import type { Pattern } from "@/lib/circles";

// Motifs dessinés au trait dans la teinte du cercle (--tone), sur son fond doux (--tone-soft).
const TILES: Record<Pattern, { size: number; body: React.ReactNode }> = {
  etoile: {
    size: 48,
    body: (
      <>
        <rect x="13" y="13" width="22" height="22" />
        <rect x="13" y="13" width="22" height="22" transform="rotate(45 24 24)" />
        <circle cx="24" cy="24" r="4" />
      </>
    ),
  },
  arcs: {
    size: 40,
    body: (
      <>
        <path d="M0 40V22a20 20 0 0 1 40 0v18" />
        <path d="M10 40V26a10 10 0 0 1 20 0v14" />
      </>
    ),
  },
  vagues: { size: 40, body: <path d="M0 12q10-10 20 0t20 0M0 32q10-10 20 0t20 0" /> },
  losanges: {
    size: 32,
    body: (
      <>
        <path d="M16 2 30 16 16 30 2 16z" />
        <path d="M16 10 22 16 16 22 10 16z" />
      </>
    ),
  },
  points: { size: 18, body: <circle cx="9" cy="9" r="1.6" className="fill-current stroke-none" /> },
};

type Props = {
  /** Identifiant unique dans la page (plusieurs couvertures peuvent s'afficher ensemble). */
  id: string;
  pattern: Pattern;
  imageUrl?: string | null;
  className?: string;
};

/** Couverture d'un cercle : l'image envoyée si elle existe, sinon le motif choisi. */
export function CoverArt({ id, pattern, imageUrl, className = "" }: Props) {
  const tile = TILES[pattern] ?? TILES.etoile;
  return (
    <div className={`relative overflow-hidden bg-(--tone-soft) text-(--tone) ${className}`}>
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL signée et temporaire de Supabase Storage
        <img src={imageUrl} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <svg aria-hidden className="absolute inset-0 size-full opacity-50">
          <defs>
            <pattern id={id} width={tile.size} height={tile.size} patternUnits="userSpaceOnUse">
              <g className="fill-none stroke-current [stroke-width:1.3]">{tile.body}</g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${id})`} />
        </svg>
      )}
    </div>
  );
}
