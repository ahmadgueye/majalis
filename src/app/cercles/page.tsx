import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { ErrorNotice } from "@/components/Notice";
import { ROLE_LABELS, requireViewer } from "@/lib/auth";
import { errorMessage } from "@/lib/messages";
import { createSpace } from "./actions";

export const metadata: Metadata = { title: "Mes cercles" };

type Props = { searchParams: Promise<{ erreur?: string }> };

export default async function CirclesPage({ searchParams }: Props) {
  const viewer = await requireViewer("/cercles");
  const { erreur } = await searchParams;

  const { data } = await viewer.supabase
    .from("space_members")
    .select("role, spaces (id, name, created_at, sessions (count), space_members (count))")
    .eq("user_id", viewer.user.id);
  const circles = (data ?? [])
    .filter((m) => m.spaces)
    .map((m) => ({
      role: m.role,
      ...m.spaces!,
      sessions: m.spaces!.sessions[0]?.count ?? 0,
      members: m.spaces!.space_members[0]?.count ?? 0,
    }))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <>
      <AppHeader viewer={viewer} crumbs={[{ label: "Mes cercles" }]} />
      <main className="px-safe mx-auto grid max-w-[720px] gap-8 pt-10 pb-16">
        <div className="grid gap-2">
          <h1 className="font-read text-[34px] leading-tight font-medium">Mes cercles</h1>
          <p className="text-muted">
            Un cercle réunit les personnes qui étudient ensemble. Chaque cercle a ses séances, son tableau et son mot
            à mot wolof.
          </p>
        </div>

        <ErrorNotice message={errorMessage(erreur)} />

        <form action={createSpace} className="grid gap-2 rounded-2xl border border-line bg-surface p-4 shadow-card">
          <label htmlFor="name" className="text-[13px] font-semibold">
            Nouveau cercle
          </label>
          <div className="flex flex-wrap gap-2">
            <input
              id="name"
              name="name"
              required
              maxLength={80}
              placeholder="Par exemple : Cercle du mardi"
              className="min-w-0 flex-1 basis-56 rounded-control border border-line bg-surface px-3 py-[9px] text-ink placeholder:text-faint"
            />
            <button type="submit" className="btn primary">
              Créer le cercle
            </button>
          </div>
        </form>

        {circles.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-5 py-8 text-center text-muted">
            Tu ne fais partie d&apos;aucun cercle pour l&apos;instant. Crée le tien ci-dessus, ou ouvre le lien
            d&apos;invitation qu&apos;on t&apos;a envoyé.
          </p>
        ) : (
          <ul className="grid gap-2.5">
            {circles.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/cercles/${c.id}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl border border-line bg-surface px-5 py-4 hover:bg-surface-2"
                >
                  <span className="min-w-0 basis-full truncate text-[17px] font-semibold sm:basis-0 sm:flex-1">{c.name}</span>
                  <span className="text-[13px] text-muted">
                    {c.sessions} séance{c.sessions > 1 ? "s" : ""} · {c.members} membre{c.members > 1 ? "s" : ""}
                  </span>
                  <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[12px] font-semibold text-accent">
                    {ROLE_LABELS[c.role]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
