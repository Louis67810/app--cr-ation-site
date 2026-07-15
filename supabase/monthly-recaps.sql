create extension if not exists pgcrypto;

create table if not exists public.project_activity_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_key text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('page_created', 'article_created', 'realisation_created', 'project_published')),
  entity_id text,
  entity_title text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists project_activity_events_month_idx
  on public.project_activity_events (owner_id, project_key, created_at desc);

create table if not exists public.monthly_recap_settings (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_key text not null,
  recipient_email text not null,
  enabled boolean not null default true,
  send_day smallint not null default 1 check (send_day between 1 and 28),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, project_key)
);

create table if not exists public.monthly_recap_deliveries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_key text not null,
  period_start date not null,
  recipient_email text not null,
  provider_message_id text,
  status text not null check (status in ('processing', 'sent', 'failed')),
  error_message text,
  created_at timestamptz not null default now(),
  unique (owner_id, project_key, period_start)
);

create table if not exists public.project_traffic_daily (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_key text not null,
  day date not null,
  visitors integer not null default 0 check (visitors >= 0),
  page_views integer not null default 0 check (page_views >= 0),
  primary key (owner_id, project_key, day)
);

alter table public.project_activity_events enable row level security;
alter table public.monthly_recap_settings enable row level security;
alter table public.monthly_recap_deliveries enable row level security;
alter table public.project_traffic_daily enable row level security;

drop policy if exists "Owners read project activity" on public.project_activity_events;
create policy "Owners read project activity" on public.project_activity_events for select using (auth.uid() = owner_id);
drop policy if exists "Project members add activity" on public.project_activity_events;
create policy "Project members add activity" on public.project_activity_events for insert with check (
  auth.uid() = actor_user_id and (
    auth.uid() = owner_id or exists (
      select 1 from public.project_members
      where project_members.owner_id = project_activity_events.owner_id
        and project_members.project_key = project_activity_events.project_key
        and project_members.user_id = auth.uid()
    )
  )
);

drop policy if exists "Owners manage recap settings" on public.monthly_recap_settings;
create policy "Owners manage recap settings" on public.monthly_recap_settings for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "Owners read recap deliveries" on public.monthly_recap_deliveries;
create policy "Owners read recap deliveries" on public.monthly_recap_deliveries for select using (auth.uid() = owner_id);
drop policy if exists "Owners read project traffic" on public.project_traffic_daily;
create policy "Owners read project traffic" on public.project_traffic_daily for select using (auth.uid() = owner_id);
