create table if not exists public.prospect_discoveries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null,
  company text not null,
  city text not null,
  sector text not null,
  website text,
  discovered_at timestamptz not null default now(),
  unique (owner_id, place_id)
);

alter table public.prospect_discoveries
  add column if not exists snapshot jsonb not null default '{}'::jsonb,
  add column if not exists status text not null default 'Nouveau';

create index if not exists prospect_discoveries_owner_date_idx
  on public.prospect_discoveries (owner_id, discovered_at desc);

create table if not exists public.prospect_search_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  city text not null,
  city_key text not null,
  sector text not null,
  result_count integer not null default 0 check (result_count >= 0),
  searched_at timestamptz not null default now()
);

create index if not exists prospect_search_runs_owner_city_idx
  on public.prospect_search_runs (owner_id, city_key, searched_at desc);

alter table public.prospect_discoveries enable row level security;
alter table public.prospect_search_runs enable row level security;

drop policy if exists "Users read their discovered prospects"
  on public.prospect_discoveries;
create policy "Users read their discovered prospects"
  on public.prospect_discoveries
  for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "Users add their discovered prospects"
  on public.prospect_discoveries;
create policy "Users add their discovered prospects"
  on public.prospect_discoveries
  for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "Users update their discovered prospects"
  on public.prospect_discoveries;
create policy "Users update their discovered prospects"
  on public.prospect_discoveries
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "Users read their prospect searches"
  on public.prospect_search_runs;
create policy "Users read their prospect searches"
  on public.prospect_search_runs
  for select
  to authenticated
  using (owner_id = auth.uid());

drop policy if exists "Users add their prospect searches"
  on public.prospect_search_runs;
create policy "Users add their prospect searches"
  on public.prospect_search_runs
  for insert
  to authenticated
  with check (owner_id = auth.uid());

grant select, insert on public.prospect_search_runs to authenticated;
grant select, insert, update on public.prospect_discoveries to authenticated;
