-- Majalis : personnalisation des cercles (teinte, couverture, intention, verset, rythme, réflexion épinglée).

alter table public.spaces
  add column tone text not null default 'teal'
    check (tone in ('teal', 'sage', 'sky', 'sand', 'rose', 'plum')),
  add column cover_pattern text not null default 'etoile'
    check (cover_pattern in ('etoile', 'arcs', 'vagues', 'losanges', 'points')),
  -- Image envoyée : chemin dans le bucket « couvertures » ; si null, le motif sert de couverture.
  add column cover_path text,
  add column intention text not null default '' check (length(intention) <= 200),
  add column verse_ref text check (verse_ref ~ '^[0-9]{1,3}:[0-9]{1,3}$'),
  -- Jour des rencontres : 1 = lundi … 7 = dimanche ; heure locale du cercle.
  add column meet_day smallint check (meet_day between 1 and 7),
  add column meet_time time,
  add column pinned_note text check (length(pinned_note) <= 280),
  add column pinned_by uuid references auth.users (id) on delete set null,
  add column pinned_at timestamptz;

create function public.is_owner(sid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.spaces where id = sid and owner_id = auth.uid());
$$;

-- Épingler une réflexion : réservé aux membres qui peuvent modifier (le reste du cercle est au responsable).
create function public.pin_note(sid uuid, note text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.can_edit(sid) then raise exception 'Droit de modification requis'; end if;
  update public.spaces
    set pinned_note = nullif(trim(note), ''),
        pinned_by = case when nullif(trim(note), '') is null then null else auth.uid() end,
        pinned_at = case when nullif(trim(note), '') is null then null else now() end
    where id = sid;
end $$;
grant execute on function public.pin_note(uuid, text) to authenticated;

-- Couvertures : bucket privé, un dossier par cercle (<space_id>/<fichier>).
-- Lecture par les membres (URL signées), écriture par le responsable.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('couvertures', 'couvertures', false, 2 * 1024 * 1024, array['image/webp', 'image/jpeg', 'image/png']);

create policy "couvertures lisibles par les membres" on storage.objects for select to authenticated
  using (bucket_id = 'couvertures' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy "couvertures envoyées par le responsable" on storage.objects for insert to authenticated
  with check (bucket_id = 'couvertures' and public.is_owner(((storage.foldername(name))[1])::uuid));
create policy "couvertures remplacées par le responsable" on storage.objects for update to authenticated
  using (bucket_id = 'couvertures' and public.is_owner(((storage.foldername(name))[1])::uuid));
create policy "couvertures supprimées par le responsable" on storage.objects for delete to authenticated
  using (bucket_id = 'couvertures' and public.is_owner(((storage.foldername(name))[1])::uuid));
