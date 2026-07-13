alter table public.project_invitations alter column email drop not null;

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

grant execute on function public.accept_project_invitation(uuid) to authenticated;
