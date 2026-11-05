"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { NotebookPen } from "lucide-react";
import { NOTE_STATUS, useNoteSaver } from "./useNoteSaver";

/**
 * Note personnelle d'un verset (Traduire et Lecture). Fermée tant qu'elle est vide, derrière
 * « Ajouter une note » ; enregistrée toute seule pendant la frappe, supprimée si on la vide.
 * `label` : « À propos » pour la note d'une sourate (ref `n:0`), dans Mes notes.
 */
export function VerseNote({
  verseRef,
  initial,
  label = "Ma note",
  placeholder = "Ce que ce verset t'inspire, une question, une référence…",
}: {
  verseRef: string;
  initial: string;
  label?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(initial.trim() !== "");
  const { body, status, change, write } = useNoteSaver(verseRef, initial);
  const area = useRef<HTMLTextAreaElement>(null);

  // Le champ grandit avec le texte.
  useLayoutEffect(() => {
    const t = area.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = `${t.scrollHeight}px`;
  }, [body, open]);

  if (!open)
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          requestAnimationFrame(() => area.current?.focus());
        }}
        className="mt-1.5 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[12.5px] font-semibold text-muted hover:bg-surface-2 hover:text-ink"
      >
        <NotebookPen aria-hidden className="size-3.5" />
        Ajouter une note
      </button>
    );

  return (
    <div className="mt-2 rounded-lg border border-line bg-surface-2 px-3 pt-2 pb-2.5">
      <div className="mb-1 flex items-center gap-2 text-[12px]">
        <NotebookPen aria-hidden className="size-3.5 text-muted" />
        <span className="font-semibold text-ink">{label}</span>
        <span role="status" className={status === "error" ? "font-semibold text-c-rose" : "text-faint"}>
          {NOTE_STATUS[status]}
        </span>
        {!body.trim() && (
          <button type="button" onClick={() => setOpen(false)} className="ml-auto font-semibold text-muted hover:text-ink">
            Fermer
          </button>
        )}
      </div>
      <textarea
        ref={area}
        rows={2}
        value={body}
        onChange={(e) => change(e.target.value)}
        onBlur={() => void write()}
        placeholder={placeholder}
        aria-label={`${label} : ${verseRef}`}
        className="block w-full resize-none overflow-hidden bg-transparent font-read text-[15px] leading-relaxed text-ink outline-none placeholder:text-faint"
      />
    </div>
  );
}
