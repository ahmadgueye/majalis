// Personnalisation des cercles : teintes, motifs de couverture, rythme. Utilisable côté client et serveur.

export const TONES = [
  { value: "teal", label: "Vert d'eau" },
  { value: "sage", label: "Sauge" },
  { value: "sky", label: "Ciel" },
  { value: "sand", label: "Sable" },
  { value: "rose", label: "Rose" },
  { value: "plum", label: "Prune" },
] as const;
export type Tone = (typeof TONES)[number]["value"];

export const PATTERNS = [
  { value: "etoile", label: "Étoile à huit branches" },
  { value: "arcs", label: "Arcs" },
  { value: "vagues", label: "Dunes" },
  { value: "losanges", label: "Losanges" },
  { value: "points", label: "Points" },
] as const;
export type Pattern = (typeof PATTERNS)[number]["value"];

export const ROLE_LABELS: Record<string, string> = {
  owner: "Responsable",
  editor: "Peut modifier",
  viewer: "Lecture seule",
};

export const DAYS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

export const isTone = (v: string): v is Tone => TONES.some((t) => t.value === v);
export const isPattern = (v: string): v is Pattern => PATTERNS.some((p) => p.value === v);

/** Classe qui pose --tone et --tone-soft (voir globals.css). */
export const toneClass = (tone: string) => `tone-${isTone(tone) ? tone : "teal"}`;

/** Teinte stable d'une personne, tirée de son identifiant. */
export function personTone(id: string): Tone {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length].value;
}

export const initial = (name: string) => (name.trim()[0] ?? "?").toLocaleUpperCase("fr");

/** « 20:30:00 » → « 20 h 30 », « 21:00 » → « 21 h ». */
export function formatTime(t: string) {
  const [h, m] = t.split(":");
  return m === "00" ? `${Number(h)} h` : `${Number(h)} h ${m}`;
}

export function formatRhythm(day: number | null, time: string | null) {
  if (!day) return null;
  return `Chaque ${DAYS[day - 1]}${time ? ` · ${formatTime(time)}` : ""}`;
}

/** Prochaine date du jour de rencontre (aujourd'hui compris), en date locale. */
export function nextMeeting(day: number, from = new Date()) {
  const today = ((from.getDay() + 6) % 7) + 1; // 1 = lundi
  const d = new Date(from);
  d.setDate(from.getDate() + ((day - today + 7) % 7));
  return d;
}

export function timeAgo(iso: string, now = new Date()) {
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 7) return `il y a ${days} jours`;
  if (days < 14) return "il y a 1 semaine";
  if (days < 31) return `il y a ${Math.floor(days / 7)} semaines`;
  const months = Math.floor(days / 30);
  return months <= 1 ? "il y a 1 mois" : `il y a ${months} mois`;
}

export const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? "s" : ""}`;
