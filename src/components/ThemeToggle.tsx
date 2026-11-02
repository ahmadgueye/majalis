"use client";

import { useEffect, useState } from "react";
import { THEME_KEY } from "@/lib/theme";

type Theme = "light" | "dark";

function currentTheme(): Theme {
  const set = document.documentElement.dataset.theme;
  if (set === "light" || set === "dark") return set;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const OPTIONS = [
  { value: "light", label: "Thème clair", Icon: SunIcon },
  { value: "dark", label: "Thème sombre", Icon: MoonIcon },
] as const;

/** Sélecteur clair / sombre à deux icônes. Sans choix enregistré, l'app suit le système. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => setTheme(currentTheme()), []);

  function choose(next: Theme) {
    if (next === theme) return;
    setTheme(next);
    const apply = () => {
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        // Stockage bloqué (navigation privée) : le choix vaut pour cette page seulement.
      }
    };
    // Fondu entre les deux thèmes (durée dans globals.css) quand le navigateur le permet.
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (document.startViewTransition && !calm) document.startViewTransition(apply);
    else apply();
  }

  return (
    <div
      role="group"
      aria-label="Thème"
      className="relative flex flex-none gap-0.5 rounded-full border border-line bg-surface-2 p-0.5"
    >
      {/* Pastille qui glisse sous l'icône active. */}
      <span
        aria-hidden
        className={`absolute top-0.5 left-0.5 size-7 rounded-full bg-surface shadow-card transition-transform duration-300 ease-out motion-reduce:transition-none ${
          theme === "dark" ? "translate-x-[30px]" : ""
        } ${theme ? "" : "invisible"}`}
      />
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => choose(value)}
            aria-pressed={active}
            aria-label={label}
            title={label}
            className={`relative grid size-7 place-items-center rounded-full transition-colors duration-300 ${
              active ? "text-ink" : "text-muted hover:text-ink"
            }`}
          >
            <Icon />
          </button>
        );
      })}
    </div>
  );
}

function SunIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2 [stroke-linecap:round]">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2 [stroke-linejoin:round]">
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
    </svg>
  );
}
