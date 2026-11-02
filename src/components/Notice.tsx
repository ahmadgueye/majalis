/** Message d'erreur en tête de page, après une action refusée. */
export function ErrorNotice({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-xl border border-c-rose/40 bg-hl-link px-4 py-3 text-c-rose">
      {message}
    </p>
  );
}
