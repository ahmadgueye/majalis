import { NextResponse } from "next/server";
import { buildExport, exportName } from "@/lib/export";
import { createClient } from "@/lib/supabase/server";

/** « Exporter mes traductions et notes » : un fichier JSON à télécharger (session requise). */
export async function GET() {
  const db = await createClient();
  const user = db && (await db.auth.getUser()).data.user;
  if (!db || !user) return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  const data = await buildExport(db);
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exportName()}"`,
      "Cache-Control": "no-store",
    },
  });
}
