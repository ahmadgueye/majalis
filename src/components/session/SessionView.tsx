"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronsLeft,
  ChevronsRight,
  Highlighter,
  Palette,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { setSessionTitle } from "@/app/cercles/actions";
import {
  HIGHLIGHTS,
  HIGHLIGHT_KINDS,
  compareRefs,
  isHighlightKind,
  type HighlightKind,
} from "@/lib/highlights";
import { createClient } from "@/lib/supabase/client";

export type SessionVerse = { n: number; ar: string; fr: string };

type Props = {
  space: { id: string; name: string };
  session: { id: string; title: string };
  canEdit: boolean;
  viewer: { name: string; email: string };
  surahs: { n: number; tname: string; ar: string }[];
  text: {
    n: number;
    ar: string;
    tname: string;
    type: string;
    basmala: string | null;
    verses: SessionVerse[];
  };
  notice: string;
  initialHighlights: Record<string, HighlightKind>;
};

/** Page de séance : lecture à gauche (repliable), tableau en grand, panneau à droite à la demande. */
export function SessionView({
  space,
  session,
  canEdit,
  viewer,
  surahs,
  text,
  notice,
  initialHighlights,
}: Props) {
  const router = useRouter();
  const [readerOpen, setReaderOpen] = useState(true);
  const [pane, setPane] = useState<"reader" | "board">("reader"); // téléphone : une zone à la fois
  const [drawer, setDrawer] = useState<null | "marks">(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [highlights, setHighlights] = useState(initialHighlights);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const supabase = useRef(createClient()).current;

  const say = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  // Surlignages des autres membres, en direct (Supabase Realtime).
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel(`surlignages:${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "highlights",
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          setHighlights((h) => {
            const next = { ...h };
            if (payload.eventType === "DELETE")
              delete next[(payload.old as { ref: string }).ref];
            else {
              const row = payload.new as { ref: string; kind: string };
              if (isHighlightKind(row.kind)) next[row.ref] = row.kind;
            }
            return next;
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, session.id]);

  // Échap : ferme ce qui est ouvert, du plus récent au plus ancien.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || (e.target as HTMLElement).closest?.("dialog"))
        return;
      if (picking) setPicking(false);
      else if (selected) setSelected(null);
      else if (drawer) setDrawer(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [picking, selected, drawer]);

  async function highlight(ref: string, kind: HighlightKind | null) {
    if (!supabase) return;
    const before = highlights[ref];
    setHighlights((h) => {
      const next = { ...h };
      if (kind) next[ref] = kind;
      else delete next[ref];
      return next;
    });
    setPicking(false);
    const { error } = kind
      ? await supabase
          .from("highlights")
          .upsert({ session_id: session.id, space_id: space.id, ref, kind })
      : await supabase
          .from("highlights")
          .delete()
          .eq("session_id", session.id)
          .eq("ref", ref);
    if (error) {
      setHighlights((h) => {
        const back = { ...h };
        if (before) back[ref] = before;
        else delete back[ref];
        return back;
      });
      say("Le surlignage n'a pas été enregistré. Réessaie.");
    } else
      say(
        kind
          ? `${ref} surligné : ${HIGHLIGHTS[kind].label}`
          : "Surlignage retiré",
      );
  }

  function goToVerse(ref: string) {
    const [s, v] = ref.split(":").map(Number);
    setReaderOpen(true);
    setPane("reader");
    setSelected(canEdit ? ref : null);
    if (s !== text.n) {
      router.push(`?sourate=${s}#v${v}`);
      return;
    }
    requestAnimationFrame(() =>
      document
        .getElementById(`v${v}`)
        ?.scrollIntoView({ block: "center", behavior: "smooth" }),
    );
  }

  const reader = (
    <section
      aria-label="Lecture"
      className={`${pane === "reader" ? "flex" : "hidden"} min-h-0 min-w-0 flex-col border-line bg-surface md:border-r ${
        readerOpen ? "md:flex" : "md:hidden"
      }`}
    >
      <div className="flex items-center gap-1.5 border-b border-line py-2.5 pr-3 pl-4">
        <select
          aria-label="Sourate"
          value={text.n}
          onChange={(e) => router.push(`?sourate=${e.target.value}`)}
          className="min-w-0 flex-1 rounded-control border border-line bg-surface px-2 py-[7px] text-sm font-semibold text-ink"
        >
          {surahs.map((s) => (
            <option key={s.n} value={s.n}>
              {s.n}. {s.tname} — {s.ar}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setReaderOpen(false)}
          aria-label="Masquer la lecture"
          title="Masquer la lecture"
          className="hidden size-8 flex-none place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink md:grid"
        >
          <ChevronsLeft aria-hidden className="size-[18px]" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="px-4 pt-[22px] pb-1.5 text-center">
          <div className="font-ar text-[30px] leading-[1.6]" lang="ar">
            سورة {text.ar}
          </div>
          <div className="text-[12.5px] text-muted">
            {text.tname} · {text.type === "Meccan" ? "mecquoise" : "médinoise"}{" "}
            · {text.verses.length} versets
          </div>
        </div>
        {text.basmala && (
          <p
            className="pb-2.5 text-center font-ar text-[21px] text-muted"
            lang="ar"
          >
            {text.basmala}
          </p>
        )}
        <ol className="flex flex-col gap-0.5 px-2 pt-1 pb-5">
          {text.verses.map((v) => {
            const ref = `${text.n}:${v.n}`;
            const kind = highlights[ref];
            const sel = selected === ref;
            return (
              <li
                key={v.n}
                id={`v${v.n}`}
                className={`scroll-mt-4 rounded-xl border px-3.5 py-3 ${sel ? "border-accent" : "border-transparent"} ${
                  kind
                    ? HIGHLIGHTS[kind].bg
                    : canEdit
                      ? "hover:bg-surface-2"
                      : ""
                }`}
              >
                <div
                  {...(canEdit && {
                    role: "button",
                    tabIndex: 0,
                    "aria-pressed": sel,
                    onClick: () => {
                      setSelected(sel ? null : ref);
                      setPicking(false);
                    },
                    onKeyDown: (e: React.KeyboardEvent) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(sel ? null : ref);
                        setPicking(false);
                      }
                    },
                  })}
                  aria-label={`Verset ${ref}${kind ? `, surligné : ${HIGHLIGHTS[kind].label}` : ""}`}
                  className={canEdit ? "cursor-pointer" : ""}
                >
                  <div className="flex min-h-5 items-center gap-2">
                    <span className="text-[11.5px] font-semibold text-faint tabular-nums">
                      {ref}
                    </span>
                    {kind && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted">
                        <span
                          className={`size-2 rounded-full ${HIGHLIGHTS[kind].dot}`}
                        />
                        {HIGHLIGHTS[kind].label}
                      </span>
                    )}
                  </div>
                  <p
                    className="mt-1 mb-0.5 text-right font-ar text-[25px] leading-[2]"
                    lang="ar"
                    dir="rtl"
                  >
                    {v.ar}
                  </p>
                  <p className="font-read text-[16.5px] leading-normal">
                    {v.fr}
                  </p>
                </div>

                {sel && (
                  <div className="mt-2.5 grid gap-1.5">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        aria-expanded={picking}
                        onClick={() => setPicking((p) => !p)}
                        className={`inline-flex items-center gap-1.5 rounded-lg bg-surface px-2.5 py-1.5 text-[12.5px] font-semibold ${
                          picking
                            ? "shadow-[inset_0_0_0_1.5px_var(--ink)]"
                            : "shadow-[inset_0_0_0_1px_var(--line)] hover:bg-surface-2"
                        }`}
                      >
                        <Highlighter
                          aria-hidden
                          className="size-3.5 text-muted"
                        />
                        Surligner
                      </button>
                    </div>
                    {picking && (
                      <div
                        className="flex flex-wrap gap-1"
                        role="group"
                        aria-label="Couleur de surlignage"
                      >
                        {HIGHLIGHT_KINDS.map((k) => (
                          <button
                            key={k}
                            type="button"
                            aria-pressed={kind === k}
                            title={HIGHLIGHTS[k].desc}
                            onClick={() => highlight(ref, k)}
                            className={`inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-[12.5px] font-semibold ${
                              kind === k
                                ? "shadow-[inset_0_0_0_1.5px_var(--ink)]"
                                : "shadow-[inset_0_0_0_1px_var(--line)] hover:bg-surface-2"
                            }`}
                          >
                            <span
                              className={`size-2.5 rounded-full ${HIGHLIGHTS[k].dot}`}
                            />
                            {HIGHLIGHTS[k].label}
                          </button>
                        ))}
                        {kind && (
                          <button
                            type="button"
                            onClick={() => highlight(ref, null)}
                            className="rounded-full bg-surface px-3 py-1 text-[12.5px] font-semibold shadow-[inset_0_0_0_1px_var(--line)] hover:bg-surface-2"
                          >
                            Retirer
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        <p className="px-[22px] pb-6 text-xs leading-normal text-faint">
          Texte arabe : {notice} (
          <a
            className="underline"
            href="https://tanzil.net"
            target="_blank"
            rel="noreferrer"
          >
            tanzil.net
          </a>
          ), licence CC BY 3.0. Traduction : Muhammad Hamidullah.
        </p>
      </div>
    </section>
  );

  const counts = HIGHLIGHT_KINDS.map(
    (k) => Object.values(highlights).filter((x) => x === k).length,
  );

  return (
    <div className="grid h-dvh grid-rows-[auto_minmax(0,1fr)_auto] md:grid-rows-[auto_minmax(0,1fr)]">
      <header className="px-safe flex h-[52px] min-w-0 items-center gap-2.5 border-b border-line bg-surface">
        <Link
          href={`/cercles/${space.id}`}
          aria-label={`Retour au cercle ${space.name}`}
          title={space.name}
        >
          <Logo />
        </Link>
        <Link
          href={`/cercles/${space.id}`}
          className="hidden max-w-[200px] truncate text-sm text-muted hover:text-ink sm:block"
        >
          {space.name}
        </Link>
        <span aria-hidden className="hidden text-faint sm:block">
          /
        </span>
        <SessionTitle
          spaceId={space.id}
          sessionId={session.id}
          initial={session.title}
          canEdit={canEdit}
          onError={say}
        />
        <div className="ml-auto flex flex-none items-center gap-2.5">
          <button
            type="button"
            aria-pressed={drawer === "marks"}
            title="Repères de couleurs"
            onClick={() => setDrawer((d) => (d === "marks" ? null : "marks"))}
            className={`btn flex-none px-3 py-1.5 ${drawer === "marks" ? "border-transparent bg-accent-soft" : ""}`}
          >
            <Palette aria-hidden />
            <span className="max-sm:sr-only">Repères</span>
          </button>
          <ThemeToggle />
          <UserMenu name={viewer.name} email={viewer.email} />
        </div>
      </header>

      <main
        className={`relative grid min-h-0 grid-cols-1 overflow-hidden ${
          readerOpen
            ? "md:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)]"
            : ""
        }`}
      >
        {reader}

        <section
          aria-label="Tableau"
          className={`${pane === "board" ? "grid" : "hidden"} relative min-w-0 place-items-center bg-bg bg-[radial-gradient(var(--grid)_1.1px,transparent_1.2px)] bg-size-[22px_22px] p-6 md:grid`}
        >
          {!readerOpen && (
            <button
              type="button"
              onClick={() => setReaderOpen(true)}
              className="btn absolute top-3 left-3 hidden shadow-card md:inline-flex"
            >
              <ChevronsRight aria-hidden />
              Afficher la lecture
            </button>
          )}
          <div className="max-w-[340px] text-center text-muted">
            <b className="mb-1 block text-base text-ink">
              Le tableau de la séance
            </b>
            Il arrive à la prochaine étape : tu pourras y poser des versets, des
            notes et des flèches avec ton cercle.
          </div>
        </section>

        <aside
          aria-label="Repères de couleurs"
          aria-hidden={!drawer}
          inert={!drawer}
          className={`absolute inset-y-0 right-0 z-20 flex w-[min(400px,100%)] flex-col border-l border-line bg-surface shadow-pop transition-[transform,visibility] duration-200 motion-reduce:transition-none ${
            drawer ? "visible translate-x-0" : "invisible translate-x-[104%]"
          }`}
        >
          <div className="flex items-center gap-2 border-b border-line py-3 pr-2.5 pl-[18px]">
            <h2 className="flex-1 text-base font-bold">Repères de couleurs</h2>
            <button
              type="button"
              onClick={() => setDrawer(null)}
              aria-label="Fermer le panneau"
              title="Fermer"
              className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
            >
              <X aria-hidden className="size-[18px]" />
            </button>
          </div>
          <div className="grid min-h-0 flex-1 content-start gap-4 overflow-auto p-[18px]">
            <p className="leading-normal text-muted">
              Chaque couleur a toujours le même sens dans le cercle. Clique un
              verset pour y aller.
            </p>
            {HIGHLIGHT_KINDS.map((k, i) => {
              const refs = Object.keys(highlights)
                .filter((r) => highlights[r] === k)
                .sort(compareRefs);
              return (
                <section
                  key={k}
                  aria-label={HIGHLIGHTS[k].label}
                  className="grid gap-1.5"
                >
                  <h3 className="flex items-center gap-2 font-bold">
                    <span className={`size-3 rounded ${HIGHLIGHTS[k].dot}`} />
                    {HIGHLIGHTS[k].label}
                    <span className="font-medium text-muted">
                      · {counts[i]}
                    </span>
                  </h3>
                  <p className="text-[13px] text-muted">{HIGHLIGHTS[k].desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {refs.length ? (
                      refs.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => goToVerse(r)}
                          className={`rounded-full px-2.5 py-0.5 text-[12.5px] font-semibold tabular-nums ${HIGHLIGHTS[k].bg} hover:brightness-95`}
                        >
                          {r}
                        </button>
                      ))
                    ) : (
                      <span className="text-xs text-muted">Aucun verset</span>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </aside>
      </main>

      <nav
        aria-label="Zones de la séance"
        className="px-safe flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom,0px)] md:hidden"
      >
        {(["reader", "board"] as const).map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={pane === p}
            onClick={() => setPane(p)}
            className={`flex-1 border-t-2 px-1 py-[11px] font-semibold ${pane === p ? "border-accent text-ink" : "border-transparent text-muted"}`}
          >
            {p === "reader" ? "Lecture" : "Tableau"}
          </button>
        ))}
      </nav>

      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed top-16 left-1/2 z-30 -translate-x-1/2 rounded-[10px] bg-ink px-3.5 py-2 font-medium text-bg shadow-card ${
          toast ? "" : "hidden"
        }`}
      >
        {toast}
      </div>
    </div>
  );
}

/** Titre de la séance, modifiable sur place par les membres qui peuvent modifier. */
function SessionTitle({
  spaceId,
  sessionId,
  initial,
  canEdit,
  onError,
}: {
  spaceId: string;
  sessionId: string;
  initial: string;
  canEdit: boolean;
  onError: (msg: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const saved = useRef(initial);
  if (!canEdit)
    return (
      <h1 className="min-w-0 flex-1 truncate px-2 text-[15px] font-semibold">
        {initial}
      </h1>
    );

  async function save() {
    const title = value.trim();
    if (!title) return setValue(saved.current);
    if (title === saved.current) return;
    const ok = await setSessionTitle(spaceId, sessionId, title);
    if (ok) saved.current = title;
    else {
      setValue(saved.current);
      onError("Le titre n'a pas été enregistré.");
    }
  }

  return (
    <input
      aria-label="Titre de la séance"
      value={value}
      maxLength={120}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setValue(saved.current);
          requestAnimationFrame(() => (e.target as HTMLInputElement).blur());
        }
      }}
      className="w-full min-w-10 flex-1 truncate rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-[15px] font-semibold text-ink hover:bg-surface-2 focus:border-accent focus:bg-surface focus:outline-none sm:max-w-[440px]"
    />
  );
}
