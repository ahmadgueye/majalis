"use server";

import { revalidatePath } from "next/cache";
import { requireViewer } from "@/lib/auth";

/** Publie les brouillons des versets donnés ; la base vérifie que la personne est traductrice. */
export async function publishWolof(surah: number, refs: string[]) {
  const { supabase } = await requireViewer(`/traduire/${surah}`);
  const ok = refs.filter((r) => r.startsWith(`${surah}:`));
  if (!ok.length) return false;
  const { error } = await supabase.rpc("publish_wolof", { refs: ok });
  if (error) return false;
  // La page Lecture est générée à l'avance : on la régénère avec le wolof publié.
  revalidatePath(`/lire/${surah}`);
  return true;
}
