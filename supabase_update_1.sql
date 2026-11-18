-- À coller dans Supabase > SQL Editor > Run
-- Ajoute le support de plusieurs types de questions (texte, code, image, formule, audio)
-- sans toucher aux quizz et questions déjà existants.

alter table questions add column if not exists type text not null default 'text';
alter table questions add column if not exists language text;
alter table questions add column if not exists media_url text;

-- Bucket de stockage pour les images et fichiers audio des questions
insert into storage.buckets (id, name, public)
values ('quiz-media', 'quiz-media', true)
on conflict (id) do nothing;

create policy "lecture publique quiz-media" on storage.objects
  for select using (bucket_id = 'quiz-media');

create policy "admin envoie quiz-media" on storage.objects
  for insert to authenticated with check (bucket_id = 'quiz-media');

create policy "admin supprime quiz-media" on storage.objects
  for delete to authenticated using (bucket_id = 'quiz-media');
