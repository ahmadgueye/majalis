import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { CopyButton } from "@/components/CopyButton";
import { ErrorNotice } from "@/components/Notice";
import { ROLE_LABELS, requireViewer } from "@/lib/auth";
import { errorMessage } from "@/lib/messages";
import { getSurahMeta, surahs } from "@/lib/quran";
import {
  changeRole,
  createInvite,
  createSession,
  deleteInvite,
  removeMember,
  renameSpace,
} from "../actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ erreur?: string }> };

export const metadata: Metadata = { title: "Cercle" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default async function CirclePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { erreur } = await searchParams;
  const viewer = await requireViewer(`/cercles/${id}`);
  const db = viewer.supabase;

  // RLS : un non-membre ne lit rien, et la page répond « introuvable ».
  const { data: space } = await db.from("spaces").select("id, name, owner_id").eq("id", id).maybeSingle();
  if (!space) notFound();

  const [{ data: sessions }, { data: members }] = await Promise.all([
    db.from("sessions").select("id, title, surah, created_at").eq("space_id", id).order("created_at", { ascending: false }),
    db.from("space_members").select("user_id, role, joined_at").eq("space_id", id).order("joined_at"),
  ]);
  const myRole = members?.find((m) => m.user_id === viewer.user.id)?.role ?? "viewer";
  const isOwner = space.owner_id === viewer.user.id;
  const canEdit = myRole !== "viewer";

  const [{ data: profiles }, { data: invites }] = await Promise.all([
    db.from("profiles").select("id, display_name").in("id", (members ?? []).map((m) => m.user_id)),
    canEdit
      ? db
          .from("space_invites")
          .select("token, role, expires_at")
          .eq("space_id", id)
          .gt("expires_at", new Date().toISOString())
          .order("expires_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);
  const nameOf = (uid: string) => profiles?.find((p) => p.id === uid)?.display_name || "Membre";

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  return (
    <>
      <AppHeader viewer={viewer} crumbs={[{ label: "Mes cercles", href: "/cercles" }, { label: space.name }]} />
      <main className="px-safe mx-auto grid max-w-[1080px] gap-8 pt-10 pb-16">
        <div className="grid gap-3">
          <h1 className="font-read text-[34px] leading-tight font-medium">{space.name}</h1>
          {isOwner && (
            <details className="group">
              <summary className="w-fit cursor-pointer text-[13px] font-semibold text-muted hover:text-ink">
                Renommer le cercle
              </summary>
              <form action={renameSpace} className="mt-2 flex max-w-md flex-wrap gap-2">
                <input type="hidden" name="space_id" value={space.id} />
                <input
                  name="name"
                  aria-label="Nouveau nom du cercle"
                  defaultValue={space.name}
                  required
                  maxLength={80}
                  className="min-w-0 flex-1 basis-48 rounded-control border border-line bg-surface px-3 py-[7px] text-ink"
                />
                <button type="submit" className="btn">
                  Renommer
                </button>
              </form>
            </details>
          )}
        </div>

        <ErrorNotice message={errorMessage(erreur)} />

        <div className="grid items-start gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
          <section aria-labelledby="seances" className="grid gap-4">
            <h2 id="seances" className="text-lg font-semibold">
              Séances
            </h2>
            {canEdit && (
              <form action={createSession} className="grid gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
                <input type="hidden" name="space_id" value={space.id} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-[13px] font-semibold">
                    Titre
                    <input
                      name="title"
                      maxLength={120}
                      placeholder="Par exemple : Sâd, versets 27 à 29"
                      className="rounded-control border border-line bg-surface px-3 py-[9px] text-sm font-normal text-ink placeholder:text-faint"
                    />
                  </label>
                  <label className="grid gap-1 text-[13px] font-semibold">
                    Sourate
                    <select
                      name="surah"
                      defaultValue={1}
                      className="min-w-0 rounded-control border border-line bg-surface px-2 py-[9px] text-sm font-normal text-ink"
                    >
                      {surahs.map((s) => (
                        <option key={s.n} value={s.n}>
                          {s.n}. {s.tname} — {s.ar}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <button type="submit" className="btn primary w-fit">
                  Créer la séance
                </button>
              </form>
            )}
            {!sessions?.length ? (
              <p className="rounded-2xl border border-dashed border-line px-5 py-8 text-center text-muted">
                Aucune séance pour l&apos;instant.
                {canEdit ? " Crée la première ci-dessus en choisissant une sourate." : ""}
              </p>
            ) : (
              <ul className="grid gap-2">
                {sessions.map((s) => {
                  const meta = getSurahMeta(s.surah);
                  return (
                    <li key={s.id}>
                      <Link
                        href={`/cercles/${space.id}/seances/${s.id}`}
                        className="grid gap-0.5 rounded-xl border border-line bg-surface px-4 py-3 hover:bg-surface-2"
                      >
                        <span className="font-semibold">{s.title}</span>
                        <span className="text-[13px] text-muted">
                          {meta ? `${meta.n}. ${meta.tname}` : `Sourate ${s.surah}`} ·{" "}
                          {dateFmt.format(new Date(s.created_at))}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <div className="grid gap-8">
            <section id="membres" aria-labelledby="membres-titre" className="grid scroll-mt-20 gap-3">
              <h2 id="membres-titre" className="text-lg font-semibold">
                Membres
              </h2>
              <ul className="grid divide-y divide-line rounded-2xl border border-line bg-surface">
                {members?.map((m) => {
                  const editable = isOwner && m.role !== "owner";
                  return (
                    <li key={m.user_id} className="grid gap-2 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate font-semibold">
                          {nameOf(m.user_id)}
                          {m.user_id === viewer.user.id && <span className="font-normal text-muted"> (toi)</span>}
                        </span>
                        {!editable && <span className="text-[13px] text-muted">{ROLE_LABELS[m.role]}</span>}
                      </div>
                      {editable && (
                        <div className="flex flex-wrap items-center gap-2">
                          <form action={changeRole} className="flex gap-2">
                            <input type="hidden" name="space_id" value={space.id} />
                            <input type="hidden" name="user_id" value={m.user_id} />
                            <select
                              name="role"
                              defaultValue={m.role}
                              aria-label={`Rôle de ${nameOf(m.user_id)}`}
                              className="rounded-control border border-line bg-surface px-2 py-[5px] text-[13px] text-ink"
                            >
                              <option value="editor">{ROLE_LABELS.editor}</option>
                              <option value="viewer">{ROLE_LABELS.viewer}</option>
                            </select>
                            <button type="submit" className="btn px-2.5 py-[5px] text-[13px]">
                              Changer
                            </button>
                          </form>
                          <form action={removeMember}>
                            <input type="hidden" name="space_id" value={space.id} />
                            <input type="hidden" name="user_id" value={m.user_id} />
                            <button type="submit" className="btn px-2.5 py-[5px] text-[13px] text-c-rose">
                              Retirer du cercle
                            </button>
                          </form>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>

            {canEdit && (
              <section id="inviter" aria-labelledby="inviter-titre" className="grid scroll-mt-20 gap-3">
                <h2 id="inviter-titre" className="text-lg font-semibold">
                  Inviter
                </h2>
                <p className="text-[13px] text-muted">
                  Crée un lien et envoie-le aux personnes qui étudient avec toi. Il reste valable 14 jours.
                </p>
                <form action={createInvite} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="space_id" value={space.id} />
                  <select
                    name="role"
                    defaultValue="editor"
                    aria-label="Rôle des personnes invitées"
                    className="rounded-control border border-line bg-surface px-2 py-[7px] text-sm text-ink"
                  >
                    <option value="editor">{ROLE_LABELS.editor}</option>
                    <option value="viewer">{ROLE_LABELS.viewer}</option>
                  </select>
                  <button type="submit" className="btn primary">
                    Créer un lien
                  </button>
                </form>
                {!!invites?.length && (
                  <ul className="grid gap-2">
                    {invites.map((inv) => {
                      const url = `${origin}/rejoindre/${inv.token}`;
                      return (
                        <li key={inv.token} className="grid gap-2 rounded-xl border border-line bg-surface p-3">
                          <input
                            readOnly
                            value={url}
                            aria-label="Lien d'invitation"
                            className="w-full truncate rounded-control border border-line bg-surface-2 px-2.5 py-1.5 text-[13px] text-ink"
                          />
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="flex-1 text-[12px] text-muted">
                              {ROLE_LABELS[inv.role]} · jusqu&apos;au {dateFmt.format(new Date(inv.expires_at))}
                            </span>
                            <CopyButton text={url} label="Copier le lien" />
                            <form action={deleteInvite}>
                              <input type="hidden" name="space_id" value={space.id} />
                              <input type="hidden" name="token" value={inv.token} />
                              <button type="submit" className="btn text-c-rose">
                                Supprimer
                              </button>
                            </form>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
