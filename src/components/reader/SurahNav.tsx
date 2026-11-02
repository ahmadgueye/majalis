"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { List, Search, X } from "lucide-react";
import { norm } from "@/lib/wolof";

export type NavSurah = { n: number; tname: string; ar: string; ayas: number };

/** Un verset dont le haut est au-dessus de cette ligne est « lu ». Les versets atteints par un saut
 *  se placent à 136 px (scroll-mt de SurahText), sous l'en-tête et la barre de la page. */
const TOP = 144;

const latin = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/(.)\1+/g, "$1"); // « ikhlas » trouve Al-Ikhlaas

/** « 2:255 », « 2 255 », « baqara 255 » ou « baqara:255 » : la sourate (numéro ou nom) et le verset. */
function parseQuery(raw: string): { name: string; verse: number | null } {
  const q = raw.trim();
  const m = /^(.*?)\s*[:.\s]\s*(\d+)$/.exec(q);
  if (m && m[1]) return { name: m[1], verse: Number(m[2]) };
  return { name: q.replace(/[:.\s]+$/, ""), verse: null }; // « 2: » en cours de frappe
}

/**
 * Liste des sourates de la page Lecture : recherche (nom, numéro, ou sourate:verset), sourate
 * ouverte mise en évidence et, à côté, une colonne avec les numéros de ses versets (le verset lu
 * y est suivi pendant le défilement). Barre latérale sur ordinateur, panneau sur téléphone.
 */
export function SurahNav({ surahs, onNavigate }: { surahs: NavSurah[]; onNavigate?: () => void }) {
  const current = Number(/^\/lire\/(\d+)/.exec(usePathname())?.[1] ?? 0);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const versesRef = useRef<HTMLOListElement>(null);
  const verse = useVerseInView(current);
  const target = parseQuery(query).verse;
  const here = surahs.find((s) => s.n === current);

  const shown = useMemo(() => {
    const q = parseQuery(query).name;
    if (!q) return surahs;
    if (/^\d+$/.test(q)) {
      // Avec un verset, le numéro de sourate est exact (« 2:255 » ne donne pas 20, 21…).
      return surahs.filter((s) => (target === null ? String(s.n).startsWith(q) : s.n === Number(q)));
    }
    const l = latin(q);
    const a = norm(q);
    return surahs.filter((s) => (l && latin(s.tname).includes(l)) || (a && norm(s.ar).includes(a)));
  }, [query, target, surahs]);

  // La liste ne bouge pas quand on clique une sourate visible. Elle ne se déplace que si la sourate
  // ouverte est hors de vue (ouverture de la page, sourate voisine, recherche) : on la place alors
  // au tiers de la liste. Si l'adresse vise un verset (#v255), on y va (aussi en mode Arabe).
  useEffect(() => {
    const list = listRef.current;
    const item = list?.querySelector<HTMLElement>(`[data-surah="${current}"]`);
    if (list && item) {
      const top = item.offsetTop;
      const hidden = top < list.scrollTop || top + item.offsetHeight > list.scrollTop + list.clientHeight;
      if (hidden) list.scrollTop = top - list.clientHeight / 3;
    }
    const hash = /^#v(\d+)$/.exec(location.hash);
    if (hash) jump(Number(hash[1]), false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seulement au changement de sourate
  }, [current]);

  // Le verset lu reste visible dans sa colonne (sans faire défiler la page).
  useEffect(() => {
    const col = versesRef.current;
    const cell = col?.querySelector<HTMLElement>(`[data-cell="${verse}"]`);
    if (!col || !cell) return;
    const top = cell.offsetTop;
    const bottom = top + cell.offsetHeight;
    if (top < col.scrollTop + 32) col.scrollTop = top - 32;
    else if (bottom > col.scrollTop + col.clientHeight - 32) col.scrollTop = bottom - col.clientHeight + 32;
  }, [verse, current]);

  function jump(n: number, close = true) {
    // Verset par verset ou texte continu (Arabe) : on va à celui des deux qui est affiché.
    const el = [...document.querySelectorAll<HTMLElement>(`[data-verse="${n}"]`)].find(
      (e) => e.getClientRects().length > 0,
    );
    if (!el) return;
    if (close) onNavigate?.(); // le panneau du téléphone se ferme avant le défilement
    // Défilement doux pour un saut court ; au-delà de deux écrans, on y va directement.
    const far = Math.abs(el.getBoundingClientRect().top) > 2 * innerHeight;
    const smooth = !far && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: smooth ? "smooth" : "instant", block: "start" });
    history.replaceState(null, "", `#v${n}`);
  }

  /** Ouvre une sourate, au verset demandé s'il existe. */
  function open(s: NavSurah, v: number | null) {
    const ok = v !== null && v >= 1 && v <= s.ayas;
    setQuery("");
    if (s.n === current) {
      if (ok) jump(v);
      else onNavigate?.();
      return;
    }
    onNavigate?.();
    router.push(`/lire/${s.n}${ok ? `#v${v}` : ""}`);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-3 pt-3 pb-2">
        <label className="relative block">
          <span className="sr-only">Chercher une sourate ou un verset</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-faint"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && shown[0]) open(shown[0], target);
            }}
            placeholder="Sourate, ou verset : 2:255"
            className="field-input w-full pl-8"
          />
        </label>
      </div>

      <div className="flex min-h-0 flex-1">
        <div ref={listRef} className="relative min-h-0 min-w-0 flex-1 overflow-y-auto px-2 pb-4">
          {shown.length === 0 && <p className="px-2 py-3 text-[13px] text-muted">Aucune sourate ne correspond.</p>}
          <ol aria-label="Sourates" className="grid gap-px">
            {shown.map((s) => {
              const on = s.n === current;
              const ok = target !== null && target >= 1 && target <= s.ayas;
              return (
                <li key={s.n} data-surah={s.n}>
                  <Link
                    href={`/lire/${s.n}${ok ? `#v${target}` : ""}`}
                    aria-current={on ? "page" : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      open(s, target);
                    }}
                    className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 ${
                      on ? "bg-accent-soft text-ink" : "text-ink hover:bg-surface-2"
                    }`}
                  >
                    <span
                      className={`w-7 flex-none text-right text-[12px] font-semibold tabular-nums ${on ? "text-accent" : "text-faint"}`}
                    >
                      {s.n}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold">{s.tname}</span>
                      {target === null ? (
                        <span className="block text-[11.5px] text-muted">
                          {s.ayas} verset{s.ayas > 1 ? "s" : ""}
                        </span>
                      ) : ok ? (
                        <span className="block text-[11.5px] font-semibold text-accent">
                          Aller au verset {s.n}:{target}
                        </span>
                      ) : (
                        <span className="block text-[11.5px] text-muted">
                          N&apos;a que {s.ayas} verset{s.ayas > 1 ? "s" : ""}
                        </span>
                      )}
                    </span>
                    <span className="flex-none font-ar text-[19px] leading-none" lang="ar" dir="rtl">
                      {s.ar}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
        {here && (
          <nav
            aria-label={`Versets de ${here.tname}`}
            className="flex w-[60px] flex-none flex-col border-l border-line"
          >
            <div className="px-1 pb-1.5 text-center text-[11px] font-semibold text-muted">Versets</div>
            <ol ref={versesRef} className="relative min-h-0 flex-1 overflow-y-auto px-1.5 pb-4">
              {Array.from({ length: here.ayas }, (_, k) => k + 1).map((v) => (
                <li key={v}>
                  <a
                    href={`#v${v}`}
                    data-cell={v}
                    aria-current={v === verse ? "location" : undefined}
                    aria-label={`Verset ${v}`}
                    onClick={(e) => {
                      e.preventDefault();
                      jump(v);
                    }}
                    className={`my-px grid h-7 place-items-center rounded-md text-[12.5px] font-semibold tabular-nums ${
                      v === verse ? "bg-accent text-surface" : "text-muted hover:bg-surface-2 hover:text-ink"
                    }`}
                  >
                    {v}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>
    </div>
  );
}

/** Le verset en haut de l'écran (verset par verset ou texte continu), suivi pendant le défilement. */
function useVerseInView(surah: number) {
  const [verse, setVerse] = useState(1);
  useEffect(() => {
    let frame = 0;
    function measure() {
      frame = 0;
      let seen = 1;
      for (const el of document.querySelectorAll<HTMLElement>("[data-verse]")) {
        const rects = el.getClientRects();
        if (rects.length === 0) continue; // partie cachée par la façon de lire
        if (rects[0].top > TOP) break;
        seen = Number(el.dataset.verse);
      }
      setVerse(seen);
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    // Changer la façon de lire (data-read sur <html>) change ce qui est affiché.
    const watch = new MutationObserver(onScroll);
    watch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-read"] });
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      watch.disconnect();
    };
  }, [surah]);
  return verse;
}

/** Sur téléphone : le bouton « Sourates » ouvre la même liste dans un panneau à gauche. */
export function SurahDrawer({ surahs }: { surahs: NavSurah[] }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => ref.current?.close();
  return (
    <>
      <button
        type="button"
        className="btn lg:hidden"
        onClick={() => {
          setOpen(true);
          ref.current?.showModal();
        }}
      >
        <List aria-hidden className="size-4" />
        Sourates
      </button>
      <dialog
        ref={ref}
        className="drawer"
        aria-label="Sourates"
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === e.currentTarget && close()}
      >
        <div className="flex items-center gap-2.5 border-b border-line px-4 py-2.5">
          <h2 className="flex-1 text-[16px] font-bold">Sourates</h2>
          <button
            type="button"
            onClick={close}
            aria-label="Fermer"
            title="Fermer"
            className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
        {/* Monté à l'ouverture : la sourate ouverte se place dans la liste visible. */}
        {open && <SurahNav surahs={surahs} onNavigate={close} />}
      </dialog>
    </>
  );
}
