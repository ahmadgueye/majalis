import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSurah, getSurahMeta, surahs } from "@/lib/quran";
import { SurahPicker } from "@/components/reader/SurahPicker";
import { SurahText } from "@/components/reader/SurahText";
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
        <SurahText surah={surah} />
      </main>
    </div>
  );
}
