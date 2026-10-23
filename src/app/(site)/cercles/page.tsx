import type { Metadata } from "next";
import { Users } from "lucide-react";
import { ErrorNotice } from "@/components/Notice";
import { CircleCard } from "@/components/circles/CircleCard";
import { NewCircleSheet } from "@/components/circles/CircleSheets";
import { requireViewer } from "@/lib/auth";
import { loadCircles } from "@/lib/circles-server";
import { errorMessage } from "@/lib/messages";
import { createSpace } from "@/app/cercles/actions";

export const metadata: Metadata = { title: "Mes cercles" };

type Props = { searchParams: Promise<{ erreur?: string }> };

export default async function CirclesPage({ searchParams }: Props) {
  const viewer = await requireViewer("/cercles");
  const { erreur } = await searchParams;
  const circles = await loadCircles(viewer);
  const me = { id: viewer.user.id, name: viewer.name || viewer.email };

  return (
    <>
      <main className="px-safe mx-auto grid max-w-[1080px] gap-6 pb-16">
        <div className="flex flex-wrap items-end justify-between gap-4 pt-9">
          <div className="grid gap-1.5">
            <h1 className="font-read text-[36px] leading-[1.1] font-medium">Mes cercles</h1>
            <p className="max-w-[52ch] text-muted">
              Les cercles où tu étudies. Chacun a ses séances, son tableau et son mot à mot wolof.
            </p>
          </div>
          {circles.length > 0 && <NewCircleSheet me={me} action={createSpace} />}
        </div>

        <ErrorNotice message={errorMessage(erreur)} />

        {circles.length === 0 ? (
          <div className="grid justify-items-center gap-3 rounded-2xl border border-line bg-surface px-6 py-12 text-center">
            <span className="tone-teal grid size-14 place-items-center rounded-full bg-(--tone-soft) text-(--tone)">
              <Users aria-hidden className="size-6" />
            </span>
            <h2 className="font-read text-[24px] font-medium">Ton premier cercle</h2>
            <p className="max-w-[46ch] text-muted">
              Crée un cercle pour ta famille, une classe ou des amis, puis invite-les avec un lien. Si on t&apos;a
              envoyé une invitation, ouvre simplement le lien.
            </p>
            <NewCircleSheet me={me} action={createSpace} />
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,320px),1fr))] gap-[18px]">
            {circles.map((c) => (
              <CircleCard key={c.id} circle={c} href={`/cercles/${c.id}`} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
