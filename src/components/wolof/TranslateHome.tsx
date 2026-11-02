"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { PageBar } from "@/components/SiteHeader";

export type SurahProgress = {
  n: number;
  tname: string;
  ar: string;
  ayas: number;
  /** Mots à traduire (mots fusionnés comptés une fois) et mots traduits. */
  words: number;
  done: number;
  published: number;
  notes: number;
};

/** Pour chercher sans tenir compte des accents ni des majuscules, en gardant la place de chaque lettre. */
function fold(s: string) {
  let out = "";
  const pos: number[] = [];
  for (let i = 0; i < s.length; i++) {
    for (const c of s[i].normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()) {
      out += c;
      pos.push(i);
    }
  }
  return { out, pos };
}

const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

/** Accueil de Traduire : avancement, reprise, recherche dans les traductions, sourates, export. */
export function TranslateHome({
  progress,
  index,
  resume,
}: {
  progress: SurahProgress[];
  index: { ref: string; wo: string }[];
  resume: string | null;
}) {
  const [query, setQuery] = useState("");
  const [started, setStarted] = useState(false);
  const names = useMemo(() => new Map(progress.map((s) => [s.n, s.tname])), [progress]);
  const total = progress.reduce(
    (a, s) => ({ words: a.words + s.words, done: a.done + s.done, published: a.published + s.published, notes: a.notes + s.notes }),
    { words: 0, done: 0, published: 0, notes: 0 },
  );

  const q = fold(query.trim()).out;
  const results = useMemo(() => {
    if (q.length < 2) return [];
    return index.flatMap((e) => {
      const f = fold(e.wo);
      const at = f.out.indexOf(q);
      if (at < 0) return [];
      return [{ ...e, start: f.pos[at], end: f.pos[at + q.length - 1] + 1 }];
    });
  }, [q, index]);

  const shown = started ? progress.filter((s) => s.done > 0 || s.notes > 0) : progress;

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-bg">
      <PageBar>
        <h1 className="text-[15px] font-bold">Traduction wolof</h1>
        <a href="/api/export" className="btn ml-auto" download>
          <Download aria-hidden className="size-4" />
          Exporter mes traductions et notes
        </a>
      </PageBar>

      <main className="px-safe mx-auto grid max-w-[1080px] gap-6 pt-6 pb-16">
        <section className="grid gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="grid gap-2">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[22px] font-bold tabular-nums">
                {(total.words ? (total.done / total.words) * 100 : 0).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %
              </span>
              <span className="text-[13.5px] text-muted tabular-nums">
                {total.done.toLocaleString("fr-FR")} / {total.words.toLocaleString("fr-FR")} mots traduits ·{" "}
                {total.published} verset{total.published > 1 ? "s" : ""} publié{total.published > 1 ? "s" : ""} ·{" "}
                {total.notes} note{total.notes > 1 ? "s" : ""}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.max(pct(total.done, total.words), total.done ? 1 : 0)}%` }}
              />
            </div>
          </div>
          {resume && (
            <Link href={`/traduire/${resume.split(":")[0]}#v${resume.split(":")[1]}`} className="btn primary justify-self-start">
              Reprendre au verset {resume}
            </Link>
          )}
        </section>

        <section className="grid gap-2">
          <label className="relative block">
            <span className="sr-only">Chercher dans mes traductions</span>
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Chercher dans mes traductions (un mot wolof, une expression…)"
              className="field-input w-full pl-9"
            />
          </label>
          {q.length >= 2 && (
            <div className="rounded-xl border border-line bg-surface">
              <p className="border-b border-line px-4 py-2 text-[12.5px] text-muted">
                {results.length === 0
                  ? "Aucun verset ne contient ce texte."
                  : `${results.length} verset${results.length > 1 ? "s" : ""}${results.length > 60 ? " (les 60 premiers)" : ""}`}
              </p>
              <ul className="grid">
                {results.slice(0, 60).map((r) => {
                  const [s, v] = r.ref.split(":");
                  return (
                    <li key={r.ref} className="border-b border-line last:border-0">
                      <Link href={`/traduire/${s}#v${v}`} className="grid gap-0.5 px-4 py-2.5 hover:bg-surface-2">
                        <span className="text-[12px] font-semibold text-muted">
                          {r.ref} · {names.get(Number(s))}
                        </span>
                        <span className="font-read text-[15px]">
                          {r.wo.slice(0, r.start)}
                          <mark className="rounded-sm bg-accent-soft text-ink">{r.wo.slice(r.start, r.end)}</mark>
                          {r.wo.slice(r.end)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>

        <section className="grid gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-[15px] font-bold">Sourates</h2>
            <div role="group" aria-label="Sourates affichées" className="flex rounded-control border border-line bg-surface-2 p-0.5">
              {[
                { on: false, label: "Toutes" },
                { on: true, label: "Commencées" },
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  aria-pressed={started === o.on}
                  onClick={() => setStarted(o.on)}
                  className={`rounded-[7px] px-2.5 py-1 text-[13px] font-semibold ${
                    started === o.on ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          {shown.length === 0 && <p className="text-[13.5px] text-muted">Aucune sourate commencée pour l&apos;instant.</p>}
          <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((s) => (
              <li key={s.n}>
                <Link
                  href={`/traduire/${s.n}`}
                  className="grid gap-2 rounded-xl border border-line bg-surface px-3.5 py-3 hover:border-accent"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-7 text-right text-[12px] font-semibold text-faint tabular-nums">{s.n}</span>
                    <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold">{s.tname}</span>
                    <span className="font-ar text-[19px] leading-none" lang="ar" dir="rtl">
                      {s.ar}
                    </span>
                  </span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{ width: `${pct(s.done, s.words)}%` }}
                    />
                  </span>
                  <span className="text-[12px] text-muted tabular-nums">
                    {s.done} / {s.words} mots
                    {s.published > 0 && ` · ${s.published} / ${s.ayas} publiés`}
                    {s.notes > 0 && ` · ${s.notes} note${s.notes > 1 ? "s" : ""}`}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
