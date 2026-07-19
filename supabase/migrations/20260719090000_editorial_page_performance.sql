create table if not exists public.project_page_performance (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_key text not null,
  page_path text not null,
  page_title text not null,
  first_seen_at timestamptz,
  period_start date not null,
  period_end date not null,
  ga_sessions numeric not null default 0,
  ga_engagement_seconds numeric not null default 0,
  ga_page_views numeric not null default 0,
  ga_total_users numeric not null default 0,
  ga_sessions_per_user numeric not null default 0,
  ga_active_28_day_users numeric not null default 0,
  af_views_last_week numeric not null default 0,
  af_visitors_last_week numeric not null default 0,
  af_sessions_last_week numeric not null default 0,
  af_clicks_last_week numeric not null default 0,
  af_form_submits_last_week numeric not null default 0,
  af_avg_duration_seconds numeric not null default 0,
  af_max_scroll_depth numeric not null default 0,
  af_last_seen_at timestamptz,
  af_daily_stats jsonb not null default '[]'::jsonb,
  gsc_clicks numeric not null default 0,
  gsc_impressions numeric not null default 0,
  gsc_ctr numeric not null default 0,
  gsc_position numeric not null default 0,
  custom_signals jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (owner_id, project_key, page_path)
);

create index if not exists project_page_performance_updated_idx
  on public.project_page_performance (owner_id, project_key, updated_at desc);

alter table public.project_page_performance enable row level security;

drop policy if exists "Project collaborators read page performance" on public.project_page_performance;
create policy "Project collaborators read page performance"
  on public.project_page_performance for select
  using (
    auth.uid() = owner_id or exists (
      select 1 from public.project_members
      where project_members.owner_id = project_page_performance.owner_id
        and project_members.project_key = project_page_performance.project_key
        and project_members.user_id = auth.uid()
    )
  );

drop policy if exists "Owners manage page performance" on public.project_page_performance;
create policy "Owners manage page performance"
  on public.project_page_performance for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
