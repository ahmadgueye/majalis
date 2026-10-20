import { DEFAULT_TRANSLATION, QURAN_NOTICE, type getSurah } from "@/lib/quran";

type Surah = NonNullable<Awaited<ReturnType<typeof getSurah>>>;

/** Texte d'une sourate : titre, basmala, versets (arabe et traduction) et mention des sources. */
export function SurahText({ surah }: { surah: Surah }) {
  const { meta, basmala, verses } = surah;
  return (
    <>
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
              {meta.n}:{v.n}
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
    </>
  );
}
