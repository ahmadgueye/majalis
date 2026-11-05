"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Info, X } from "lucide-react";
import { NOTE_STATUS, useNoteSaver } from "./useNoteSaver";

/** « de Yunus », mais « d'Al-Baqara » : élision devant une voyelle. */
const deName = (t: string) => (/^[aeiou]/i.test(t) ? `d'${t}` : `de ${t}`);

export const ABOUT_PLACEHOLDER = "Thèmes centraux, contexte de révélation, plan de la sourate…";

/**
 * « ⓘ À propos » d'une sourate : ma note sur toute la sourate (ref `n:0`, dans la table des notes),
 * lue et écrite dans une fenêtre. Le bouton prend la couleur d'accent quand elle existe.
 */
export function SurahAbout({ surah, tname, initial }: { surah: number; tname: string; initial: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const { body, status, change, write } = useNoteSaver(`${surah}:0`, initial);
  const [open, setOpen] = useState(false);
  const filled = body.trim() !== "";

  // Le champ grandit avec le texte (jusqu'à la hauteur de la fenêtre, puis il défile).
  useLayoutEffect(() => {
    const t = area.current;
    if (!t || !open) return;
    t.style.height = "auto";
    t.style.height = `${Math.max(t.scrollHeight, 220)}px`;
  }, [body, open]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          ref.current?.showModal();
        }}
        title={`À propos de la sourate ${tname}`}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12.5px] font-semibold ${
          filled ? "border-accent bg-accent-soft text-accent" : "border-line text-muted hover:bg-surface-2 hover:text-ink"
        }`}
      >
        <Info aria-hidden className="size-3.5" />À propos
      </button>
      <dialog
        ref={ref}
        className="sheet"
        aria-label={`À propos de la sourate ${tname}`}
        onClose={() => {
          setOpen(false);
          void write();
        }}
        onClick={(e) => e.target === e.currentTarget && ref.current?.close()}
      >
        <div className="flex items-center gap-2.5 px-5 pt-[18px] pb-1">
          <h2 className="flex-1 font-read text-[22px] leading-tight font-medium">À propos {deName(tname)}</h2>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Fermer"
            title="Fermer"
            className="grid size-9 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-ink"
          >
            <X aria-hidden className="size-4" />
          </button>
        </div>
        <p role="status" className={`px-5 text-[12.5px] ${status === "error" ? "font-semibold text-c-rose" : "text-faint"}`}>
          {NOTE_STATUS[status]}
        </p>
        <div className="px-5 pt-2 pb-5">
          <textarea
            ref={area}
            value={body}
            onChange={(e) => change(e.target.value)}
            onBlur={() => void write()}
            placeholder={ABOUT_PLACEHOLDER}
            aria-label={`À propos de la sourate ${tname}`}
            className="field-input block max-h-[65dvh] w-full resize-none font-read text-[15.5px] leading-relaxed"
          />
        </div>
      </dialog>
    </>
  );
}
