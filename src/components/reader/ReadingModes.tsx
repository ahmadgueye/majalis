"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  READ_KEY,
  READ_LANGS,
  READ_MODES,
  isReadLang,
  isReadMode,
  type ReadLang,
  type ReadMode,
} from "@/lib/reading";

/** Choix de la façon de lire (Arabe, Arabe et traduction, Traduction) et de la langue des traductions. */
export function ReadingModes({ className = "" }: { className?: string }) {
  const [mode, setMode] = useState<ReadMode>("both");
  const [lang, setLang] = useState<ReadLang>("both");

  // Le script du layout a déjà posé le choix enregistré sur <html> : on le relit, et on suit
  // les changements faits ailleurs (la Lecture a un choix dans la barre et un dans la page).
  useEffect(() => {
    const read = () => {
      const d = document.documentElement.dataset;
      if (isReadMode(d.read)) setMode(d.read);
      if (isReadLang(d.lang)) setLang(d.lang);
    };
    read();
    const watch = new MutationObserver(read);
    watch.observe(document.documentElement, { attributes: true, attributeFilter: ["data-read", "data-lang"] });
    return () => watch.disconnect();
  }, []);

  function apply(next: { mode: ReadMode; lang: ReadLang }) {
    setMode(next.mode);
    setLang(next.lang);
    const d = document.documentElement.dataset;
    d.read = next.mode;
    d.lang = next.lang;
    try {
      localStorage.setItem(READ_KEY, JSON.stringify(next));
    } catch {
      // Stockage bloqué : le choix vaut pour cette page seulement.
    }
  }

  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 ${className}`}>
      <Segmented label="Façon de lire" options={READ_MODES} value={mode} onChange={(m) => apply({ mode: m, lang })} />
      {/* Caché en mode Arabe par globals.css (data-part), même avant le premier rendu. */}
      <div data-part="lang-choice">
        <LangPicker value={lang} onChange={(l) => apply({ mode, lang: l })} />
      </div>
    </div>
  );
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex rounded-control border border-line bg-surface-2 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-[7px] px-2.5 py-1 text-[13px] font-semibold whitespace-nowrap ${
            value === o.value ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Langue des traductions : liste déroulante au style des onglets (le libellé « Langue » reste visible). */
function LangPicker({ value, onChange }: { value: ReadLang; onChange: (v: ReadLang) => void }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const current = READ_LANGS.find((o) => o.value === value) ?? READ_LANGS[0];

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  function show() {
    setActive(READ_LANGS.indexOf(current));
    setOpen(true);
  }
  function choose(v: ReadLang) {
    onChange(v);
    setOpen(false);
    ref.current?.querySelector("button")?.focus();
  }

  return (
    <div
      ref={ref}
      className="relative flex items-center rounded-control border border-line bg-surface-2 p-0.5"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
          ref.current?.querySelector("button")?.focus();
        } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          if (!open) return show();
          const step = e.key === "ArrowDown" ? 1 : -1;
          setActive((a) => (a + step + READ_LANGS.length) % READ_LANGS.length);
        } else if ((e.key === "Enter" || e.key === " ") && open) {
          e.preventDefault();
          choose(READ_LANGS[active].value);
        }
      }}
    >
      <span id={`${id}-libelle`} className="px-2 text-[13px] font-semibold text-muted">
        Langue
      </span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-libelle ${id}-valeur`}
        onClick={() => (open ? setOpen(false) : show())}
        className="flex items-center gap-1 rounded-[7px] bg-surface px-2.5 py-1 text-[13px] font-semibold whitespace-nowrap text-ink shadow-card"
      >
        <span id={`${id}-valeur`}>{current.label}</span>
        <ChevronDown aria-hidden className={`size-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-labelledby={`${id}-libelle`}
          aria-activedescendant={`${id}-${READ_LANGS[active].value}`}
          className="absolute top-full right-0 z-20 mt-1 grid min-w-full gap-0.5 rounded-control border border-line bg-surface-2 p-0.5 shadow-pop"
        >
          {READ_LANGS.map((o, k) => {
            const selected = o.value === value;
            return (
              <li
                key={o.value}
                id={`${id}-${o.value}`}
                role="option"
                aria-selected={selected}
                onPointerEnter={() => setActive(k)}
                onClick={() => choose(o.value)}
                className={`flex cursor-pointer items-center gap-2 rounded-[7px] px-2.5 py-1.5 text-[13px] font-semibold whitespace-nowrap ${
                  selected ? "bg-surface text-ink shadow-card" : k === active ? "bg-surface/60 text-ink" : "text-muted"
                }`}
              >
                <Check aria-hidden className={`size-3.5 ${selected ? "" : "invisible"}`} />
                {o.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
