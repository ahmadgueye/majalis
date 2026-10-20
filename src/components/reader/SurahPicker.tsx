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
      className="max-w-[320px] min-w-0 flex-1 rounded-control border border-line bg-surface px-2 py-[7px] text-sm font-semibold text-ink"
    >
      {surahs.map((s) => (
        <option key={s.n} value={s.n}>
          {s.n}. {s.tname} — {s.ar}
        </option>
      ))}
    </select>
  );
}
