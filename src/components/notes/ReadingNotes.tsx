"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { VerseNote } from "./VerseNote";

type Loaded = { surah: number; notes: Record<string, string> } | null;

const Ctx = createContext<Loaded>(null);

/**
 * Notes de la Lecture : la page est générée à l'avance (sans compte), donc les notes de la
 * personne connectée sont lues dans le navigateur, sourate par sourate. Sans compte : rien.
 */
export function ReadingNotes({ children }: { children: React.ReactNode }) {
  const surah = Number(/^\/lire\/(\d+)/.exec(usePathname())?.[1] ?? 0);
  const db = useRef(createClient()).current;
  const [loaded, setLoaded] = useState<Loaded>(null);

  useEffect(() => {
    if (!db || !surah) return;
    let live = true;
    void (async () => {
      const { session } = (await db.auth.getSession()).data;
      if (!session || !live) return setLoaded(null);
      const { data, error } = await db.from("notes").select("ref, body").eq("surah", surah);
      if (!live || error) return;
      setLoaded({ surah, notes: Object.fromEntries((data ?? []).map((r) => [r.ref, r.body])) });
    })();
    return () => {
      live = false;
    };
  }, [db, surah]);

  return <Ctx.Provider value={loaded?.surah === surah ? loaded : null}>{children}</Ctx.Provider>;
}

/** Place de la note sous un verset : rien tant qu'on ne sait pas si quelqu'un est connecté. */
export function VerseNoteSlot({ verseRef }: { verseRef: string }) {
  const loaded = useContext(Ctx);
  if (!loaded) return null;
  return <VerseNote verseRef={verseRef} initial={loaded.notes[verseRef] ?? ""} />;
}
