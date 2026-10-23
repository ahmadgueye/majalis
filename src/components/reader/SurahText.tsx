import { DEFAULT_TRANSLATION, QURAN_NOTICE, type getSurah } from "@/lib/quran";
import { verseEnd } from "@/lib/reading";
import { wolofText, type WolofVerse } from "@/lib/wolof";
import { VerseTranslations } from "./VerseTranslations";

type Surah = NonNullable<Awaited<ReturnType<typeof getSurah>>>;

/** Texte d'une sourate : titre, basmala, versets et mention des sources.
 *  Deux présentations, choisies par la façon de lire : verset par verset, ou texte continu (Arabe). */
export function SurahText({
  surah,
  wolof = {},
}: {
  surah: Surah;
  wolof?: Record<string, WolofVerse>;
}) {
  const { meta, basmala, verses } = surah;
  return (
    <>
      <div className="pt-7 pb-1.5 text-center">
        <div className="font-ar text-[34px] leading-[1.6]" lang="ar">
          سورة {meta.ar}
        </div>
        <div className="text-[13px] text-muted">
          {meta.tname} · {meta.type === "Meccan" ? "mecquoise" : "médinoise"} ·{" "}
          {meta.ayas} versets
        </div>
      </div>
      {basmala && (
        <p
          data-part="ar"
          className="mt-1.5 mb-3.5 text-center font-ar text-2xl text-muted"
          lang="ar"
        >
          {basmala}
        </p>
      )}
      {/* Arabe seul : le texte d'un seul tenant, comme dans un mushaf, chaque verset fini par son numéro. */}
      <p
        className="read-mushaf px-4 py-3 text-justify font-ar text-[28px] leading-[2.3]"
        lang="ar"
        dir="rtl"
      >
        {verses.map((v) => (
          <span key={v.n}>
            {v.ar}{" "}
            <span className="whitespace-nowrap text-accent" aria-label={`fin du verset ${v.n}`}>
              {verseEnd(v.n)}
            </span>{" "}
          </span>
        ))}
      </p>
      <ol className="read-list flex flex-col gap-0.5">
        {verses.map((v) => {
          const wo = wolofText(v.ar, wolof[`${meta.n}:${v.n}`]);
          return (
            <li
              key={v.n}
              className="scroll-mt-[72px] rounded-xl px-4 py-3.5 hover:bg-surface-2"
              id={`v${v.n}`}
            >
              <span className="text-[11.5px] font-semibold text-faint tabular-nums">
                {meta.n}:{v.n}
              </span>
              <p
                data-part="ar"
                className="my-1 text-right font-ar text-ar"
                lang="ar"
                dir="rtl"
              >
                {v.ar}
              </p>
              <VerseTranslations fr={v.tr[DEFAULT_TRANSLATION]} wo={wo} />
            </li>
          );
        })}
      </ol>
      <footer className="mt-7 border-t border-line pt-3.5 text-xs leading-normal text-faint">
        Texte arabe : {QURAN_NOTICE.split(". License")[0]} (
        <a
          className="underline"
          href="https://tanzil.net"
          target="_blank"
          rel="noreferrer"
        >
          tanzil.net
        </a>
        ), licence CC BY 3.0. Traduction : Muhammad Hamidullah.
        {Object.keys(wolof).length > 0 && " Wolof : traduction de Majalis."}
      </footer>
    </>
  );
}
