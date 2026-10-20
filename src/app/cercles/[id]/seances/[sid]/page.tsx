import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ErrorNotice } from "@/components/Notice";
import { SurahText } from "@/components/reader/SurahText";
import { requireViewer } from "@/lib/auth";
import { errorMessage } from "@/lib/messages";
import { getSurah } from "@/lib/quran";
import { renameSession } from "../../../actions";

type Props = { params: Promise<{ id: string; sid: string }>; searchParams: Promise<{ erreur?: string }> };

export const metadata: Metadata = { title: "Séance" };

/** Une séance : pour l'instant le texte de sa sourate. Le tableau et la discussion viendront ici. */
export default async function SessionPage({ params, searchParams }: Props) {
  const { id, sid } = await params;
  const { erreur } = await searchParams;
  const viewer = await requireViewer(`/cercles/${id}/seances/${sid}`);
  const db = viewer.supabase;

  const [{ data: session }, { data: space }, { data: me }] = await Promise.all([
    db.from("sessions").select("id, title, surah").eq("id", sid).eq("space_id", id).maybeSingle(),
    db.from("spaces").select("id, name").eq("id", id).maybeSingle(),
    db.from("space_members").select("role").eq("space_id", id).eq("user_id", viewer.user.id).maybeSingle(),
  ]);
  if (!session || !space) notFound();
  const surah = await getSurah(session.surah);
  if (!surah) notFound();
  const canEdit = me?.role === "owner" || me?.role === "editor";

  return (
    <div className="min-h-full bg-surface">
      <AppHeader
        viewer={viewer}
        crumbs={[
          { label: "Mes cercles", href: "/cercles" },
          { label: space.name, href: `/cercles/${space.id}` },
          { label: session.title },
        ]}
      />
      <main className="px-safe mx-auto max-w-[720px] pt-8 pb-12">
        <div className="grid gap-3">
          <h1 className="font-read text-[30px] leading-tight font-medium">{session.title}</h1>
          {canEdit && (
            <details>
              <summary className="w-fit cursor-pointer text-[13px] font-semibold text-muted hover:text-ink">
                Renommer la séance
              </summary>
              <form action={renameSession} className="mt-2 flex max-w-md flex-wrap gap-2">
                <input type="hidden" name="space_id" value={space.id} />
                <input type="hidden" name="session_id" value={session.id} />
                <input
                  name="title"
                  aria-label="Nouveau titre de la séance"
                  defaultValue={session.title}
                  required
                  maxLength={120}
                  className="min-w-0 flex-1 basis-48 rounded-control border border-line bg-surface px-3 py-[7px] text-ink"
                />
                <button type="submit" className="btn">
                  Renommer
                </button>
              </form>
            </details>
          )}
          <ErrorNotice message={errorMessage(erreur)} />
        </div>
        <SurahText surah={surah} />
      </main>
    </div>
  );
}
