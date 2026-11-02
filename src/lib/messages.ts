/** Messages d'erreur affichés après une action (paramètre `?erreur=` de l'URL). */
export const ERRORS: Record<string, string> = {
  nom: "Donne un nom avant de valider.",
  creation: "La création a échoué. Réessaie dans un instant.",
  modification: "La modification n'a pas été enregistrée. Seuls les membres qui peuvent modifier en ont le droit.",
  invitation: "Ce lien d'invitation n'est plus valable. Demande-en un nouveau à la personne qui t'a invité.",
};

export function errorMessage(code?: string) {
  return code ? (ERRORS[code] ?? "Une erreur est survenue.") : null;
}
