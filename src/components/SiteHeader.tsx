"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ACCOUNT_KEY, UserMenu } from "@/components/UserMenu";
import { createClient } from "@/lib/supabase/client";

export type HeaderViewer = { name: string; email: string; translator: boolean };

/**
 * En-tête commun à tout le site, posé une seule fois par le layout de (site) : il reste en place
 * quand on change de page. Mêmes éléments aux mêmes places. Gauche : logo (Mes cercles une fois
 * connecté, sinon l'accueil). Centre : navigation. Droite : thème et compte.
 * Ce qui est propre à une page va dans sa barre (PageBar). La séance a son en-tête compact.
 */
export function SiteHeader() {
  const viewer = useViewer();
  const path = usePathname();
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Tant qu'on ne sait pas qui lit, pas de liens : ils changeraient sous les yeux.
  const links =
    viewer === undefined
      ? []
      : viewer
        ? [
            {
              href: "/cercles",
              label: "Mes cercles",
              on: path.startsWith("/cercles"),
            },
            {
              href: "/lire/1",
              label: "Lire le Coran",
              on: path.startsWith("/lire"),
            },
            ...(viewer.translator
              ? [
                  {
                    href: "/traduire",
                    label: "Traduire",
                    on: path.startsWith("/traduire"),
                  },
                ]
              : []),
          ]
        : [
            { href: "/#fonctions", label: "Fonctions", on: false },
            {
              href: "/lire/1",
              label: "Lire le Coran",
              on: path.startsWith("/lire"),
            },
          ];

  useEffect(() => setMenu(false), [path]);
  useEffect(() => {
    if (!menu) return;
    const onPointer = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/92 backdrop-blur-sm">
      <div className="px-safe mx-auto flex h-14 max-w-[1080px] items-center gap-3">
        <Link
          href={viewer ? "/cercles" : "/"}
          className="flex flex-none items-center gap-2.5 text-[17px] font-bold"
        >
          <Logo />
          Majalis
        </Link>

        <nav
          aria-label="Navigation principale"
          className="ml-4 hidden items-center gap-0.5 md:flex"
        >
          {links.map((l) => (
            <NavLink key={l.href} {...l} />
          ))}
        </nav>

        <div className="ml-auto flex flex-none items-center gap-2">
          <div ref={menuRef} className="relative md:hidden">
            <button
              type="button"
              aria-expanded={menu}
              aria-controls="menu-principal"
              onClick={() => setMenu((m) => !m)}
              className="btn ghost px-2.5"
            >
              {menu ? (
                <X aria-hidden className="size-4" />
              ) : (
                <Menu aria-hidden className="size-4" />
              )}
              Menu
            </button>
            {menu && (
              <nav
                id="menu-principal"
                aria-label="Navigation principale"
                className="absolute top-full right-0 z-30 mt-2 grid w-56 gap-0.5 rounded-xl border border-line bg-surface p-1.5 shadow-pop"
              >
                {links.map((l) => (
                  <NavLink key={l.href} {...l} />
                ))}
              </nav>
            )}
          </div>
          <ThemeToggle />
          {viewer === undefined ? (
            // Le temps de savoir qui lit : la place de l'avatar est gardée.
            <span aria-hidden className="size-9 flex-none" />
          ) : viewer ? (
            <UserMenu
              name={viewer.name}
              email={viewer.email}
              translator={viewer.translator}
            />
          ) : path.startsWith("/connexion") ? null : (
            <Link
              className="btn"
              href={`/connexion${path === "/" ? "" : `?suite=${encodeURIComponent(path)}`}`}
            >
              Se connecter
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({
  href,
  label,
  on,
}: {
  href: string;
  label: string;
  on: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={on ? "page" : undefined}
      className={`rounded-lg px-3 py-[7px] text-[14.5px] font-semibold ${
        on
          ? "bg-accent-soft text-ink"
          : "text-muted hover:bg-surface-2 hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}

/** Barre propre à une page, sous l'en-tête commun : fil d'Ariane, sourate, outils de la page. */
export function PageBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky top-14 z-10 border-b border-line bg-surface/92 backdrop-blur-sm">
      <div className="px-safe mx-auto flex min-h-12 max-w-[1080px] flex-wrap items-center gap-x-3 gap-y-2 py-2">
        {children}
      </div>
    </div>
  );
}

/** La personne connectée, lue dans le navigateur : undefined tant qu'on ne sait pas, null pour un visiteur. */
function useViewer() {
  const [viewer, setViewer] = useState<HeaderViewer | null | undefined>(
    undefined,
  );
  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(ACCOUNT_KEY) ?? "null");
      if (cached && typeof cached.email === "string") setViewer(cached);
    } catch {}
    const db = createClient();
    if (!db) return setViewer(null);
    let live = true;
    let loadedId: string | null | undefined;
    async function load() {
      const { user } = (await db!.auth.getUser()).data;
      if (!live) return;
      loadedId = user?.id ?? null;
      if (!user) {
        setViewer(null);
        try {
          localStorage.removeItem(ACCOUNT_KEY);
        } catch {}
        return;
      }
      const [{ data: profile }, { data: translator }] = await Promise.all([
        db!
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle(),
        db!.rpc("is_translator"),
      ]);
      if (!live) return;
      const next = {
        name: profile?.display_name ?? "",
        email: user.email ?? "",
        translator: translator === true,
      };
      setViewer(next);
      try {
        localStorage.setItem(ACCOUNT_KEY, JSON.stringify(next));
      } catch {}
    }
    // Première lecture (INITIAL_SESSION), puis connexion ou déconnexion, même dans un autre onglet.
    // Supabase redit « SIGNED_IN » à chaque retour sur l'onglet : on ne relit que si la personne a changé.
    // setTimeout : un appel à Supabase dans ce rappel peut bloquer la bibliothèque.
    const { data } = db.auth.onAuthStateChange((event, session) => {
      const id = session?.user.id ?? null;
      const changed =
        event === "INITIAL_SESSION" ||
        event === "USER_UPDATED" ||
        ((event === "SIGNED_IN" || event === "SIGNED_OUT") && id !== loadedId);
      if (!changed) return;
      loadedId = id;
      setTimeout(() => void load(), 0);
    });
    return () => {
      live = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return viewer;
}
