"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireViewer, type Viewer } from "@/lib/auth";
import { isPattern, isTone } from "@/lib/circles";
import { COVER_BUCKET } from "@/lib/circles-server";
import { getSurahMeta } from "@/lib/quran";

// Actions des cercles et des séances. Les droits sont vérifiés par la base (RLS) :
// une action refusée n'écrit rien et renvoie vers la page avec un message.

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

function fail(path: string, code: string): never {
  redirect(`${path}?erreur=${code}`);
}

/** Champs de personnalisation envoyés par la fenêtre du cercle (création et paramètres). */
function circleFields(fd: FormData) {
  const verse = text(fd, "verse");
  const m = /^(\d{1,3}):(\d{1,3})$/.exec(verse);
  const meta = m ? getSurahMeta(Number(m[1])) : undefined;
  const verseOk = !!meta && Number(m![2]) >= 1 && Number(m![2]) <= meta.ayas;
  const day = Number(text(fd, "day"));
  const time = text(fd, "time");
  const tone = text(fd, "tone");
  const pattern = text(fd, "pattern");
  return {
    name: text(fd, "name").slice(0, 80),
    intention: text(fd, "intention").slice(0, 200),
    tone: isTone(tone) ? tone : "teal",
    cover_pattern: isPattern(pattern) ? pattern : "etoile",
    verse_ref: verseOk ? `${meta!.n}:${Number(m![2])}` : null,
    meet_day: day >= 1 && day <= 7 ? day : null,
    meet_time: day >= 1 && /^\d{2}:\d{2}$/.test(time) ? time : null,
  };
}

/** Envoie la couverture (déjà réduite par le navigateur) et renvoie son chemin, ou null. */
async function uploadCover(db: Viewer["supabase"], spaceId: string, fd: FormData) {
  const file = fd.get("cover_file");
  if (!(file instanceof File) || file.size === 0) return null;
  const ext = file.type === "image/png" ? "png" : file.type === "image/jpeg" ? "jpg" : "webp";
  const path = `${spaceId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from(COVER_BUCKET).upload(path, file, { contentType: file.type });
  return error ? null : path;
}

export async function createSpace(fd: FormData) {
  const { supabase } = await requireViewer("/cercles");
  const fields = circleFields(fd);
  if (!fields.name) fail("/cercles", "nom");
  const { data: id, error } = await supabase.rpc("create_space", { space_name: fields.name });
  if (error || !id) fail("/cercles", "creation");
  const cover_path = text(fd, "cover") === "upload" ? await uploadCover(supabase, id, fd) : null;
  await supabase.from("spaces").update({ ...fields, cover_path }).eq("id", id);
  redirect(`/cercles/${id}`);
}

export async function updateSpace(fd: FormData) {
  const id = text(fd, "space_id");
  const path = `/cercles/${id}`;
  const { supabase } = await requireViewer(path);
  const fields = circleFields(fd);
  if (!fields.name) fail(path, "nom");

  const { data: before } = await supabase.from("spaces").select("cover_path").eq("id", id).maybeSingle();
  const cover = text(fd, "cover"); // "keep" (image actuelle), "upload" (nouvelle image) ou "pattern"
  let cover_path = before?.cover_path ?? null;
  if (cover === "upload") cover_path = (await uploadCover(supabase, id, fd)) ?? cover_path;
  if (cover === "pattern") cover_path = null;

  const { data, error } = await supabase.from("spaces").update({ ...fields, cover_path }).eq("id", id).select("id");
  if (error || !data?.length) fail(path, "modification");
  if (before?.cover_path && before.cover_path !== cover_path) {
    await supabase.storage.from(COVER_BUCKET).remove([before.cover_path]);
  }
  revalidatePath(path);
  revalidatePath("/cercles");
  redirect(path);
}

export async function pinNote(fd: FormData) {
  const id = text(fd, "space_id");
  const path = `/cercles/${id}`;
  const { supabase } = await requireViewer(path);
  const { error } = await supabase.rpc("pin_note", { sid: id, note: text(fd, "note").slice(0, 280) });
  if (error) fail(path, "modification");
  revalidatePath(path);
  redirect(path);
}

export async function createSession(fd: FormData) {
  const spaceId = text(fd, "space_id");
  const path = `/cercles/${spaceId}`;
  const { supabase } = await requireViewer(path);
  const surah = Number(text(fd, "surah"));
  const title = text(fd, "title") || getSurahMeta(surah)?.tname || "Nouvelle séance";
  const { data, error } = await supabase
    .from("sessions")
    .insert({ space_id: spaceId, title, surah })
    .select("id")
    .single();
  if (error || !data) fail(path, "creation");
  redirect(`${path}/seances/${data.id}`);
}

export async function renameSession(fd: FormData) {
  const spaceId = text(fd, "space_id");
  const id = text(fd, "session_id");
  const path = `/cercles/${spaceId}/seances/${id}`;
  const { supabase } = await requireViewer(path);
  const title = text(fd, "title");
  if (!title) fail(path, "nom");
  const { data, error } = await supabase.from("sessions").update({ title }).eq("id", id).select("id");
  if (error || !data?.length) fail(path, "modification");
  revalidatePath(path);
  redirect(path);
}

/** Crée un lien d'invitation ; appelée depuis la fenêtre « Inviter », qui reste ouverte. */
export async function createInvite(spaceId: string, role: "editor" | "viewer") {
  const { supabase } = await requireViewer(`/cercles/${spaceId}`);
  const { data, error } = await supabase
    .from("space_invites")
    .insert({ space_id: spaceId, role: role === "viewer" ? "viewer" : "editor" })
    .select("token")
    .single();
  revalidatePath(`/cercles/${spaceId}`);
  return error || !data ? null : data.token;
}

export async function deleteInvite(spaceId: string, token: string) {
  const { supabase } = await requireViewer(`/cercles/${spaceId}`);
  await supabase.from("space_invites").delete().eq("token", token);
  revalidatePath(`/cercles/${spaceId}`);
}

export async function changeRole(fd: FormData) {
  const spaceId = text(fd, "space_id");
  const path = `/cercles/${spaceId}`;
  const { supabase } = await requireViewer(path);
  const role = text(fd, "role") === "viewer" ? "viewer" : "editor";
  const { data, error } = await supabase
    .from("space_members")
    .update({ role })
    .eq("space_id", spaceId)
    .eq("user_id", text(fd, "user_id"))
    .select("user_id");
  if (error || !data?.length) fail(path, "modification");
  revalidatePath(path);
  redirect(`${path}#membres`);
}

export async function removeMember(fd: FormData) {
  const spaceId = text(fd, "space_id");
  const path = `/cercles/${spaceId}`;
  const { supabase } = await requireViewer(path);
  await supabase.from("space_members").delete().eq("space_id", spaceId).eq("user_id", text(fd, "user_id"));
  revalidatePath(path);
  redirect(`${path}#membres`);
}

export async function joinSpace(fd: FormData) {
  const token = text(fd, "token");
  const path = `/rejoindre/${token}`;
  const { supabase } = await requireViewer(path);
  const { data: id, error } = await supabase.rpc("accept_invite", { invite_token: token });
  if (error || !id) fail(path, "invitation");
  redirect(`/cercles/${id}`);
}
