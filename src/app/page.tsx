import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  return (
    <main style={{ minHeight: "100%", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ textAlign: "center", display: "grid", gap: 14, justifyItems: "center", maxWidth: 420 }}>
        <span
          aria-hidden
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: "var(--accent)",
            color: "var(--accent-ink)",
            display: "grid",
            placeItems: "center",
            fontFamily: '"Geeza Pro", "Noto Naskh Arabic", var(--f-ui)',
            fontWeight: 700,
            fontSize: 32,
            lineHeight: 1,
          }}
        >
          م
        </span>
        <h1 style={{ margin: 0, fontSize: 28 }}>Majalis</h1>
        <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.5 }}>
          Lire, méditer et annoter le Coran ensemble.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
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
          <p style={{ margin: 0, fontSize: 12, color: "var(--faint)" }}>
            Supabase n&apos;est pas encore configuré : renseigne <code>.env.local</code> pour activer la connexion.
          </p>
        )}
      </div>
    </main>
  );
}
