// Façon de lire : arabe seul, arabe et traduction, ou traduction seule ; langue des traductions.
// Le choix est posé sur <html> (data-read, data-lang) avant l'affichage par un script du layout,
// et les règles de globals.css montrent ou cachent les parties marquées data-part.

export type ReadMode = "ar" | "both" | "tr";
export type ReadLang = "fr" | "wo" | "both";

export const READ_KEY = "majalis-lecture";

export const READ_MODES: { value: ReadMode; label: string }[] = [
  { value: "ar", label: "Arabe" },
  { value: "both", label: "Arabe et traduction" },
  { value: "tr", label: "Traduction" },
];

export const READ_LANGS: { value: ReadLang; label: string }[] = [
  { value: "fr", label: "Français" },
  { value: "wo", label: "Wolof" },
  { value: "both", label: "Français et wolof" },
];

export const isReadMode = (v: unknown): v is ReadMode => v === "ar" || v === "both" || v === "tr";
export const isReadLang = (v: unknown): v is ReadLang => v === "fr" || v === "wo" || v === "both";

/** Script du layout : applique le choix enregistré avant l'affichage (pas de clignotement). */
export const readingScript = `try{var r=JSON.parse(localStorage.getItem(${JSON.stringify(READ_KEY)})||"{}"),d=document.documentElement.dataset;if(["ar","both","tr"].indexOf(r.mode)>=0)d.read=r.mode;if(["fr","wo","both"].indexOf(r.lang)>=0)d.lang=r.lang}catch(e){}`;

/** Numéro de fin de verset à la manière du mushaf : ۝ suivi des chiffres arabes. */
export const verseEnd = (n: number) => "۝" + String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
