-- Dimensions used by the Statistics tab. One row represents a page viewed in a session.
create table if not exists public.project_tracking_events (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_key text not null,
  page_path text not null,
  session_id uuid not null,
  visitor_id uuid not null,
  referrer text not null default 'direct',
  device_type text not null default 'desktop' check (device_type in ('desktop', 'mobile', 'tablet')),
  country_code text not null default 'Unknown',
  occurred_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (owner_id, project_key, page_path, session_id)
);

create index if not exists project_tracking_events_lookup_idx
  on public.project_tracking_events (owner_id, project_key, occurred_at desc);
create index if not exists project_tracking_events_referrer_idx
  on public.project_tracking_events (owner_id, project_key, referrer);
create index if not exists project_tracking_events_device_idx
  on public.project_tracking_events (owner_id, project_key, device_type);
create index if not exists project_tracking_events_country_idx
  on public.project_tracking_events (owner_id, project_key, country_code);

alter table public.project_tracking_events enable row level security;

drop policy if exists "Project collaborators read tracking events" on public.project_tracking_events;
create policy "Project collaborators read tracking events"
  on public.project_tracking_events for select
  using (
    auth.uid() = owner_id or exists (
      select 1 from public.project_members
      where project_members.owner_id = project_tracking_events.owner_id
        and project_members.project_key = project_tracking_events.project_key
        and project_members.user_id = auth.uid()
    )
  );

create or replace function public.record_project_tracking_event(
  tracking_owner_id uuid,
  tracking_project_key text,
  tracking_page_path text,
  tracking_session_id uuid,
  tracking_visitor_id uuid,
  tracking_referrer text default 'direct',
  tracking_device_type text default 'desktop',
  tracking_country_code text default 'Unknown'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  safe_referrer text := left(coalesce(nullif(trim(tracking_referrer), ''), 'direct'), 180);
  safe_device text := case when tracking_device_type in ('desktop', 'mobile', 'tablet') then tracking_device_type else 'desktop' end;
  safe_country text := left(coalesce(nullif(trim(tracking_country_code), ''), 'Unknown'), 24);
begin
  insert into public.project_tracking_events (
    owner_id, project_key, page_path, session_id, visitor_id, referrer, device_type, country_code
  ) values (
    tracking_owner_id, tracking_project_key, tracking_page_path, tracking_session_id, tracking_visitor_id,
    safe_referrer, safe_device, safe_country
  )
  on conflict (owner_id, project_key, page_path, session_id) do update set
    last_seen_at = now(),
    referrer = excluded.referrer,
    device_type = excluded.device_type,
    country_code = excluded.country_code;
end;
$$;

revoke all on function public.record_project_tracking_event(uuid, text, text, uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.record_project_tracking_event(uuid, text, text, uuid, uuid, text, text, text) to service_role;
