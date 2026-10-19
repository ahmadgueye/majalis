-- Majalis : schéma initial.
-- Un espace (space) réunit des membres. Chaque espace contient des séances (sessions),
-- et chaque séance a son tableau, ses surlignages et sa discussion.
-- Le mot à mot wolof et le glossaire sont partagés à l'échelle de l'espace.

create extension if not exists pgcrypto;

-- Profils ---------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  color text not null default '#0d5c52',
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Espaces et membres -----------------------------------------------------
create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.space_members (
  space_id uuid not null references public.spaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor', 'viewer')),
  joined_at timestamptz not null default now(),
  primary key (space_id, user_id)
);
create index on public.space_members (user_id);

create table public.space_invites (
  token text primary key default encode(gen_random_bytes(12), 'hex'),
  space_id uuid not null references public.spaces (id) on delete cascade,
  role text not null default 'editor' check (role in ('editor', 'viewer')),
  created_by uuid not null references auth.users (id) on delete cascade default auth.uid(),
  expires_at timestamptz not null default now() + interval '14 days'
);

-- Fonctions d'accès (security definer pour éviter la récursion des politiques)
create function public.is_member(sid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.space_members where space_id = sid and user_id = auth.uid());
$$;

create function public.can_edit(sid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.space_members
                 where space_id = sid and user_id = auth.uid() and role in ('owner', 'editor'));
$$;

create function public.add_owner_as_member() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.space_members (space_id, user_id, role) values (new.id, new.owner_id, 'owner');
  return new;
end $$;

create trigger on_space_created after insert on public.spaces
  for each row execute function public.add_owner_as_member();

-- Rejoindre un espace avec un lien d'invitation
create function public.accept_invite(invite_token text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare inv public.space_invites;
begin
  if auth.uid() is null then raise exception 'Connexion requise'; end if;
  select * into inv from public.space_invites where token = invite_token and expires_at > now();
  if not found then raise exception 'Invitation invalide ou expirée'; end if;
  insert into public.space_members (space_id, user_id, role)
  values (inv.space_id, auth.uid(), inv.role)
  on conflict (space_id, user_id) do nothing;
  return inv.space_id;
end $$;

-- Séances ------------------------------------------------------------------
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  title text not null default 'Nouvelle séance',
  surah smallint not null default 1 check (surah between 1 and 114),
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index on public.sessions (space_id, created_at desc);

-- Tableau : un élément par ligne (carte de verset, note, texte, cadre, flèche, dessin)
create table public.board_elements (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete cascade,
  space_id uuid not null references public.spaces (id) on delete cascade,
  type text not null check (type in ('verse', 'note', 'text', 'rect', 'arrow', 'stroke')),
  data jsonb not null default '{}',
  z double precision not null default 0,
  updated_by uuid references auth.users (id) on delete set null default auth.uid(),
  updated_at timestamptz not null default now()
);
create index on public.board_elements (session_id);

-- Surlignages (Thème, Question, À méditer, Lien) par séance
create table public.highlights (
  session_id uuid not null references public.sessions (id) on delete cascade,
  space_id uuid not null references public.spaces (id) on delete cascade,
  ref text not null check (ref ~ '^[0-9]{1,3}:[0-9]{1,3}$'),
  kind text not null check (kind in ('theme', 'question', 'reflect', 'link')),
  primary key (session_id, ref)
);

-- Discussion : commentaires ancrés (verset, mot, élément du tableau ou séance)
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  session_id uuid references public.sessions (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  anchor jsonb,
  author_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  body text not null check (length(body) between 1 and 5000),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.comments (session_id, created_at);

create table public.mentions (
  comment_id uuid not null references public.comments (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  space_id uuid not null references public.spaces (id) on delete cascade,
  read_at timestamptz,
  primary key (comment_id, user_id)
);
create index on public.mentions (user_id) where read_at is null;

-- Mot à mot wolof, partagé dans l'espace (sert aussi de glossaire)
create table public.wbw_translations (
  space_id uuid not null references public.spaces (id) on delete cascade,
  ref text not null check (ref ~ '^[0-9]{1,3}:[0-9]{1,3}$'),
  words jsonb not null default '{}',   -- { "<index du premier mot>": "traduction" }
  joins smallint[] not null default '{}', -- index des mots fusionnés avec le suivant
  free text not null default '',       -- traduction libre du verset
  updated_by uuid references auth.users (id) on delete set null default auth.uid(),
  updated_at timestamptz not null default now(),
  primary key (space_id, ref)
);

-- Sécurité par ligne -----------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.spaces enable row level security;
alter table public.space_members enable row level security;
alter table public.space_invites enable row level security;
alter table public.sessions enable row level security;
alter table public.board_elements enable row level security;
alter table public.highlights enable row level security;
alter table public.comments enable row level security;
alter table public.mentions enable row level security;
alter table public.wbw_translations enable row level security;

-- Profils : chacun voit les profils des personnes avec qui il partage un espace
create policy "profil lisible par les co-membres" on public.profiles for select using (
  id = auth.uid() or exists (
    select 1 from public.space_members a join public.space_members b on a.space_id = b.space_id
    where a.user_id = auth.uid() and b.user_id = profiles.id));
create policy "profil modifiable par soi" on public.profiles for update using (id = auth.uid());

create policy "espaces visibles par les membres" on public.spaces for select using (public.is_member(id));
create policy "créer un espace" on public.spaces for insert with check (owner_id = auth.uid());
create policy "renommer son espace" on public.spaces for update using (owner_id = auth.uid());
create policy "supprimer son espace" on public.spaces for delete using (owner_id = auth.uid());

create policy "membres visibles par les membres" on public.space_members for select using (public.is_member(space_id));
create policy "le propriétaire gère les membres" on public.space_members for delete using (
  exists (select 1 from public.spaces s where s.id = space_id and s.owner_id = auth.uid()) or user_id = auth.uid());

create policy "invitations visibles par les éditeurs" on public.space_invites for select using (public.can_edit(space_id));
create policy "créer une invitation" on public.space_invites for insert with check (public.can_edit(space_id));
create policy "supprimer une invitation" on public.space_invites for delete using (public.can_edit(space_id));

-- Tables de contenu : lecture pour les membres, écriture pour les éditeurs
do $$
declare t text;
begin
  foreach t in array array['sessions', 'board_elements', 'highlights', 'wbw_translations'] loop
    execute format('create policy "lecture membres" on public.%I for select using (public.is_member(space_id))', t);
    execute format('create policy "ajout éditeurs" on public.%I for insert with check (public.can_edit(space_id))', t);
    execute format('create policy "modif éditeurs" on public.%I for update using (public.can_edit(space_id))', t);
    execute format('create policy "suppression éditeurs" on public.%I for delete using (public.can_edit(space_id))', t);
  end loop;
end $$;

create policy "commentaires lisibles" on public.comments for select using (public.is_member(space_id));
create policy "commenter" on public.comments for insert with check (public.is_member(space_id) and author_id = auth.uid());
create policy "modifier son commentaire ou résoudre" on public.comments for update using (public.can_edit(space_id) or author_id = auth.uid());
create policy "supprimer son commentaire" on public.comments for delete using (author_id = auth.uid());

create policy "mes mentions" on public.mentions for select using (user_id = auth.uid());
create policy "mentionner un membre" on public.mentions for insert with check (
  public.is_member(space_id) and exists (
    select 1 from public.space_members m where m.space_id = mentions.space_id and m.user_id = mentions.user_id));
create policy "marquer comme lue" on public.mentions for update using (user_id = auth.uid());

-- Temps réel --------------------------------------------------------------------
alter publication supabase_realtime add table
  public.board_elements, public.highlights, public.comments, public.mentions, public.wbw_translations;
alter table public.board_elements replica identity full;
alter table public.highlights replica identity full;
