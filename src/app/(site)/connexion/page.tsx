import type { Metadata } from "next";
import { HOME } from "@/lib/features";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Connexion" };

type Props = { searchParams: Promise<{ erreur?: string; suite?: string }> };
// erreur=lien : lien expiré ou déjà utilisé ; erreur=acces : refusé (inscriptions fermées, connexion annulée).

export default async function LoginPage({ searchParams }: Props) {
  const { erreur, suite } = await searchParams;
  // Page où revenir après la connexion (lien d'invitation, page protégée) ; chemin interne seulement.
  const next = suite && suite.startsWith("/") && !suite.startsWith("//") ? suite : HOME;
  if (await getViewer()) redirect(next);
  return (
    <>
      <main className="grid min-h-[calc(100dvh-3.5rem)] place-items-center p-6">
        <div className="grid w-full max-w-[400px] gap-3 rounded-2xl border border-line bg-surface p-6 shadow-card">
          <h1 className="text-xl font-bold">Se connecter à Majalis</h1>
          <p className="leading-normal text-muted">
            Avec ton compte Google, ou avec un lien reçu par e-mail : pas de mot de passe.
          </p>
          {erreur === "lien" && (
            <p role="alert" className="text-c-rose">
              Ce lien a expiré ou a déjà servi. Demande-en un nouveau.
            </p>
          )}
          {erreur === "acces" && (
            <p role="alert" className="text-c-rose">
              Connexion refusée : ce compte n&apos;a pas accès à Majalis.
            </p>
          )}
          <LoginForm next={next} />
        </div>
      </main>
    </>
  );
}
