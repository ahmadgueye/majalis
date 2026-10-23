"use client";

import Link from "next/link";
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BookOpenText, Search, X } from "lucide-react";
import { SurahPicker } from "@/components/reader/SurahPicker";
import { PageBar } from "@/components/SiteHeader";
import { publishWolof } from "@/app/traduire/actions";
import { createClient } from "@/lib/supabase/client";
import {
  EMPTY,
  WOLOF_LETTERS,
  indexKnown,
  isEmpty,
  known,
  norm,
  same,
  suggest,
  tiles,
  type Known,
  type KnownIndex,
  type Tile,
  type WolofVerse,
  wolofText,
} from "@/lib/wolof";

type VerseIn = { n: number; ar: string; fr: string };

type Props = {
  surahs: { n: number; tname: string; ar: string }[];
  text: { n: number; ar: string; tname: string; verses: VerseIn[] };
  initialDrafts: Record<string, WolofVerse>;
  initialPublished: Record<string, WolofVerse>;
  elsewhere: Known[];
};

type Field = HTMLInputElement | HTMLTextAreaElement;

type Save = "idle" | "saving" | "saved" | "error";

const SAVE_LABEL: Record<Save, string> = {
  idle: "Tes brouillons s'enregistrent tout seuls.",
  saving: "Enregistrement…",
  saved: "Brouillon enregistré",
  error: "Échec de l'enregistrement : vérifie ta connexion.",
};

/** Actions d'un verset, stables d'un rendu à l'autre (les lignes sont mémorisées). */
type Act = {
  setWord(ref: string, i: number, value: string): void;
  setFree(ref: string, value: string): void;
  /** Fusionne des tuiles qui se suivent (deux mots, ou tout un groupe : une expression). */
  merge(ref: string, group: Tile[]): void;
  /** Choix d'un groupe : départ depuis le menu d'un mot, puis clic sur le dernier mot. */
  startGroup(ref: string, k: number): void;
  pickGroup(k: number): void;
  cancelGroup(): void;
  split(ref: string, t: Tile): void;
  ignore(key: string): void;
  commit(): void;
  publish(refs: string[]): void;
  openMenu(ref: string, i: number | null): void;
  openGlossary(q: string): void;
  nextVerse(n: number): void;
  focused(input: Field): void;
};

/** Mot à mot wolof d'une sourate, pour le traducteur : brouillon enregistré tout seul, puis « Publier ». */
export function TranslateView({
  surahs,
  text,
  initialDrafts,
  initialPublished,
  elsewhere,
}: Props) {
  const n = text.n;
  const supabase = useRef(createClient()).current;
  const [drafts, setDrafts] = useState(initialDrafts);
  const [published, setPublished] = useState(initialPublished);
  // Mots connus pour les suggestions : mis à jour quand on quitte un champ, pas à chaque lettre.
  const [corpus, setCorpus] = useState(initialDrafts);
  const [ignored, setIgnored] = useState<Set<string>>(() => new Set());
  const [save, setSave] = useState<Save>("idle");
  const [menu, setMenu] = useState<{ ref: string; i: number } | null>(null);
  // Groupe de mots en cours de choix : indices de tuiles (début fixé, fin au dernier mot cliqué).
  const [group, setGroup] = useState<{ ref: string; from: number; to: number } | null>(null);
  const [glossary, setGlossary] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const latest = useRef(drafts);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const queue = useRef<Promise<boolean>>(Promise.resolve(true));
  const lastInput = useRef<Field | null>(null);
  const dirty = useRef(false);

  // Les messages d'échec restent plus longtemps, le temps de les lire.
  const say = useCallback((msg: string, ms = 2600) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), ms);
  }, []);

  const all = useMemo(
    () => [
      ...elsewhere,
      ...text.verses.flatMap((v) =>
        known(`${n}:${v.n}`, v.ar, corpus[`${n}:${v.n}`] ?? EMPTY),
      ),
    ],
    [elsewhere, text.verses, n, corpus],
  );
  const index = useMemo(() => indexKnown(all), [all]);

  // Enregistrement : un brouillon par verset, envoyé 600 ms après la dernière frappe, l'un après l'autre.
  const write = useCallback(
    (ref: string) => {
      if (!supabase) return;
      const v = latest.current[ref] ?? EMPTY;
      const words = Object.fromEntries(
        Object.entries(v.words).flatMap(([k, x]) =>
          x.trim() ? [[k, x.trim()]] : [],
        ),
      );
      setSave("saving");
      queue.current = queue.current
        .then(async () => {
          const { error } = await supabase.from("wolof_drafts").upsert({
            ref,
            surah: n,
            words,
            joins: v.joins,
            free: v.free.trim(),
            updated_at: new Date().toISOString(),
          });
          return !error;
        })
        .catch(() => false)
        .then((ok) => {
          setSave(ok ? (timers.current.size ? "saving" : "saved") : "error");
          return ok;
        });
    },
    [supabase, n],
  );

  const schedule = useCallback(
    (ref: string) => {
      clearTimeout(timers.current.get(ref));
      setSave("saving");
      timers.current.set(
        ref,
        setTimeout(() => {
          timers.current.delete(ref);
          write(ref);
        }, 600),
      );
    },
    [write],
  );

  const flush = useCallback(() => {
    for (const [ref, t] of timers.current) {
      clearTimeout(t);
      timers.current.delete(ref);
      write(ref);
    }
    return queue.current;
  }, [write]);

  const update = useCallback(
    (ref: string, fn: (v: WolofVerse) => WolofVerse) => {
      latest.current = {
        ...latest.current,
        [ref]: fn(latest.current[ref] ?? EMPTY),
      };
      setDrafts(latest.current);
      dirty.current = true;
      schedule(ref);
    },
    [schedule],
  );

  const publish = useCallback(
    async (refs: string[]) => {
      if (!refs.length) return;
      setPublishing(true);
      let ok = false;
      let offline = false;
      try {
        ok = (await flush()) && (await publishWolof(n, refs));
      } catch {
        // Serveur injoignable (arrêté, coupure réseau) : l'action serveur lève « Failed to fetch ».
        // Les brouillons, eux, vont directement à Supabase : rien n'est perdu.
        offline = true;
      } finally {
        // Toujours rendre le bouton, sinon il reste bloqué sur « Publication… ».
        setPublishing(false);
      }
      if (offline)
        return say(
          "Le serveur ne répond pas : publication impossible. Ton brouillon est bien enregistré, réessaie plus tard.",
          7000,
        );
      if (!ok) return say("La publication a échoué. Réessaie.", 5000);
      const removed = refs.filter((r) =>
        isEmpty(latest.current[r] ?? EMPTY),
      ).length;
      setPublished((p) => {
        const next = { ...p };
        for (const r of refs) {
          const d = latest.current[r] ?? EMPTY;
          if (isEmpty(d)) delete next[r];
          else next[r] = d;
        }
        return next;
      });
      say(
        refs.length === 1
          ? removed
            ? `Publication du verset ${refs[0]} retirée`
            : `Verset ${refs[0]} publié`
          : `${refs.length} versets publiés`,
      );
    },
    [flush, n, say],
  );

  const act = useMemo<Act>(
    () => ({
      setWord: (ref, i, value) =>
        update(ref, (v) => ({ ...v, words: { ...v.words, [i]: value } })),
      setFree: (ref, value) => update(ref, (v) => ({ ...v, free: value })),
      merge(ref, group) {
        if (group.length < 2) return;
        const first = group[0];
        const last = group[group.length - 1];
        update(ref, (v) => {
          const joins = [...v.joins];
          for (let x = first.i; x < last.j; x++)
            if (!joins.includes(x)) joins.push(x);
          // Les traductions déjà écrites sont gardées, mises bout à bout.
          const words = { ...v.words };
          words[first.i] = group
            .map((t) => words[t.i])
            .filter((x) => x?.trim())
            .join(" ");
          for (const t of group.slice(1)) delete words[t.i];
          return { ...v, joins, words };
        });
        setCorpus(latest.current);
        setMenu(null);
        setGroup(null);
        say(group.length > 2 ? `${group.length} mots fusionnés` : "Mots fusionnés");
      },
      startGroup(ref, k) {
        setMenu(null);
        setGroup({ ref, from: k, to: k });
      },
      pickGroup: (k) => setGroup((g) => g && { ...g, to: k }),
      cancelGroup: () => setGroup(null),
      split(ref, t) {
        update(ref, (v) => ({
          ...v,
          joins: v.joins.filter((x) => x < t.i || x >= t.j),
        }));
        setCorpus(latest.current);
        setMenu(null);
        say("Mots séparés");
      },
      ignore: (key) => setIgnored((s) => new Set(s).add(key)),
      commit() {
        if (!dirty.current) return;
        dirty.current = false;
        setCorpus(latest.current);
      },
      publish: (refs) => void publish(refs),
      openMenu: (ref, i) => setMenu(i === null ? null : { ref, i }),
      openGlossary(q) {
        setMenu(null);
        setGlossary(q);
      },
      nextVerse(v) {
        const next = document
          .getElementById(`v${v + 1}`)
          ?.querySelector("input");
        if (next) {
          next.focus({ preventScroll: true });
          next.scrollIntoView({ block: "nearest", behavior: "smooth" });
        } else {
          (document.activeElement as HTMLElement | null)?.blur();
          say("Dernier verset de la sourate");
        }
      },
      focused: (input) => void (lastInput.current = input),
    }),
    [update, publish, say],
  );

  // Fermer le menu d'un mot au clic ailleurs ou avec Échap.
  useEffect(() => {
    if (!menu) return;
    const onPointer = (e: PointerEvent) => {
      if (!(e.target as Element).closest("[data-word-menu]")) setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(null);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  // Échap abandonne le choix d'un groupe.
  useEffect(() => {
    if (!group) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setGroup(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [group]);

  // Prévenir avant de quitter la page si un brouillon n'est pas encore enregistré.
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (timers.current.size || save === "saving") e.preventDefault();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [save]);

  /** Lettres wolof : insérées dans le dernier champ utilisé, à la place du curseur. */
  function insertLetter(l: string) {
    const input = lastInput.current;
    if (!input || !document.body.contains(input))
      return say("Clique d'abord dans un mot à traduire");
    const a = input.selectionStart ?? input.value.length;
    const b = input.selectionEnd ?? a;
    const value = input.value.slice(0, a) + l + input.value.slice(b);
    const ref = input.dataset.ref!;
    if (input.dataset.i) act.setWord(ref, Number(input.dataset.i), value);
    else act.setFree(ref, value);
    input.focus();
    requestAnimationFrame(() => input.setSelectionRange(a + 1, a + 1));
  }

  function goToWord(ref: string, i: number) {
    if (window.matchMedia("(max-width: 767px)").matches) setGlossary(null);
    const input = document.querySelector<HTMLInputElement>(
      `input[data-ref="${ref}"][data-i="${i}"]`,
    );
    input?.focus({ preventScroll: true });
    input?.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  let total = 0;
  let done = 0;
  const pending: string[] = [];
  for (const v of text.verses) {
    const ref = `${n}:${v.n}`;
    const d = drafts[ref] ?? EMPTY;
    for (const t of tiles(v.ar, d.joins)) {
      total++;
      if ((d.words[t.i] ?? "").trim()) done++;
    }
    if (!same(drafts[ref], published[ref])) pending.push(ref);
  }

  return (
    <div className="flex min-h-full flex-col bg-bg">
      <PageBar>
        <SurahPicker current={n} surahs={surahs} base="/traduire" />
        <div className="ml-auto flex flex-none items-center gap-1.5">
          <Link href={`/lire/${n}`} className="btn ghost hidden md:inline-flex">
            <BookOpenText aria-hidden className="size-4" />
            Voir la lecture
          </Link>
          <button
            type="button"
            className="btn"
            aria-expanded={glossary !== null}
            onClick={() => setGlossary(glossary === null ? "" : null)}
          >
            Glossaire
          </button>
        </div>
        <div className="basis-full" aria-hidden />
        <div className="contents">
          <div className="flex min-w-[220px] flex-1 items-center gap-2.5">
            <div
              className="h-1.5 w-28 flex-none overflow-hidden rounded-full bg-surface-2"
              aria-hidden
            >
              <div
                className="h-full rounded-full bg-accent transition-[width]"
                style={{ width: `${total ? (done / total) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[13px] whitespace-nowrap text-muted tabular-nums">
              {done} / {total} mots traduits
            </span>
            <span
              role="status"
              className={`truncate text-[13px] ${save === "error" ? "font-semibold text-c-rose" : "text-faint"}`}
            >
              {SAVE_LABEL[save]}
            </span>
          </div>
          <div
            className="flex items-center gap-1"
            role="group"
            aria-label="Lettres wolof"
          >
            {WOLOF_LETTERS.map((l) => (
              <button
                key={l}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertLetter(l)}
                aria-label={`Insérer la lettre ${l}`}
                title={`Insérer « ${l} »`}
                className="grid h-8 min-w-8 place-items-center rounded-lg border border-line bg-surface px-1.5 text-[15px] font-semibold hover:bg-surface-2"
              >
                {l}
              </button>
            ))}
          </div>
          {pending.length > 0 && (
            <button
              type="button"
              className="btn primary"
              disabled={publishing}
              onClick={() => act.publish(pending)}
            >
              {publishing
                ? "Publication…"
                : `Publier ${pending.length > 1 ? `les ${pending.length} versets modifiés` : "le verset modifié"}`}
            </button>
          )}
        </div>
      </PageBar>

      <main className="px-safe mx-auto w-full max-w-[1080px] flex-1 pt-5 pb-16">
        <div className="mb-4 text-center">
          <div className="font-ar text-[32px] leading-[1.6]" lang="ar">
            سورة {text.ar}
          </div>
          <div className="text-[13px] text-muted">
            {text.tname} · mot à mot en wolof
          </div>
        </div>
        <p className="mx-auto mb-5 max-w-[620px] text-center text-[13px] leading-normal text-muted">
          <b className="text-ink">Tab</b> mot suivant ·{" "}
          <b className="text-ink">Entrée</b> verset suivant · suggestion en vert
          : <b className="text-ink">Tab</b> pour l&apos;accepter,{" "}
          <b className="text-ink">Échap</b> pour l&apos;ignorer. Clique un mot
          arabe pour le fusionner avec le suivant, ou avec tout un groupe (une expression). Sous les mots, la phrase
          wolof du verset reprend les mots mis bout à bout : retouche-la pour la
          rendre fluide. Tes brouillons ne sont visibles que par toi :{" "}
          <b className="text-ink">Publier</b> les montre à tous, dans la lecture
          et les séances.
        </p>
        <ol className="grid gap-3">
          {text.verses.map((v) => {
            const ref = `${n}:${v.n}`;
            return (
              <VerseRow
                key={v.n}
                verseRef={ref}
                verse={v}
                draft={drafts[ref] ?? EMPTY}
                published={published[ref]}
                index={index}
                ignored={ignored}
                menu={menu?.ref === ref ? menu.i : null}
                group={group?.ref === ref ? group : null}
                publishing={publishing}
                act={act}
              />
            );
          })}
        </ol>
      </main>

      {glossary !== null && (
        <Glossary
          all={all}
          surah={n}
          query={glossary}
          onQuery={setGlossary}
          onClose={() => setGlossary(null)}
          onGo={goToWord}
        />
      )}

      <div
        role="status"
        aria-live="polite"
        className={`pointer-events-none fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-[10px] bg-ink px-3.5 py-2 font-medium text-bg shadow-card ${
          toast ? "" : "hidden"
        }`}
      >
        {toast}
      </div>
    </div>
  );
}

const VerseRow = memo(function VerseRow({
  verseRef: ref,
  verse,
  draft,
  published,
  index,
  ignored,
  menu,
  group,
  publishing,
  act,
}: {
  verseRef: string;
  verse: VerseIn;
  draft: WolofVerse;
  published: WolofVerse | undefined;
  index: KnownIndex;
  ignored: Set<string>;
  menu: number | null;
  group: { from: number; to: number } | null;
  publishing: boolean;
  act: Act;
}) {
  const ts = tiles(verse.ar, draft.joins);
  const lo = group ? Math.min(group.from, group.to) : -1;
  const hi = group ? Math.max(group.from, group.to) : -1;
  const groupWords = group ? ts.slice(lo, hi + 1).reduce((n, t) => n + t.j - t.i + 1, 0) : 0;
  const done = ts.filter((t) => (draft.words[t.i] ?? "").trim()).length;
  // Proposition pour la phrase du verset : ce que les lecteurs verraient sans elle.
  const joined = wolofText(verse.ar, { ...draft, free: "" });
  const sentence = draft.free || joined;

  // La phrase du verset revient à la ligne : le champ grandit avec son texte.
  const freeRef = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const t = freeRef.current;
    if (!t) return;
    const fit = () => {
      t.style.height = "auto";
      t.style.height = `${t.scrollHeight}px`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(t.parentElement!);
    return () => ro.disconnect();
  }, [sentence]);
  return (
    <li
      id={`v${verse.n}`}
      className="scroll-mt-32 rounded-xl border border-line bg-surface px-3.5 pt-2.5 pb-3 focus-within:border-accent"
    >
      <div className="flex min-h-8 items-center gap-2">
        <span className="text-[11.5px] font-semibold text-faint tabular-nums">
          {ref}
        </span>
        <span
          className={`text-[11px] font-bold tabular-nums ${done === ts.length ? "text-accent" : "text-faint"}`}
        >
          {done}/{ts.length}
        </span>
        <span className="flex-1" />
        <PublishControls
          verseRef={ref}
          draft={draft}
          published={published}
          publishing={publishing}
          act={act}
        />
      </div>
      {group && (
        <div
          role="group"
          aria-label="Groupe de mots à fusionner"
          className="mt-1 flex flex-wrap items-center gap-2 rounded-lg bg-surface-2 px-3 py-2 text-[13px]"
        >
          <span className="flex-1 text-muted">
            {hi > lo ? (
              <>
                <b className="text-ink">{groupWords} mots</b> choisis. Clique un autre mot pour changer la fin du groupe.
              </>
            ) : (
              "Clique le dernier mot de l'expression (avant ou après celui-ci)."
            )}
          </span>
          <button type="button" className="btn ghost" onClick={act.cancelGroup}>
            Annuler
          </button>
          {hi > lo && (
            <button type="button" className="btn primary" onClick={() => act.merge(ref, ts.slice(lo, hi + 1))}>
              Fusionner les {groupWords} mots
            </button>
          )}
        </div>
      )}
      <div className="my-2 flex flex-wrap gap-x-1.5 gap-y-2.5" dir="rtl">
        {ts.map((t, k) => {
          const value = draft.words[t.i] ?? "";
          const key = `${ref}|${t.i}`;
          const sug = value || ignored.has(key) ? null : suggest(ref, t, index);
          return (
            <div
              key={t.i}
              dir="ltr"
              className="relative flex max-w-[200px] min-w-[86px] flex-col items-stretch gap-[3px] text-center"
            >
              <button
                type="button"
                tabIndex={-1}
                data-word-menu
                lang="ar"
                dir="rtl"
                aria-haspopup={group ? undefined : "menu"}
                aria-expanded={group ? undefined : menu === t.i}
                aria-pressed={group ? k >= lo && k <= hi : undefined}
                aria-label={group ? `Groupe jusqu'au mot ${t.ar}` : `Options du mot ${t.ar}`}
                title={group ? "Dernier mot du groupe" : "Options du mot"}
                onClick={() => (group ? act.pickGroup(k) : act.openMenu(ref, menu === t.i ? null : t.i))}
                className={`rounded-lg px-2 font-ar text-[23px] leading-[1.75] hover:bg-surface-2 ${
                  group && k >= lo && k <= hi
                    ? "bg-accent-soft ring-2 ring-accent"
                    : t.j > t.i
                      ? "bg-accent-soft"
                      : ""
                }`}
              >
                {t.ar}
              </button>
              <input
                data-ref={ref}
                data-i={t.i}
                value={value}
                placeholder={sug?.text ?? "…"}
                aria-label={`Wolof pour ${t.ar}`}
                autoComplete="off"
                spellCheck={false}
                lang="wo"
                onFocus={(e) => act.focused(e.currentTarget)}
                onChange={(e) => act.setWord(ref, t.i, e.target.value)}
                onBlur={act.commit}
                onKeyDown={(e) => {
                  if (e.key === "Tab" && !e.shiftKey && !value && sug)
                    act.setWord(ref, t.i, sug.text);
                  if (e.key === "Escape" && !value && sug) {
                    e.preventDefault();
                    act.ignore(key);
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    act.nextVerse(verse.n);
                  }
                }}
                className={`w-full min-w-0 rounded-[7px] border px-1.5 py-[5px] text-center text-sm font-medium outline-none focus:border-accent focus:ring-3 focus:ring-accent-soft ${
                  value.trim()
                    ? "border-transparent bg-accent-soft"
                    : "border-line bg-surface"
                } ${sug ? "placeholder:text-accent placeholder:italic" : "placeholder:text-faint"}`}
              />
              {sug && (
                <small className="text-[10.5px] font-semibold text-accent">
                  {sug.kind === "same" ? "déjà traduit" : "forme proche"} ·{" "}
                  {sug.ref}
                </small>
              )}
              {menu === t.i && (
                <div
                  role="menu"
                  data-word-menu
                  className="absolute top-full right-0 z-10 mt-1 grid w-64 gap-0.5 rounded-xl border border-line bg-surface p-1.5 text-left shadow-pop"
                >
                  {k < ts.length - 1 && (
                    <MenuItem
                      label="Fusionner avec le mot suivant"
                      desc="Pour une expression qui se traduit d'un bloc"
                      onClick={() => act.merge(ref, [t, ts[k + 1]])}
                    />
                  )}
                  {ts.length > 2 && (
                    <MenuItem
                      label="Fusionner un groupe de mots"
                      desc="Pour une expression : clique ensuite son dernier mot"
                      onClick={() => act.startGroup(ref, k)}
                    />
                  )}
                  {t.j > t.i && (
                    <MenuItem
                      label="Séparer en mots"
                      desc="Revenir au découpage mot par mot"
                      onClick={() => act.split(ref, t)}
                    />
                  )}
                  <MenuItem
                    label="Voir dans le glossaire"
                    desc="Toutes tes traductions de ce mot"
                    onClick={() => act.openGlossary(norm(t.ar))}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <textarea
        ref={freeRef}
        rows={1}
        data-ref={ref}
        // Sans phrase écrite, le champ montre les mots mis bout à bout (ce que lisent les lecteurs)
        // et les suit ; dès qu'on le retouche, la phrase écrite remplace les mots.
        value={sentence}
        placeholder="Traduction wolof du verset (facultatif)"
        aria-label={`Traduction wolof du verset ${ref}`}
        autoComplete="off"
        spellCheck={false}
        lang="wo"
        onFocus={(e) => act.focused(e.currentTarget)}
        onChange={(e) =>
          act.setFree(ref, e.target.value === joined ? "" : e.target.value)
        }
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            act.nextVerse(verse.n);
          }
        }}
        className="block w-full resize-none overflow-hidden border-t border-dashed border-line bg-transparent px-0.5 pt-2 pb-0.5 font-read text-base outline-none placeholder:text-faint focus:border-accent"
      />
      {joined && (
        <small className="text-[10.5px] font-semibold text-muted">
          {draft.free.trim()
            ? "Phrase retouchée"
            : "Phrase tirée des mots : retouche-la pour la rendre fluide"}
        </small>
      )}
      <p className="mt-1.5 font-read text-[13.5px] leading-normal text-muted">
        {verse.fr}
      </p>
    </li>
  );
});

/** État d'un verset (Brouillon, Publié) et son bouton « Publier ». */
function PublishControls({
  verseRef: ref,
  draft,
  published,
  publishing,
  act,
}: {
  verseRef: string;
  draft: WolofVerse;
  published: WolofVerse | undefined;
  publishing: boolean;
  act: Act;
}) {
  const changed = !same(draft, published);
  const status = changed
    ? isEmpty(draft)
      ? "À retirer"
      : "Brouillon"
    : published
      ? "Publié"
      : null;
  return (
    <>
      {status && (
        <span
          className={`rounded-full px-2 py-0.5 text-[11.5px] font-semibold ${
            status === "Publié"
              ? "bg-accent-soft text-accent"
              : "bg-surface-2 text-muted"
          }`}
        >
          {status}
        </span>
      )}
      {changed && (
        <button
          type="button"
          className="btn"
          disabled={publishing}
          onClick={() => act.publish([ref])}
        >
          {isEmpty(draft) ? "Retirer la publication" : "Publier"}
        </button>
      )}
    </>
  );
}

function MenuItem({
  label,
  desc,
  onClick,
}: {
  label: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="grid gap-0.5 rounded-lg px-2.5 py-2 text-left hover:bg-surface-2"
    >
      <span className="text-sm font-semibold">{label}</span>
      <small className="text-xs text-muted">{desc}</small>
    </button>
  );
}

/** Glossaire : chaque mot arabe traduit, avec ses traductions et les versets où il apparaît. */
function Glossary({
  all,
  surah,
  query,
  onQuery,
  onClose,
  onGo,
}: {
  all: Known[];
  surah: number;
  query: string;
  onQuery: (q: string) => void;
  onClose: () => void;
  onGo: (ref: string, i: number) => void;
}) {
  const entries = useMemo(() => {
    const map = new Map<
      string,
      { ar: string; key: string; tr: Map<string, Known[]> }
    >();
    for (const x of all) {
      const key = norm(x.ar);
      if (!map.has(key)) map.set(key, { ar: x.ar, key, tr: new Map() });
      const tr = map.get(key)!.tr;
      tr.set(x.text, [...(tr.get(x.text) ?? []), x]);
    }
    return [...map.values()].sort((a, b) => a.key.localeCompare(b.key, "ar"));
  }, [all]);
  const q = query.trim();
  const qn = norm(q).toLowerCase();
  const shown = q
    ? entries.filter(
        (e) =>
          e.key.includes(qn) ||
          [...e.tr.keys()].some((t) => t.toLowerCase().includes(qn)),
      )
    : entries;

  return (
    <aside
      aria-label="Glossaire wolof"
      className="fixed inset-y-0 right-0 z-30 flex w-[min(400px,100%)] flex-col border-l border-line bg-surface shadow-pop"
    >
      <div className="flex items-center gap-2 border-b border-line py-3 pr-2.5 pl-[18px]">
        <h2 className="flex-1 text-base font-bold">Glossaire wolof</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le glossaire"
          title="Fermer"
          className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
        >
          <X aria-hidden className="size-[18px]" />
        </button>
      </div>
      <div className="grid min-h-0 flex-1 content-start gap-3 overflow-auto p-[18px]">
        <label className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-faint"
          />
          <input
            type="search"
            className="field-input w-full pl-9"
            placeholder="Chercher en wolof ou en arabe"
            aria-label="Chercher dans le glossaire"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            autoFocus
          />
        </label>
        {shown.length ? (
          shown.slice(0, 300).map((e) => (
            <div
              key={e.key}
              className="grid grid-cols-[minmax(0,auto)_1fr] gap-3 border-b border-line pb-3"
            >
              <div
                className="text-right font-ar text-[22px] leading-[1.6]"
                lang="ar"
                dir="rtl"
              >
                {e.ar}
              </div>
              <div className="grid content-start gap-1">
                {[...e.tr].map(([t, occ]) => (
                  <div
                    key={t}
                    className="flex flex-wrap items-baseline gap-1.5"
                  >
                    <b className="font-semibold">{t}</b>
                    {occ.map((o) => {
                      const [s, v] = o.ref.split(":");
                      const cls =
                        "rounded-full bg-surface-2 px-2 text-xs font-semibold text-muted tabular-nums hover:text-ink";
                      return Number(s) === surah ? (
                        <button
                          key={`${o.ref}|${o.i}`}
                          type="button"
                          title="Aller au mot"
                          className={cls}
                          onClick={() => onGo(o.ref, o.i)}
                        >
                          {o.ref}
                        </button>
                      ) : (
                        <Link
                          key={`${o.ref}|${o.i}`}
                          href={`/traduire/${s}#v${v}`}
                          title="Ouvrir la sourate"
                          className={cls}
                        >
                          {o.ref}
                        </Link>
                      );
                    })}
                  </div>
                ))}
                {e.tr.size > 1 && (
                  <small className="text-xs text-muted">
                    {e.tr.size} traductions différentes
                  </small>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-muted">
            {q
              ? "Aucun mot ne correspond."
              : "Le glossaire se remplit tout seul quand tu traduis."}
          </p>
        )}
      </div>
    </aside>
  );
}
