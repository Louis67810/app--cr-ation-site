create table if not exists public.prospect_appointments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null,
  prospect_name text not null default '',
  attendee_name text not null default '',
  attendee_email text not null default '',
  attendee_phone text not null default '',
  starts_at timestamptz not null,
  time_zone text not null default 'Europe/Paris',
  booking_uid text,
  source_website text,
  status text not null default 'scheduled',
  intake_snapshot jsonb not null default '{}'::jsonb,
  project_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists prospect_appointments_owner_start_idx
  on public.prospect_appointments (owner_id, starts_at asc);

create unique index if not exists prospect_appointments_owner_booking_uid_idx
  on public.prospect_appointments (owner_id, booking_uid)
  where booking_uid is not null;

create table if not exists public.project_source_briefs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_key text not null,
  appointment_id uuid references public.prospect_appointments(id) on delete set null,
  source_url text,
  business_profile jsonb not null default '{}'::jsonb,
  collected_pages jsonb not null default '[]'::jsonb,
  selected_images jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, project_key)
);

alter table public.prospect_appointments enable row level security;
alter table public.project_source_briefs enable row level security;

drop policy if exists "Users manage their prospect appointments"
  on public.prospect_appointments;
create policy "Users manage their prospect appointments"
  on public.prospect_appointments
  for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "Users manage their project source briefs"
  on public.project_source_briefs;
create policy "Users manage their project source briefs"
  on public.project_source_briefs
  for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

grant select, insert, update, delete on public.prospect_appointments to authenticated;
grant select, insert, update, delete on public.project_source_briefs to authenticated;
