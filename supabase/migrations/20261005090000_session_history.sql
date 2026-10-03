-- Milestone 5: session-time validation for manual corrections and
-- last-studied aggregates.

-- ---------------------------------------------------------------------------
-- Validation trigger covering every write path (timer RPCs, manual
-- corrections, and fixes from any client).
-- ---------------------------------------------------------------------------

create or replace function public.validate_session()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.ended_at is not null then
    if new.ended_at <= new.started_at then
      raise exception 'Session end must be later than its start.';
    end if;

    -- One minute of grace tolerates client clock skew on "entered just now".
    if new.ended_at > now() + interval '1 minute' then
      raise exception 'Session end cannot be in the future.';
    end if;
  end if;

  -- A running session can only change its start or note; never topic/task.
  if tg_op = 'UPDATE'
     and old.ended_at is null
     and new.ended_at is null
     and (
       new.topic_id <> old.topic_id
       or new.task_id is distinct from old.task_id
     ) then
    raise exception 'A running session cannot change topic or task; stop it first.';
  end if;

  return new;
end;
$$;

revoke execute on function public.validate_session() from anon, authenticated;

drop trigger if exists validate_session_before_write on public.sessions;
create trigger validate_session_before_write
  before insert or update on public.sessions
  for each row execute function public.validate_session();

-- ---------------------------------------------------------------------------
-- Per-topic totals with last-studied timestamps (replaces topic_time_totals)
-- ---------------------------------------------------------------------------

drop function if exists public.topic_time_totals();

create or replace function public.topic_study_stats()
returns table(topic_id text, total_seconds bigint, last_ended_at timestamptz)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    topic_id,
    sum(extract(epoch from (ended_at - started_at))::bigint) as total_seconds,
    max(ended_at) as last_ended_at
  from public.sessions
  where user_id = auth.uid()
    and ended_at is not null
  group by topic_id;
$$;

revoke execute on function public.topic_study_stats() from anon;
grant execute on function public.topic_study_stats() to authenticated;
