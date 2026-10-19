import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { hasSupabase, supabaseKey, supabaseUrl } from "@/lib/supabase/env";

/** Rafraîchit la session Supabase à chaque requête (cookies httpOnly). */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!hasSupabase) return response;

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  // Les pages de lecture sont statiques et n'ont pas besoin de session.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|lire/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|json)$).*)"],
};
