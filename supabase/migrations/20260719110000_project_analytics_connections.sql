create table if not exists public.project_analytics_connections (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_key text not null,
  ga_property_id text not null default '',
  ga_measurement_id text not null default '',
  gsc_site_url text not null default '',
  updated_at timestamptz not null default now(),
  primary key (owner_id, project_key)
);

alter table public.project_analytics_connections enable row level security;

drop policy if exists "Project collaborators read analytics connections" on public.project_analytics_connections;
create policy "Project collaborators read analytics connections"
  on public.project_analytics_connections for select
  using (
    auth.uid() = owner_id or exists (
      select 1 from public.project_members
      where project_members.owner_id = project_analytics_connections.owner_id
        and project_members.project_key = project_analytics_connections.project_key
        and project_members.user_id = auth.uid()
    )
  );

drop policy if exists "Owners manage analytics connections" on public.project_analytics_connections;
create policy "Owners manage analytics connections"
  on public.project_analytics_connections for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
