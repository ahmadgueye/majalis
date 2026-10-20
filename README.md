# Majalis

Espace collaboratif pour l'étude et le tadabbur du Coran : lecture, tableau d'annotation, notes, mot à mot wolof et discussion en temps réel.

Stack : Next.js (App Router, TypeScript) · Supabase (auth, Postgres, Realtime) · Vercel.

## Démarrer

```bash
npm install
cp .env.local.example .env.local   # puis remplir avec les clés Supabase
npm run dev
```

Sans `.env.local`, la lecture fonctionne déjà ; la connexion et les espaces partagés demandent Supabase.

## Base de données

Le schéma est dans `supabase/migrations/`. Pour l'appliquer à ton projet Supabase :

```bash
npx supabase login
npx supabase link --project-ref <ref-du-projet>
npx supabase db push
```

(ou colle le fichier SQL dans l'éditeur SQL du tableau de bord Supabase).

Dans **Authentication → URL Configuration**, ajoute `http://localhost:3000/auth/callback` et l'URL Vercel `/auth/callback` aux Redirect URLs.

## Texte du Coran

L'application sert elle-même le texte : aucun appel d'API à l'exécution.

- `data/tanzil/` : texte uthmani et métadonnées du [Tanzil Project](https://tanzil.net) (CC BY 3.0, recopié sans modification ; la mention de source est affichée dans l'app).
- `data/translations/*.raw.json` : traductions récupérées une fois depuis l'API publique de Quran.com (`npm run quran:fetch -- <id> <slug>`). Actuellement : Muhammad Hamidullah (id 31).
- `npm run quran:build` génère `src/data/quran/` (index + un fichier par sourate) à partir de ces sources.

La traduction Hamidullah est utilisée pour un usage personnel et non commercial ; vérifier sa licence avant toute diffusion publique.
