"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [google, setGoogle] = useState<"idle" | "going" | "error">("idle");
  const supabase = createClient();

  if (!supabase) {
    return (
      <p className="text-muted">
        La connexion n&apos;est pas encore configurée : renseigne <code>.env.local</code> (voir le README).
      </p>
    );
  }

  const back = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  // Google : pas d'e-mail à attendre, ni de limite d'envoi. Le retour passe par /auth/callback.
  async function withGoogle() {
    setGoogle("going");
    const { error } = await supabase!.auth.signInWithOAuth({ provider: "google", options: { redirectTo: back() } });
    if (error) {
      setGoogle("error");
      setMessage(error.message);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const { error } = await supabase!.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: back() },
    });
    if (error) {
      setState("error");
      setMessage(error.message);
    } else setState("sent");
  }

  if (state === "sent") {
    return (
      <p role="status" className="leading-normal">
        Lien envoyé à <b>{email}</b>. Ouvre ta boîte mail et clique sur le lien pour te connecter.
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      <button type="button" className="btn justify-center" onClick={withGoogle} disabled={google === "going"}>
        {google === "going" ? "Ouverture de Google…" : "Continuer avec Google"}
      </button>
      {google === "error" && (
        <p role="alert" className="text-c-rose">
          La connexion avec Google n&apos;a pas pu démarrer : {message}
        </p>
      )}
      <div className="flex items-center gap-3 text-[12.5px] text-muted" aria-hidden>
        <span className="h-px flex-1 bg-line" />
        ou par un lien reçu par e-mail
        <span className="h-px flex-1 bg-line" />
      </div>
      <form onSubmit={onSubmit} className="grid gap-2.5">
        <label htmlFor="email" className="text-[13px] font-semibold">
          Adresse e-mail
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-control border border-line bg-surface px-3 py-[9px] text-ink"
        />
        {state === "error" && (
          <p role="alert" className="text-c-rose">
            L&apos;envoi a échoué : {message}
          </p>
        )}
        <button className="btn primary justify-center" type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Envoi…" : "Recevoir le lien de connexion"}
        </button>
      </form>
    </div>
  );
}
