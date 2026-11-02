import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { fetchAll } from "@/lib/supabase/fetch-all";

/**
 * Sauvegarde complète du travail personnel : brouillons wolof, versions publiées et notes.
 * Utilisée par le bouton « Exporter » (avec la session : ses notes seulement) et par la
 * sauvegarde quotidienne (clé secrète : toutes les lignes, RLS ignorée).
 */
export async function buildExport(db: SupabaseClient<Database>) {
  const [drafts, published, notes] = await Promise.all([
    fetchAll((a, b) =>
      db.from("wolof_drafts").select("ref, surah, words, joins, free, updated_at").order("ref").range(a, b),
    ),
    fetchAll((a, b) =>
      db.from("wolof").select("ref, surah, words, joins, free, published_at").order("ref").range(a, b),
    ),
    fetchAll((a, b) =>
      db.from("notes").select("user_id, ref, surah, body, created_at, updated_at").order("user_id").order("ref").range(a, b),
    ),
  ]);
  return {
    app: "majalis",
    version: 1,
    exported_at: new Date().toISOString(),
    counts: { wolof_drafts: drafts.length, wolof: published.length, notes: notes.length },
    wolof_drafts: drafts,
    wolof: published,
    notes,
  };
}

export const exportName = (d = new Date()) => `majalis-sauvegarde-${d.toISOString().slice(0, 10)}.json`;
