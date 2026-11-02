/** Traductions d'un verset. Montrées ou cachées selon la façon de lire (data-part, voir src/lib/reading.ts).
 *  Sans wolof publié, le mode « Wolof » montre le français en gris, avec une mention. */
export function VerseTranslations({ fr, wo, size = "text-tr" }: { fr: string; wo: string; size?: string }) {
  return (
    <>
      <p data-part="fr" className={`font-read ${size}`}>
        {fr}
      </p>
      {wo ? (
        <p data-part="wo" lang="wo" className={`mt-1 font-read ${size} text-accent`}>
          {wo}
        </p>
      ) : (
        <p data-part="wo-missing" className={`font-read ${size} text-muted`}>
          {fr}
          <span className="mt-0.5 block font-ui text-[11.5px] font-semibold text-faint">Pas encore traduit en wolof</span>
        </p>
      )}
    </>
  );
}
