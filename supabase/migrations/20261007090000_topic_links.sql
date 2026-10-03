-- Custom pinned links per topic (user-owned).

create table if not exists public.topic_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id text not null references public.topics (id) on update cascade,
  label text not null check (length(btrim(label)) > 0),
  url text not null check (url ~* '^https?://'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.topic_links is 'User-pinned link shortcuts per exam topic.';

create index if not exists topic_links_user_topic_idx
  on public.topic_links (user_id, topic_id, created_at);

drop trigger if exists set_updated_at_on_topic_links on public.topic_links;
create trigger set_updated_at_on_topic_links
  before update on public.topic_links
  for each row execute function public.set_updated_at();

grant select, insert, update, delete on public.topic_links to authenticated;

alter table public.topic_links enable row level security;

create policy topic_links_owner_all
  on public.topic_links for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
