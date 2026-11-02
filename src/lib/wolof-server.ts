import "server-only";
import { createClient as createPlainClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { hasSupabase, supabaseKey, supabaseUrl } from "@/lib/supabase/env";
import { fromWolofRow, type WolofVerse } from "@/lib/wolof";

type Db = SupabaseClient<Database>;

export async function isTranslator(db: Db) {
  const { data } = await db.rpc("is_translator");
  return data === true;
}

/** Le wolof publié des sourates données, par verset. Sans base joignable : rien, la page s'affiche sans wolof. */
export async function publishedWolof(surahs: number[], db?: Db): Promise<Record<string, WolofVerse>> {
  const out: Record<string, WolofVerse> = {};
  if (!surahs.length || !hasSupabase) return out;
  // Sans session : la page Lecture est générée à l'avance et le wolof publié est lisible par tous.
  const client = db ?? createPlainClient<Database>(supabaseUrl!, supabaseKey!, { auth: { persistSession: false } });
  try {
    const { data } = await client.from("wolof").select("ref, words, joins, free").in("surah", surahs);
    for (const r of data ?? []) out[r.ref] = fromWolofRow(r);
  } catch {
    // Base injoignable (build sans Supabase) : on continue sans wolof.
  }
  return out;
}
