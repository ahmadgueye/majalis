import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { supabaseUrl } from "@/lib/supabase/env";
import { buildExport, exportName } from "@/lib/export";
import { hasDrive, saveToDrive } from "@/lib/google-drive";

export const dynamic = "force-dynamic";

/**
 * Tâche quotidienne (vercel.json → crons) :
 * 1. lit toute la base (traductions, publications, notes) : ce passage suffit à garder le projet
 *    Supabase gratuit actif (il se met en pause après 7 jours sans activité) ;
 * 2. dépose la sauvegarde JSON dans le Google Drive du porteur, si Drive est configuré.
 * Vercel appelle la route avec « Authorization: Bearer $CRON_SECRET ».
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !key) return NextResponse.json({ error: "SUPABASE_SECRET_KEY manquante" }, { status: 500 });

  // Clé secrète : lit toutes les lignes, y compris les notes (RLS ignorée). Jamais côté navigateur.
  const db = createClient<Database>(supabaseUrl, key, { auth: { persistSession: false } });
  try {
    const data = await buildExport(db);
    const drive = hasDrive ? await saveToDrive(exportName(), JSON.stringify(data, null, 2)) : "non configuré";
    return NextResponse.json({ ok: true, counts: data.counts, drive });
  } catch (e) {
    console.error("Sauvegarde quotidienne :", e);
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
