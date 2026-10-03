-- Pomodoro mode for study sessions.
-- mode = 'stopwatch' (free-running, default) or 'pomodoro' (planned rounds).
-- planned_seconds only makes sense for pomodoro; complete_pomodoro clamps the
-- session to exactly its planned length even if it ends much later.

alter table public.sessions
  add column if not exists mode text not null default 'stopwatch'
    check (mode in ('stopwatch', 'pomodoro'));

alter table public.sessions
  add column if not exists planned_seconds integer;

create or replace function public.sessions_enforce_pomodoro_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.mode = 'stopwatch' and new.planned_seconds is not null then
    raise exception 'Only pomodoro sessions may set a planned duration.';
  end if;

  if new.mode = 'pomodoro'
     and (new.planned_seconds is null or new.planned_seconds < 60) then
    raise exception 'Pomodoro sessions need a planned duration of at least 60 seconds.';
  end if;

  return new;
end;
$$;

revoke execute on function public.sessions_enforce_pomodoro_fields() from anon, authenticated;

drop trigger if exists enforce_pomodoro_fields on public.sessions;
create trigger enforce_pomodoro_fields
  before insert or update on public.sessions
  for each row execute function public.sessions_enforce_pomodoro_fields();

-- start/switch learn the new optional arguments (dropped to keep RPC unambiguous)
drop function if exists public.start_session(uuid, text, uuid);

create or replace function public.start_session(
  p_id uuid,
  p_topic_id text,
  p_task_id uuid default null,
  p_mode text default 'stopwatch',
  p_planned_seconds integer default null
)
returns setof public.sessions
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_session public.sessions;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 421));

  select * into v_session
  from public.sessions
  where id = p_id and user_id = v_user;
  if found then
    return next v_session;
    return;
  end if;

  if p_task_id is not null then
    perform 1
    from public.tasks
    where id = p_task_id
      and user_id = v_user
      and topic_id = p_topic_id
      and archived_at is null;
    if not found then
      raise exception 'Task does not exist, is archived, or belongs to another topic.';
    end if;
  end if;

  perform 1 from public.sessions
  where user_id = v_user and ended_at is null;
  if found then
    raise exception 'Another study session is already running.';
  end if;

  insert into public.sessions (id, user_id, topic_id, task_id, started_at, mode, planned_seconds)
  values (p_id, v_user, p_topic_id, p_task_id, now(), p_mode, p_planned_seconds)
  returning * into v_session;

  return next v_session;
end;
$$;

revoke execute on function public.start_session(uuid, text, uuid, text, integer) from anon;
grant execute on function public.start_session(uuid, text, uuid, text, integer) to authenticated;

drop function if exists public.switch_session(uuid, text, uuid);

create or replace function public.switch_session(
  p_id uuid,
  p_topic_id text,
  p_task_id uuid default null,
  p_mode text default 'stopwatch',
  p_planned_seconds integer default null
)
returns table(active_session public.sessions, previous_session public.sessions)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := now();
  v_current public.sessions;
  v_next public.sessions;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 421));

  select * into v_next
  from public.sessions
  where id = p_id and user_id = v_user;
  if found then
    active_session := v_next;
    previous_session := null;
    return next;
    return;
  end if;

  if p_task_id is not null then
    perform 1
    from public.tasks
    where id = p_task_id
      and user_id = v_user
      and topic_id = p_topic_id
      and archived_at is null;
    if not found then
      raise exception 'Task does not exist, is archived, or belongs to another topic.';
    end if;
  end if;

  select * into v_current
  from public.sessions
  where user_id = v_user and ended_at is null
  for update;

  if found then
    update public.sessions
    set ended_at = v_now
    where id = v_current.id and ended_at is null
    returning * into v_current;
  end if;

  insert into public.sessions (id, user_id, topic_id, task_id, started_at, mode, planned_seconds)
  values (p_id, v_user, p_topic_id, p_task_id, v_now, p_mode, p_planned_seconds)
  returning * into v_next;

  active_session := v_next;
  previous_session := v_current;
  return next;
end;
$$;

revoke execute on function public.switch_session(uuid, text, uuid, text, integer) from anon;
grant execute on function public.switch_session(uuid, text, uuid, text, integer) to authenticated;

-- Ends a pomodoro round at exactly started_at + planned_seconds, no matter
-- how late the completion is detected (device slept, browser closed).
create or replace function public.complete_pomodoro(p_id uuid)
returns setof public.sessions
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_session public.sessions;
begin
  if v_user is null then
    raise exception 'not authenticated';
  end if;

  update public.sessions
  set ended_at = started_at + (planned_seconds || ' seconds')::interval
  where id = p_id
    and user_id = v_user
    and mode = 'pomodoro'
    and ended_at is null
  returning * into v_session;

  if not found then
    select * into v_session
    from public.sessions
    where id = p_id and user_id = v_user;
    if not found then
      raise exception 'Study session not found.';
    end if;
  end if;

  return next v_session;
end;
$$;

revoke execute on function public.complete_pomodoro(uuid) from anon;
grant execute on function public.complete_pomodoro(uuid) to authenticated;
