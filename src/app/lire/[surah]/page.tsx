import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DEFAULT_TRANSLATION, QURAN_NOTICE, getSurah, getSurahMeta, surahs } from "@/lib/quran";
import { SurahPicker } from "@/components/reader/SurahPicker";
import { ThemeToggle } from "@/components/ThemeToggle";

type Props = { params: Promise<{ surah: string }> };

export function generateStaticParams() {
  return surahs.map((s) => ({ surah: String(s.n) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const meta = getSurahMeta(Number((await params).surah));
  return { title: meta ? `${meta.n}. ${meta.tname}` : "Lecture" };
}

export default async function ReadPage({ params }: Props) {
  const n = Number((await params).surah);
  const surah = await getSurah(n);
  if (!surah) notFound();
  const { meta, basmala, verses } = surah;

  return (
    <div className="min-h-full bg-surface">
      <header className="px-safe sticky top-0 z-5 flex h-14 items-center gap-2.5 border-b border-line bg-surface/92 backdrop-blur-sm">
        <Link
          href="/"
          className="grid size-[30px] flex-none place-items-center rounded-lg bg-accent font-mark text-lg leading-none font-bold text-accent-ink"
          aria-label="Majalis, accueil"
        >
          م
        </Link>
        <SurahPicker current={n} surahs={surahs.map(({ n, tname, ar }) => ({ n, tname, ar }))} />
        <nav className="ml-auto flex gap-1.5" aria-label="Sourates voisines">
          <ThemeToggle />
          {n > 1 && (
            <Link className="btn" href={`/lire/${n - 1}`} title="Sourate précédente">
              ‹ {n - 1}
            </Link>
          )}
          {n < 114 && (
            <Link className="btn" href={`/lire/${n + 1}`} title="Sourate suivante">
              {n + 1} ›
            </Link>
          )}
        </nav>
      </header>

      <main className="px-safe mx-auto max-w-[720px] pt-2 pb-12">
        <div className="pt-7 pb-1.5 text-center">
          <div className="font-ar text-[34px] leading-[1.6]" lang="ar">
            سورة {meta.ar}
          </div>
          <div className="text-[13px] text-muted">
            {meta.tname} · {meta.type === "Meccan" ? "mecquoise" : "médinoise"} · {meta.ayas} versets
          </div>
        </div>
        {basmala && (
          <p className="mt-1.5 mb-3.5 text-center font-ar text-2xl text-muted" lang="ar">
            {basmala}
          </p>
        )}
        <ol className="flex flex-col gap-0.5">
          {verses.map((v) => (
            <li key={v.n} className="scroll-mt-[72px] rounded-xl px-4 py-3.5 hover:bg-surface-2" id={`v${v.n}`}>
              <span className="text-[11.5px] font-semibold text-faint tabular-nums">
                {n}:{v.n}
              </span>
              <p className="my-1 text-right font-ar text-ar" lang="ar" dir="rtl">
                {v.ar}
              </p>
              <p className="font-read text-tr">{v.tr[DEFAULT_TRANSLATION]}</p>
            </li>
          ))}
        </ol>
        <footer className="mt-7 border-t border-line pt-3.5 text-xs leading-normal text-faint">
          Texte arabe : {QURAN_NOTICE.split(". License")[0]} (
          <a className="underline" href="https://tanzil.net" target="_blank" rel="noreferrer">
            tanzil.net
          </a>
          ), licence CC BY 3.0. Traduction : Muhammad Hamidullah.
        </footer>
      </main>
    </div>
  );
}
