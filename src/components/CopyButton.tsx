"use client";

import { useState } from "react";

/** Copie un texte dans le presse-papiers ; le libellé confirme pendant deux secondes. */
export function CopyButton({ text, label = "Copier" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      // Presse-papiers refusé : on laisse la personne sélectionner le lien affiché à côté.
    }
  }

  return (
    <button type="button" className="btn" onClick={copy}>
      {done ? "Copié" : label}
    </button>
  );
}
