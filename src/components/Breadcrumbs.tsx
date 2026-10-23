import Link from "next/link";
import { PageBar } from "@/components/SiteHeader";

export type Crumb = { label: string; href?: string };

/** Fil d'Ariane d'une page plus bas qu'une rubrique (un cercle), dans la barre sous l'en-tête commun. */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <PageBar>
      <nav aria-label="Fil d'Ariane" className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-1.5 text-sm">
          {crumbs.map((c, i) => (
            <li key={i} className="flex min-w-0 items-center gap-1.5">
              {i > 0 && (
                <span className="text-faint" aria-hidden>
                  /
                </span>
              )}
              {c.href ? (
                <Link href={c.href} className="truncate text-muted hover:text-ink">
                  {c.label}
                </Link>
              ) : (
                <span className="truncate font-semibold" aria-current="page">
                  {c.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </PageBar>
  );
}
