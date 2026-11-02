import type { Metadata } from "next";
import { NotesList, type NoteItem } from "@/components/notes/NotesList";
import { requireViewer } from "@/lib/auth";
import { byRef } from "@/lib/notes";
import { DEFAULT_TRANSLATION, getSurah } from "@/lib/quran";
import { fetchAll } from "@/lib/supabase/fetch-all";

export const metadata: Metadata = { title: "Mes notes" };

/** Toutes mes notes, dans l'ordre du Coran, avec leur verset ; recherche et export. */
export default async function NotesPage() {
  const viewer = await requireViewer("/notes");
  const rows = await fetchAll((a, b) =>
    viewer.supabase.from("notes").select("ref, surah, body, updated_at").order("ref").range(a, b),
  );
  rows.sort(byRef);
  const texts = new Map(
    (await Promise.all([...new Set(rows.map((r) => r.surah))].map((s) => getSurah(s)))).flatMap((s) =>
      s ? [[s.meta.n, s] as const] : [],
    ),
  );
  const notes: NoteItem[] = rows.map((r) => {
    const t = texts.get(r.surah);
    const v = t?.verses[Number(r.ref.split(":")[1]) - 1];
    return {
      ref: r.ref,
      body: r.body,
      updated_at: r.updated_at,
      tname: t?.meta.tname ?? "",
      ar: v?.ar ?? "",
      fr: v?.tr[DEFAULT_TRANSLATION] ?? "",
    };
  });
  return <NotesList notes={notes} translator={viewer.translator} />;
}
