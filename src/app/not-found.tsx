import Link from "next/link";
import { Logo } from "@/components/Logo";

/** Page introuvable : aussi ce que voit une personne qui n'est pas membre d'un cercle. */
export default function NotFound() {
  return (
    <main className="grid min-h-full place-items-center p-6">
      <div className="grid max-w-[420px] justify-items-center gap-4 text-center">
        <Logo />
        <h1 className="font-read text-[30px] leading-tight font-medium">Page introuvable</h1>
        <p className="leading-normal text-muted">
          Cette page n&apos;existe pas, ou elle appartient à un cercle dont tu ne fais pas partie. Pour rejoindre un
          cercle, demande un lien d&apos;invitation à un de ses membres.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link className="btn primary" href="/cercles">
            Mes cercles
          </Link>
          <Link className="btn" href="/">
            Accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
