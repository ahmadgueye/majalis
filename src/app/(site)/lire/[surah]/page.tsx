import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSurah, getSurahMeta, surahs } from "@/lib/quran";
import { SurahText } from "@/components/reader/SurahText";
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
  const prev = getSurahMeta(n - 1);
  const next = getSurahMeta(n + 1);

  return (
    <main className="mx-auto w-full max-w-[780px] pt-2 pb-12">
      <SurahText
        surah={surah}
        wolof={wolof}
        after={
          <nav aria-label="Sourates voisines" className="mt-8 grid gap-2 sm:grid-cols-2">
            {prev && (
              <Link href={`/lire/${prev.n}`} className="rounded-xl border border-line px-4 py-3 hover:bg-surface-2">
                <span className="block text-[12px] font-semibold text-muted">‹ Sourate précédente</span>
                <span className="block font-semibold">
                  {prev.n}. {prev.tname}
                </span>
              </Link>
            )}
            {next && (
              <Link
                href={`/lire/${next.n}`}
                className="rounded-xl border border-line px-4 py-3 text-right hover:bg-surface-2 sm:col-start-2"
              >
                <span className="block text-[12px] font-semibold text-muted">Sourate suivante ›</span>
                <span className="block font-semibold">
                  {next.n}. {next.tname}
                </span>
              </Link>
            )}
          </nav>
        }
      />
    </main>
  );
}
