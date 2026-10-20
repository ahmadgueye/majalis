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
      <p style={{ margin: 0, color: "var(--muted)" }}>
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
      <p role="status" style={{ margin: 0, lineHeight: 1.5 }}>
        Lien envoyé à <b>{email}</b>. Ouvre ta boîte mail et clique sur le lien pour te connecter.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
      <label htmlFor="email" style={{ fontWeight: 600, fontSize: 13 }}>
        Adresse e-mail
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{
          font: "inherit",
          color: "var(--ink)",
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 9,
          padding: "9px 12px",
        }}
      />
      {state === "error" && (
        <p role="alert" style={{ margin: 0, color: "var(--c-rose)" }}>
          L&apos;envoi a échoué : {message}
        </p>
      )}
      <button className="btn primary" type="submit" disabled={state === "sending"} style={{ justifyContent: "center" }}>
        {state === "sending" ? "Envoi…" : "Recevoir le lien de connexion"}
      </button>
    </form>
  );
}
