import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { VerseText } from "@/components/board/Board";
import { SessionView } from "@/components/session/SessionView";
import { requireViewer } from "@/lib/auth";
import { fromRow, type BoardEl } from "@/lib/board";
import { peopleById } from "@/lib/circles-server";
import { isHighlightKind, type HighlightKind } from "@/lib/highlights";
import { DEFAULT_TRANSLATION, QURAN_NOTICE, getSurah, surahs } from "@/lib/quran";
import { wolofText } from "@/lib/wolof";
import { publishedWolof } from "@/lib/wolof-server";

type Props = { params: Promise<{ id: string; sid: string }>; searchParams: Promise<{ sourate?: string }> };

export const metadata: Metadata = { title: "Séance" };

/** Une séance : lecture, tableau et surlignages partagés. ?sourate= change la sourate lue. */
export default async function SessionPage({ params, searchParams }: Props) {
  const { id, sid } = await params;
  const { sourate } = await searchParams;
  const viewer = await requireViewer(`/cercles/${id}/seances/${sid}`);
  const db = viewer.supabase;

  const [{ data: session }, { data: space }, { data: members }, { data: rows }, { data: board }] = await Promise.all([
    db.from("sessions").select("id, title, surah").eq("id", sid).eq("space_id", id).maybeSingle(),
    db.from("spaces").select("id, name").eq("id", id).maybeSingle(),
    db.from("space_members").select("user_id, role").eq("space_id", id),
    db.from("highlights").select("ref, kind").eq("session_id", sid),
    db.from("board_elements").select("id, type, z, data").eq("session_id", sid),
  ]);
  if (!session || !space) notFound();
  const surah = (await getSurah(Number(sourate) || session.surah)) ?? (await getSurah(session.surah));
  if (!surah) notFound();

  const highlights: Record<string, HighlightKind> = {};
  for (const r of rows ?? []) if (isHighlightKind(r.kind)) highlights[r.ref] = r.kind;

  // Tableau : ses éléments, le texte des versets posés (données locales) et le nom des auteurs des notes.
  const elements = (board ?? []).map(fromRow).filter((e): e is BoardEl => !!e);
  const verses: Record<string, VerseText> = {};
  const refs = [...new Set(elements.flatMap((e) => (e.type === "verse" ? [e.ref] : [])))];
  const boardSurahs = [...new Set(refs.map((r) => Number(r.split(":")[0])))];
  const [bySurah, wolof] = await Promise.all([
    Promise.all(boardSurahs.map((n) => getSurah(n))),
    publishedWolof([...new Set([surah.meta.n, ...boardSurahs])], db),
  ]);
  for (const ref of refs) {
    const [n, v] = ref.split(":").map(Number);
    const s = bySurah.find((x) => x?.meta.n === n);
    const verse = s?.verses[v - 1];
    if (s && verse)
      verses[ref] = {
        label: `${s.meta.tname} · ${ref}`,
        ar: verse.ar,
        fr: verse.tr[DEFAULT_TRANSLATION],
        wo: wolofText(verse.ar, wolof[ref]),
      };
  }
  const people = await peopleById(db, (members ?? []).map((m) => m.user_id));
  const role = members?.find((m) => m.user_id === viewer.user.id)?.role;

  return (
    <SessionView
      space={space}
      session={{ id: session.id, title: session.title }}
      canEdit={role === "owner" || role === "editor"}
      viewer={{ id: viewer.user.id, name: viewer.name, email: viewer.email, translator: viewer.translator }}
      people={Object.fromEntries([...people].map(([pid, p]) => [pid, p.name]))}
      board={elements}
      boardVerses={verses}
      surahs={surahs.map(({ n, tname, ar }) => ({ n, tname, ar }))}
      text={{
        n: surah.meta.n,
        ar: surah.meta.ar,
        tname: surah.meta.tname,
        type: surah.meta.type,
        basmala: surah.basmala,
        verses: surah.verses.map((v) => ({
          n: v.n,
          ar: v.ar,
          fr: v.tr[DEFAULT_TRANSLATION],
          wo: wolofText(v.ar, wolof[`${surah.meta.n}:${v.n}`]),
        })),
      }}
      notice={QURAN_NOTICE.split(". License")[0]}
      initialHighlights={highlights}
    />
  );
}
