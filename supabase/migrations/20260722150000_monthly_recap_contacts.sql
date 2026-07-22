create extension if not exists pgcrypto;

create table if not exists public.project_contact_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_key text not null,
  visitor_id uuid not null,
  session_id uuid not null,
  page_path text not null,
  source text not null default 'contact_form',
  created_at timestamptz not null default now(),
  unique (owner_id, project_key, session_id)
);

create index if not exists project_contact_events_month_idx
  on public.project_contact_events (owner_id, project_key, created_at desc);

alter table public.project_contact_events enable row level security;

drop policy if exists "Owners read project contacts" on public.project_contact_events;
create policy "Owners read project contacts"
  on public.project_contact_events for select
  using (auth.uid() = owner_id);

drop policy if exists "Owners read site tracking visitors" on public.project_site_tracking_visitors;
create policy "Owners read site tracking visitors"
  on public.project_site_tracking_visitors for select
  using (auth.uid() = owner_id);
