"use client";

import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import {
  Hand,
  Minus,
  MousePointer2,
  MoveUpRight,
  Pencil,
  Plus,
  Redo2,
  Scan,
  Square,
  StickyNote,
  Type,
  Undo2,
} from "lucide-react";
import {
  BOARD_COLORS,
  COLOR_KEYS,
  arrowMid,
  arrowPts,
  bbox,
  bindable,
  boardBounds,
  center,
  clamp,
  diff,
  hasStyle,
  isBound,
  withoutEl,
  type ArrowEl,
  type BoardColor,
  type BoardEl,
  type Box,
  type LineStyle,
  type Point,
  type Sizes,
  type VerseEl,
} from "@/lib/board";
import type { BoardSync } from "@/lib/board-sync";
import type { HighlightKind } from "@/lib/highlights";
import { ArrowShape, NoteCard, RectShape, StrokeShape, TextCard, VerseCard, type VerseText } from "./BoardItems";

export type { VerseText };

/** Ce que la page de séance peut demander au tableau (boutons de la lecture). */
export type BoardHandle = {
  addVerse(ref: string, text: VerseText): void;
  addReflection(ref: string, text: VerseText): void;
};

export type SayAction = { label: string; run: () => void };

type Props = {
  ref?: React.Ref<BoardHandle>;
  sync: BoardSync | null;
  canEdit: boolean;
  me: { id: string };
  people: Record<string, string>;
  initial: BoardEl[];
  initialVerses: Record<string, VerseText>;
  highlights: Record<string, HighlightKind>;
  onShowVerse: (ref: string) => void;
  say: (msg: string, action?: SayAction) => void;
  /** Largeur cachée à gauche par le panneau de lecture, posé sur le tableau. */
  inset?: number;
  children?: React.ReactNode;
};

type Tool = "select" | "hand" | "pen" | "rect" | "arrow" | "note" | "text";
type Cam = { x: number; y: number; z: number };
type Drag =
  | { kind: "pan"; sx: number; sy: number; ox: number; oy: number }
  | { kind: "move"; id: string; start: Point; orig: BoardEl; moved: boolean }
  | { kind: "resize"; id: string; start: Point; ow: number; oh: number }
  | { kind: "bend"; id: string }
  | { kind: "pen"; id: string }
  | { kind: "rect"; id: string; sx: number; sy: number }
  | { kind: "arrow"; id: string; hover: string | null };
/** Un pas d'historique : pour chaque élément touché, son état avant et après (null = absent).
    Seuls les changements faits ici y entrent : annuler ne défait jamais le travail des autres. */
type Patch = Map<string, [BoardEl | null, BoardEl | null]>;

const TOOLS: { id: Tool; label: string; key: string; Icon: typeof Hand }[] = [
  { id: "select", label: "Sélection", key: "V", Icon: MousePointer2 },
  { id: "hand", label: "Main", key: "H", Icon: Hand },
  { id: "pen", label: "Crayon", key: "P", Icon: Pencil },
  { id: "rect", label: "Cadre", key: "R", Icon: Square },
  { id: "arrow", label: "Flèche", key: "A", Icon: MoveUpRight },
  { id: "note", label: "Note", key: "N", Icon: StickyNote },
  { id: "text", label: "Texte", key: "T", Icon: Type },
];

const HINTS: Record<Tool | "welcome", React.ReactNode> = {
  welcome: "Glisse un verset depuis la lecture sur le tableau, ou choisis un outil ci-dessous.",
  select: (
    <>
      <b>Sélection</b> · clique pour sélectionner, glisse pour déplacer. Glisser le fond déplace la vue.
    </>
  ),
  hand: (
    <>
      <b>Main</b> · glisse pour te déplacer. Ctrl + molette pour zoomer.
    </>
  ),
  pen: (
    <>
      <b>Crayon</b> · dessine librement, même sur les versets. Échap pour arrêter.
    </>
  ),
  rect: (
    <>
      <b>Cadre</b> · glisse pour entourer un groupe de versets.
    </>
  ),
  arrow: (
    <>
      <b>Flèche</b> · glisse d&apos;un élément à un autre pour les relier, puis tire le point du milieu pour la courber.
    </>
  ),
  note: (
    <>
      <b>Note</b> · clique où poser ta réflexion.
    </>
  ),
  text: (
    <>
      <b>Texte</b> · clique pour écrire un titre.
    </>
  ),
};

const DRAWING: Tool[] = ["pen", "rect", "arrow", "note", "text"];
const STAGE_CURSOR: Record<Tool, string> = {
  select: "cursor-default",
  hand: "cursor-grab",
  pen: "cursor-crosshair",
  rect: "cursor-crosshair",
  arrow: "cursor-crosshair",
  note: "cursor-copy",
  text: "cursor-copy",
};

const uid = () => crypto.randomUUID();
const isHtml = (e: BoardEl) => e.type === "verse" || e.type === "note" || e.type === "text";

/** Le tableau d'une séance : caméra, outils, historique, et enregistrement dans board_elements. */
export function Board({
  ref,
  sync,
  canEdit,
  me,
  people,
  initial,
  initialVerses,
  highlights,
  onShowVerse,
  say,
  inset = 0,
  children,
}: Props) {
  const [els, setEls] = useState(initial);
  const [sizes, setSizes] = useState<Sizes>({});
  const [cam, setCam] = useState<Cam>({ x: 0, y: 0, z: 1 });
  const [view, setView] = useState({ w: 0, h: 0 });
  const [tool, setToolState] = useState<Tool>("select");
  const [selId, setSelId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ kind: Drag["kind"]; hover: string | null } | null>(null);
  const [panning, setPanning] = useState(false);
  const [dropping, setDropping] = useState(false);
  const [color, setColor] = useState<BoardColor>("ink");
  const [noteColor, setNoteColor] = useState<BoardColor>("sand");
  const [lineStyle, setLineStyle] = useState<LineStyle>("clean");
  const [hint, setHint] = useState<React.ReactNode>(null);
  const [verses, setVerses] = useState(initialVerses);
  const [history, setHistory] = useState({ undo: 0, redo: 0 });

  const stageRef = useRef<HTMLElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const spaceDown = useRef(false);
  const fitted = useRef(false);
  const focusAfter = useRef<{ ids: string[]; readable: boolean } | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Enregistrement : `base` est l'état déjà envoyé. Les changements venus des autres membres sont
  // marqués (remoteObjs, remoteGone) pour n'être ni renvoyés ni ajoutés à l'historique.
  const base = useRef(new Map(initial.map((e) => [e.id, e])));
  const remoteObjs = useRef(new WeakSet<BoardEl>());
  const remoteGone = useRef(new Set<string>());
  const undoStack = useRef<Patch[]>([]);
  const redoStack = useRef<Patch[]>([]);
  const replaying = useRef<null | "undo" | "redo">(null);

  const byId = useMemo(() => new Map(els.map((e) => [e.id, e])), [els]);
  const sorted = useMemo(() => [...els].sort((a, b) => a.z - b.z), [els]);

  // Valeurs à jour pour les écouteurs posés une seule fois (clavier, molette).
  const latest = useRef({ els, byId, sizes, cam, view, inset, tool, selId, editingId });
  latest.current = { els, byId, sizes, cam, view, inset, tool, selId, editingId };

  /* ---------- Caméra ---------- */

  const toWorld = useCallback((cx: number, cy: number): Point => {
    const r = stageRef.current!.getBoundingClientRect();
    const c = latest.current.cam;
    return { x: (cx - r.left - c.x) / c.z, y: (cy - r.top - c.y) / c.z };
  }, []);

  const zoomAt = useCallback((px: number, py: number, nz: number) => {
    setCam((c) => {
      const z = clamp(nz, 0.2, 3);
      return { x: px - ((px - c.x) * z) / c.z, y: py - ((py - c.y) * z) / c.z, z };
    });
  }, []);

  // La partie visible du tableau commence après la lecture (inset) : on cadre et on centre dedans.
  const fitView = useCallback(() => {
    const { els, byId, sizes, view, inset } = latest.current;
    const vw = view.w - inset;
    if (vw <= 0) return;
    const b = boardBounds(els, byId, sizes);
    if (!b) return setCam({ x: inset + vw / 2, y: view.h / 2, z: 1 });
    const top = 66, bottom = 100, padX = 50;
    const z = clamp(Math.min((vw - padX * 2) / (b.w || 1), (view.h - top - bottom) / (b.h || 1)), 0.25, 1.1);
    setCam({ z, x: inset + (vw - b.w * z) / 2 - b.x * z, y: top + (view.h - top - bottom - b.h * z) / 2 - b.y * z });
  }, []);

  const centerOn = useCallback((b: Box, readable: boolean) => {
    const { view, cam, inset } = latest.current;
    const vw = view.w - inset;
    const z = readable ? clamp(Math.max(cam.z, 0.8), 0.2, Math.min(1, (vw - 40) / (b.w || 1))) : cam.z;
    const c = center(b);
    setCam({ z, x: inset + vw / 2 - c.x * z, y: view.h / 2 - c.y * z });
  }, []);

  const viewCenter = useCallback((): Point => {
    const { view, cam, inset } = latest.current;
    return { x: (inset + (view.w - inset) / 2 - cam.x) / cam.z, y: (view.h / 2 - cam.y) / cam.z };
  }, []);


  /* ---------- Mesure des éléments HTML (la hauteur dépend du texte) ---------- */

  const observer = useRef<ResizeObserver | null>(null);
  const measure = useCallback((node: HTMLElement | null) => {
    if (!node) return;
    observer.current ??= new ResizeObserver((entries) => {
      setSizes((s) => {
        let next = s;
        for (const en of entries) {
          const n = en.target as HTMLElement;
          const id = n.dataset.id!;
          const w = n.offsetWidth, h = n.offsetHeight;
          if (!w && !h) continue; // tableau masqué (téléphone) : on attend qu'il s'affiche
          if (s[id]?.w !== w || s[id]?.h !== h) next = { ...next, [id]: { w, h } };
        }
        return next;
      });
    });
    observer.current.observe(node);
    return () => observer.current?.unobserve(node);
  }, []);
  useEffect(() => () => observer.current?.disconnect(), []);

  useEffect(() => {
    const stage = stageRef.current!;
    const ro = new ResizeObserver(() => setView({ w: stage.clientWidth, h: stage.clientHeight }));
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  // Premier affichage (ou tableau affiché plus tard sur téléphone) : tout voir, une fois mesuré.
  useEffect(() => {
    if (fitted.current || view.w - inset <= 0) return;
    if (els.some((e) => isHtml(e) && !sizes[e.id])) return;
    fitted.current = true;
    fitView();
  }, [view, inset, sizes, els, fitView]);

  // Centrer sur un élément ajouté, dès qu'il est mesuré et que le tableau est visible.
  useEffect(() => {
    const f = focusAfter.current;
    if (!f || !view.w || f.ids.some((id) => byId.get(id) && isHtml(byId.get(id)!) && !sizes[id])) return;
    focusAfter.current = null;
    const b = boardBounds(f.ids.map((id) => byId.get(id)!).filter(Boolean), byId, sizes);
    if (b) centerOn(b, f.readable);
  }, [view, sizes, byId, centerOn]);

  /* ---------- Enregistrement et historique ---------- */

  const busy = !!drag || !!editingId;
  useEffect(() => {
    if (busy || !sync || !canEdit) return;
    const now = new Map(els.map((e) => [e.id, e]));
    const { upserts, removed } = diff(base.current, now);
    const patch: Patch = new Map();
    const up = upserts.filter((e) => !remoteObjs.current.has(e));
    const rm = removed.filter((id) => !remoteGone.current.delete(id));
    for (const e of up) patch.set(e.id, [base.current.get(e.id) ?? null, e]);
    for (const id of rm) patch.set(id, [base.current.get(id)!, null]);
    base.current = now;
    const mode = replaying.current;
    replaying.current = null;
    if (!patch.size) return;

    if (mode === "undo") redoStack.current.push(patch);
    else {
      undoStack.current.push(patch);
      if (undoStack.current.length > 100) undoStack.current.shift();
      if (!mode) redoStack.current = [];
    }
    setHistory({ undo: undoStack.current.length, redo: redoStack.current.length });

    sync.write(up, rm).then(async (ok) => {
      if (ok) return;
      say("Le tableau n'a pas été enregistré. Il revient à son dernier état enregistré.");
      const fresh = await sync.load();
      if (!fresh) return;
      const ids = new Set(fresh.map((e) => e.id));
      for (const e of fresh) remoteObjs.current.add(e);
      setEls((cur) => {
        for (const e of cur) if (!ids.has(e.id)) remoteGone.current.add(e.id);
        return fresh;
      });
      undoStack.current = [];
      redoStack.current = [];
      setHistory({ undo: 0, redo: 0 });
    });
  }, [els, busy, sync, canEdit, say]);

  // Changements des autres membres, en direct.
  useEffect(() => {
    if (!sync) return;
    return sync.subscribe({
      upsert(e) {
        remoteObjs.current.add(e);
        setEls((cur) => (cur.some((x) => x.id === e.id) ? cur.map((x) => (x.id === e.id ? e : x)) : [...cur, e]));
      },
      remove(id) {
        remoteGone.current.add(id);
        setEls((cur) => cur.filter((x) => x.id !== id));
        setSelId((s) => (s === id ? null : s));
      },
    });
  }, [sync]);

  const replay = useCallback((from: "undo" | "redo") => {
    const stack = from === "undo" ? undoStack.current : redoStack.current;
    const patch = stack.pop();
    if (!patch) return;
    replaying.current = from;
    setEls((cur) => {
      const m = new Map(cur.map((e) => [e.id, e]));
      // On remet toujours l'état « avant » : le pas que produit une annulation va dans « rétablir »,
      // et inversement, donc rétablir revient à annuler une annulation.
      for (const [id, [before]] of patch) {
        if (before) m.set(id, { ...before }); // copie : un état venu d'un autre membre doit être renvoyé
        else m.delete(id);
      }
      return [...m.values()];
    });
    setSelId((s) => (s && patch.get(s)?.[0] === null ? null : s));
  }, []);

  // Textes des versets posés par d'autres membres (servis par l'app, depuis les données locales).
  useEffect(() => {
    const missing = [...new Set(els.flatMap((e) => (e.type === "verse" && !verses[e.ref] ? [e.ref] : [])))];
    if (!missing.length) return;
    let live = true;
    Promise.all(
      missing.map((ref) =>
        fetch(`/api/verset?ref=${ref}`)
          .then((r) => (r.ok ? r.json() : null))
          .then((v: { ref: string; surah: string; ar: string; fr: string } | null) =>
            v ? ([ref, { label: `${v.surah} · ${v.ref}`, ar: v.ar, fr: v.fr }] as const) : null,
          )
          .catch(() => null),
      ),
    ).then((found) => {
      if (!live) return;
      const add = Object.fromEntries(found.filter((f) => !!f));
      if (Object.keys(add).length) setVerses((v) => ({ ...v, ...add }));
    });
    return () => {
      live = false;
    };
  }, [els, verses]);

  /* ---------- Actions ---------- */

  const nextZ = () => latest.current.els.reduce((m, e) => Math.max(m, e.z), 0) + 1;
  const update = (id: string, fn: (e: BoardEl) => BoardEl) => setEls((cur) => cur.map((e) => (e.id === id ? fn(e) : e)));

  const flashHint = useCallback((key: Tool | "welcome", ms = 3800) => {
    setHint(HINTS[key]);
    clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(null), ms);
  }, []);

  const setTool = useCallback(
    (t: Tool, quiet = false) => {
      if (latest.current.tool !== t && !quiet) flashHint(t);
      setToolState(t);
      if (t !== "select") setSelId(null);
    },
    [flashHint],
  );

  useEffect(() => {
    if (canEdit) flashHint("welcome", 6000);
    return () => clearTimeout(hintTimer.current);
  }, [canEdit, flashHint]);

  function startEdit(id: string) {
    setSelId(id);
    setEditingId(id);
  }

  const endEdit = useCallback((id: string, text: string) => {
    setEls((cur) => {
      const e = cur.find((x) => x.id === id);
      if (!e || (e.type !== "note" && e.type !== "text")) return cur;
      if (!text) return withoutEl(cur, id);
      return text === e.text ? cur : cur.map((x) => (x.id === id ? { ...e, text } : x));
    });
    setEditingId(null);
    if (!text) setSelId((s) => (s === id ? null : s));
  }, []);

  function remove(id: string) {
    setEls((cur) => withoutEl(cur, id));
    setSelId(null);
    say("Élément supprimé", { label: "Annuler", run: () => replay("undo") });
  }

  function duplicate(e: BoardEl) {
    if (e.type === "arrow" || e.type === "verse") return;
    const copy: BoardEl = { ...e, id: uid(), z: nextZ(), x: e.x + 28, y: e.y + 28 };
    setEls((cur) => [...cur, copy]);
    setSelId(copy.id);
  }

  function newNote(at: Point, edit = true) {
    const n: BoardEl = {
      id: uid(),
      type: "note",
      z: nextZ(),
      x: at.x - 20,
      y: at.y - 20,
      w: 260,
      text: "",
      color: noteColor,
      style: lineStyle,
      by: me.id,
    };
    setEls((cur) => [...cur, n]);
    if (edit) startEdit(n.id);
    return n;
  }

  /** Pose la carte d'un verset (ou retrouve celle qui y est déjà). */
  function placeVerse(ref: string, text: VerseText, at: Point | null, quiet: boolean) {
    setVerses((v) => (v[ref] ? v : { ...v, [ref]: text }));
    const existing = latest.current.els.find((e): e is VerseEl => e.type === "verse" && e.ref === ref);
    if (existing) {
      if (!quiet) {
        setSelId(existing.id);
        focusAfter.current = { ids: [existing.id], readable: true };
        setEls((cur) => [...cur]); // relance le centrage
        say(`${ref} est déjà sur le tableau`);
      }
      return existing;
    }
    const p = at ?? viewCenter();
    const card: VerseEl = { id: uid(), type: "verse", z: nextZ(), ref, x: p.x - 170, y: p.y - 60, w: 340 };
    setEls((cur) => [...cur, card]);
    if (!quiet) {
      setSelId(card.id);
      focusAfter.current = { ids: [card.id], readable: true };
      say(`Verset ${ref} ajouté au tableau`);
    }
    return card;
  }

  /** Réflexion : la carte du verset, une note à côté et une flèche qui les relie. */
  function reflect(ref: string, text: VerseText) {
    const card = placeVerse(ref, text, null, true);
    const b = bbox(card, latest.current.byId, latest.current.sizes) ?? { x: card.x, y: card.y, w: 340, h: 140 };
    const note: BoardEl = {
      id: uid(),
      type: "note",
      z: nextZ() + 1,
      x: b.x + b.w + 70,
      y: b.y,
      w: 260,
      text: "",
      color: noteColor,
      style: lineStyle,
      by: me.id,
    };
    const arrow: BoardEl = {
      id: uid(),
      type: "arrow",
      z: nextZ() + 2,
      from: { id: card.id },
      to: { id: note.id },
      bend: 0,
      color: noteColor,
      style: lineStyle,
    };
    setEls((cur) => [...cur, note, arrow]);
    setToolState("select");
    focusAfter.current = { ids: [card.id, note.id], readable: true };
    startEdit(note.id);
  }

  useImperativeHandle(ref, () => ({
    addVerse: (r, t) => placeVerse(r, t, null, false),
    addReflection: reflect,
  }));

  /* ---------- Pointeur ---------- */

  const hitId = (n: Element | null) => n?.closest("[data-id]")?.getAttribute("data-id") ?? null;

  function onPointerDown(e: React.PointerEvent<HTMLElement>) {
    const target = e.target as Element;
    if (target.closest("[data-board-ui]")) return;
    if (editingId) {
      if (target.closest("[contenteditable]")) return;
      (document.activeElement as HTMLElement | null)?.blur();
    }
    const w = toWorld(e.clientX, e.clientY);
    const tid = hitId(target);
    e.currentTarget.setPointerCapture(e.pointerId);
    // Pas de sélection de texte ni de perte du focus : sinon une note tout juste créée serait refermée.
    e.preventDefault();

    const pan = () => {
      dragRef.current = { kind: "pan", sx: e.clientX, sy: e.clientY, ox: cam.x, oy: cam.y };
      setDrag({ kind: "pan", hover: null });
      setPanning(true);
    };
    if (e.button === 1 || tool === "hand" || spaceDown.current || !canEdit) return pan();
    if (e.button !== 0) return;

    if (tool === "select") {
      if (target.closest("[data-bend]") && selId) {
        dragRef.current = { kind: "bend", id: selId };
        setDrag({ kind: "bend", hover: null });
      } else if (target.closest("[data-handle]") && selId) {
        const t = byId.get(selId)!;
        const b = bbox(t, byId, sizes)!;
        dragRef.current = { kind: "resize", id: selId, start: w, ow: t.type === "rect" ? t.w : b.w, oh: b.h };
        setDrag({ kind: "resize", hover: null });
      } else if (tid && byId.has(tid)) {
        setSelId(tid);
        dragRef.current = { kind: "move", id: tid, start: w, orig: byId.get(tid)!, moved: false };
      } else {
        setSelId(null);
        pan();
      }
      return;
    }

    if (tool === "note" || tool === "text") {
      if (tool === "note") newNote(w);
      else {
        const t: BoardEl = { id: uid(), type: "text", z: nextZ(), x: w.x, y: w.y - 14, w: 320, text: "", color, style: lineStyle, size: "md" };
        setEls((cur) => [...cur, t]);
        startEdit(t.id);
      }
      setTool("select", true);
      return;
    }

    setHint(null);
    const id = uid();
    if (tool === "pen") {
      setEls((cur) => [...cur, { id, type: "stroke", z: nextZ(), x: w.x, y: w.y, points: [[0, 0]], color }]);
      dragRef.current = { kind: "pen", id };
    }
    if (tool === "rect") {
      setEls((cur) => [...cur, { id, type: "rect", z: nextZ(), x: w.x, y: w.y, w: 0, h: 0, color, style: lineStyle }]);
      dragRef.current = { kind: "rect", id, sx: w.x, sy: w.y };
    }
    if (tool === "arrow") {
      const from = tid && bindable(byId.get(tid)) ? { id: tid } : w;
      setEls((cur) => [...cur, { id, type: "arrow", z: nextZ(), from, to: w, bend: 0, color, style: lineStyle }]);
      dragRef.current = { kind: "arrow", id, hover: null };
    }
    setDrag({ kind: dragRef.current!.kind, hover: null });
  }

  function onPointerMove(e: React.PointerEvent<HTMLElement>) {
    const d = dragRef.current;
    if (!d) return;
    if (d.kind === "pan") {
      setCam((c) => ({ ...c, x: d.ox + e.clientX - d.sx, y: d.oy + e.clientY - d.sy }));
      return;
    }
    const w = toWorld(e.clientX, e.clientY);
    switch (d.kind) {
      case "move": {
        const dx = w.x - d.start.x, dy = w.y - d.start.y;
        if (!d.moved) {
          if (Math.hypot(dx, dy) * cam.z < 3) return;
          d.moved = true;
          setDrag({ kind: "move", hover: null });
        }
        const o = d.orig;
        update(d.id, () => {
          if (o.type === "arrow")
            return {
              ...o,
              from: isBound(o.from) ? o.from : { x: o.from.x + dx, y: o.from.y + dy },
              to: isBound(o.to) ? o.to : { x: o.to.x + dx, y: o.to.y + dy },
            };
          return { ...o, x: o.x + dx, y: o.y + dy };
        });
        break;
      }
      case "resize": {
        const dx = w.x - d.start.x, dy = w.y - d.start.y;
        update(d.id, (t) =>
          t.type === "rect"
            ? { ...t, w: Math.max(30, d.ow + dx), h: Math.max(30, d.oh + dy) }
            : "w" in t
              ? { ...t, w: Math.max(180, d.ow + dx) }
              : t,
        );
        break;
      }
      case "bend":
        update(d.id, (t) => {
          if (t.type !== "arrow") return t;
          const p = arrowPts({ ...t, bend: 0 }, byId, sizes);
          if (!p) return t;
          const m = { x: (p.p1.x + p.p2.x) / 2, y: (p.p1.y + p.p2.y) / 2 };
          const b = Math.round((w.x - m.x) * p.n.x + (w.y - m.y) * p.n.y);
          return { ...t, bend: Math.abs(b) < 6 ? 0 : b };
        });
        break;
      case "pen":
        update(d.id, (t) => {
          if (t.type !== "stroke") return t;
          const l = t.points[t.points.length - 1];
          const p: [number, number] = [w.x - t.x, w.y - t.y];
          return Math.hypot(p[0] - l[0], p[1] - l[1]) > 1.5 / cam.z ? { ...t, points: [...t.points, p] } : t;
        });
        break;
      case "rect":
        update(d.id, (t) => ({
          ...t,
          x: Math.min(d.sx, w.x),
          y: Math.min(d.sy, w.y),
          w: Math.abs(w.x - d.sx),
          h: Math.abs(w.y - d.sy),
        }));
        break;
      case "arrow": {
        const a = byId.get(d.id) as ArrowEl | undefined;
        let hover: string | null = null;
        for (const n of document.elementsFromPoint(e.clientX, e.clientY)) {
          const id = hitId(n);
          if (id && id !== d.id && !(a && isBound(a.from) && a.from.id === id) && bindable(byId.get(id))) {
            hover = id;
            break;
          }
        }
        d.hover = hover;
        setDrag({ kind: "arrow", hover });
        update(d.id, (t) => (t.type === "arrow" ? { ...t, to: w } : t));
        break;
      }
    }
  }

  function onPointerUp() {
    const d = dragRef.current;
    dragRef.current = null;
    setPanning(false);
    if (!d) return;
    if (d.kind === "pen" || d.kind === "rect" || d.kind === "arrow") {
      setEls((cur) => {
        const t = cur.find((x) => x.id === d.id);
        if (!t) return cur;
        if (t.type === "stroke" && t.points.length < 2) return cur.filter((x) => x !== t);
        if (t.type === "rect" && (t.w < 8 || t.h < 8)) return cur.filter((x) => x !== t);
        if (t.type === "arrow") {
          const done: ArrowEl = d.kind === "arrow" && d.hover ? { ...t, to: { id: d.hover } } : t;
          const m = new Map(cur.map((x) => [x.id, x]));
          const p = arrowPts(done, m, sizes);
          if (!p || Math.hypot(p.p2.x - p.p1.x, p.p2.y - p.p1.y) < 12) return cur.filter((x) => x !== t);
          return cur.map((x) => (x === t ? done : x));
        }
        return cur;
      });
      if (d.kind !== "pen") {
        setToolState("select");
        setSelId(d.id);
      }
    }
    setDrag(null);
  }

  function onDoubleClick(e: React.MouseEvent<HTMLElement>) {
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || target.closest("[data-board-ui]")) return;
    const t = byId.get(hitId(target) ?? "");
    if (t?.type === "verse") return onShowVerse(t.ref);
    if (!canEdit) return;
    if (t && (t.type === "note" || t.type === "text")) return startEdit(t.id);
    if (!t && tool === "select") newNote(toWorld(e.clientX, e.clientY));
  }

  // Molette : déplacer la vue ; Ctrl ou Cmd + molette (ou pincer sur le pavé tactile) : zoomer.
  useEffect(() => {
    const stage = stageRef.current!;
    const onWheel = (e: WheelEvent) => {
      if ((e.target as Element).closest("[data-board-ui]")) return;
      e.preventDefault();
      const r = stage.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) zoomAt(e.clientX - r.left, e.clientY - r.top, latest.current.cam.z * Math.exp(-e.deltaY * 0.01));
      else setCam((c) => ({ ...c, x: c.x - e.deltaX, y: c.y - e.deltaY }));
    };
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  /* ---------- Clavier ---------- */

  const keyActions = useRef({ remove, startEdit, setTool, replay });
  keyActions.current = { remove, startEdit, setTool, replay };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tg = e.target as HTMLElement;
      if (tg.closest?.("input, textarea, select, [contenteditable], dialog")) return;
      const L = latest.current;
      const A = keyActions.current;
      const onBoard = tg === document.body || !!tg.closest?.("[data-board]");
      if (e.key === "Escape") {
        if (canEdit && L.tool !== "select") A.setTool("select", true);
        else if (L.selId) setSelId(null);
        else return;
        e.stopImmediatePropagation(); // la page de séance n'a pas à fermer autre chose
        return;
      }
      if (!canEdit) return;
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && (k === "z" || k === "y")) {
        e.preventDefault();
        A.replay(k === "y" || e.shiftKey ? "redo" : "undo");
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = TOOLS.find((x) => x.key.toLowerCase() === k);
      if (t) return A.setTool(t.id);
      if (!onBoard) return; // Espace, Entrée et Suppr gardent leur rôle ailleurs (boutons, versets)
      if (e.key === " ") {
        e.preventDefault();
        spaceDown.current = true;
        setPanning(true);
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && L.selId) {
        e.preventDefault();
        A.remove(L.selId);
        return;
      }
      if (e.key === "Enter" && L.selId) {
        const el = L.byId.get(L.selId);
        if (el && (el.type === "note" || el.type === "text")) {
          e.preventDefault();
          A.startEdit(el.id);
        }
        return;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== " ") return;
      spaceDown.current = false;
      if (!dragRef.current) setPanning(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [canEdit]);

  /* ---------- Glisser un verset depuis la lecture ---------- */

  function onDragOver(e: React.DragEvent) {
    if (!canEdit || !e.dataTransfer.types.includes("text/x-verse")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDropping(true);
  }

  function onDrop(e: React.DragEvent) {
    setDropping(false);
    const raw = e.dataTransfer.getData("text/x-verse");
    if (!raw || !canEdit) return;
    e.preventDefault();
    try {
      const v = JSON.parse(raw) as VerseText & { ref: string };
      const w = toWorld(e.clientX, e.clientY);
      placeVerse(v.ref, { label: v.label, ar: v.ar, fr: v.fr }, { x: w.x, y: w.y + 40 }, false);
    } catch {
      /* contenu glissé d'ailleurs : ignoré */
    }
  }

  /* ---------- Rendu ---------- */

  const iz = 1 / cam.z;
  const sel = selId ? byId.get(selId) : undefined;
  const selBox = sel ? bbox(sel, byId, sizes) : null;
  const drawingDrag = drag && ["pen", "rect", "arrow"].includes(drag.kind);
  const hoverBox = drag?.hover ? bbox(byId.get(drag.hover), byId, sizes) : null;

  const forSel = !!sel && sel.type !== "verse";
  const showPalette = canEdit && (forSel || DRAWING.includes(tool));
  const activeColor = forSel ? (sel as { color: BoardColor }).color : tool === "note" ? noteColor : color;
  const styleShown = forSel ? hasStyle(sel.type) : hasStyle(tool);
  const activeStyle = forSel && "style" in sel ? sel.style : lineStyle;

  function pickColor(c: BoardColor) {
    if (forSel) {
      update(sel.id, (t) => ("color" in t ? { ...t, color: c } : t));
      if (sel.type === "note") setNoteColor(c);
      else setColor(c);
    } else if (tool === "note") setNoteColor(c);
    else setColor(c);
  }

  function pickStyle(s: LineStyle) {
    setLineStyle(s);
    if (forSel && hasStyle(sel.type)) update(sel.id, (t) => ("style" in t ? { ...t, style: s } : t));
  }

  const showSelTools = canEdit && sel && selBox && !drag && !editingId;
  const selTop = selBox ? cam.y + selBox.y * cam.z - 12 : 0;
  const selBelow = selTop < 56;

  return (
    <section
      ref={stageRef}
      data-board
      data-tool={canEdit ? tool : "view"}
      aria-label="Tableau"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick}
      onDragOver={onDragOver}
      onDragLeave={() => setDropping(false)}
      onDrop={onDrop}
      style={{ backgroundSize: `${24 * cam.z}px ${24 * cam.z}px`, backgroundPosition: `${cam.x}px ${cam.y}px` }}
      className={`board-stage relative size-full touch-none overflow-hidden bg-bg bg-[radial-gradient(var(--grid)_1.1px,transparent_1.2px)] select-none ${
        panning ? "cursor-grabbing" : canEdit ? STAGE_CURSOR[tool] : "cursor-grab"
      } ${dropping ? "shadow-[inset_0_0_0_3px_var(--accent)]" : ""}`}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.z})` }}
      >
        <svg className="pointer-events-none absolute top-0 left-0 overflow-visible" width="1" height="1" aria-hidden>
          {sorted.map((e) => {
            if (e.type === "rect") return <RectShape key={e.id} el={e} iz={iz} />;
            if (e.type === "arrow") {
              const geo = arrowPts(e, byId, sizes);
              return geo ? <ArrowShape key={e.id} el={e} geo={geo} iz={iz} /> : null;
            }
            return null;
          })}
        </svg>

        {sorted.map((e) => {
          if (e.type === "verse")
            return <VerseCard key={e.id} el={e} text={verses[e.ref]} highlight={highlights[e.ref]} measure={measure} />;
          if (e.type === "note")
            return (
              <NoteCard
                key={e.id}
                el={e}
                author={e.by === me.id ? "Toi" : (e.by && people[e.by]) || "Membre"}
                measure={measure}
                editing={editingId === e.id}
                onEditEnd={endEdit}
              />
            );
          if (e.type === "text")
            return <TextCard key={e.id} el={e} measure={measure} editing={editingId === e.id} onEditEnd={endEdit} />;
          return null;
        })}

        <svg className="pointer-events-none absolute top-0 left-0 overflow-visible" width="1" height="1" aria-hidden>
          {sorted.map((e) => (e.type === "stroke" ? <StrokeShape key={e.id} el={e} iz={iz} /> : null))}
          {sel && selBox && !drawingDrag && (
            <>
              <rect
                x={selBox.x - 6 * iz}
                y={selBox.y - 6 * iz}
                width={selBox.w + 12 * iz}
                height={selBox.h + 12 * iz}
                rx={8 * iz}
                className="fill-none stroke-accent"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                vectorEffect="non-scaling-stroke"
              />
              {canEdit && ["verse", "note", "text", "rect"].includes(sel.type) && (
                <rect
                  data-handle
                  x={selBox.x + selBox.w + 6 * iz - 5.5 * iz}
                  y={selBox.y + selBox.h + 6 * iz - 5.5 * iz}
                  width={11 * iz}
                  height={11 * iz}
                  rx={2 * iz}
                  strokeWidth={1.6 * iz}
                  className="pointer-events-auto cursor-nwse-resize fill-surface stroke-accent"
                >
                  <title>Tire pour redimensionner</title>
                </rect>
              )}
              {canEdit &&
                sel.type === "arrow" &&
                (() => {
                  const geo = arrowPts(sel, byId, sizes);
                  if (!geo) return null;
                  const m = arrowMid(geo);
                  return (
                    <circle
                      data-bend
                      cx={m.x}
                      cy={m.y}
                      r={7 * iz}
                      strokeWidth={2 * iz}
                      className="pointer-events-auto cursor-grab fill-surface stroke-accent"
                    >
                      <title>Tire pour courber la flèche</title>
                    </circle>
                  );
                })()}
            </>
          )}
          {hoverBox && (
            <rect
              x={hoverBox.x - 5 * iz}
              y={hoverBox.y - 5 * iz}
              width={hoverBox.w + 10 * iz}
              height={hoverBox.h + 10 * iz}
              rx={10 * iz}
              className="fill-none stroke-accent"
              strokeWidth={2.5}
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
      </div>

      {!els.length && (
        <div
          style={{ left: inset }}
          className="pointer-events-none absolute inset-y-0 right-0 grid place-items-center p-6 text-center text-muted"
        >
          <div>
            <b className="mb-1 block text-base text-ink">Le tableau est vide</b>
            {canEdit
              ? "Glisse un verset depuis la lecture, ou choisis un outil en bas."
              : "Les membres qui peuvent modifier y poseront des versets et des notes."}
          </div>
        </div>
      )}

      {children}

      <div
        data-board-ui
        className="absolute top-3.5 right-3.5 z-10 flex gap-0.5 rounded-[11px] border border-line bg-surface p-[3px] text-[12.5px] font-semibold shadow-card"
      >
        {canEdit && (
          <>
            <CornerButton label="Annuler" title="Annuler (Ctrl+Z)" disabled={!history.undo} onClick={() => replay("undo")}>
              <Undo2 aria-hidden className="size-4" />
            </CornerButton>
            <CornerButton label="Rétablir" title="Rétablir (Ctrl+Maj+Z)" disabled={!history.redo} onClick={() => replay("redo")}>
              <Redo2 aria-hidden className="size-4" />
            </CornerButton>
            <span aria-hidden className="mx-[3px] my-1 w-px bg-line" />
          </>
        )}
        <CornerButton label="Dézoomer" title="Dézoomer" onClick={() => zoomAt(inset + (view.w - inset) / 2, view.h / 2, cam.z / 1.2)}>
          <Minus aria-hidden className="size-4" />
        </CornerButton>
        <button
          type="button"
          title="Revenir à 100 %"
          onClick={() => zoomAt(inset + (view.w - inset) / 2, view.h / 2, 1)}
          className="min-w-[52px] rounded-lg px-2 py-[5px] tabular-nums hover:bg-surface-2"
        >
          {Math.round(cam.z * 100)} %
        </button>
        <CornerButton label="Zoomer" title="Zoomer" onClick={() => zoomAt(inset + (view.w - inset) / 2, view.h / 2, cam.z * 1.2)}>
          <Plus aria-hidden className="size-4" />
        </CornerButton>
        <button
          type="button"
          title="Tout afficher"
          onClick={fitView}
          className="flex items-center gap-1.5 rounded-lg px-2 py-[5px] hover:bg-surface-2"
        >
          <Scan aria-hidden className="size-4" />
          <span className="max-sm:sr-only">Tout voir</span>
        </button>
      </div>

      {showSelTools && (
        <div
          data-board-ui
          role="toolbar"
          aria-label="Actions sur l'élément"
          style={{
            left: clamp(cam.x + (selBox.x + selBox.w / 2) * cam.z, inset + 120, view.w - 120),
            top: selBelow ? cam.y + (selBox.y + selBox.h) * cam.z + 12 : selTop,
          }}
          className={`absolute z-20 flex w-max max-w-[calc(100%-16px)] -translate-x-1/2 flex-wrap justify-center gap-0.5 rounded-[10px] bg-ink p-[3px] text-bg shadow-card ${
            selBelow ? "" : "-translate-y-full"
          }`}
        >
          {sel.type === "verse" && (
            <>
              <SelButton onClick={() => onShowVerse(sel.ref)}>Voir le texte</SelButton>
              <SelButton onClick={() => reflect(sel.ref, verses[sel.ref] ?? { label: sel.ref, ar: "", fr: "" })}>
                Réflexion
              </SelButton>
            </>
          )}
          {(sel.type === "note" || sel.type === "text") && <SelButton onClick={() => startEdit(sel.id)}>Écrire</SelButton>}
          {sel.type === "arrow" && !!sel.bend && <SelButton onClick={() => update(sel.id, (t) => ({ ...t, bend: 0 }))}>Redresser</SelButton>}
          {sel.type !== "arrow" && sel.type !== "verse" && <SelButton onClick={() => duplicate(sel)}>Dupliquer</SelButton>}
          <SelButton danger onClick={() => remove(sel.id)}>
            Supprimer
          </SelButton>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-3 bottom-[calc(14px+env(safe-area-inset-bottom,0px))] z-10 flex flex-col items-center gap-2 *:pointer-events-auto">
        {hint && (
          <div
            role="status"
            data-board-ui
            className="max-w-[440px] rounded-[10px] bg-ink px-3 py-[7px] text-center text-[12.5px] leading-[1.45] text-bg shadow-card"
          >
            {hint}
          </div>
        )}
        {showPalette && (
          <div data-board-ui className="flex flex-wrap items-center justify-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-[5px] shadow-card">
            <small className="mr-0.5 text-[11px] font-semibold text-muted">{forSel ? "Couleur de l'élément" : "Couleur"}</small>
            {COLOR_KEYS.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={activeColor === c}
                aria-label={`Couleur ${BOARD_COLORS[c].label}`}
                title={BOARD_COLORS[c].label}
                onClick={() => pickColor(c)}
                className={`size-5 rounded-full border-2 border-surface ${BOARD_COLORS[c].dot} ${
                  activeColor === c ? "ring-2 ring-ink" : "ring-1 ring-line"
                }`}
              />
            ))}
            {styleShown && (
              <>
                <span aria-hidden className="mx-1 w-px self-stretch bg-line" />
                <small className="text-[11px] font-semibold text-muted">Style</small>
                <div role="group" aria-label="Style du trait" className="flex rounded-full bg-surface-2 p-0.5">
                  {(["clean", "hand"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={activeStyle === s}
                      onClick={() => pickStyle(s)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        activeStyle === s ? "bg-surface text-ink shadow-card" : "text-muted"
                      }`}
                    >
                      {s === "clean" ? "Net" : "Main levée"}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        {canEdit ? (
          <div
            role="toolbar"
            data-board-ui
            aria-label="Outils du tableau"
            className="flex max-w-full items-stretch gap-0.5 overflow-x-auto rounded-[14px] border border-line bg-surface p-1 shadow-card"
          >
            {TOOLS.map(({ id, label, key, Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={tool === id}
                title={`${label} (${key})`}
                onClick={() => setTool(id)}
                className={`flex min-w-[46px] flex-col items-center gap-px rounded-[10px] px-1.5 pt-1.5 pb-1 text-[10.5px] font-semibold sm:min-w-[52px] sm:px-2 ${
                  tool === id ? "bg-accent text-accent-ink" : "text-muted hover:bg-surface-2"
                } ${id === "pen" ? "ml-1.5 border-l border-line sm:ml-2" : ""}`}
              >
                <Icon aria-hidden className={`size-[19px] ${tool === id ? "" : "text-ink"}`} strokeWidth={1.8} />
                {label}
              </button>
            ))}
          </div>
        ) : (
          <div data-board-ui className="rounded-full border border-line bg-surface px-3 py-1.5 text-center text-[12.5px] text-muted shadow-card">
            Lecture seule : tu peux regarder le tableau et t&apos;y déplacer.
          </div>
        )}
      </div>
    </section>
  );
}

function CornerButton({
  label,
  title,
  disabled,
  onClick,
  children,
}: {
  label: string;
  title: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="grid place-items-center rounded-lg px-2 py-[5px] hover:bg-surface-2 disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function SelButton({ danger, onClick, children }: { danger?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[7px] px-2.5 py-1.5 text-[12.5px] font-semibold whitespace-nowrap hover:bg-bg/20 ${danger ? "text-c-rose" : ""}`}
    >
      {children}
    </button>
  );
}

