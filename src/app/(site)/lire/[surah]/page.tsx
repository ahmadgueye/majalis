import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSurah, getSurahMeta, surahs } from "@/lib/quran";
import { SurahPicker } from "@/components/reader/SurahPicker";
import { ReadingModes } from "@/components/reader/ReadingModes";
import { SurahText } from "@/components/reader/SurahText";
import { PageBar } from "@/components/SiteHeader";
import { publishedWolof } from "@/lib/wolof-server";

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
  // Lu à la génération ; « Publier » sur /traduire régénère la page.
  const wolof = await publishedWolof([n]);

  return (
    <div className="min-h-full bg-surface">
      <PageBar>
        <SurahPicker current={n} surahs={surahs.map(({ n, tname, ar }) => ({ n, tname, ar }))} />
        <nav className="ml-auto flex gap-1.5" aria-label="Sourates voisines">
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
      </PageBar>

      <main className="px-safe mx-auto max-w-[720px] pt-2 pb-12">
        <ReadingModes className="pt-4" />
        <SurahText surah={surah} wolof={wolof} />
      </main>
    </div>
  );
}
