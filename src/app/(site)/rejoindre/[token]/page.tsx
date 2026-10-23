import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { ErrorNotice } from "@/components/Notice";
import { requireViewer } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/circles";
import { errorMessage } from "@/lib/messages";
import { joinSpace } from "@/app/cercles/actions";

export const metadata: Metadata = { title: "Rejoindre un cercle" };

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ erreur?: string }>;
};

/** Ouverte depuis un lien d'invitation : montre le cercle et propose de le rejoindre. */
export default async function JoinPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { erreur } = await searchParams;
  const viewer = await requireViewer(`/rejoindre/${token}`);
  const { data } = await viewer.supabase.rpc("invite_info", {
    invite_token: token,
  });
  const invite = data?.[0];

  return (
    <>
      <main className="grid min-h-[calc(100dvh-3.5rem)] place-items-center p-6">
        <div className="grid w-full max-w-[420px] justify-items-start gap-4 rounded-2xl border border-line bg-surface p-6 shadow-card">
          <Logo />
          <ErrorNotice message={errorMessage(erreur)} />
          {!invite ? (
            <>
              <h1 className="text-xl font-bold">Invitation introuvable</h1>
              <p className="leading-normal text-muted">
                Ce lien a expiré ou a été supprimé. Demande un nouveau lien à la personne qui t&apos;a invité.
              </p>
              <Link className="btn" href="/cercles">
                Voir mes cercles
              </Link>
            </>
          ) : invite.already_member ? (
            <>
              <h1 className="text-xl font-bold">Tu fais déjà partie de « {invite.space_name} »</h1>
              <Link className="btn primary" href={`/cercles/${invite.space_id}`}>
                Ouvrir le cercle
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold">Rejoindre « {invite.space_name} »</h1>
              <p className="leading-normal text-muted">
                {invite.invited_by ? `${invite.invited_by} t'invite` : "Tu es invité"} à étudier dans ce cercle. Ton
                rôle : <b className="text-ink">{ROLE_LABELS[invite.role]}</b>.
              </p>
              <form action={joinSpace}>
                <input type="hidden" name="token" value={token} />
                <button type="submit" className="btn primary">
                  Rejoindre le cercle
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </>
  );
}
