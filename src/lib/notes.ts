import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

// Notes personnelles : une par verset, visibles par leur auteur seul (RLS sur public.notes).

export type NoteRow = { ref: string; surah: number; body: string; updated_at: string };

/** Enregistre la note d'un verset ; une note vidée est supprimée. Renvoie faux en cas d'échec. */
export async function saveNote(db: SupabaseClient<Database>, ref: string, body: string): Promise<boolean> {
  const { session } = (await db.auth.getSession()).data;
  if (!session) return false;
  const text = body.trim();
  const { error } = text
    ? await db.from("notes").upsert({
        user_id: session.user.id,
        ref,
        surah: Number(ref.split(":")[0]),
        body: text,
        updated_at: new Date().toISOString(),
      })
    : await db.from("notes").delete().eq("ref", ref);
  return !error;
}

/** Ordre du Coran : 2:9 avant 2:10. */
export const byRef = (a: { ref: string }, b: { ref: string }) => {
  const [as, av] = a.ref.split(":").map(Number);
  const [bs, bv] = b.ref.split(":").map(Number);
  return as - bs || av - bv;
};
