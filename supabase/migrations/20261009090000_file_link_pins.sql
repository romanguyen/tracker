-- Allow file:// pinned links (local documents on the user's machine) in
-- addition to http/https links. Kind-free: works on the plain topic_links
-- schema even when the attachments/upload migration was intentionally skipped.

-- Remove the trigger/function an earlier version of this migration created,
-- which mistakenly assumed upload-related columns exist.
drop trigger if exists enforce_topic_links_kind on public.topic_links;
drop function if exists public.topic_links_enforce_kind();

-- Relax the original http/https-only URL check to also accept file://.
alter table public.topic_links
  drop constraint if exists topic_links_url_check;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'topic_links_url_check'
      and conrelid = 'public.topic_links'::regclass
  ) then
    alter table public.topic_links
      add constraint topic_links_url_check
      check (url ~* '^(https?|file)://') not valid;

    alter table public.topic_links
      validate constraint topic_links_url_check;
  end if;
end $$;
