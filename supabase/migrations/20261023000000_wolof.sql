-- Mot à mot wolof : une seule traduction pour toute l'app, faite par les traducteurs.
-- Le traducteur travaille dans un brouillon (wolof_drafts), visible de lui seul ;
-- « Publier » recopie le brouillon dans wolof, que tout le monde peut lire, même sans compte.

drop table if exists public.wbw_translations;

-- Traducteurs : on ne devient traducteur que par une ligne ajoutée en SQL, jamais depuis l'app.
--   insert into public.translators (user_id) select id from auth.users where email = '…';
create table public.translators (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.translators enable row level security;
create policy "voir son rôle de traducteur" on public.translators for select using (user_id = auth.uid());

create function public.is_translator() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.translators where user_id = auth.uid());
$$;

-- Les mots sont ceux du texte affiché (basmala séparée), découpés par espaces.
create table public.wolof_drafts (
  ref text primary key check (ref ~ '^[0-9]{1,3}:[0-9]{1,3}$'),
  surah smallint not null check (surah between 1 and 114),
  words jsonb not null default '{}',     -- { "<index du premier mot>": "traduction" }
  joins smallint[] not null default '{}', -- index des mots fusionnés avec le suivant
  free text not null default '',         -- traduction libre du verset
  updated_by uuid references auth.users (id) on delete set null default auth.uid(),
  updated_at timestamptz not null default now()
);
create index wolof_drafts_surah on public.wolof_drafts (surah);

create table public.wolof (
  ref text primary key check (ref ~ '^[0-9]{1,3}:[0-9]{1,3}$'),
  surah smallint not null check (surah between 1 and 114),
  words jsonb not null default '{}',
  joins smallint[] not null default '{}',
  free text not null default '',
  published_by uuid references auth.users (id) on delete set null default auth.uid(),
  published_at timestamptz not null default now()
);
create index wolof_surah on public.wolof (surah);

alter table public.wolof_drafts enable row level security;
alter table public.wolof enable row level security;

create policy "brouillon : lecture" on public.wolof_drafts for select using (public.is_translator());
create policy "brouillon : ajout" on public.wolof_drafts for insert with check (public.is_translator());
create policy "brouillon : modif" on public.wolof_drafts for update using (public.is_translator());
create policy "brouillon : suppression" on public.wolof_drafts for delete using (public.is_translator());

create policy "wolof publié lisible par tous" on public.wolof for select using (true);
create policy "retirer une publication" on public.wolof for delete using (public.is_translator());

-- Publie les brouillons des versets donnés. Un brouillon vide retire la publication.
create function public.publish_wolof(refs text[]) returns integer
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  if not public.is_translator() then
    raise exception 'réservé aux traducteurs' using errcode = '42501';
  end if;
  delete from public.wolof w using public.wolof_drafts d
    where w.ref = d.ref and d.ref = any (refs) and d.words = '{}' and d.free = '';
  insert into public.wolof (ref, surah, words, joins, free, published_by, published_at)
    select ref, surah, words, joins, free, auth.uid(), now()
    from public.wolof_drafts
    where ref = any (refs) and (words <> '{}' or free <> '')
  on conflict (ref) do update
    set words = excluded.words, joins = excluded.joins, free = excluded.free,
        published_by = excluded.published_by, published_at = excluded.published_at;
  get diagnostics n = row_count;
  return n;
end $$;

grant select on public.wolof to anon;
