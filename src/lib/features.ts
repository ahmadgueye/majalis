// Parties de l'app qu'on peut couper en ligne, le temps de les finir.
// NEXT_PUBLIC_CERCLES=off : les cercles et les séances disparaissent (liens et pages), l'accueil mène
// à la Lecture et, une fois connecté, on arrive sur Traduire. En local, tout reste visible.

export const CIRCLES = process.env.NEXT_PUBLIC_CERCLES !== "off";

/** Page d'arrivée une fois connecté. */
export const HOME = CIRCLES ? "/cercles" : "/traduire";
export const HOME_LABEL = CIRCLES ? "Mes cercles" : "Traduire";
