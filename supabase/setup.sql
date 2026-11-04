-- Run this entire file once in this project's Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ytiemfqyfaglsvibizvs/sql/new
-- It is safe to run again; existing opening times are preserved.
begin;

create table if not exists public.note_openings (
  id uuid primary key default gen_random_uuid(),
  opened_at timestamptz not null default now()
);

alter table public.note_openings enable row level security;
revoke all on table public.note_openings from public, anon, authenticated;

-- Visitors can call this function to append a server timestamp. They cannot
-- choose the timestamp, read the history, change entries, or delete entries.
create or replace function public.record_note_opening()
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  insert into public.note_openings default values;
$$;

revoke all on function public.record_note_opening() from public, anon, authenticated;
grant usage on schema public to anon;
grant execute on function public.record_note_opening() to anon;

comment on table public.note_openings is
  'Opening times for the botanical notes page. No visitor identity or location is stored.';

notify pgrst, 'reload schema';
commit;
