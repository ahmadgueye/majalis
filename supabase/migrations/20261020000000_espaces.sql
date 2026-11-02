-- Majalis : fonctions pour les espaces (cercles) et les invitations.

-- Créer un espace et en devenir propriétaire en une seule opération.
-- Un insert direct suivi d'un select échoue : le membre propriétaire est ajouté par un déclencheur
-- après l'insert, donc la politique de lecture (is_member) ne voit pas encore la ligne.
create function public.create_space(space_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare sid uuid;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  if length(trim(space_name)) = 0 then raise exception 'Le nom est vide'; end if;
  insert into public.spaces (name, owner_id) values (trim(space_name), auth.uid()) returning id into sid;
  return sid;
end $$;

-- Ce qu'une personne voit d'une invitation avant de rejoindre : le nom du cercle, qui invite,
-- le rôle proposé et si elle en est déjà membre. Rien d'autre n'est lisible sans être membre.
create function public.invite_info(invite_token text)
returns table (space_id uuid, space_name text, invited_by text, role text, expires_at timestamptz, already_member boolean)
language sql stable security definer set search_path = '' as $$
  select s.id, s.name, coalesce(p.display_name, ''), i.role, i.expires_at,
         exists (select 1 from public.space_members m where m.space_id = s.id and m.user_id = auth.uid())
  from public.space_invites i
  join public.spaces s on s.id = i.space_id
  left join public.profiles p on p.id = i.created_by
  where i.token = invite_token and i.expires_at > now();
$$;

-- Le propriétaire peut changer le rôle des autres membres (pas le sien).
create policy "le propriétaire change les rôles" on public.space_members for update
  using (exists (select 1 from public.spaces s where s.id = space_id and s.owner_id = auth.uid()))
  with check (role in ('editor', 'viewer') and user_id <> auth.uid());

grant execute on function public.create_space(text) to authenticated;
grant execute on function public.invite_info(text) to authenticated;
