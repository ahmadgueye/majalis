"use client";

import { useRouter } from "next/navigation";

type Item = { n: number; tname: string; ar: string };

export function SurahPicker({ current, surahs }: { current: number; surahs: Item[] }) {
  const router = useRouter();
  return (
    <select
      aria-label="Sourate"
      value={current}
      onChange={(e) => router.push(`/lire/${e.target.value}`)}
      style={{
        font: "600 14px var(--f-ui)",
        color: "var(--ink)",
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 9,
        padding: "7px 8px",
        minWidth: 0,
        maxWidth: 320,
        flex: 1,
      }}
    >
      {surahs.map((s) => (
        <option key={s.n} value={s.n}>
          {s.n}. {s.tname} — {s.ar}
        </option>
      ))}
    </select>
  );
}
