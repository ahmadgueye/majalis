import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Connexion" };

type Props = { searchParams: Promise<{ erreur?: string; suite?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { erreur, suite } = await searchParams;
  // Page où revenir après la connexion (lien d'invitation, page protégée) ; chemin interne seulement.
  const next = suite && suite.startsWith("/") && !suite.startsWith("//") ? suite : "/cercles";
  if (await getViewer()) redirect(next);
  return (
    <>
      <main className="grid min-h-[calc(100dvh-3.5rem)] place-items-center p-6">
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
          <LoginForm next={next} />
        </div>
      </main>
    </>
  );
}
