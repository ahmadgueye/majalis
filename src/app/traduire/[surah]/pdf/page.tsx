import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintBar } from "@/components/pdf/PrintBar";
import { requireViewer } from "@/lib/auth";
import { DEFAULT_TRANSLATION, QURAN_NOTICE, getSurah, getSurahMeta } from "@/lib/quran";
import { EMPTY, fromWolofRow, tiles, wolofText, type WolofVerse } from "@/lib/wolof";
import { isTranslator } from "@/lib/wolof-server";

type Props = {
  params: Promise<{ surah: string }>;
  searchParams: Promise<{ de?: string; a?: string; notes?: string }>;
};

/** Versets demandés (?de=…&a=…), bornés à la sourate ; toute la sourate par défaut. */
function range(ayas: number, de?: string, a?: string) {
  const clamp = (v: string | undefined, d: number) => Math.min(ayas, Math.max(1, Number(v) || d));
  const [x, y] = [clamp(de, 1), clamp(a, ayas)];
  return x <= y ? [x, y] : [y, x];
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const meta = getSurahMeta(Number((await params).surah));
  if (!meta) return { title: "PDF" };
  const { de, a } = await searchParams;
  const [x, y] = range(meta.ayas, de, a);
  const part = x === 1 && y === meta.ayas ? "" : x === y ? ` ${x}` : ` ${x}-${y}`;
  // Le titre devient le nom proposé pour le fichier PDF.
  return { title: { absolute: `${meta.n}. ${meta.tname}${part} - mot à mot wolof` } };
}

/**
 * Document à imprimer ou enregistrer en PDF (A4) : pour chaque verset, l'arabe, le mot à mot
 * arabe-wolof, le français, le wolof et, sur demande, ma note. Le navigateur fait le PDF :
 * l'arabe y est rendu comme à l'écran (lettres liées, droite à gauche), ce que les bibliothèques
 * PDF gratuites font mal. Brouillon de travail : réservé aux traducteurs.
 */
export default async function SurahPdf({ params, searchParams }: Props) {
  const n = Number((await params).surah);
  const { de, a, notes: withNotes } = await searchParams;
  const viewer = await requireViewer(`/traduire/${n}`);
  const db = viewer.supabase;
  if (!(await isTranslator(db))) notFound();
  const surah = await getSurah(n);
  if (!surah) notFound();
  const { meta, basmala } = surah;
  const [x, y] = range(meta.ayas, de, a);
  const verses = surah.verses.slice(x - 1, y);

  const [{ data: rows }, { data: noteRows }] = await Promise.all([
    db.from("wolof_drafts").select("ref, words, joins, free").eq("surah", n),
    withNotes === "1" ? db.from("notes").select("ref, body").eq("surah", n) : Promise.resolve({ data: [] }),
  ]);
  const drafts = new Map<string, WolofVerse>((rows ?? []).map((r) => [r.ref, fromWolofRow(r)]));
  const notes = new Map((noteRows ?? []).map((r) => [r.ref, r.body]));
  const whole = x === 1 && y === meta.ayas;
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-dvh bg-surface text-ink print:bg-transparent">
      <PrintBar />
      <article className="mx-auto max-w-[760px] px-8 pt-10 pb-12 print:max-w-none print:p-0">
        <header className="mb-6 border-b border-line pb-5 text-center">
          <div className="font-ar text-[40px] leading-[1.5]" lang="ar">
            سورة {meta.ar}
          </div>
          <div className="text-[17px] font-semibold">
            {meta.n}. {meta.tname}
          </div>
          <div className="mt-0.5 text-[13px] text-muted">
            {whole ? `${meta.ayas} versets` : x === y ? `Verset ${x}` : `Versets ${x} à ${y}`} · mot à mot en wolof
          </div>
          {basmala && x === 1 && (
            <p className="mt-4 font-ar text-[26px] leading-[1.8]" lang="ar" dir="rtl">
              {basmala}
            </p>
          )}
        </header>

        <div className="grid gap-7">
          {verses.map((v) => {
            const ref = `${n}:${v.n}`;
            const d = drafts.get(ref) ?? EMPTY;
            const wo = wolofText(v.ar, d);
            const note = notes.get(ref);
            return (
              <section key={v.n} className="break-inside-avoid">
                <div className="mb-1 text-[12px] font-bold text-muted tabular-nums">{ref}</div>
                <p className="text-right font-ar text-[27px] leading-[1.9]" lang="ar" dir="rtl">
                  {v.ar}
                </p>

                <div className="mt-2 flex flex-wrap gap-x-2 gap-y-2.5" dir="rtl">
                  {tiles(v.ar, d.joins).map((t) => {
                    const w = (d.words[t.i] ?? "").trim();
                    return (
                      <div
                        key={t.i}
                        className="grid min-w-[70px] break-inside-avoid justify-items-center rounded-md border border-line px-2 pt-0.5 pb-1.5 text-center"
                      >
                        <span className="font-ar text-[21px] leading-[1.7]" lang="ar">
                          {t.ar}
                        </span>
                        <span className={`text-[12.5px] ${w ? "font-semibold" : "text-faint"}`} dir="ltr" lang="wo">
                          {w || "…"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <dl className="mt-3 grid grid-cols-[72px_1fr] gap-x-3 gap-y-1.5 text-[14px] leading-relaxed">
                  <dt className="font-semibold text-muted">Français</dt>
                  <dd className="font-read">{v.tr[DEFAULT_TRANSLATION]}</dd>
                  <dt className="font-semibold text-muted">Wolof</dt>
                  <dd className={wo ? "font-read" : "text-faint"} lang="wo">
                    {wo || "Pas encore traduit"}
                  </dd>
                  {note && (
                    <>
                      <dt className="font-semibold text-muted">Ma note</dt>
                      <dd className="font-read whitespace-pre-wrap">{note}</dd>
                    </>
                  )}
                </dl>
              </section>
            );
          })}
        </div>

        <footer className="mt-10 border-t border-line pt-3 text-[11px] leading-normal text-muted">
          Texte arabe : {QURAN_NOTICE.split(". License")[0]} (tanzil.net), licence CC BY 3.0. Français : Muhammad
          Hamidullah. Wolof : traduction de travail de Majalis. Document créé le {today}.
        </footer>
      </article>
    </div>
  );
}
