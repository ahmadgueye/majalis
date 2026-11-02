// Mot à mot wolof (logique de la v2) : découpage en mots entiers, fusions, suggestions et texte affiché.
// Les index des mots sont ceux du texte affiché (basmala séparée), découpé par espaces.

export type WolofVerse = { words: Record<string, string>; joins: number[]; free: string };
/** Un mot (ou un groupe de mots fusionnés) : du mot i au mot j inclus. */
export type Tile = { i: number; j: number; ar: string };
/** Un mot déjà traduit, ailleurs dans le Coran : sert aux suggestions et au glossaire. */
export type Known = { ref: string; i: number; ar: string; text: string };

export const EMPTY: WolofVerse = { words: {}, joins: [], free: "" };

/** Les lettres wolof qu'un clavier français n'a pas. */
export const WOLOF_LETTERS = ["à", "é", "ë", "ó", "ñ", "ŋ"];

/** Forme sans voyelles ni signes, alif unifié : deux mots écrits pareil ont la même clé.
 * Plages en \u : écrites en lettres arabes, l'affichage bidirectionnel les inverse (erreur de la v2). */
export const norm = (w: string) =>
  w.replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "").replace(/[\u0623\u0625\u0622\u0671]/g, "\u0627");
/** Forme proche : sans le préfixe و ou ف. */
const loose = (k: string) =>
  k
    .split(" ")
    .map((x) => x.replace(/^[\u0648\u0641](?=\S{2})/, ""))
    .join(" ");

export const arWords = (ar: string) => ar.split(" ").filter(Boolean);

export function tiles(ar: string, joins: number[]): Tile[] {
  const w = arWords(ar);
  const out: Tile[] = [];
  let i = 0;
  while (i < w.length) {
    let j = i;
    while (joins.includes(j) && j < w.length - 1) j++;
    out.push({ i, j, ar: w.slice(i, j + 1).join(" ") });
    i = j + 1;
  }
  return out;
}

export function known(ref: string, ar: string, v: WolofVerse): Known[] {
  return tiles(ar, v.joins).flatMap((t) => {
    const text = (v.words[t.i] ?? "").trim();
    return text ? [{ ref, i: t.i, ar: t.ar, text }] : [];
  });
}

export type KnownIndex = { same: Map<string, Known[]>; close: Map<string, Known[]> };

/** Index des mots traduits par forme, pour trouver vite les suggestions. */
export function indexKnown(all: Known[]): KnownIndex {
  const same = new Map<string, Known[]>();
  const close = new Map<string, Known[]>();
  const add = (m: Map<string, Known[]>, k: string, x: Known) => {
    const list = m.get(k);
    if (list) list.push(x);
    else m.set(k, [x]);
  };
  for (const x of all) {
    const k = norm(x.ar);
    add(same, k, x);
    add(close, loose(k), x);
  }
  return { same, close };
}

/** La traduction la plus fréquente du même mot, sinon d'une forme proche (sans و ou ف). */
export function suggest(ref: string, t: Tile, index: KnownIndex) {
  const k = norm(t.ar);
  const mine = (x: Known) => !(x.ref === ref && x.i === t.i);
  let kind: "same" | "close" = "same";
  let m = (index.same.get(k) ?? []).filter(mine);
  if (!m.length) {
    m = (index.close.get(loose(k)) ?? []).filter(mine);
    kind = "close";
  }
  if (!m.length) return null;
  const count = new Map<string, number>();
  for (const x of m) count.set(x.text, (count.get(x.text) ?? 0) + 1);
  const text = [...count].sort((a, b) => b[1] - a[1])[0][0];
  return { text, kind, ref: m.find((x) => x.text === text)!.ref };
}

/** Le wolof affiché sous le français : la traduction libre, sinon les mots mis bout à bout. */
export function wolofText(ar: string, v: WolofVerse | undefined) {
  if (!v) return "";
  const free = v.free.trim();
  if (free) return free;
  return tiles(ar, v.joins)
    .map((t) => (v.words[t.i] ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

export const isEmpty = (v: WolofVerse) => !v.free.trim() && !Object.values(v.words).some((x) => x.trim());

/** Même contenu (pour savoir si un brouillon diffère de la version publiée). */
export function same(a: WolofVerse | undefined, b: WolofVerse | undefined) {
  const clean = (v: WolofVerse | undefined) => {
    if (!v) return "";
    const words = Object.entries(v.words)
      .filter(([, x]) => x.trim())
      .map(([k, x]) => [k, x.trim()])
      .sort(([a], [b]) => Number(a) - Number(b));
    if (!words.length && !v.free.trim()) return "";
    return JSON.stringify([words, [...v.joins].sort((x, y) => x - y), v.free.trim()]);
  };
  return clean(a) === clean(b);
}

/** Lit une ligne de la base (wolof ou wolof_drafts). */
export function fromWolofRow(r: { words: unknown; joins: number[] | null; free: string | null }): WolofVerse {
  const words: Record<string, string> = {};
  if (r.words && typeof r.words === "object")
    for (const [k, x] of Object.entries(r.words)) if (typeof x === "string") words[k] = x;
  return { words, joins: r.joins ?? [], free: r.free ?? "" };
}
