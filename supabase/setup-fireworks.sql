-- Run this entire file in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ytiemfqyfaglsvibizvs/sql/new
-- Safe to run again. Existing notes and fireworks opening times are preserved.
begin;

create table if not exists public.fireworks_openings (
  id uuid primary key default gen_random_uuid(),
  opened_at timestamptz not null default now()
);

alter table public.fireworks_openings enable row level security;
revoke all on table public.fireworks_openings from public, anon, authenticated;

-- Visitors may append a server timestamp, but cannot choose a timestamp,
-- read the history, change entries, or delete entries.
create or replace function public.record_fireworks_opening()
returns void
language sql
volatile
security definer
set search_path = ''
as $$
  insert into public.fireworks_openings default values;
$$;

revoke all on function public.record_fireworks_opening() from public, anon, authenticated;
grant usage on schema public to anon;
grant execute on function public.record_fireworks_opening() to anon;

comment on table public.fireworks_openings is
  'Opening times for the flower fireworks page. No visitor identity or location is stored.';

notify pgrst, 'reload schema';
commit;
