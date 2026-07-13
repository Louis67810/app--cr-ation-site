create table if not exists public.project_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_key text not null,
  storage_path text not null unique,
  public_url text not null,
  original_name text not null,
  title text not null,
  alt_text text not null,
  ai_generated boolean not null default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists project_assets_project_idx
  on public.project_assets(owner_id, project_key, created_at desc);

alter table public.project_assets enable row level security;

drop policy if exists "project users read assets" on public.project_assets;
create policy "project users read assets"
  on public.project_assets for select to authenticated
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.project_members member
      where member.owner_id = project_assets.owner_id
        and member.project_key = project_assets.project_key
        and member.user_id = auth.uid()
    )
  );

drop policy if exists "project users add assets" on public.project_assets;
create policy "project users add assets"
  on public.project_assets for insert to authenticated
  with check (
    created_by = auth.uid()
    and (
      owner_id = auth.uid()
      or exists (
        select 1 from public.project_members member
        where member.owner_id = project_assets.owner_id
          and member.project_key = project_assets.project_key
          and member.user_id = auth.uid()
      )
    )
  );

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('project-assets', 'project-assets', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "project users upload asset files" on storage.objects;
create policy "project users upload asset files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'project-assets'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.project_members member
        where member.owner_id::text = (storage.foldername(name))[1]
          and member.project_key = (storage.foldername(name))[2]
          and member.user_id = auth.uid()
      )
    )
  );

drop policy if exists "project users remove asset files" on storage.objects;
create policy "project users remove asset files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'project-assets'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.project_members member
        where member.owner_id::text = (storage.foldername(name))[1]
          and member.project_key = (storage.foldername(name))[2]
          and member.user_id = auth.uid()
      )
    )
  );
