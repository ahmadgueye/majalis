import "server-only";
import index from "@/data/quran/surahs.json";

/** Le texte vient de Tanzil, recopié tel quel : on ne fait que le découper pour l'affichage. */
export const QURAN_NOTICE = index.notice;
export const TRANSLATIONS = index.translations;
export const DEFAULT_TRANSLATION = "fr.hamidullah";

export type SurahMeta = (typeof index.surahs)[number];
export type Verse = { n: number; ar: string; tr: Record<string, string> };

/** Tanzil place la basmala (4 mots) en tête du verset 1 de chaque sourate, sauf 1 et 9. */
const stripMarks = (s: string) => s.replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, "").replace(/ٱ/g, "ا");
const BASMALA_KEY = stripMarks("بسم الله الرحمن الرحيم");

export const surahs: SurahMeta[] = index.surahs;

export function getSurahMeta(n: number): SurahMeta | undefined {
  return surahs.find((s) => s.n === n);
}

export async function getSurah(n: number) {
  const meta = getSurahMeta(n);
  if (!meta) return null;
  const data: { verses: Verse[] } = await import(`@/data/quran/s/${n}.json`);
  let basmala: string | null = null;
  const verses = data.verses.map((v) => {
    if (v.n === 1 && n !== 1) {
      const w = words(v.ar);
      if (w.length > 4 && stripMarks(w.slice(0, 4).join(" ")) === BASMALA_KEY) {
        basmala = w.slice(0, 4).join(" ");
        return { ...v, ar: w.slice(4).join(" ") };
      }
    }
    return v;
  });
  return { meta, basmala, verses };
}

/** Découpage en mots entiers, utilisé par le mode Mot à mot. */
export const words = (ar: string) => ar.split(" ").filter(Boolean);
