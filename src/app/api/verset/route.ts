import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_TRANSLATION, getSurah } from "@/lib/quran";
import { wolofText } from "@/lib/wolof";
import { publishedWolof } from "@/lib/wolof-server";

/** Un verset depuis les données locales, avec son wolof publié. GET /api/verset?ref=38:29 */
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref") ?? "";
  const m = /^(\d{1,3}):(\d{1,3})$/.exec(ref.trim());
  const surah = m ? await getSurah(Number(m[1])) : null;
  const verse = surah?.verses[Number(m![2]) - 1];
  if (!surah || !verse) return NextResponse.json({ error: "Verset introuvable" }, { status: 404 });
  const key = `${surah.meta.n}:${verse.n}`;
  const wolof = await publishedWolof([surah.meta.n]);
  return NextResponse.json(
    { ref: key, surah: surah.meta.tname, ar: verse.ar, fr: verse.tr[DEFAULT_TRANSLATION], wo: wolofText(verse.ar, wolof[key]) },
    // Court : le wolof peut être publié entre-temps.
    { headers: { "Cache-Control": "public, max-age=300" } },
  );
}
