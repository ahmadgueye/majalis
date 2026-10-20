"use client";

import { useState } from "react";

type Props = { surahs: { n: number; tname: string }[]; studied: number[] };

/** Les 114 sourates en cases ; celles que le cercle a étudiées sont dans sa teinte. */
export function QuranMap({ surahs, studied }: Props) {
  const done = new Set(studied);
  const [hover, setHover] = useState<number | null>(null);
  const h = hover ? surahs[hover - 1] : null;
  return (
    <div className="grid gap-2">
      <div
        role="img"
        aria-label={`${done.size} sourate${done.size > 1 ? "s" : ""} étudiée${done.size > 1 ? "s" : ""} sur 114`}
        className="grid grid-cols-[repeat(19,minmax(0,1fr))] gap-[3px]"
        onMouseLeave={() => setHover(null)}
      >
        {surahs.map((s) => (
          <span
            key={s.n}
            title={`${s.n}. ${s.tname}`}
            onMouseEnter={() => setHover(s.n)}
            className={`aspect-square rounded-[3px] border hover:outline-2 hover:outline-offset-1 hover:outline-(--tone) ${
              done.has(s.n) ? "border-(--tone) bg-(--tone)" : "border-line bg-surface-2"
            }`}
          />
        ))}
      </div>
      <p className="min-h-[1.5em] text-[12.5px]" aria-live="polite">
        {h ? `${h.n}. ${h.tname} : ${done.has(h.n) ? "étudiée" : "pas encore étudiée"}` : (
          <span className="text-muted">Survole une case pour voir la sourate.</span>
        )}
      </p>
      <div className="flex justify-between text-[12.5px] text-muted">
        <span>1. Al-Fâtiha</span>
        <span>114. An-Nâs</span>
      </div>
    </div>
  );
}
