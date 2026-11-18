import { createClient } from "@supabase/supabase-js";

// La clé "anon" est publique par conception : la sécurité repose sur les règles RLS (voir supabase.sql).
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Envoie un fichier (image ou audio) dans le bucket "quiz-media" et renvoie son adresse publique.
export async function uploadMedia(file) {
  const ext = file.name.split(".").pop();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("quiz-media").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("quiz-media").getPublicUrl(path);
  return data.publicUrl;
}
