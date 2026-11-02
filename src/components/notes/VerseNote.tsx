"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { NotebookPen } from "lucide-react";
import { saveNote } from "@/lib/notes";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "saving" | "saved" | "error";

const STATUS: Record<Status, string> = {
  idle: "Visible par toi seul",
  saving: "Enregistrement…",
  saved: "Note enregistrée",
  error: "Échec de l'enregistrement : vérifie ta connexion",
};

/**
 * Note personnelle d'un verset (Traduire et Lecture). Fermée tant qu'elle est vide, derrière
 * « Ajouter une note » ; enregistrée toute seule pendant la frappe, supprimée si on la vide.
 */
export function VerseNote({ verseRef, initial }: { verseRef: string; initial: string }) {
  const db = useRef(createClient()).current;
  const [open, setOpen] = useState(initial.trim() !== "");
  const [body, setBody] = useState(initial);
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pending = useRef<string | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);

  async function write() {
    clearTimeout(timer.current);
    const text = pending.current;
    if (text === null || !db) return;
    pending.current = null;
    setStatus("saving");
    const ok = await saveNote(db, verseRef, text);
    setStatus(ok ? (pending.current === null ? "saved" : "saving") : "error");
  }

  function change(text: string) {
    setBody(text);
    pending.current = text;
    setStatus("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void write(), 700);
  }

  // Une note pas encore envoyée part quand on quitte la page ou la sourate.
  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (pending.current !== null) e.preventDefault();
    };
    addEventListener("beforeunload", onLeave);
    return () => {
      removeEventListener("beforeunload", onLeave);
      if (pending.current !== null) void write();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une seule fois par note
  }, []);

  // Le champ grandit avec le texte.
  useLayoutEffect(() => {
    const t = area.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = `${t.scrollHeight}px`;
  }, [body, open]);

  if (!open)
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          requestAnimationFrame(() => area.current?.focus());
        }}
        className="mt-1.5 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[12.5px] font-semibold text-muted hover:bg-surface-2 hover:text-ink"
      >
        <NotebookPen aria-hidden className="size-3.5" />
        Ajouter une note
      </button>
    );

  return (
    <div className="mt-2 rounded-lg border border-line bg-surface-2 px-3 pt-2 pb-2.5">
      <div className="mb-1 flex items-center gap-2 text-[12px]">
        <NotebookPen aria-hidden className="size-3.5 text-muted" />
        <span className="font-semibold text-ink">Ma note</span>
        <span role="status" className={status === "error" ? "font-semibold text-c-rose" : "text-faint"}>
          {STATUS[status]}
        </span>
        {!body.trim() && (
          <button type="button" onClick={() => setOpen(false)} className="ml-auto font-semibold text-muted hover:text-ink">
            Fermer
          </button>
        )}
      </div>
      <textarea
        ref={area}
        rows={2}
        value={body}
        onChange={(e) => change(e.target.value)}
        onBlur={() => void write()}
        placeholder="Ce que ce verset t'inspire, une question, une référence…"
        aria-label={`Ma note sur le verset ${verseRef}`}
        className="block w-full resize-none overflow-hidden bg-transparent font-read text-[15px] leading-relaxed text-ink outline-none placeholder:text-faint"
      />
    </div>
  );
}
