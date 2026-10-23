"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/** Dernier compte vu par l'en-tête, pour afficher l'avatar tout de suite au chargement suivant (relu ensuite). */
export const ACCOUNT_KEY = "majalis-compte";

type Props = { name: string; email: string; translator?: boolean };

/** Avatar de la personne connectée ; un clic ouvre son nom, son e-mail, la traduction (traducteurs) et la déconnexion. */
export function UserMenu({ name, email, translator = false }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const display = name || email;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Mon compte : ${display}`}
        title={display}
        className="grid size-9 place-items-center rounded-full bg-me text-sm font-bold text-accent-ink uppercase hover:brightness-110"
      >
        {initials(display)}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-full right-0 z-10 mt-2 grid w-64 gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-pop"
        >
          <div className="grid min-w-0 gap-0.5">
            {name && <span className="truncate font-semibold">{name}</span>}
            <span className="truncate text-[13px] text-muted">{email}</span>
          </div>
          {translator && (
            <Link href="/traduire" role="menuitem" className="btn w-full justify-center" onClick={() => setOpen(false)}>
              Traduire en wolof
            </Link>
          )}
          <form
            action="/auth/deconnexion"
            method="post"
            onSubmit={() => {
              // Oublie le compte gardé par l'en-tête, pour ne pas le revoir un instant après.
              try {
                localStorage.removeItem(ACCOUNT_KEY);
              } catch {}
            }}
          >
            <button type="submit" role="menuitem" className="btn w-full justify-center">
              Se déconnecter
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

/** Une ou deux initiales : « Aïssatou Ba » → « AB », « aissatou » → « A ». */
function initials(s: string) {
  const parts = s.split(/[\s._@-]+/).filter(Boolean);
  const letters = parts.length > 1 && !s.includes("@") ? parts[0][0] + parts[1][0] : parts[0]?.[0] ?? "?";
  return letters;
}
