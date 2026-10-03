-- Milestone 6: timezone-aware daily/weekly study aggregates.
--
-- Sessions are stored as UTC instants. Day boundaries are the user's local
-- midnight in their saved timezone, so a session crossing midnight or a week
-- boundary contributes real elapsed seconds to every local day it touches.

create or replace function public.daily_time_totals(p_timezone text default 'UTC')
returns table(day date, total_seconds bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  with user_sessions as (
    select started_at, ended_at
    from public.sessions
    where user_id = auth.uid()
      and ended_at is not null
  ),
  bounds as (
    select
      s.started_at as session_start,
      s.ended_at as session_end,
      (s.started_at at time zone p_timezone)::date as start_day,
      (s.ended_at at time zone p_timezone)::date as end_day
    from user_sessions s
  ),
  days as (
    select
      b.session_start,
      b.session_end,
      (b.start_day + gs.n) as day
    from bounds b
    cross join lateral generate_series(
      0,
      greatest(b.end_day - b.start_day, 0)
    ) as gs(n)
  )
  select
    day,
    sum(
      greatest(
        0,
        extract(epoch from (
          least(session_end, (day + 1)::timestamp at time zone p_timezone)
          - greatest(session_start, day::timestamp at time zone p_timezone)
        ))::bigint
      )
    ) as total_seconds
  from days
  group by day
  order by day desc;
$$;

revoke execute on function public.daily_time_totals(text) from anon;
grant execute on function public.daily_time_totals(text) to authenticated;

-- Today, this week (Monday start), and all-time, all in the caller's timezone.
create or replace function public.study_windows(p_timezone text default 'UTC')
returns table(
  today_seconds bigint,
  week_seconds bigint,
  all_time_seconds bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with week_bounds as (
    select
      (now() at time zone p_timezone)::date as local_date,
      (now() at time zone p_timezone)::date
        - (extract(isodow from (now() at time zone p_timezone)::date)::int - 1)
        as week_start
  ),
  daily as (
    select * from public.daily_time_totals(p_timezone)
  )
  select
    coalesce(sum(d.total_seconds) filter (where d.day = w.local_date), 0)
      as today_seconds,
    coalesce(sum(d.total_seconds) filter (where d.day >= w.week_start), 0)
      as week_seconds,
    coalesce(sum(d.total_seconds), 0) as all_time_seconds
  from daily d
  cross join week_bounds w;
$$;

revoke execute on function public.study_windows(text) from anon;
grant execute on function public.study_windows(text) to authenticated;
