-- À coller dans Supabase > SQL Editor > Run
-- Permet aux amis de créer un compte et de garder un historique de scores,
-- tout en gardant les droits de création/modification de quizz réservés à toi (l'admin).

-- 1) Table des administrateurs : seuls les user_id présents ici peuvent écrire des quizz/questions.
create table if not exists admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table admins enable row level security;

-- Un utilisateur connecté peut seulement vérifier SA PROPRE ligne (le site en a besoin pour savoir quel menu afficher).
create policy "chacun lit sa propre ligne admin" on admins
  for select to authenticated using (user_id = auth.uid());

-- 2) On remplace les anciennes règles "tout utilisateur connecté peut écrire" par "seul un admin peut écrire".
drop policy if exists "admin ecrit quizzes" on quizzes;
drop policy if exists "admin ecrit questions" on questions;
drop policy if exists "admin envoie quiz-media" on storage.objects;
drop policy if exists "admin supprime quiz-media" on storage.objects;

create policy "seul un admin ecrit quizzes" on quizzes
  for all to authenticated
  using (exists (select 1 from admins where user_id = auth.uid()))
  with check (exists (select 1 from admins where user_id = auth.uid()));

create policy "seul un admin ecrit questions" on questions
  for all to authenticated
  using (exists (select 1 from admins where user_id = auth.uid()))
  with check (exists (select 1 from admins where user_id = auth.uid()));

create policy "seul un admin envoie quiz-media" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'quiz-media' and exists (select 1 from admins where user_id = auth.uid())
  );

create policy "seul un admin supprime quiz-media" on storage.objects
  for delete to authenticated using (
    bucket_id = 'quiz-media' and exists (select 1 from admins where user_id = auth.uid())
  );

-- 3) Table de l'historique des scores de chaque joueur.
create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null references quizzes(id) on delete cascade,
  score int not null,
  total int not null,
  created_at timestamptz default now()
);

alter table scores enable row level security;

-- Chacun ne voit et n'enregistre que ses propres scores (pas ceux des autres).
create policy "chacun lit son propre historique" on scores
  for select to authenticated using (user_id = auth.uid());

create policy "chacun enregistre son propre score" on scores
  for insert to authenticated with check (user_id = auth.uid());

-- 4) IMPORTANT : ajoute-toi comme admin (sinon plus personne, pas même toi, ne pourra créer de quizz !)
-- Va dans Authentication > Users, copie ton "User UID", puis remplace ci-dessous et exécute cette ligne séparément :
-- insert into admins (user_id) values ('colle-ton-uid-ici');
