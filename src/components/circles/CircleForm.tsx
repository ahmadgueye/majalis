"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, ImagePlus } from "lucide-react";
import { DAYS, PATTERNS, TONES, formatRhythm, toneClass, type Pattern, type Tone } from "@/lib/circles";
import type { Person } from "./Avatars";
import { CircleCard } from "./CircleCard";
import { CoverArt } from "./CoverArt";

export type CircleValues = {
  name: string;
  intention: string;
  tone: Tone;
  pattern: Pattern;
  coverUrl: string | null;
  verse: string;
  day: number | null;
  time: string | null;
};

type Props = {
  mode: "create" | "edit";
  spaceId?: string;
  initial: CircleValues;
  members: Person[];
  role: string;
  action: (fd: FormData) => Promise<void>;
  onCancel: () => void;
};

type VersePreview = { ref: string; surah: string; ar: string; fr: string } | null;

const EXAMPLES = ["38:29", "47:24", "20:114"];

/** Réduit l'image dans le navigateur (1600 px de large au plus) avant l'envoi. */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const toBlob = (type: string) => new Promise<Blob | null>((r) => canvas.toBlob(r, type, 0.82));
  const webp = await toBlob("image/webp");
  return webp?.type === "image/webp" ? webp : ((await toBlob("image/jpeg")) ?? file);
}

/** Fenêtre de création et de paramètres d'un cercle, avec aperçu de sa carte en direct. */
export function CircleForm({ mode, spaceId, initial, members, role, action, onCancel }: Props) {
  const [v, setV] = useState(initial);
  const [cover, setCover] = useState<"pattern" | "keep" | "upload">(initial.coverUrl ? "keep" : "pattern");
  const [upload, setUpload] = useState<{ blob: Blob; url: string } | null>(null);
  const [verse, setVerse] = useState<VersePreview>(null);
  const [verseState, setVerseState] = useState<"idle" | "loading" | "missing">("idle");
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof CircleValues>(k: K, value: CircleValues[K]) => setV((s) => ({ ...s, [k]: value }));

  // Aperçu du verset, servi par l'app (/api/verset) à partir des données locales.
  useEffect(() => {
    const ref = v.verse.trim();
    if (!/^\d{1,3}:\d{1,3}$/.test(ref)) {
      setVerse(null);
      setVerseState(ref ? "missing" : "idle");
      return;
    }
    let live = true;
    setVerseState("loading");
    fetch(`/api/verset?ref=${encodeURIComponent(ref)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!live) return;
        setVerse(data);
        setVerseState(data ? "idle" : "missing");
      })
      .catch(() => live && setVerseState("missing"));
    return () => {
      live = false;
    };
  }, [v.verse]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const blob = await shrink(file);
    if (upload) URL.revokeObjectURL(upload.url);
    setUpload({ blob, url: URL.createObjectURL(blob) });
    setCover("upload");
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("tone", v.tone);
    fd.set("pattern", v.pattern);
    fd.set("cover", cover);
    if (spaceId) fd.set("space_id", spaceId);
    if (cover === "upload" && upload) fd.set("cover_file", upload.blob, "couverture.webp");
    startTransition(() => action(fd));
  }

  const coverUrl = cover === "upload" ? (upload?.url ?? null) : cover === "keep" ? initial.coverUrl : null;
  const preview = {
    id: "apercu",
    name: v.name,
    tone: v.tone,
    pattern: v.pattern,
    coverUrl,
    intention: v.intention,
    rhythm: formatRhythm(v.day, v.time),
    lastSession: null,
    members,
    studied: 0,
    role,
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="grid gap-6 px-5 pt-3.5 pb-5 md:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid min-w-0 gap-[18px]">
          <Field label="Nom du cercle" htmlFor="c-name">
            <input
              id="c-name"
              name="name"
              required
              maxLength={80}
              value={v.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Par exemple : Cercle du mardi"
              className="field-input"
            />
          </Field>

          <Field label="Intention" optional htmlFor="c-intention">
            <textarea
              id="c-intention"
              name="intention"
              maxLength={200}
              rows={2}
              value={v.intention}
              onChange={(e) => set("intention", e.target.value)}
              placeholder="Pourquoi vous vous réunissez, en une ou deux phrases."
              className="field-input resize-y"
            />
          </Field>

          <Field label="Couverture">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PATTERNS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  aria-pressed={cover === "pattern" && v.pattern === p.value}
                  aria-label={p.label}
                  title={p.label}
                  onClick={() => {
                    set("pattern", p.value);
                    setCover("pattern");
                  }}
                  className={`${toneClass(v.tone)} relative h-14 overflow-hidden rounded-[10px] border-2 ${
                    cover === "pattern" && v.pattern === p.value ? "border-ink" : "border-transparent"
                  }`}
                >
                  <CoverArt id={`opt-${p.value}`} pattern={p.value} className="size-full" />
                </button>
              ))}
              <label
                className={`relative grid h-14 cursor-pointer place-items-center overflow-hidden rounded-[10px] border-2 text-xs font-semibold text-muted hover:text-ink ${
                  cover !== "pattern" && coverUrl ? "border-ink" : "border-dashed border-grid"
                }`}
              >
                <input type="file" accept="image/*" onChange={onFile} className="sr-only" />
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- aperçu local de l'image choisie
                  <img src={coverUrl} alt="" className="absolute inset-0 size-full object-cover" />
                ) : (
                  <span className="flex items-center gap-1.5">
                    <ImagePlus aria-hidden className="size-4" />
                    Ton image
                  </span>
                )}
                <span className="sr-only">Choisir une image de couverture</span>
              </label>
            </div>
            {coverUrl && (
              <span className="text-[12.5px] text-faint">
                Image choisie. Clique sur un motif pour revenir à une couverture dessinée.
              </span>
            )}
          </Field>

          <Field label="Couleur">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Couleur du cercle">
              {TONES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={v.tone === t.value}
                  aria-label={t.label}
                  title={t.label}
                  onClick={() => set("tone", t.value)}
                  className={`${toneClass(t.value)} grid size-8 place-items-center rounded-full bg-(--tone) text-surface ring-2 ring-offset-2 ring-offset-surface ${
                    v.tone === t.value ? "ring-ink" : "ring-transparent"
                  }`}
                >
                  {v.tone === t.value && <Check aria-hidden className="size-4" />}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Verset du cercle" optional htmlFor="c-verse">
            <input
              id="c-verse"
              name="verse"
              inputMode="numeric"
              autoComplete="off"
              value={v.verse}
              onChange={(e) => set("verse", e.target.value)}
              placeholder="Sourate:verset, par exemple 38:29"
              className="field-input"
            />
            <div className="flex flex-wrap gap-1.5" aria-label="Exemples">
              {EXAMPLES.map((ref) => (
                <button
                  key={ref}
                  type="button"
                  onClick={() => set("verse", ref)}
                  className="rounded-full border border-line bg-surface-2 px-2.5 py-0.5 text-[12.5px] hover:border-muted"
                >
                  {ref}
                </button>
              ))}
            </div>
            {verse ? (
              <div className="grid gap-1 rounded-[10px] bg-surface-2 px-3 py-2.5">
                <p className="text-right font-ar text-[21px] leading-[1.8]" lang="ar" dir="rtl">
                  {verse.ar}
                </p>
                <p className="font-read text-[15px] leading-snug text-muted italic">{verse.fr}</p>
              </div>
            ) : (
              <span className="text-[12.5px] text-faint">
                {verseState === "missing"
                  ? "Ce verset n'existe pas. Écris la sourate et le verset, par exemple 38:29."
                  : "Le verset s'affiche en tête de la page du cercle."}
              </span>
            )}
          </Field>

          <Field label="Rythme" optional>
            <div className="flex flex-wrap gap-2">
              <select
                name="day"
                aria-label="Jour des rencontres"
                value={v.day ?? ""}
                onChange={(e) => set("day", e.target.value ? Number(e.target.value) : null)}
                className="field-input min-w-0 flex-1 basis-36"
              >
                <option value="">Pas de jour fixe</option>
                {DAYS.map((d, i) => (
                  <option key={d} value={i + 1}>
                    {d}
                  </option>
                ))}
              </select>
              <input
                type="time"
                name="time"
                aria-label="Heure des rencontres"
                disabled={!v.day}
                value={v.time?.slice(0, 5) ?? "20:30"}
                onChange={(e) => set("time", e.target.value)}
                className="field-input min-w-0 flex-1 basis-28 disabled:opacity-50"
              />
            </div>
          </Field>
        </div>

        <aside className="grid content-start gap-2.5 md:sticky md:top-0" aria-label="Aperçu de la carte du cercle">
          <span className="text-xs font-bold tracking-[0.06em] text-faint uppercase">Aperçu</span>
          <CircleCard circle={preview} />
        </aside>
      </div>

      <div className="flex justify-end gap-2 border-t border-line px-5 pt-3.5 pb-[18px]">
        <button type="button" className="btn ghost" onClick={onCancel}>
          Annuler
        </button>
        <button type="submit" className="btn primary" disabled={pending}>
          <Check aria-hidden />
          {pending ? "Enregistrement…" : mode === "create" ? "Créer le cercle" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  optional,
  htmlFor,
  children,
}: {
  label: string;
  optional?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  const Label = htmlFor ? "label" : "span";
  return (
    <div className="grid min-w-0 gap-1.5">
      <Label htmlFor={htmlFor} className="text-[13px] font-semibold">
        {label}
        {optional && <span className="font-normal text-faint"> (facultatif)</span>}
      </Label>
      {children}
    </div>
  );
}
