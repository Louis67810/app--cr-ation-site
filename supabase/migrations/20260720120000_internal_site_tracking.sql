create extension if not exists pgcrypto;

create table if not exists public.project_page_traffic_daily (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_key text not null,
  page_path text not null,
  day date not null,
  page_views integer not null default 0 check (page_views >= 0),
  unique_visitors integer not null default 0 check (unique_visitors >= 0),
  total_engagement_seconds integer not null default 0 check (total_engagement_seconds >= 0),
  updated_at timestamptz not null default now(),
  primary key (owner_id, project_key, page_path, day)
);

create table if not exists public.project_page_tracking_sessions (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_key text not null,
  page_path text not null,
  session_id uuid not null,
  visitor_id uuid not null,
  day date not null,
  engagement_seconds integer not null default 0 check (engagement_seconds between 0 and 21600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, project_key, page_path, session_id)
);

create table if not exists public.project_page_tracking_visitors (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_key text not null,
  page_path text not null,
  day date not null,
  visitor_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (owner_id, project_key, page_path, day, visitor_id)
);

create table if not exists public.project_site_tracking_visitors (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_key text not null,
  day date not null,
  visitor_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (owner_id, project_key, day, visitor_id)
);

create table if not exists public.project_traffic_daily (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_key text not null,
  day date not null,
  visitors integer not null default 0 check (visitors >= 0),
  page_views integer not null default 0 check (page_views >= 0),
  primary key (owner_id, project_key, day)
);

create index if not exists project_page_traffic_daily_lookup_idx
  on public.project_page_traffic_daily (owner_id, project_key, day desc, page_path);

alter table public.project_page_traffic_daily enable row level security;
alter table public.project_page_tracking_sessions enable row level security;
alter table public.project_page_tracking_visitors enable row level security;
alter table public.project_site_tracking_visitors enable row level security;
alter table public.project_traffic_daily enable row level security;

drop policy if exists "Project collaborators read internal page traffic" on public.project_page_traffic_daily;
create policy "Project collaborators read internal page traffic"
  on public.project_page_traffic_daily for select
  using (
    auth.uid() = owner_id or exists (
      select 1 from public.project_members
      where project_members.owner_id = project_page_traffic_daily.owner_id
        and project_members.project_key = project_page_traffic_daily.project_key
        and project_members.user_id = auth.uid()
    )
  );

drop policy if exists "Owners read project traffic" on public.project_traffic_daily;
create policy "Owners read project traffic"
  on public.project_traffic_daily for select
  using (auth.uid() = owner_id);

create or replace function public.record_project_page_tracking(
  tracking_owner_id uuid,
  tracking_project_key text,
  tracking_page_path text,
  tracking_session_id uuid,
  tracking_visitor_id uuid,
  tracking_engagement_seconds integer default 0
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  tracking_day date := (now() at time zone 'utc')::date;
  safe_engagement integer := least(greatest(coalesce(tracking_engagement_seconds, 0), 0), 21600);
  previous_engagement integer := 0;
  engagement_delta integer := 0;
  inserted_session integer := 0;
  inserted_page_visitor integer := 0;
  inserted_site_visitor integer := 0;
begin
  insert into public.project_page_tracking_sessions (
    owner_id, project_key, page_path, session_id, visitor_id, day, engagement_seconds
  ) values (
    tracking_owner_id, tracking_project_key, tracking_page_path, tracking_session_id, tracking_visitor_id, tracking_day, 0
  ) on conflict do nothing;
  get diagnostics inserted_session = row_count;

  select engagement_seconds into previous_engagement
  from public.project_page_tracking_sessions
  where owner_id = tracking_owner_id
    and project_key = tracking_project_key
    and page_path = tracking_page_path
    and session_id = tracking_session_id
  for update;

  engagement_delta := greatest(safe_engagement - coalesce(previous_engagement, 0), 0);

  update public.project_page_tracking_sessions
  set engagement_seconds = greatest(engagement_seconds, safe_engagement), updated_at = now()
  where owner_id = tracking_owner_id
    and project_key = tracking_project_key
    and page_path = tracking_page_path
    and session_id = tracking_session_id;

  insert into public.project_page_tracking_visitors (
    owner_id, project_key, page_path, day, visitor_id
  ) values (
    tracking_owner_id, tracking_project_key, tracking_page_path, tracking_day, tracking_visitor_id
  ) on conflict do nothing;
  get diagnostics inserted_page_visitor = row_count;

  insert into public.project_site_tracking_visitors (
    owner_id, project_key, day, visitor_id
  ) values (
    tracking_owner_id, tracking_project_key, tracking_day, tracking_visitor_id
  ) on conflict do nothing;
  get diagnostics inserted_site_visitor = row_count;

  if inserted_session > 0 or inserted_page_visitor > 0 or engagement_delta > 0 then
    insert into public.project_page_traffic_daily (
      owner_id, project_key, page_path, day, page_views, unique_visitors, total_engagement_seconds, updated_at
    ) values (
      tracking_owner_id,
      tracking_project_key,
      tracking_page_path,
      tracking_day,
      inserted_session,
      inserted_page_visitor,
      engagement_delta,
      now()
    )
    on conflict (owner_id, project_key, page_path, day) do update set
      page_views = project_page_traffic_daily.page_views + excluded.page_views,
      unique_visitors = project_page_traffic_daily.unique_visitors + excluded.unique_visitors,
      total_engagement_seconds = project_page_traffic_daily.total_engagement_seconds + excluded.total_engagement_seconds,
      updated_at = now();
  end if;

  if inserted_session > 0 or inserted_site_visitor > 0 then
    insert into public.project_traffic_daily (
      owner_id, project_key, day, visitors, page_views
    ) values (
      tracking_owner_id, tracking_project_key, tracking_day, inserted_site_visitor, inserted_session
    )
    on conflict (owner_id, project_key, day) do update set
      visitors = project_traffic_daily.visitors + excluded.visitors,
      page_views = project_traffic_daily.page_views + excluded.page_views;
  end if;
end;
$$;

revoke all on function public.record_project_page_tracking(uuid, text, text, uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.record_project_page_tracking(uuid, text, text, uuid, uuid, integer) to service_role;
