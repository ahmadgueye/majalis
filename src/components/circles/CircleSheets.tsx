"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Link2, Plus, SlidersHorizontal, Trash2, UserPlus } from "lucide-react";
import { Sheet } from "@/components/Sheet";
import { ROLE_LABELS } from "@/lib/circles";
import type { Person } from "./Avatars";
import { CircleForm, type CircleValues } from "./CircleForm";

const EMPTY: CircleValues = {
  name: "",
  intention: "",
  tone: "sage",
  pattern: "etoile",
  coverUrl: null,
  verse: "",
  day: null,
  time: null,
};

type Action = (fd: FormData) => Promise<void>;

export function NewCircleSheet({ me, action }: { me: Person; action: Action }) {
  return (
    <Sheet
      title="Nouveau cercle"
      triggerClassName="btn primary"
      trigger={
        <>
          <Plus aria-hidden />
          Nouveau cercle
        </>
      }
    >
      {(close) => <CircleForm mode="create" initial={EMPTY} members={[me]} role="owner" action={action} onCancel={close} />}
    </Sheet>
  );
}

export function CircleSettingsSheet(props: { spaceId: string; initial: CircleValues; members: Person[]; action: Action }) {
  return (
    <Sheet
      title="Paramètres du cercle"
      triggerClassName="btn ghost"
      trigger={
        <>
          <SlidersHorizontal aria-hidden />
          Paramètres
        </>
      }
    >
      {(close) => <CircleForm mode="edit" role="owner" onCancel={close} {...props} />}
    </Sheet>
  );
}

type Invite = { token: string; role: string; expires: string };

/** Fenêtre « Inviter » : choisir le rôle, créer un lien, le copier ; liste des liens actifs. */
export function InviteSheet({
  spaceId,
  origin,
  invites,
  create,
  remove,
  label = "Inviter",
}: {
  spaceId: string;
  origin: string;
  invites: Invite[];
  create: (spaceId: string, role: "editor" | "viewer") => Promise<string | null>;
  remove: (spaceId: string, token: string) => Promise<void>;
  label?: string;
}) {
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const url = (token: string) => `${origin}/rejoindre/${token}`;

  function makeLink() {
    startTransition(async () => {
      const token = await create(spaceId, role);
      setFailed(!token);
      setLink(token ? url(token) : null);
    });
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Presse-papiers refusé : le lien reste affiché et sélectionnable.
    }
  }

  return (
    <Sheet
      title="Inviter dans le cercle"
      small
      trigger={
        <>
          <UserPlus aria-hidden />
          {label}
        </>
      }
    >
      {() => (
        <div className="grid gap-[18px] px-5 pt-3.5 pb-5">
          <div className="grid gap-1.5">
            <span className="text-[13px] font-semibold">Les personnes invitées pourront</span>
            <div className="inline-flex w-fit gap-[3px] rounded-[10px] border border-line bg-surface-2 p-[3px]" role="group" aria-label="Rôle des personnes invitées">
              {(["editor", "viewer"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={role === r}
                  onClick={() => {
                    setRole(r);
                    setLink(null);
                  }}
                  className={`rounded-[7px] px-3 py-1.5 font-semibold ${role === r ? "bg-surface text-ink shadow-card" : "text-muted"}`}
                >
                  {r === "editor" ? "Modifier" : "Seulement lire"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-1.5">
            {link ? (
              <>
                <label htmlFor="invite-link" className="text-[13px] font-semibold">
                  Lien à envoyer
                </label>
                <div className="flex gap-2">
                  <input id="invite-link" readOnly value={link} onFocus={(e) => e.target.select()} className="field-input min-w-0 flex-1 bg-surface-2 text-[13px]" />
                  <button type="button" className="btn primary" onClick={() => copy(link)}>
                    {copied === link ? <Check aria-hidden /> : <Copy aria-hidden />}
                    {copied === link ? "Copié" : "Copier"}
                  </button>
                </div>
              </>
            ) : (
              <button type="button" className="btn primary w-fit" onClick={makeLink} disabled={pending}>
                <Link2 aria-hidden />
                {pending ? "Création…" : "Créer un lien d'invitation"}
              </button>
            )}
            {failed && <span className="text-[13px] text-c-rose">Le lien n&apos;a pas pu être créé. Réessaie.</span>}
            <span className="text-[12.5px] text-faint">
              Valable 14 jours. La personne se connecte avec son e-mail, puis rejoint le cercle.
            </span>
          </div>

          {invites.length > 0 && (
            <div className="grid gap-1.5">
              <span className="text-[13px] font-semibold">Liens actifs</span>
              <ul className="grid gap-1.5">
                {invites.map((inv) => (
                  <li key={inv.token} className="flex items-center gap-2 rounded-[9px] bg-surface-2 px-2.5 py-1.5 text-[13px] text-muted">
                    <Link2 aria-hidden className="size-4 flex-none" />
                    <span className="min-w-0 flex-1 truncate">
                      {ROLE_LABELS[inv.role]} · jusqu&apos;au {inv.expires}
                    </span>
                    <button type="button" className="btn ghost px-2 py-1 text-[13px]" onClick={() => copy(url(inv.token))}>
                      {copied === url(inv.token) ? "Copié" : "Copier"}
                    </button>
                    <button
                      type="button"
                      className="btn ghost px-2 py-1 text-[13px]"
                      aria-label="Supprimer ce lien"
                      title="Supprimer ce lien"
                      onClick={() => startTransition(() => remove(spaceId, inv.token))}
                    >
                      <Trash2 aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

/** Fenêtre « Nouvelle séance » : une sourate et un titre facultatif. */
export function NewSessionSheet({
  spaceId,
  surahs,
  action,
  label = "Nouvelle séance",
}: {
  spaceId: string;
  surahs: { n: number; tname: string; ar: string }[];
  action: Action;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <Sheet
      title="Nouvelle séance"
      small
      triggerClassName="btn primary"
      trigger={
        <>
          <Plus aria-hidden />
          {label}
        </>
      }
    >
      {(close) => (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            startTransition(() => action(fd));
          }}
        >
          <input type="hidden" name="space_id" value={spaceId} />
          <div className="grid gap-[18px] px-5 pt-3.5 pb-5">
            <label className="grid gap-1.5 text-[13px] font-semibold">
              Sourate
              <select name="surah" defaultValue={1} className="field-input font-normal">
                {surahs.map((s) => (
                  <option key={s.n} value={s.n}>
                    {s.n}. {s.tname} — {s.ar}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-[13px] font-semibold">
              <span>
                Titre <span className="font-normal text-faint">(facultatif)</span>
              </span>
              <input name="title" maxLength={120} placeholder="Par exemple : versets 1 à 10" className="field-input font-normal" />
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-line px-5 pt-3.5 pb-[18px]">
            <button type="button" className="btn ghost" onClick={close}>
              Annuler
            </button>
            <button type="submit" className="btn primary" disabled={pending}>
              <Plus aria-hidden />
              {pending ? "Création…" : "Créer la séance"}
            </button>
          </div>
        </form>
      )}
    </Sheet>
  );
}
