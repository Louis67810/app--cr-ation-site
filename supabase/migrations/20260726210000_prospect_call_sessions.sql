create table if not exists public.prospect_call_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null,
  prospect_name text not null default '',
  phone text not null default '',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  answered boolean not null default false,
  concluded boolean not null default false,
  booked boolean not null default false,
  booking_uid text,
  created_at timestamptz not null default now()
);

create index if not exists prospect_call_sessions_owner_started_idx
  on public.prospect_call_sessions (owner_id, started_at desc);

create index if not exists prospect_call_sessions_owner_place_idx
  on public.prospect_call_sessions (owner_id, place_id);

alter table public.prospect_call_sessions enable row level security;

drop policy if exists "Users can read their prospect calls"
  on public.prospect_call_sessions;
create policy "Users can read their prospect calls"
  on public.prospect_call_sessions
  for select
  to authenticated
  using (auth.uid() = owner_id);

drop policy if exists "Users can create their prospect calls"
  on public.prospect_call_sessions;
create policy "Users can create their prospect calls"
  on public.prospect_call_sessions
  for insert
  to authenticated
  with check (auth.uid() = owner_id);

drop policy if exists "Users can update their prospect calls"
  on public.prospect_call_sessions;
create policy "Users can update their prospect calls"
  on public.prospect_call_sessions
  for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

grant select, insert, update on public.prospect_call_sessions to authenticated;
