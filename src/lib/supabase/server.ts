import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { hasSupabase, supabaseKey, supabaseUrl } from "./env";

export async function createClient() {
  if (!hasSupabase) return null;
  const cookieStore = await cookies();
  return createServerClient<Database>(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Appelé depuis un Server Component : le middleware rafraîchit déjà la session.
        }
      },
    },
  });
}
