create extension if not exists pgcrypto;

create table if not exists public.project_invitations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_key text not null,
  email text,
  token uuid not null unique default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  accepted_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create index if not exists project_invitations_owner_project_idx
  on public.project_invitations(owner_id, project_key, created_at desc);

create table if not exists public.project_members (
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_key text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'collaborator' check (role = 'collaborator'),
  created_at timestamptz not null default now(),
  primary key (owner_id, project_key, user_id)
);

alter table public.project_invitations enable row level security;
alter table public.project_members enable row level security;
alter table public.project_invitations alter column email drop not null;

drop policy if exists "owners manage project invitations" on public.project_invitations;
create policy "owners manage project invitations"
  on public.project_invitations for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "members read their membership" on public.project_members;
create policy "members read their membership"
  on public.project_members for select to authenticated
  using (user_id = auth.uid() or owner_id = auth.uid());

drop policy if exists "members read shared projects" on public.site_projects;
create policy "members read shared projects"
  on public.site_projects for select to authenticated
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.project_members member
      where member.owner_id = site_projects.owner_id
        and member.project_key = site_projects.project_key
        and member.user_id = auth.uid()
    )
  );

drop policy if exists "members update shared projects" on public.site_projects;
create policy "members update shared projects"
  on public.site_projects for update to authenticated
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.project_members member
      where member.owner_id = site_projects.owner_id
        and member.project_key = site_projects.project_key
        and member.user_id = auth.uid()
    )
  )
  with check (
    owner_id = auth.uid()
    or exists (
      select 1 from public.project_members member
      where member.owner_id = site_projects.owner_id
        and member.project_key = site_projects.project_key
        and member.user_id = auth.uid()
    )
  );

create or replace function public.get_project_invitation(invite_token uuid)
returns table(email text, project_name text, status text)
language sql
security definer
set search_path = public
as $$
  select invitation.email, project.project_name, invitation.status
  from public.project_invitations invitation
  join public.site_projects project
    on project.owner_id = invitation.owner_id
   and project.project_key = invitation.project_key
  where invitation.token = invite_token
  limit 1;
$$;

create or replace function public.accept_project_invitation(invite_token uuid)
returns table(owner_id uuid, project_key text)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  invitation public.project_invitations%rowtype;
  signed_in_email text;
begin
  signed_in_email := lower(coalesce(auth.jwt() ->> 'email', ''));

  select * into invitation
  from public.project_invitations
  where token = invite_token
  for update;

  if invitation.id is null or invitation.status <> 'pending' then
    raise exception 'Invitation invalide ou déjà utilisée';
  end if;

  if signed_in_email = '' or (invitation.email is not null and signed_in_email <> lower(invitation.email)) then
    raise exception 'Cette invitation ne correspond pas à ce compte';
  end if;

  insert into public.project_members(owner_id, project_key, user_id, email)
  values (invitation.owner_id, invitation.project_key, auth.uid(), signed_in_email)
  on conflict (owner_id, project_key, user_id) do nothing;

  update public.project_invitations
  set status = 'accepted', email = coalesce(invitation.email, signed_in_email), accepted_user_id = auth.uid(), accepted_at = now()
  where id = invitation.id;

  return query select invitation.owner_id, invitation.project_key;
end;
$$;

grant execute on function public.get_project_invitation(uuid) to anon, authenticated;
grant execute on function public.accept_project_invitation(uuid) to authenticated;
