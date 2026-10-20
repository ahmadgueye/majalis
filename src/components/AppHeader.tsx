import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import type { Viewer } from "@/lib/auth";

export type Crumb = { label: string; href?: string };

/** En-tête des pages de l'app : logo, fil d'Ariane, thème et compte. */
export function AppHeader({ viewer, crumbs }: { viewer: Viewer; crumbs: Crumb[] }) {
  return (
    <header className="sticky top-0 z-5 border-b border-line bg-surface/92 backdrop-blur-sm">
      <div className="px-safe mx-auto flex h-14 max-w-[1080px] items-center gap-3">
        <Link href="/cercles" aria-label="Mes cercles">
          <Logo />
        </Link>
        <nav aria-label="Fil d'Ariane" className="min-w-0 flex-1">
          <ol className="flex min-w-0 items-center gap-1.5 text-sm">
            {crumbs.map((c, i) => (
              <li key={i} className="flex min-w-0 items-center gap-1.5">
                {i > 0 && <span className="text-faint" aria-hidden>/</span>}
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
        <ThemeToggle />
        <UserMenu name={viewer.name} email={viewer.email} />
      </div>
    </header>
  );
}
