import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TranslateHome, type SurahProgress } from "@/components/wolof/TranslateHome";
import { requireViewer } from "@/lib/auth";
import { getSurah, surahs } from "@/lib/quran";
import { fetchAll } from "@/lib/supabase/fetch-all";
import { arWords, fromWolofRow, tiles, wolofText } from "@/lib/wolof";
import { isTranslator } from "@/lib/wolof-server";

export const metadata: Metadata = { title: "Traduire en wolof" };

/** Vue d'ensemble du mot à mot : avancement des 114 sourates, reprise, recherche, export. */
export default async function TranslateIndex() {
  const viewer = await requireViewer("/traduire");
  const db = viewer.supabase;
  if (!(await isTranslator(db))) notFound();

  const [drafts, published, notes] = await Promise.all([
    fetchAll((a, b) =>
      db.from("wolof_drafts").select("ref, surah, words, joins, free, updated_at").order("ref").range(a, b),
    ),
    fetchAll((a, b) => db.from("wolof").select("ref, surah").order("ref").range(a, b)),
    fetchAll((a, b) => db.from("notes").select("ref, surah").order("ref").range(a, b)),
  ]);

  const texts = await Promise.all(surahs.map((s) => getSurah(s.n)));
  const draftByRef = new Map(drafts.map((d) => [d.ref, d]));
  const count = (rows: { surah: number }[]) => {
    const m = new Map<number, number>();
    for (const r of rows) m.set(r.surah, (m.get(r.surah) ?? 0) + 1);
    return m;
  };
  const publishedBySurah = count(published);
  const notesBySurah = count(notes);

  // Mots à traduire : les tuiles (mots fusionnés comptés une fois) ; un verset pas commencé compte ses mots.
  const index: { ref: string; wo: string }[] = [];
  const progress: SurahProgress[] = texts.flatMap((t) => {
    if (!t) return [];
    let words = 0;
    let done = 0;
    for (const v of t.verses) {
      const ref = `${t.meta.n}:${v.n}`;
      const row = draftByRef.get(ref);
      if (!row) {
        words += arWords(v.ar).length;
        continue;
      }
      const d = fromWolofRow(row);
      for (const tile of tiles(v.ar, d.joins)) {
        words++;
        if ((d.words[tile.i] ?? "").trim()) done++;
      }
      const wo = wolofText(v.ar, d);
      if (wo) index.push({ ref, wo });
    }
    return [
      {
        n: t.meta.n,
        tname: t.meta.tname,
        ar: t.meta.ar,
        ayas: t.meta.ayas,
        words,
        done,
        published: publishedBySurah.get(t.meta.n) ?? 0,
        notes: notesBySurah.get(t.meta.n) ?? 0,
      },
    ];
  });

  // Reprendre là où on s'est arrêté : le dernier verset modifié.
  const last = drafts.reduce<(typeof drafts)[number] | null>(
    (a, d) => (!a || d.updated_at > a.updated_at ? d : a),
    null,
  );

  return <TranslateHome progress={progress} index={index} resume={last?.ref ?? null} />;
}
