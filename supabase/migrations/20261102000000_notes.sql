-- Notes personnelles : une note par verset et par personne, lue et écrite par elle seule.
-- Elles s'écrivent dans Traduire et dans la Lecture, et se retrouvent dans « Mes notes ».

create table public.notes (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  ref text not null check (ref ~ '^[0-9]{1,3}:[0-9]{1,3}$'),
  surah smallint not null check (surah between 1 and 114),
  body text not null check (length(body) between 1 and 20000), -- une note vidée est supprimée
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, ref)
);
create index notes_user_surah on public.notes (user_id, surah);

alter table public.notes enable row level security;
create policy "lire ses notes" on public.notes for select using (user_id = auth.uid());
create policy "écrire ses notes" on public.notes for insert with check (user_id = auth.uid());
create policy "modifier ses notes" on public.notes for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "supprimer ses notes" on public.notes for delete using (user_id = auth.uid());
