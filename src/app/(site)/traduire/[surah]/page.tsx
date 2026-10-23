import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TranslateView } from "@/components/wolof/TranslateView";
import { requireViewer } from "@/lib/auth";
import { DEFAULT_TRANSLATION, getSurah, surahs } from "@/lib/quran";
import { fromWolofRow, known, type Known, type WolofVerse } from "@/lib/wolof";
import { isTranslator, publishedWolof } from "@/lib/wolof-server";

type Props = { params: Promise<{ surah: string }> };

export const metadata: Metadata = { title: "Traduire en wolof" };

/** Mot à mot wolof, réservé aux traducteurs. Les autres obtiennent la page introuvable. */
export default async function TranslatePage({ params }: Props) {
  const n = Number((await params).surah);
  const viewer = await requireViewer(`/traduire/${n}`);
  const db = viewer.supabase;
  if (!(await isTranslator(db))) notFound();
  const surah = await getSurah(n);
  if (!surah) notFound();

  const [{ data: rows }, published] = await Promise.all([
    db.from("wolof_drafts").select("ref, surah, words, joins, free"),
    publishedWolof([n], db),
  ]);

  // Brouillons de cette sourate, et mots déjà traduits ailleurs (suggestions et glossaire).
  const drafts: Record<string, WolofVerse> = {};
  const elsewhere: Known[] = [];
  const others = [...new Set((rows ?? []).map((r) => r.surah).filter((s) => s !== n))];
  const texts = new Map((await Promise.all(others.map((s) => getSurah(s)))).flatMap((s) => (s ? [[s.meta.n, s] as const] : [])));
  for (const r of rows ?? []) {
    const v = fromWolofRow(r);
    if (r.surah === n) {
      drafts[r.ref] = v;
      continue;
    }
    const ar = texts.get(r.surah)?.verses[Number(r.ref.split(":")[1]) - 1]?.ar;
    if (ar) elsewhere.push(...known(r.ref, ar, v));
  }

  return (
    <TranslateView
      surahs={surahs.map(({ n, tname, ar }) => ({ n, tname, ar }))}
      text={{
        n,
        ar: surah.meta.ar,
        tname: surah.meta.tname,
        verses: surah.verses.map((v) => ({ n: v.n, ar: v.ar, fr: v.tr[DEFAULT_TRANSLATION] })),
      }}
      initialDrafts={drafts}
      initialPublished={published}
      elsewhere={elsewhere}
    />
  );
}
