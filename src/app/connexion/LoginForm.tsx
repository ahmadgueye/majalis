"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const supabase = createClient();

  if (!supabase) {
    return (
      <p className="text-muted">
        La connexion n&apos;est pas encore configurée : renseigne <code>.env.local</code> (voir le README).
      </p>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const { error } = await supabase!.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
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
  );
}
