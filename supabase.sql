-- À coller dans Supabase > SQL Editor > Run
-- Script complet : crée toute la base en partant de zéro (quizz multi-types + comptes joueurs + admin).

create table quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  theme text not null,
  created_at timestamptz default now()
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  type text not null default 'text', -- text | code | image | math | audio
  question text not null,            -- texte, code, LaTeX, ou légende selon le type
  language text,                     -- langage du code si type = 'code'
  media_url text,                    -- adresse de l'image/audio si type = 'image' ou 'audio'
  correct text not null,
  wrong text[] not null check (array_length(wrong, 1) = 3),
  created_at timestamptz default now()
);

-- Table des administrateurs : seuls les user_id présents ici peuvent créer/modifier des quizz.
create table admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- Historique des scores de chaque joueur.
create table scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null references quizzes(id) on delete cascade,
  score int not null,
  total int not null,
  created_at timestamptz default now()
);

alter table quizzes enable row level security;
alter table questions enable row level security;
alter table admins enable row level security;
alter table scores enable row level security;

-- Tout le monde peut lire les quizz et questions (jouer sans compte)
create policy "lecture publique quizzes" on quizzes for select using (true);
create policy "lecture publique questions" on questions for select using (true);

-- Seul un admin (présent dans la table admins) peut créer/modifier/supprimer
create policy "seul un admin ecrit quizzes" on quizzes
  for all to authenticated
  using (exists (select 1 from admins where user_id = auth.uid()))
  with check (exists (select 1 from admins where user_id = auth.uid()));

create policy "seul un admin ecrit questions" on questions
  for all to authenticated
  using (exists (select 1 from admins where user_id = auth.uid()))
  with check (exists (select 1 from admins where user_id = auth.uid()));

-- Un utilisateur connecté peut seulement vérifier sa propre ligne admin
create policy "chacun lit sa propre ligne admin" on admins
  for select to authenticated using (user_id = auth.uid());

-- Chacun ne voit et n'enregistre que ses propres scores
create policy "chacun lit son propre historique" on scores
  for select to authenticated using (user_id = auth.uid());
create policy "chacun enregistre son propre score" on scores
  for insert to authenticated with check (user_id = auth.uid());

-- Bucket de stockage pour les images et fichiers audio des questions
insert into storage.buckets (id, name, public)
values ('quiz-media', 'quiz-media', true)
on conflict (id) do nothing;

create policy "lecture publique quiz-media" on storage.objects
  for select using (bucket_id = 'quiz-media');

create policy "seul un admin envoie quiz-media" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'quiz-media' and exists (select 1 from admins where user_id = auth.uid())
  );

create policy "seul un admin supprime quiz-media" on storage.objects
  for delete to authenticated using (
    bucket_id = 'quiz-media' and exists (select 1 from admins where user_id = auth.uid())
  );

-- IMPORTANT : ajoute-toi comme admin après avoir créé ton compte (Authentication > Users > copie ton UID) :
-- insert into admins (user_id) values ('colle-ton-uid-ici');
