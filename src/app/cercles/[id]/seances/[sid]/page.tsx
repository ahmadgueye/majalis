import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SessionView } from "@/components/session/SessionView";
import { requireViewer } from "@/lib/auth";
import { isHighlightKind, type HighlightKind } from "@/lib/highlights";
import { DEFAULT_TRANSLATION, QURAN_NOTICE, getSurah, surahs } from "@/lib/quran";

type Props = { params: Promise<{ id: string; sid: string }>; searchParams: Promise<{ sourate?: string }> };

export const metadata: Metadata = { title: "Séance" };

/** Une séance : lecture, tableau (à venir) et surlignages partagés. ?sourate= change la sourate lue. */
export default async function SessionPage({ params, searchParams }: Props) {
  const { id, sid } = await params;
  const { sourate } = await searchParams;
  const viewer = await requireViewer(`/cercles/${id}/seances/${sid}`);
  const db = viewer.supabase;

  const [{ data: session }, { data: space }, { data: me }, { data: rows }] = await Promise.all([
    db.from("sessions").select("id, title, surah").eq("id", sid).eq("space_id", id).maybeSingle(),
    db.from("spaces").select("id, name").eq("id", id).maybeSingle(),
    db.from("space_members").select("role").eq("space_id", id).eq("user_id", viewer.user.id).maybeSingle(),
    db.from("highlights").select("ref, kind").eq("session_id", sid),
  ]);
  if (!session || !space) notFound();
  const surah = (await getSurah(Number(sourate) || session.surah)) ?? (await getSurah(session.surah));
  if (!surah) notFound();

  const highlights: Record<string, HighlightKind> = {};
  for (const r of rows ?? []) if (isHighlightKind(r.kind)) highlights[r.ref] = r.kind;

  return (
    <SessionView
      space={space}
      session={{ id: session.id, title: session.title }}
      canEdit={me?.role === "owner" || me?.role === "editor"}
      viewer={{ name: viewer.name, email: viewer.email }}
      surahs={surahs.map(({ n, tname, ar }) => ({ n, tname, ar }))}
      text={{
        n: surah.meta.n,
        ar: surah.meta.ar,
        tname: surah.meta.tname,
        type: surah.meta.type,
        basmala: surah.basmala,
        verses: surah.verses.map((v) => ({ n: v.n, ar: v.ar, fr: v.tr[DEFAULT_TRANSLATION] })),
      }}
      notice={QURAN_NOTICE.split(". License")[0]}
      initialHighlights={highlights}
    />
  );
}
