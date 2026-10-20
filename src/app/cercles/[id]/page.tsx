import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, CalendarDays, ChevronRight, LayoutGrid, Pin, Users } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { ErrorNotice } from "@/components/Notice";
import { PersonAvatar, AvatarStack } from "@/components/circles/Avatars";
import { RoleChip } from "@/components/circles/CircleCard";
import { CircleSettingsSheet, InviteSheet, NewSessionSheet } from "@/components/circles/CircleSheets";
import { CoverArt } from "@/components/circles/CoverArt";
import { QuranMap } from "@/components/circles/QuranMap";
import { requireViewer } from "@/lib/auth";
import { ROLE_LABELS, formatRhythm, formatTime, initial, isPattern, isTone, nextMeeting, toneClass } from "@/lib/circles";
import { coverUrls, peopleById } from "@/lib/circles-server";
import { errorMessage } from "@/lib/messages";
import { DEFAULT_TRANSLATION, getSurah, getSurahMeta, surahs } from "@/lib/quran";
import { changeRole, createInvite, createSession, deleteInvite, pinNote, removeMember, updateSpace } from "../actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ erreur?: string }> };

export const metadata: Metadata = { title: "Cercle" };

const dateFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const dayFmt = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" });
const shortFmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });

export default async function CirclePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { erreur } = await searchParams;
  const viewer = await requireViewer(`/cercles/${id}`);
  const db = viewer.supabase;

  // RLS : un non-membre ne lit rien, et la page répond « introuvable ».
  const { data: space } = await db
    .from("spaces")
    .select("id, name, owner_id, tone, cover_pattern, cover_path, intention, verse_ref, meet_day, meet_time, pinned_note, pinned_by, pinned_at")
    .eq("id", id)
    .maybeSingle();
  if (!space) notFound();

  const [{ data: sessions }, { data: members }] = await Promise.all([
    db.from("sessions").select("id, title, surah, created_at").eq("space_id", id).order("created_at", { ascending: false }),
    db.from("space_members").select("user_id, role, joined_at").eq("space_id", id).order("joined_at"),
  ]);
  const myRole = members?.find((m) => m.user_id === viewer.user.id)?.role ?? "viewer";
  const isOwner = space.owner_id === viewer.user.id;
  const canEdit = myRole !== "viewer";

  const verseMatch = space.verse_ref?.match(/^(\d+):(\d+)$/);
  const [people, urls, invites, verseSurah] = await Promise.all([
    peopleById(db, [...(members ?? []).map((m) => m.user_id), ...(space.pinned_by ? [space.pinned_by] : [])]),
    coverUrls(db, [space.cover_path]),
    canEdit
      ? db
          .from("space_invites")
          .select("token, role, expires_at")
          .eq("space_id", id)
          .gt("expires_at", new Date().toISOString())
          .order("expires_at", { ascending: false })
          .then((r) => r.data ?? [])
      : Promise.resolve([]),
    verseMatch ? getSurah(Number(verseMatch[1])) : Promise.resolve(undefined),
  ]);
  const verse = verseMatch && verseSurah?.verses[Number(verseMatch[2]) - 1];
  const memberList = (members ?? []).map((m) => ({ ...m, person: people.get(m.user_id) ?? { id: m.user_id, name: "Membre" } }));
  const persons = memberList.map((m) => m.person);
  const studied = [...new Set((sessions ?? []).map((s) => s.surah))];
  const coverUrl = (space.cover_path && urls.get(space.cover_path)) || null;
  const tone = isTone(space.tone) ? space.tone : "teal";
  const pattern = isPattern(space.cover_pattern) ? space.cover_pattern : "etoile";
  const rhythm = formatRhythm(space.meet_day, space.meet_time);
  const next = space.meet_day ? nextMeeting(space.meet_day) : null;
  const surahList = surahs.map(({ n, tname, ar }) => ({ n, tname, ar }));

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  return (
    <>
      <AppHeader viewer={viewer} crumbs={[{ label: "Mes cercles", href: "/cercles" }, { label: space.name }]} />
      <main className={`${toneClass(tone)} px-safe mx-auto max-w-[1080px] pb-16`}>
        {/* Bandeau */}
        <section className="pt-5">
          <CoverArt id="cover-hero" pattern={pattern} imageUrl={coverUrl} className="h-[130px] rounded-[14px] sm:h-[190px] sm:rounded-[18px]" />
          <div className="relative -mt-8 flex flex-wrap items-end gap-x-5 gap-y-3.5 px-1 sm:-mt-10 sm:px-2">
            <span
              aria-hidden
              className="grid size-[68px] flex-none place-items-center rounded-[18px] border-4 border-surface bg-(--tone) text-[28px] font-bold text-surface sm:size-[84px] sm:rounded-[22px] sm:text-[34px]"
            >
              {initial(space.name)}
            </span>
            <div className="grid min-w-[min(100%,260px)] flex-1 gap-1 sm:pt-11">
              <h1 className="font-read text-[29px] leading-[1.1] font-medium text-balance sm:text-[34px]">{space.name}</h1>
              {space.intention && <p className="max-w-[60ch] text-muted">{space.intention}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isOwner && (
                <CircleSettingsSheet
                  spaceId={space.id}
                  members={persons}
                  action={updateSpace}
                  initial={{
                    name: space.name,
                    intention: space.intention,
                    tone,
                    pattern,
                    coverUrl,
                    verse: space.verse_ref ?? "",
                    day: space.meet_day,
                    time: space.meet_time,
                  }}
                />
              )}
              {canEdit && (
                <>
                  <InviteSheet
                    spaceId={space.id}
                    origin={origin}
                    create={createInvite}
                    remove={deleteInvite}
                    invites={invites.map((i) => ({ token: i.token, role: i.role, expires: shortFmt.format(new Date(i.expires_at)) }))}
                  />
                  <NewSessionSheet spaceId={space.id} surahs={surahList} action={createSession} />
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-[18px] gap-y-2 px-1 pt-3.5 text-[13.5px] text-muted sm:px-2">
            <span className="flex items-center gap-2">
              <AvatarStack people={persons} max={5} />
              <span>
                <b className="font-semibold text-ink">{memberList.length}</b> membre{memberList.length > 1 ? "s" : ""}
              </span>
            </span>
            {rhythm && (
              <span className="flex items-center gap-2">
                <CalendarDays aria-hidden className="size-4" />
                {rhythm}
              </span>
            )}
            <span className="flex items-center gap-2">
              <LayoutGrid aria-hidden className="size-4" />
              <span>
                <b className="font-semibold text-ink">{studied.length}</b> sourate{studied.length > 1 ? "s" : ""} sur 114
              </span>
            </span>
            <RoleChip role={myRole} />
          </div>
        </section>

        <div className="pt-4">
          <ErrorNotice message={errorMessage(erreur)} />
        </div>

        <div className="grid items-start gap-7 pt-4 md:grid-cols-[minmax(0,1fr)_minmax(0,330px)]">
          <div className="grid min-w-0 gap-[22px]">
            {verse && (
              <figure className="grid gap-3 rounded-2xl bg-(--tone-soft) p-[18px]">
                <p className="text-right font-ar text-[27px] leading-[1.9]" lang="ar" dir="rtl">
                  {verse.ar}
                </p>
                <p className="font-read text-[17px] leading-[1.45] italic">{verse.tr[DEFAULT_TRANSLATION]}</p>
                <figcaption className="text-[12.5px] font-semibold text-(--tone)">
                  Verset du cercle · {verseSurah!.meta.tname}, {space.verse_ref}
                </figcaption>
              </figure>
            )}

            {next && (
              <section aria-label="Prochaine rencontre" className="flex items-center gap-3.5 rounded-2xl border border-line bg-surface p-[18px]">
                <span className="w-14 flex-none rounded-xl bg-(--tone-soft) py-1.5 text-center leading-[1.1] text-(--tone)">
                  <b className="block text-[22px]">{next.getDate()}</b>
                  <span className="text-[11.5px] font-bold tracking-[0.06em] uppercase">
                    {new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(next)}
                  </span>
                </span>
                <span className="grid min-w-0">
                  <strong>Prochaine rencontre</strong>
                  <span className="text-[13px] text-muted first-letter:uppercase">
                    {dayFmt.format(next)}
                    {space.meet_time && ` · ${formatTime(space.meet_time)}`}
                  </span>
                </span>
              </section>
            )}

            <Panel icon={<BookOpen aria-hidden className="size-4" />} title="Séances" count={sessions?.length ?? 0}>
              {sessions?.length ? (
                <ul className="grid gap-2">
                  {sessions.map((s) => {
                    const meta = getSurahMeta(s.surah);
                    return (
                      <li key={s.id}>
                        <Link
                          href={`/cercles/${space.id}/seances/${s.id}`}
                          className="flex items-center gap-3.5 rounded-xl border border-line bg-surface py-2.5 pr-3 pl-2.5 hover:bg-surface-2"
                        >
                          <span lang="ar" className="grid size-[58px] flex-none place-items-center rounded-xl bg-(--tone-soft) font-ar text-[22px] leading-none font-bold text-(--tone)">
                            {meta?.ar}
                          </span>
                          <span className="grid min-w-0 flex-1">
                            <strong className="truncate">{s.title}</strong>
                            <span className="text-[13px] text-muted">
                              {meta ? `${meta.n}. ${meta.tname}` : `Sourate ${s.surah}`} · {dateFmt.format(new Date(s.created_at))}
                            </span>
                          </span>
                          <ChevronRight aria-hidden className="size-4 text-faint" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="grid justify-items-center gap-2.5 px-3 py-6 text-center text-muted">
                  <span className="grid size-13 place-items-center rounded-full bg-(--tone-soft) text-(--tone)">
                    <BookOpen aria-hidden className="size-[22px]" />
                  </span>
                  <strong className="text-ink">Aucune séance pour l&apos;instant</strong>
                  <span>
                    {canEdit
                      ? "Choisis une sourate pour ouvrir la première séance du cercle."
                      : "Les séances du cercle apparaîtront ici."}
                  </span>
                  {canEdit && <NewSessionSheet spaceId={space.id} surahs={surahList} action={createSession} />}
                </div>
              )}
            </Panel>
          </div>

          <div className="grid min-w-0 gap-[22px]">
            <Panel icon={<Pin aria-hidden className="size-4" />} title="Réflexion épinglée">
              {space.pinned_note ? (
                <>
                  <p className="-rotate-[0.8deg] rounded-xl bg-hl-theme px-4 py-3.5 font-hand text-[23px] leading-[1.2] font-medium text-c-sage">
                    {space.pinned_note}
                  </p>
                  <span className="text-[12.5px] text-muted">
                    {space.pinned_by ? people.get(space.pinned_by)?.name : "Un membre"}
                    {space.pinned_at && `, le ${shortFmt.format(new Date(space.pinned_at))}`}
                  </span>
                </>
              ) : (
                <p className="text-[13px] text-muted">
                  {canEdit
                    ? "Garde ici une pensée qui accompagne le cercle, par exemple la réflexion de la semaine."
                    : "Aucune réflexion épinglée pour l'instant."}
                </p>
              )}
              {canEdit && (
                <details>
                  <summary className="w-fit cursor-pointer text-[13px] font-semibold text-muted hover:text-ink">
                    {space.pinned_note ? "Changer la réflexion" : "Épingler une réflexion"}
                  </summary>
                  <form action={pinNote} className="mt-2 grid gap-2">
                    <input type="hidden" name="space_id" value={space.id} />
                    <textarea
                      name="note"
                      aria-label="Réflexion à épingler"
                      maxLength={280}
                      rows={3}
                      defaultValue={space.pinned_note ?? ""}
                      className="field-input resize-y"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button type="submit" className="btn primary">
                        <Pin aria-hidden />
                        Épingler
                      </button>
                      {space.pinned_note && (
                        <button type="submit" name="note" value="" className="btn ghost">
                          Retirer la réflexion
                        </button>
                      )}
                    </div>
                  </form>
                </details>
              )}
            </Panel>

            <Panel icon={<LayoutGrid aria-hidden className="size-4" />} title="Carte du Coran" count={`${studied.length} / 114`}>
              <QuranMap surahs={surahList} studied={studied} />
            </Panel>

            <Panel icon={<Users aria-hidden className="size-4" />} title="Membres" count={memberList.length} id="membres">
              <ul className="grid gap-2.5">
                {memberList.map((m) => (
                  <li key={m.user_id} className="flex items-center gap-2.5">
                    <PersonAvatar person={m.person} />
                    <span className="min-w-0 flex-1 truncate font-semibold">
                      {m.person.name}
                      {m.user_id === viewer.user.id && <span className="font-normal text-muted"> (toi)</span>}
                    </span>
                    <RoleChip role={m.role} />
                  </li>
                ))}
              </ul>
              {isOwner && memberList.length > 1 && (
                <details>
                  <summary className="w-fit cursor-pointer text-[13px] font-semibold text-muted hover:text-ink">
                    Gérer les rôles
                  </summary>
                  <ul className="mt-2 grid gap-2.5">
                    {memberList
                      .filter((m) => m.role !== "owner")
                      .map((m) => (
                        <li key={m.user_id} className="grid gap-1.5 rounded-xl bg-surface-2 p-2.5">
                          <span className="text-[13px] font-semibold">{m.person.name}</span>
                          <div className="flex flex-wrap items-center gap-2">
                            <form action={changeRole} className="flex gap-2">
                              <input type="hidden" name="space_id" value={space.id} />
                              <input type="hidden" name="user_id" value={m.user_id} />
                              <select
                                name="role"
                                defaultValue={m.role}
                                aria-label={`Rôle de ${m.person.name}`}
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
                              <button type="submit" className="btn ghost px-2.5 py-[5px] text-[13px] text-c-rose">
                                Retirer du cercle
                              </button>
                            </form>
                          </div>
                        </li>
                      ))}
                  </ul>
                </details>
              )}
              {canEdit && (
                <InviteSheet
                  spaceId={space.id}
                  origin={origin}
                  create={createInvite}
                  remove={deleteInvite}
                  label="Inviter quelqu'un"
                  invites={invites.map((i) => ({ token: i.token, role: i.role, expires: shortFmt.format(new Date(i.expires_at)) }))}
                />
              )}
            </Panel>
          </div>
        </div>
      </main>
    </>
  );
}

function Panel({
  icon,
  title,
  count,
  id,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number | string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} aria-label={title} className="grid scroll-mt-20 gap-3 rounded-2xl border border-line bg-surface p-[18px]">
      <div className="flex items-center gap-2">
        <span className="text-faint">{icon}</span>
        <h2 className="flex-1 text-[15.5px] font-bold">{title}</h2>
        {count !== undefined && <span className="text-[12.5px] text-faint tabular-nums">{count}</span>}
      </div>
      {children}
    </section>
  );
}
