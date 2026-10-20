import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur } = await searchParams;
  return (
    <main className="grid min-h-full place-items-center p-6">
      <div className="grid w-full max-w-[400px] gap-3 rounded-2xl border border-line bg-surface p-6 shadow-card">
        <h1 className="text-xl font-bold">Se connecter à Majalis</h1>
        <p className="leading-normal text-muted">
          Entre ton adresse e-mail : tu recevras un lien pour te connecter, sans mot de passe.
        </p>
        {erreur === "lien" && (
          <p role="alert" className="text-c-rose">
            Ce lien a expiré ou a déjà servi. Demande-en un nouveau.
          </p>
        )}
        <LoginForm />
      </div>
    </main>
  );
}
