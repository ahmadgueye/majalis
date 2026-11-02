"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { PageBar } from "@/components/SiteHeader";
import { VerseNote } from "./VerseNote";

export type NoteItem = { ref: string; body: string; updated_at: string; tname: string; ar: string; fr: string };

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** « Mes notes » : chaque note sous son verset, modifiable sur place ; recherche dans les notes. */
export function NotesList({ notes, translator }: { notes: NoteItem[]; translator: boolean }) {
  const [query, setQuery] = useState("");
  const q = fold(query.trim());
  const shown = useMemo(
    () => (q ? notes.filter((n) => fold(`${n.body} ${n.ref} ${n.tname} ${n.fr}`).includes(q)) : notes),
    [q, notes],
  );

  return (
    <div className="min-h-[calc(100dvh-3.5rem)] bg-bg">
      <PageBar>
        <h1 className="text-[15px] font-bold">Mes notes</h1>
        <span className="text-[13px] text-muted">Visibles par toi seul</span>
        <a href="/api/export" className="btn ml-auto" download>
          <Download aria-hidden className="size-4" />
          Exporter mes traductions et notes
        </a>
      </PageBar>

      <main className="px-safe mx-auto grid max-w-[780px] gap-4 pt-6 pb-16">
        {notes.length === 0 ? (
          <p className="rounded-xl border border-line bg-surface p-5 text-[14px] leading-normal text-muted">
            Tu n&apos;as pas encore de note. Sous chaque verset, dans la{" "}
            <Link className="font-semibold text-ink underline" href="/lire/1">
              Lecture
            </Link>
            {translator && (
              <>
                {" "}
                ou dans{" "}
                <Link className="font-semibold text-ink underline" href="/traduire">
                  Traduire
                </Link>
              </>
            )}
            , « Ajouter une note » en ouvre une.
          </p>
        ) : (
          <>
            <label className="relative block">
              <span className="sr-only">Chercher dans mes notes</span>
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Chercher dans mes notes, un verset (2:255), une sourate…"
                className="field-input w-full pl-9"
              />
            </label>
            <p className="text-[12.5px] text-muted">
              {q
                ? `${shown.length} note${shown.length > 1 ? "s" : ""} sur ${notes.length}`
                : `${notes.length} note${notes.length > 1 ? "s" : ""}`}
            </p>
            <ol className="grid gap-3">
              {shown.map((n) => {
                const [s, v] = n.ref.split(":");
                return (
                  <li key={n.ref} className="rounded-xl border border-line bg-surface px-4 pt-3 pb-3.5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-[12.5px] font-semibold text-muted">
                        {n.ref} · {n.tname}
                      </span>
                      <span className="ml-auto flex gap-1">
                        <Link className="btn ghost" href={`/lire/${s}#v${v}`}>
                          Lire
                        </Link>
                        {translator && (
                          <Link className="btn ghost" href={`/traduire/${s}#v${v}`}>
                            Traduire
                          </Link>
                        )}
                      </span>
                    </div>
                    <p className="my-1 text-right font-ar text-[24px] leading-[1.9]" lang="ar" dir="rtl">
                      {n.ar}
                    </p>
                    <p className="font-read text-[13.5px] leading-normal text-muted">{n.fr}</p>
                    <VerseNote verseRef={n.ref} initial={n.body} />
                  </li>
                );
              })}
            </ol>
          </>
        )}
      </main>
    </div>
  );
}
