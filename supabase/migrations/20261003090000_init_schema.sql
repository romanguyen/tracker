-- Milestone 2: schema, constraints, indexes, grants, and Row Level Security.
-- Curriculum snapshot: B-PVA, template 2025/2026 or earlier
-- (23 topics; excludes "Softwarové inženýrství").

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'topic_section'
  ) then
    create type public.topic_section as enum ('theory', 'systems');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'readiness'
  ) then
    create type public.readiness as enum (
      'not_started',
      'learning',
      'can_explain',
      'exam_ready'
    );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Shared, read-only exam topic catalogue
-- ---------------------------------------------------------------------------

create table if not exists public.topics (
  id text primary key, -- stable IDs such as 'theory-01', 'systems-13'
  section public.topic_section not null,
  official_number smallint not null check (official_number > 0),
  display_order smallint not null check (display_order > 0),
  title_cs text not null check (length(btrim(title_cs)) > 0),
  description_cs text not null check (length(btrim(description_cs)) > 0),
  course_links jsonb not null default '[]'::jsonb,
  source_url text not null,
  curriculum_version text not null default 'bc-pva-2025/2026-or-earlier',
  unique (section, official_number),
  unique (section, display_order)
);

comment on table public.topics is 'Official PVA state-exam topics, shared and read-only for authenticated users.';

-- ---------------------------------------------------------------------------
-- Per-user profile preferences
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  timezone text not null default 'UTC' check (length(btrim(timezone)) > 0),
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Per-user preferences; timezone uses the user''s saved IANA zone.';

-- Auto-create a profile row for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Per-user topic assessment and notes
-- ---------------------------------------------------------------------------

create table if not exists public.topic_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id text not null references public.topics (id) on update cascade,
  readiness public.readiness not null default 'not_started',
  notes text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

comment on table public.topic_progress is 'Self-assessed readiness and notes per user and topic.';

-- ---------------------------------------------------------------------------
-- User-owned mini-tasks
-- ---------------------------------------------------------------------------

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id text not null references public.topics (id) on update cascade,
  title text not null check (length(btrim(title)) > 0),
  position double precision not null,
  completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Required by the composite foreign key from sessions.
  unique (user_id, topic_id, id)
);

comment on table public.tasks is 'User-created mini-tasks/milestones per topic; archived instead of deleted.';

create index if not exists tasks_user_topic_position_idx
  on public.tasks (user_id, topic_id, position);

-- ---------------------------------------------------------------------------
-- Study sessions (active when ended_at is null)
-- ---------------------------------------------------------------------------

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id text not null references public.topics (id) on update cascade,
  task_id uuid,
  started_at timestamptz not null,
  ended_at timestamptz,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ended_at is null or ended_at > started_at),
  -- Guarantees that a task-linked session references a task belonging to the
  -- same user and the same topic. Skipped when task_id is null.
  foreign key (user_id, topic_id, task_id)
    references public.tasks (user_id, topic_id, id)
);

comment on table public.sessions is 'Study sessions; ended_at is null while the timer is running.';

-- Exactly one active session per user, across devices and tabs.
create unique index if not exists sessions_one_active_per_user
  on public.sessions (user_id)
  where ended_at is null;

-- No overlapping sessions per user, including overlaps with the active one.
-- Adjacent sessions are allowed via the half-open range [start, end).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'sessions_no_overlap'
  ) then
    alter table public.sessions
      add constraint sessions_no_overlap exclude using gist (
        user_id with =,
        tstzrange(started_at, coalesce(ended_at, 'infinity'::timestamptz), '[)') with &&
      );
  end if;
end $$;

create index if not exists sessions_user_started_idx
  on public.sessions (user_id, started_at desc);

create index if not exists sessions_user_topic_started_idx
  on public.sessions (user_id, topic_id, started_at desc);

create index if not exists sessions_task_idx
  on public.sessions (task_id)
  where task_id is not null;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from anon, authenticated;

drop trigger if exists set_updated_at_on_topic_progress on public.topic_progress;
create trigger set_updated_at_on_topic_progress
  before update on public.topic_progress
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_on_tasks on public.tasks;
create trigger set_updated_at_on_tasks
  before update on public.tasks
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at_on_sessions on public.sessions;
create trigger set_updated_at_on_sessions
  before update on public.sessions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

grant usage on schema public to authenticated;
grant select on public.topics to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.topic_progress to authenticated;
grant select, insert, update, delete on public.tasks to authenticated;
grant select, insert, update, delete on public.sessions to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.topics enable row level security;
alter table public.profiles enable row level security;
alter table public.topic_progress enable row level security;
alter table public.tasks enable row level security;
alter table public.sessions enable row level security;

create policy topics_select_authenticated
  on public.topics for select to authenticated
  using (true);

create policy profiles_owner_all
  on public.profiles for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy topic_progress_owner_all
  on public.topic_progress for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy tasks_owner_all
  on public.tasks for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy sessions_owner_all
  on public.sessions for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
