import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  return (
    <main className="grid min-h-full place-items-center p-6">
      <div className="grid max-w-[420px] justify-items-center gap-3.5 text-center">
        <span
          aria-hidden
          className="grid size-14 place-items-center rounded-[14px] bg-accent font-mark text-[32px] leading-none font-bold text-accent-ink"
        >
          م
        </span>
        <h1 className="text-[28px] font-bold">Majalis</h1>
        <p className="leading-normal text-muted">Lire, méditer et annoter le Coran ensemble.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link className="btn primary" href="/lire/1">
            Ouvrir la lecture
          </Link>
          {user ? (
            <span className="btn" aria-disabled>
              Connecté : {user.email}
            </span>
          ) : (
            <Link className="btn" href="/connexion">
              Se connecter
            </Link>
          )}
        </div>
        {!supabase && (
          <p className="text-xs text-faint">
            Supabase n&apos;est pas encore configuré : renseigne <code>.env.local</code> pour activer la connexion.
          </p>
        )}
      </div>
    </main>
  );
}
