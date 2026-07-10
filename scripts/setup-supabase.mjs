import postgres from "postgres";

const connectionString = process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("POSTGRES_URL_NON_POOLING ou POSTGRES_URL est requis.");
}

const sql = postgres(connectionString, { ssl: "require", max: 1 });

await sql.unsafe(`
  create extension if not exists pgcrypto;

  create table if not exists public.site_projects (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references auth.users(id) on delete cascade,
    project_key text not null default 'default',
    project_name text not null,
    pages jsonb not null default '[]'::jsonb,
    published_slug text unique,
    published_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (owner_id, project_key)
  );

  alter table public.site_projects enable row level security;

  drop policy if exists "Owners can read projects" on public.site_projects;
  create policy "Owners can read projects"
    on public.site_projects for select
    to authenticated
    using ((select auth.uid()) = owner_id);

  drop policy if exists "Owners can insert projects" on public.site_projects;
  create policy "Owners can insert projects"
    on public.site_projects for insert
    to authenticated
    with check ((select auth.uid()) = owner_id);

  drop policy if exists "Owners can update projects" on public.site_projects;
  create policy "Owners can update projects"
    on public.site_projects for update
    to authenticated
    using ((select auth.uid()) = owner_id)
    with check ((select auth.uid()) = owner_id);

  drop policy if exists "Owners can delete projects" on public.site_projects;
  create policy "Owners can delete projects"
    on public.site_projects for delete
    to authenticated
    using ((select auth.uid()) = owner_id);

  drop policy if exists "Published projects are public" on public.site_projects;
  create policy "Published projects are public"
    on public.site_projects for select
    to anon
    using (published_at is not null);
`);

await sql.end();
console.log("Supabase schema ready.");
