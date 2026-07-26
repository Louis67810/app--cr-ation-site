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

create index if not exists prospect_discoveries_owner_date_idx
  on public.prospect_discoveries (owner_id, discovered_at desc);

alter table public.prospect_discoveries enable row level security;

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

grant select, insert, update on public.prospect_discoveries to authenticated;
