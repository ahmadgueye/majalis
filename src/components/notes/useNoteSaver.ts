"use client";

import { useEffect, useRef, useState } from "react";
import { saveNote } from "@/lib/notes";
import { createClient } from "@/lib/supabase/client";

export type NoteStatus = "idle" | "saving" | "saved" | "error";

export const NOTE_STATUS: Record<NoteStatus, string> = {
  idle: "Visible par toi seul",
  saving: "Enregistrement…",
  saved: "Enregistré",
  error: "Échec de l'enregistrement : vérifie ta connexion",
};

/**
 * Texte d'une note (verset ou « À propos » d'une sourate, ref `n:0`) enregistré tout seul :
 * 700 ms après la frappe, en quittant le champ, et avant de quitter la page.
 */
export function useNoteSaver(ref: string, initial: string) {
  const db = useRef(createClient()).current;
  const [body, setBody] = useState(initial);
  const [status, setStatus] = useState<NoteStatus>("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pending = useRef<string | null>(null);

  async function write() {
    clearTimeout(timer.current);
    const text = pending.current;
    if (text === null || !db) return;
    pending.current = null;
    setStatus("saving");
    const ok = await saveNote(db, ref, text);
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

  return { body, status, change, write };
}
