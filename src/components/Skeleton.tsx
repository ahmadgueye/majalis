/** Bloc gris d'un squelette de chargement (forme et taille par les classes). */
export function Bone({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />;
}

/**
 * Enveloppe d'un squelette de page (loading.tsx) : annonce le chargement aux lecteurs d'écran
 * et n'apparaît qu'après 150 ms (classe skeleton-page), pour ne pas clignoter.
 */
export function SkeletonPage({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-live="polite" className={`skeleton-page ${className}`}>
      <span className="sr-only">Chargement de la page…</span>
      {children}
    </div>
  );
}

/** Barre de page (PageBar) en attente : même hauteur, pour que rien ne saute à l'arrivée. */
export function BarBones({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-line bg-surface">
      <div className="px-safe mx-auto flex min-h-12 max-w-[1080px] items-center gap-3 py-2">{children}</div>
    </div>
  );
}
