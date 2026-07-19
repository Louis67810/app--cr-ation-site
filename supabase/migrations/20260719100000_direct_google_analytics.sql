-- Rend la migration compatible avec une base où l’ancienne version AgenceFlow
-- de project_page_performance aurait déjà été appliquée.
alter table public.project_page_performance
  add column if not exists ga_average_session_duration numeric not null default 0,
  add column if not exists ga_engagement_rate numeric not null default 0,
  add column if not exists ga_scrolled_users numeric not null default 0;

alter table public.project_page_performance
  drop column if exists ga_active_28_day_users,
  drop column if exists af_views_last_week,
  drop column if exists af_visitors_last_week,
  drop column if exists af_sessions_last_week,
  drop column if exists af_clicks_last_week,
  drop column if exists af_form_submits_last_week,
  drop column if exists af_avg_duration_seconds,
  drop column if exists af_max_scroll_depth,
  drop column if exists af_last_seen_at,
  drop column if exists af_daily_stats,
  drop column if exists custom_signals;

create table if not exists public.project_analytics_summary (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_key text not null,
  period_start date not null,
  period_end date not null,
  ga_sessions numeric not null default 0,
  ga_engagement_seconds numeric not null default 0,
  ga_page_views numeric not null default 0,
  ga_total_users numeric not null default 0,
  ga_average_session_duration numeric not null default 0,
  ga_engagement_rate numeric not null default 0,
  ga_scrolled_users numeric not null default 0,
  gsc_clicks numeric not null default 0,
  gsc_impressions numeric not null default 0,
  gsc_ctr numeric not null default 0,
  gsc_position numeric not null default 0,
  updated_at timestamptz not null default now(),
  primary key (owner_id, project_key)
);

alter table public.project_analytics_summary enable row level security;

drop policy if exists "Project collaborators read analytics summary" on public.project_analytics_summary;
create policy "Project collaborators read analytics summary"
  on public.project_analytics_summary for select
  using (
    auth.uid() = owner_id or exists (
      select 1 from public.project_members
      where project_members.owner_id = project_analytics_summary.owner_id
        and project_members.project_key = project_analytics_summary.project_key
        and project_members.user_id = auth.uid()
    )
  );

drop policy if exists "Owners manage analytics summary" on public.project_analytics_summary;
create policy "Owners manage analytics summary"
  on public.project_analytics_summary for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
