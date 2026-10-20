// Les quatre surlignages et leur sens fixe (principe d'UX n° 6). Utilisable côté client et serveur.

export const HIGHLIGHTS = {
  theme: { label: "Thème", desc: "Idée centrale ou sujet du passage.", bg: "bg-hl-theme", dot: "bg-c-sage" },
  question: { label: "Question", desc: "Ce qu'on veut approfondir ou se demander.", bg: "bg-hl-question", dot: "bg-c-sky" },
  reflect: { label: "À méditer", desc: "Un verset qui touche, à relire et à garder.", bg: "bg-hl-reflect", dot: "bg-c-sand" },
  link: { label: "Lien", desc: "Un verset qui fait écho à un autre.", bg: "bg-hl-link", dot: "bg-c-rose" },
} as const;

export type HighlightKind = keyof typeof HIGHLIGHTS;
export const HIGHLIGHT_KINDS = Object.keys(HIGHLIGHTS) as HighlightKind[];
export const isHighlightKind = (k: string): k is HighlightKind => k in HIGHLIGHTS;

/** Tri des références « sourate:verset » dans l'ordre du Coran. */
export function compareRefs(a: string, b: string) {
  const [a1, a2] = a.split(":").map(Number);
  const [b1, b2] = b.split(":").map(Number);
  return a1 - b1 || a2 - b2;
}
