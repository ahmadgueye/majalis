import { DEFAULT_TRANSLATION, words, type Verse } from "@/lib/quran";
import { Logo } from "@/components/Logo";

type Props = { before: Verse; selected: Verse; linked: Verse };

/** Aperçu statique d'une séance : le verset lu à gauche, les réflexions du cercle sur le tableau. */
export function SessionPreview({ before, selected, linked }: Props) {
  return (
    <figure
      aria-label="Aperçu d'une séance dans Majalis"
      className="overflow-hidden rounded-2xl border border-line bg-surface shadow-pop"
    >
      <div className="flex h-12 items-center gap-2.5 border-b border-line px-3.5 text-[13px]">
        <Logo size="xs" />
        <span className="min-w-0 truncate text-muted">
          Cercle du mardi · <b className="font-semibold text-ink">Sâd, versets 28 et 29</b>
        </span>
        <span className="ml-auto flex flex-none" aria-label="Deux personnes connectées">
          <Avatar className="bg-me text-accent-ink">A</Avatar>
          <Avatar className="bg-k text-surface">K</Avatar>
        </span>
      </div>

      <div className="grid min-h-[400px] grid-cols-1 md:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="grid content-start gap-1.5 border-b border-line px-4 py-[18px] md:border-r md:border-b-0">
          <div className="pb-1.5 text-center font-ar text-[22px] leading-normal max-md:hidden" lang="ar">
            سورة ص
          </div>
          <div className="rounded-[10px] px-3 py-2.5 max-md:hidden">
            <VerseNum>38:{before.n}</VerseNum>
            <p className="font-read text-[15.5px] leading-[1.45]">{before.tr[DEFAULT_TRANSLATION]}</p>
          </div>
          <div className="rounded-[10px] bg-hl-reflect px-3 py-2.5 shadow-[inset_0_0_0_1.5px_var(--c-sand)]">
            <VerseNum>38:{selected.n}</VerseNum>
            <p className="text-right font-ar text-[22px] leading-[1.9]" lang="ar" dir="rtl">
              {selected.ar}
            </p>
            <p className="font-read text-[15.5px] leading-[1.45]">{selected.tr[DEFAULT_TRANSLATION]}</p>
            <div className="flex flex-wrap gap-1 pt-2" aria-hidden>
              {["Ajouter au tableau", "Réflexion", "Commenter", "Surligner"].map((a) => (
                <span key={a} className="rounded-[7px] border border-line bg-surface px-2 py-1 text-[11.5px] font-semibold">
                  {a}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="relative min-h-[400px] overflow-hidden bg-bg bg-[radial-gradient(var(--grid)_1.2px,transparent_1.2px)] bg-size-[22px_22px] max-sm:min-h-[460px]">
          <svg
            className="pointer-events-none absolute inset-0 size-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            <path
              d="M 34 40 C 52 34, 62 52, 66 64"
              className="fill-none stroke-c-rose stroke-2 [stroke-dasharray:5_5] [vector-effect:non-scaling-stroke]"
            />
          </svg>
          <BoardVerse
            className="top-[8%] left-[5%] border-c-sand/45 bg-hl-reflect max-sm:top-[4%] max-sm:left-[4%]"
            label={`38:${selected.n} · À méditer`}
            ar={words(selected.ar).slice(4, 6).join(" ")}
            tr="afin qu'ils méditent sur ses versets"
          />
          <span className="absolute top-[47%] left-1/2 -translate-1/2 rounded-full bg-hl-link px-2 py-[3px] text-[11.5px] font-semibold text-c-rose max-sm:top-[62%] max-sm:left-[74%]">
            Lien
          </span>
          <BoardVerse
            className="right-[5%] bottom-[9%] border-c-sky/40 bg-hl-question max-sm:right-[4%] max-sm:bottom-[4%]"
            label={`47:${linked.n} · Question`}
            ar={words(linked.ar).slice(0, 3).join(" ")}
            tr="Ne méditent-ils pas sur le Coran ?"
          />
          <div className="absolute bottom-[10%] left-[9%] w-[min(40%,240px)] -rotate-[1.5deg] rounded-xl border-[1.5px] border-dashed border-c-sage/60 bg-surface px-3.5 py-2.5 font-hand text-[21px] leading-[1.15] font-medium text-c-sage max-sm:top-[40%] max-sm:bottom-auto max-sm:left-[6%] max-sm:w-[62%]">
            Le Livre est descendu pour être médité, pas seulement récité.
          </div>
          <div
            className="absolute top-[30%] right-[30%] flex animate-drift items-start gap-0.5 motion-reduce:animate-none max-sm:top-[36%] max-sm:right-[12%]"
            aria-hidden
          >
            <svg viewBox="0 0 16 16" className="size-4 fill-k">
              <path d="M1 1l5.5 13 2-5.5L14 6.5z" />
            </svg>
            <span className="mt-3 rounded-[6px_6px_6px_2px] bg-k px-[7px] py-0.5 text-[11.5px] font-semibold text-surface">
              Khadija
            </span>
          </div>
        </div>
      </div>
    </figure>
  );
}

function Avatar({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span className={`-ml-1.5 grid size-[26px] place-items-center rounded-full border-2 border-surface text-[11px] font-bold ${className}`}>
      {children}
    </span>
  );
}

function VerseNum({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] font-semibold text-faint tabular-nums">{children}</span>;
}

function BoardVerse({ className, label, ar, tr }: { className: string; label: string; ar: string; tr: string }) {
  return (
    <div className={`absolute w-[min(46%,300px)] rounded-xl border px-3.5 py-3 shadow-card max-sm:w-[78%] ${className}`}>
      <VerseNum>{label}</VerseNum>
      <p className="text-right font-ar text-[21px] leading-[1.8]" lang="ar" dir="rtl">
        {ar}
      </p>
      <p className="font-read text-[14.5px] leading-[1.4]">{tr}</p>
    </div>
  );
}
