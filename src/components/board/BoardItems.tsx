"use client";

import { memo, useLayoutEffect, useRef } from "react";
import {
  BOARD_COLORS,
  rng,
  sketchLine,
  sketchQuad,
  strokePath,
  type ArrowEl,
  type ArrowGeometry,
  type NoteEl,
  type RectEl,
  type StrokeEl,
  type TextEl,
  type VerseEl,
} from "@/lib/board";
import { personTone, toneClass } from "@/lib/circles";
import { HIGHLIGHTS, type HighlightKind } from "@/lib/highlights";

export type VerseText = { label: string; ar: string; fr: string; wo?: string };

type Measure = (node: HTMLElement | null) => void;
type EditProps = { editing: boolean; onEditEnd: (id: string, text: string) => void };

/** Texte d'une note ou d'un titre : affiché, ou modifiable sur place pendant l'écriture. */
function EditableText({
  id,
  text,
  editing,
  placeholder,
  label,
  onEditEnd,
}: EditProps & { id: string; text: string; placeholder: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const n = ref.current;
    if (!editing || !n) return;
    n.textContent = text;
    n.focus({ preventScroll: true });
    const range = document.createRange();
    range.selectNodeContents(n);
    range.collapse(false);
    const sel = getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, [editing, text]);

  const cls = "board-editable min-h-[1.5em] break-words whitespace-pre-wrap";
  if (!editing)
    return (
      <div key="lecture" className={cls} data-ph={placeholder}>
        {text}
      </div>
    );
  return (
    <div
      key="ecriture"
      ref={ref}
      role="textbox"
      aria-multiline
      aria-label={label}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      data-ph={placeholder}
      className={`${cls} cursor-text outline-none select-text`}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape" || (e.key === "Enter" && (e.metaKey || e.ctrlKey))) {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      onBlur={(e) => onEditEnd(id, e.currentTarget.innerText.replace(/\n+$/, "").trim())}
    />
  );
}

const place = (e: { x: number; y: number; w: number }) => ({ left: e.x, top: e.y, width: e.w });

export const VerseCard = memo(function VerseCard({
  el,
  text,
  highlight,
  measure,
}: {
  el: VerseEl;
  text: VerseText | undefined;
  highlight: HighlightKind | undefined;
  measure: Measure;
}) {
  return (
    <div
      ref={measure}
      data-id={el.id}
      style={place(el)}
      className={`absolute rounded-xl border border-t-4 border-line bg-surface px-3.5 pt-2.5 pb-3 shadow-card ${
        highlight ? HIGHLIGHTS[highlight].bar : ""
      }`}
    >
      <div className="text-[11.5px] font-bold tracking-[0.03em] text-muted">{text?.label ?? el.ref}</div>
      {text ? (
        <>
          <p className="my-1 text-right font-ar text-2xl leading-[1.9]" lang="ar" dir="rtl">
            {text.ar}
          </p>
          <p className="font-read text-[15.5px] leading-[1.45]">{text.fr}</p>
          {text.wo && (
            <p className="mt-1 font-read text-[15.5px] leading-[1.45] text-accent" lang="wo">
              {text.wo}
            </p>
          )}
        </>
      ) : (
        <p className="py-3 text-muted">Chargement du verset…</p>
      )}
    </div>
  );
});

export const NoteCard = memo(function NoteCard({
  el,
  author,
  measure,
  editing,
  onEditEnd,
}: EditProps & { el: NoteEl; author: string; measure: Measure }) {
  const hand = el.style === "hand";
  return (
    <div
      ref={measure}
      data-id={el.id}
      style={place(el)}
      className={`absolute rounded-[4px_4px_14px_4px] border border-ink/8 px-3.5 pt-3 pb-2.5 shadow-card ${BOARD_COLORS[el.color].note} ${
        hand ? "font-hand text-[22px] leading-[1.2] font-medium" : "font-read text-[16.5px] leading-[1.45]"
      }`}
    >
      <EditableText
        id={el.id}
        text={el.text}
        editing={editing}
        placeholder="Écris ta réflexion…"
        label="Texte de la note"
        onEditEnd={onEditEnd}
      />
      <div className={`flex items-center gap-1.5 font-ui text-[11.5px] font-semibold text-muted ${hand ? "mt-1.5" : "mt-2"}`}>
        {el.by && <i className={`${toneClass(personTone(el.by))} size-2 rounded-full bg-(--tone)`} />}
        {author}
      </div>
    </div>
  );
});

export const TextCard = memo(function TextCard({
  el,
  measure,
  editing,
  onEditEnd,
}: EditProps & { el: TextEl; measure: Measure }) {
  const lg = el.size === "lg";
  const size =
    el.style === "hand"
      ? `font-hand ${lg ? "text-[38px]" : "text-[26px]"}`
      : lg
        ? "text-[28px] tracking-[-0.01em]"
        : "text-lg";
  return (
    <div
      ref={measure}
      data-id={el.id}
      style={place(el)}
      className={`absolute px-1 py-0.5 leading-tight font-bold ${BOARD_COLORS[el.color].text} ${size}`}
    >
      <EditableText
        id={el.id}
        text={el.text}
        editing={editing}
        placeholder="Titre…"
        label="Texte du titre"
        onEditEnd={onEditEnd}
      />
    </div>
  );
});

/* ---------- Formes SVG (iz = 1 / zoom, pour garder des zones de clic constantes à l'écran) ---------- */

export function RectShape({ el, iz }: { el: RectEl; iz: number }) {
  const x = Math.min(el.x, el.x + el.w), y = Math.min(el.y, el.y + el.h);
  const w = Math.abs(el.w), h = Math.abs(el.h);
  const color = BOARD_COLORS[el.color].stroke;
  let body;
  if (el.style === "hand") {
    const r = rng(el.id);
    const P = [
      { x, y },
      { x: x + w, y },
      { x: x + w, y: y + h },
      { x, y: y + h },
    ];
    let d = "";
    for (let k = 0; k < 2; k++) for (let i = 0; i < 4; i++) d += sketchLine(P[i], P[(i + 1) % 4], r);
    body = <path d={d} fill="none" className={color} strokeWidth={1.7} strokeLinecap="round" />;
  } else
    body = <rect x={x} y={y} width={w} height={h} rx={14} fill="none" className={color} strokeWidth={2} strokeDasharray="8 6" />;
  return (
    <g data-id={el.id}>
      <rect className="board-hit" x={x} y={y} width={w} height={h} rx={14} strokeWidth={14 * iz} />
      {body}
    </g>
  );
}

export function ArrowShape({ el, geo, iz }: { el: ArrowEl; geo: ArrowGeometry; iz: number }) {
  const { p1, p2, c } = geo;
  const color = BOARD_COLORS[el.color].stroke;
  const an = Math.atan2(p2.y - c.y, p2.x - c.x), L = 13;
  const h1 = { x: p2.x - L * Math.cos(an - 0.42), y: p2.y - L * Math.sin(an - 0.42) };
  const h2 = { x: p2.x - L * Math.cos(an + 0.42), y: p2.y - L * Math.sin(an + 0.42) };
  const d = `M${p1.x} ${p1.y}Q${c.x} ${c.y} ${p2.x} ${p2.y}`;
  let body;
  if (el.style === "hand") {
    const r = rng(el.id);
    body = (
      <>
        <path d={sketchQuad(p1, c, p2, r) + sketchQuad(p1, c, p2, r)} fill="none" className={color} strokeWidth={1.8} strokeLinecap="round" />
        <path
          d={sketchLine(h1, p2, r) + sketchLine(p2, h2, r) + sketchLine(h1, p2, r)}
          fill="none"
          className={color}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </>
    );
  } else
    body = (
      <>
        <path d={d} fill="none" className={color} strokeWidth={2.2} strokeLinecap="round" />
        <path
          d={`M${h1.x} ${h1.y}L${p2.x} ${p2.y}L${h2.x} ${h2.y}`}
          fill="none"
          className={color}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    );
  return (
    <g data-id={el.id}>
      <path className="board-hit" d={d} strokeWidth={16 * iz} />
      {body}
    </g>
  );
}

export function StrokeShape({ el, iz }: { el: StrokeEl; iz: number }) {
  const d = strokePath(el.points, el.x, el.y);
  return (
    <g data-id={el.id}>
      <path className="board-hit" d={d} strokeWidth={14 * iz} strokeLinecap="round" />
      <path
        d={d}
        fill="none"
        className={BOARD_COLORS[el.color].stroke}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}
