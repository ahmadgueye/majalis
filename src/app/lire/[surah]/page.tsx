import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DEFAULT_TRANSLATION, QURAN_NOTICE, getSurah, getSurahMeta, surahs } from "@/lib/quran";
import { SurahPicker } from "@/components/reader/SurahPicker";
import styles from "./reader.module.css";

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
    <div className={styles.page}>
      <header className={styles.top}>
        <Link href="/" className={styles.mark} aria-label="Majalis, accueil">
          م
        </Link>
        <SurahPicker current={n} surahs={surahs.map(({ n, tname, ar }) => ({ n, tname, ar }))} />
        <nav className={styles.nav} aria-label="Sourates voisines">
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

      <main className={styles.reader}>
        <div className={styles.head}>
          <div className={styles.headAr} lang="ar">
            سورة {meta.ar}
          </div>
          <div className={styles.sub}>
            {meta.tname} · {meta.type === "Meccan" ? "mecquoise" : "médinoise"} · {meta.ayas} versets
          </div>
        </div>
        {basmala && (
          <p className={styles.basmala} lang="ar">
            {basmala}
          </p>
        )}
        <ol className={styles.verses}>
          {verses.map((v) => (
            <li key={v.n} className={styles.verse} id={`v${v.n}`}>
              <span className={styles.num}>
                {n}:{v.n}
              </span>
              <p className={styles.ar} lang="ar" dir="rtl">
                {v.ar}
              </p>
              <p className={styles.tr}>{v.tr[DEFAULT_TRANSLATION]}</p>
            </li>
          ))}
        </ol>
        <footer className={styles.foot}>
          Texte arabe : {QURAN_NOTICE.split(". License")[0]} (
          <a href="https://tanzil.net" target="_blank" rel="noreferrer">
            tanzil.net
          </a>
          ), licence CC BY 3.0. Traduction : Muhammad Hamidullah.
        </footer>
      </main>
    </div>
  );
}
