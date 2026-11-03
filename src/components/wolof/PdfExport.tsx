"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import { Sheet } from "@/components/Sheet";

/**
 * « PDF » de Traduire : toute la sourate ou un passage, avec ou sans mes notes. Ouvre la page
 * à imprimer dans un nouvel onglet, après avoir enregistré ce qui était en cours de frappe.
 */
export function PdfExport({ surah, ayas, flush }: { surah: number; ayas: number; flush: () => Promise<unknown> }) {
  const [whole, setWhole] = useState(true);
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(ayas);
  const [notes, setNotes] = useState(false);

  async function create(close: () => void) {
    // L'onglet s'ouvre tout de suite (sinon le navigateur le bloque), l'adresse vient après l'enregistrement.
    const tab = window.open("", "_blank");
    await flush();
    const q = new URLSearchParams();
    if (!whole) {
      q.set("de", String(from));
      q.set("a", String(to));
    }
    if (notes) q.set("notes", "1");
    const url = `/traduire/${surah}/pdf${q.size ? `?${q}` : ""}`;
    if (tab) tab.location.href = url;
    else window.location.href = url;
    close();
  }

  const num = (v: string) => Math.min(ayas, Math.max(1, Number(v) || 1));

  return (
    <Sheet
      small
      title="Créer un PDF"
      triggerClassName="btn"
      trigger={
        <>
          <FileDown aria-hidden className="size-4" />
          PDF
        </>
      }
    >
      {(close) => (
        <form
          className="grid gap-4 px-5 pt-2 pb-5"
          onSubmit={(e) => {
            e.preventDefault();
            void create(close);
          }}
        >
          <p className="text-[13.5px] leading-normal text-muted">
            Pour chaque verset : l&apos;arabe, le mot à mot en wolof, le français et le wolof.
          </p>
          <fieldset className="grid gap-2">
            <legend className="mb-1 text-[13px] font-semibold">Versets</legend>
            <label className="flex items-center gap-2 text-[14px]">
              <input type="radio" name="portee" checked={whole} onChange={() => setWhole(true)} />
              Toute la sourate ({ayas} verset{ayas > 1 ? "s" : ""})
            </label>
            <label className="flex flex-wrap items-center gap-2 text-[14px]">
              <input type="radio" name="portee" checked={!whole} onChange={() => setWhole(false)} />
              Du verset
              <input
                type="number"
                min={1}
                max={ayas}
                value={from}
                aria-label="Premier verset"
                onFocus={() => setWhole(false)}
                onChange={(e) => setFrom(num(e.target.value))}
                className="field-input w-20"
              />
              au verset
              <input
                type="number"
                min={1}
                max={ayas}
                value={to}
                aria-label="Dernier verset"
                onFocus={() => setWhole(false)}
                onChange={(e) => setTo(num(e.target.value))}
                className="field-input w-20"
              />
            </label>
          </fieldset>
          <label className="flex items-center gap-2 text-[14px]">
            <input type="checkbox" checked={notes} onChange={(e) => setNotes(e.target.checked)} />
            Inclure mes notes
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn ghost" onClick={close}>
              Annuler
            </button>
            <button type="submit" className="btn primary">
              Créer le PDF
            </button>
          </div>
        </form>
      )}
    </Sheet>
  );
}
