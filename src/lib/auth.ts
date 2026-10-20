import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** La personne connectée (ou null) et son profil. */
export async function getViewer() {
  const supabase = await createClient();
  if (!supabase) return null;
  const { user } = (await supabase.auth.getUser()).data;
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
  return { supabase, user, name: profile?.display_name ?? "", email: user.email ?? "" };
}

export type Viewer = NonNullable<Awaited<ReturnType<typeof getViewer>>>;

/** Comme getViewer, mais renvoie vers la connexion (puis vers `next`) si personne n'est connecté. */
export async function requireViewer(next: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/connexion?suite=${encodeURIComponent(next)}`);
  return viewer;
}

