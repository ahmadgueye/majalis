import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur } = await searchParams;
  return (
    <main style={{ minHeight: "100%", display: "grid", placeItems: "center", padding: 24 }}>
      <div
        style={{
          width: "min(400px, 100%)",
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 16,
          padding: 24,
          boxShadow: "var(--shadow)",
          display: "grid",
          gap: 12,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20 }}>Se connecter à Majalis</h1>
        <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.5 }}>
          Entre ton adresse e-mail : tu recevras un lien pour te connecter, sans mot de passe.
        </p>
        {erreur === "lien" && (
          <p role="alert" style={{ margin: 0, color: "var(--c-rose)" }}>
            Ce lien a expiré ou a déjà servi. Demande-en un nouveau.
          </p>
        )}
        <LoginForm />
      </div>
    </main>
  );
}
