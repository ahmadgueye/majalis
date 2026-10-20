import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_TRANSLATION, getSurah } from "@/lib/quran";

/** Un verset depuis les données locales (aperçu du verset du cercle). GET /api/verset?ref=38:29 */
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref") ?? "";
  const m = /^(\d{1,3}):(\d{1,3})$/.exec(ref.trim());
  const surah = m ? await getSurah(Number(m[1])) : null;
  const verse = surah?.verses[Number(m![2]) - 1];
  if (!surah || !verse) return NextResponse.json({ error: "Verset introuvable" }, { status: 404 });
  return NextResponse.json(
    { ref: `${surah.meta.n}:${verse.n}`, surah: surah.meta.tname, ar: verse.ar, fr: verse.tr[DEFAULT_TRANSLATION] },
    { headers: { "Cache-Control": "public, max-age=86400, immutable" } },
  );
}
