"use client";

import { useEffect } from "react";
import { Printer } from "lucide-react";

/**
 * Barre de la page PDF (cachée à l'impression) : le document reste clair même en thème sombre,
 * et la fenêtre d'impression s'ouvre seule une fois les polices chargées (sinon l'arabe
 * partirait dans une police de secours).
 */
export function PrintBar() {
  useEffect(() => {
    document.documentElement.dataset.theme = "light";
    let live = true;
    void document.fonts.ready.then(() => live && setTimeout(() => live && window.print(), 300));
    return () => {
      live = false;
    };
  }, []);

  return (
    <div className="sticky top-0 z-10 border-b border-line bg-surface-2 print:hidden">
      <div className="mx-auto flex max-w-[760px] flex-wrap items-center gap-3 px-8 py-2.5">
        <p className="flex-1 text-[13px] text-muted">
          Pour obtenir le PDF, choisis <b className="text-ink">« Enregistrer au format PDF »</b> comme imprimante.
        </p>
        <button type="button" className="btn primary" onClick={() => window.print()}>
          <Printer aria-hidden className="size-4" />
          Enregistrer en PDF
        </button>
      </div>
    </div>
  );
}
