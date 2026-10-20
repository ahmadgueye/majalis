"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireViewer } from "@/lib/auth";

// Actions des cercles et des séances. Les droits sont vérifiés par la base (RLS) :
// une action refusée n'écrit rien et renvoie vers la page avec un message.

const text = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

function fail(path: string, code: string): never {
  redirect(`${path}?erreur=${code}`);
}

export async function createSpace(fd: FormData) {
  const { supabase } = await requireViewer("/cercles");
  const name = text(fd, "name");
  if (!name) fail("/cercles", "nom");
  const { data: id, error } = await supabase.rpc("create_space", { space_name: name });
  if (error || !id) fail("/cercles", "creation");
  redirect(`/cercles/${id}`);
}

export async function renameSpace(fd: FormData) {
  const id = text(fd, "space_id");
  const path = `/cercles/${id}`;
  const { supabase } = await requireViewer(path);
  const name = text(fd, "name");
  if (!name) fail(path, "nom");
  const { data, error } = await supabase.from("spaces").update({ name }).eq("id", id).select("id");
  if (error || !data?.length) fail(path, "modification");
  revalidatePath(path);
  redirect(path);
}

export async function createSession(fd: FormData) {
  const spaceId = text(fd, "space_id");
  const path = `/cercles/${spaceId}`;
  const { supabase } = await requireViewer(path);
  const surah = Number(text(fd, "surah"));
  const title = text(fd, "title") || "Nouvelle séance";
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

export async function createInvite(fd: FormData) {
  const spaceId = text(fd, "space_id");
  const path = `/cercles/${spaceId}`;
  const { supabase } = await requireViewer(path);
  const role = text(fd, "role") === "viewer" ? "viewer" : "editor";
  const { error } = await supabase.from("space_invites").insert({ space_id: spaceId, role });
  if (error) fail(path, "creation");
  revalidatePath(path);
  redirect(`${path}#inviter`);
}

export async function deleteInvite(fd: FormData) {
  const spaceId = text(fd, "space_id");
  const path = `/cercles/${spaceId}`;
  const { supabase } = await requireViewer(path);
  await supabase.from("space_invites").delete().eq("token", text(fd, "token"));
  revalidatePath(path);
  redirect(`${path}#inviter`);
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
