-- Optional hybrid content overrides for Reise-Tirol.
-- Repo files remain the fallback source. Rows here override content live.

create table if not exists public.trip_content (
  trip_id uuid not null references public.trips(id) on delete cascade,
  key text not null check (key in ('reiseplan.md', 'days.json', 'places.json')),
  content text not null,
  content_type text not null check (content_type in ('markdown', 'json')),
  version integer not null default 1,
  updated_by text,
  updated_at timestamptz not null default now(),
  primary key (trip_id, key)
);

create index if not exists trip_content_trip_idx on public.trip_content (trip_id);

alter table public.trip_content enable row level security;

-- Private-family baseline: anonymous clients may read content for known trips.
-- Writes should be done with the Supabase dashboard, service role, or a future Edge Function.
drop policy if exists "trip_content_read" on public.trip_content;
create policy "trip_content_read" on public.trip_content
  for select using (true);
