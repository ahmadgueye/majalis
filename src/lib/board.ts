// Modèle et géométrie du tableau (repris de la v2). Fonctions pures, utilisables côté client et serveur.
// En base, un élément = une ligne de board_elements : id, type, z, et le reste dans data (jsonb).

export const BOARD_COLORS = {
  ink: { label: "Encre", stroke: "stroke-c-ink", text: "text-c-ink", note: "bg-note-ink", dot: "bg-c-ink" },
  sand: { label: "Sable", stroke: "stroke-c-sand", text: "text-c-sand", note: "bg-note-sand", dot: "bg-c-sand" },
  sage: { label: "Sauge", stroke: "stroke-c-sage", text: "text-c-sage", note: "bg-note-sage", dot: "bg-c-sage" },
  rose: { label: "Rose", stroke: "stroke-c-rose", text: "text-c-rose", note: "bg-note-rose", dot: "bg-c-rose" },
  sky: { label: "Ciel", stroke: "stroke-c-sky", text: "text-c-sky", note: "bg-note-sky", dot: "bg-c-sky" },
} as const;

export type BoardColor = keyof typeof BOARD_COLORS;
export const COLOR_KEYS = Object.keys(BOARD_COLORS) as BoardColor[];
export type LineStyle = "clean" | "hand";

export type Point = { x: number; y: number };
export type Box = { x: number; y: number; w: number; h: number };
/** Bout de flèche : lié à un élément (il le suit) ou libre. */
export type ArrowEnd = { id: string } | Point;

type Base = { id: string; z: number };
export type VerseEl = Base & { type: "verse"; ref: string; x: number; y: number; w: number };
export type NoteEl = Base & {
  type: "note";
  x: number;
  y: number;
  w: number;
  text: string;
  color: BoardColor;
  style: LineStyle;
  by: string | null;
};
export type TextEl = Base & {
  type: "text";
  x: number;
  y: number;
  w: number;
  text: string;
  color: BoardColor;
  style: LineStyle;
  size: "md" | "lg";
};
export type RectEl = Base & { type: "rect"; x: number; y: number; w: number; h: number; color: BoardColor; style: LineStyle };
export type ArrowEl = Base & {
  type: "arrow";
  from: ArrowEnd;
  to: ArrowEnd;
  bend: number;
  color: BoardColor;
  style: LineStyle;
};
export type StrokeEl = Base & { type: "stroke"; x: number; y: number; points: [number, number][]; color: BoardColor };

export type BoardEl = VerseEl | NoteEl | TextEl | RectEl | ArrowEl | StrokeEl;
export type BoardType = BoardEl["type"];

/** Taille mesurée des éléments HTML (verset, note, texte), dont la hauteur dépend du contenu. */
export type Sizes = Record<string, { w: number; h: number }>;

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const center = (b: Box): Point => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });
export const isBound = (end: ArrowEnd): end is { id: string } => "id" in end;
/** Éléments auxquels une flèche peut s'accrocher. */
export const bindable = (e: BoardEl | undefined) => !!e && ["verse", "note", "text", "rect"].includes(e.type);
export const hasStyle = (t: string) => ["rect", "arrow", "note", "text"].includes(t);

/* ---------- Lecture et écriture en base ---------- */

const COLOR_SET = new Set<string>(COLOR_KEYS);
const num = (v: unknown, d = 0) => (typeof v === "number" && Number.isFinite(v) ? v : d);
const str = (v: unknown) => (typeof v === "string" ? v : "");
const color = (v: unknown): BoardColor => (COLOR_SET.has(v as string) ? (v as BoardColor) : "ink");
const lineStyle = (v: unknown): LineStyle => (v === "hand" ? "hand" : "clean");
function end(v: unknown): ArrowEnd {
  const o = (v ?? {}) as Record<string, unknown>;
  return typeof o.id === "string" ? { id: o.id } : { x: num(o.x), y: num(o.y) };
}

/** Ligne de board_elements vers élément du tableau ; null si la ligne est illisible. */
export function fromRow(row: { id: string; type: string; z: number; data: unknown }): BoardEl | null {
  const d = (row.data ?? {}) as Record<string, unknown>;
  const base = { id: row.id, z: num(row.z) };
  const at = { x: num(d.x), y: num(d.y) };
  switch (row.type) {
    case "verse":
      return /^\d{1,3}:\d{1,3}$/.test(str(d.ref))
        ? { ...base, type: "verse", ref: str(d.ref), ...at, w: num(d.w, 340) }
        : null;
    case "note":
      return {
        ...base,
        type: "note",
        ...at,
        w: num(d.w, 260),
        text: str(d.text),
        color: color(d.color),
        style: lineStyle(d.style),
        by: typeof d.by === "string" ? d.by : null,
      };
    case "text":
      return {
        ...base,
        type: "text",
        ...at,
        w: num(d.w, 320),
        text: str(d.text),
        color: color(d.color),
        style: lineStyle(d.style),
        size: d.size === "lg" ? "lg" : "md",
      };
    case "rect":
      return { ...base, type: "rect", ...at, w: num(d.w), h: num(d.h), color: color(d.color), style: lineStyle(d.style) };
    case "arrow":
      return {
        ...base,
        type: "arrow",
        from: end(d.from),
        to: end(d.to),
        bend: num(d.bend),
        color: color(d.color),
        style: lineStyle(d.style),
      };
    case "stroke": {
      const pts = Array.isArray(d.points) ? d.points : [];
      const points = pts.filter((p): p is [number, number] => Array.isArray(p) && p.length === 2).map(([a, b]) => [num(a), num(b)] as [number, number]);
      return points.length ? { ...base, type: "stroke", ...at, points, color: color(d.color) } : null;
    }
  }
  return null;
}

const round = (v: number) => Math.round(v * 10) / 10;

/** Élément vers colonnes de board_elements (sans session_id ni space_id). */
export function toRow(e: BoardEl) {
  const { id, type, z, ...rest } = e;
  const data: Record<string, unknown> = { ...rest };
  for (const k of ["x", "y", "w", "h"]) if (typeof data[k] === "number") data[k] = round(data[k] as number);
  if (e.type === "stroke") data.points = e.points.map(([a, b]) => [round(a), round(b)]);
  return { id, type, z, data };
}

/* ---------- Géométrie ---------- */

export function bbox(e: BoardEl | undefined, all: Map<string, BoardEl>, sizes: Sizes, depth = 0): Box | null {
  if (!e) return null;
  switch (e.type) {
    case "rect":
      return { x: Math.min(e.x, e.x + e.w), y: Math.min(e.y, e.y + e.h), w: Math.abs(e.w), h: Math.abs(e.h) };
    case "stroke": {
      let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
      for (const [px, py] of e.points) {
        a = Math.min(a, px);
        b = Math.min(b, py);
        c = Math.max(c, px);
        d = Math.max(d, py);
      }
      return { x: e.x + a, y: e.y + b, w: c - a, h: d - b };
    }
    case "arrow": {
      if (depth > 0) return null; // une flèche ne s'accroche pas à une flèche
      const p = arrowPts(e, all, sizes);
      if (!p) return null;
      const m = arrowMid(p);
      const xs = [p.p1.x, p.p2.x, m.x], ys = [p.p1.y, p.p2.y, m.y];
      const x = Math.min(...xs), y = Math.min(...ys);
      return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
    }
    default: {
      // La largeur est celle de l'élément ; la hauteur, mesurée, dépend du texte.
      return { x: e.x, y: e.y, w: e.w, h: sizes[e.id]?.h ?? 140 };
    }
  }
}

/** Point du bord de la boîte b dans la direction de t (avec un petit écart). */
function edgeTo(b: Box, t: Point, gap = 8): Point {
  const c = center(b);
  const dx = t.x - c.x, dy = t.y - c.y;
  if (!dx && !dy) return c;
  const s = Math.min(dx ? (b.w / 2 + gap) / Math.abs(dx) : 1e9, dy ? (b.h / 2 + gap) / Math.abs(dy) : 1e9);
  return { x: c.x + dx * s, y: c.y + dy * s };
}

export type ArrowGeometry = { p1: Point; p2: Point; c: Point; n: Point };

/** Extrémités et point de contrôle d'une flèche ; null si un élément relié a disparu. */
export function arrowPts(a: ArrowEl, all: Map<string, BoardEl>, sizes: Sizes): ArrowGeometry | null {
  const boxOf = (end: ArrowEnd) => (isBound(end) ? bbox(all.get(end.id), all, sizes, 1) : null);
  const b1 = boxOf(a.from), b2 = boxOf(a.to);
  if ((isBound(a.from) && !b1) || (isBound(a.to) && !b2)) return null;
  const c1 = b1 ? center(b1) : (a.from as Point);
  const c2 = b2 ? center(b2) : (a.to as Point);
  const dx = c2.x - c1.x, dy = c2.y - c1.y, L = Math.hypot(dx, dy) || 1;
  const n = { x: -dy / L, y: dx / L };
  const bend = a.bend || 0;
  const c0 = { x: (c1.x + c2.x) / 2 + n.x * bend * 2, y: (c1.y + c2.y) / 2 + n.y * bend * 2 };
  const p1 = b1 ? edgeTo(b1, bend ? c0 : c2) : c1;
  const p2 = b2 ? edgeTo(b2, bend ? c0 : c1) : c2;
  const c = { x: (p1.x + p2.x) / 2 + n.x * bend * 2, y: (p1.y + p2.y) / 2 + n.y * bend * 2 };
  return { p1, p2, c, n };
}

/** Milieu de la courbe (où se trouve la poignée pour la courber). */
export const arrowMid = ({ p1, p2, c }: ArrowGeometry): Point => ({
  x: 0.25 * p1.x + 0.5 * c.x + 0.25 * p2.x,
  y: 0.25 * p1.y + 0.5 * c.y + 0.25 * p2.y,
});

/** Boîte qui contient tous les éléments, ou null si le tableau est vide. */
export function boardBounds(els: BoardEl[], all: Map<string, BoardEl>, sizes: Sizes): Box | null {
  let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
  for (const e of els) {
    const bb = bbox(e, all, sizes);
    if (!bb) continue;
    a = Math.min(a, bb.x);
    b = Math.min(b, bb.y);
    c = Math.max(c, bb.x + bb.w);
    d = Math.max(d, bb.y + bb.h);
  }
  return a === Infinity ? null : { x: a, y: b, w: c - a, h: d - b };
}

/* ---------- Tracés ---------- */

/** Tirage pseudo-aléatoire stable à partir d'une graine (l'identifiant de l'élément). */
export function rng(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Segment crayonné (style « Main levée »). */
export function sketchLine(a: Point, b: Point, r: () => number) {
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const j = Math.min(2.6, len * 0.02 + 0.6);
  const o = () => (r() - 0.5) * 2 * j;
  return `M${a.x + o()} ${a.y + o()}Q${(a.x + b.x) / 2 + o() * 1.6} ${(a.y + b.y) / 2 + o() * 1.6} ${b.x + o()} ${b.y + o()}`;
}

export function sketchQuad(a: Point, c: Point, b: Point, r: () => number) {
  const o = () => (r() - 0.5) * 4.4;
  return `M${a.x + o()} ${a.y + o()}Q${c.x + o() * 2} ${c.y + o() * 2} ${b.x + o()} ${b.y + o()}`;
}

/** Tracé lissé d'un trait de crayon (points relatifs à ox, oy). */
export function strokePath(pts: [number, number][], ox: number, oy: number) {
  if (pts.length < 3) return pts.map((p, i) => `${i ? "L" : "M"}${p[0] + ox} ${p[1] + oy}`).join("");
  let d = `M${pts[0][0] + ox} ${pts[0][1] + oy}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2 + ox, my = (pts[i][1] + pts[i + 1][1]) / 2 + oy;
    d += `Q${pts[i][0] + ox} ${pts[i][1] + oy} ${mx} ${my}`;
  }
  const l = pts[pts.length - 1];
  return `${d}L${l[0] + ox} ${l[1] + oy}`;
}

/** Retire un élément et les flèches qui y sont reliées. */
export function withoutEl(els: BoardEl[], id: string) {
  return els.filter(
    (e) => e.id !== id && !(e.type === "arrow" && ((isBound(e.from) && e.from.id === id) || (isBound(e.to) && e.to.id === id))),
  );
}

/** Différence entre deux états : éléments à écrire et identifiants à supprimer. */
export function diff(before: Map<string, BoardEl>, after: Map<string, BoardEl>) {
  const upserts: BoardEl[] = [];
  const removed: string[] = [];
  for (const [id, e] of after) if (before.get(id) !== e) upserts.push(e);
  for (const id of before.keys()) if (!after.has(id)) removed.push(id);
  return { upserts, removed };
}
