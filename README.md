# Majalis

Espace collaboratif pour l'étude et le tadabbur du Coran : lecture, tableau d'annotation, notes, mot à mot wolof et discussion en temps réel.

Stack : Next.js (App Router, TypeScript) · Supabase (auth, Postgres, Realtime) · Vercel.

## Démarrer en local

Prérequis : Node 20+ et Docker Desktop lancé.

```bash
npm install
npm run db:start                    # Supabase local dans Docker (le 1er lancement télécharge les images)
cp .env.local.example .env.local    # les valeurs par défaut pointent déjà sur Supabase local
npm run dev                         # http://localhost:3100
```

Sans `.env.local`, la lecture fonctionne déjà ; la connexion et les espaces partagés demandent Supabase.

| Service local | Adresse |
|---|---|
| API Supabase | http://127.0.0.1:54321 |
| Studio (tableau de bord) | http://127.0.0.1:54323 |
| Boîte mail de test (Mailpit) : les liens de connexion y arrivent | http://127.0.0.1:54324 |
| PostgreSQL | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

## Base de données

Le schéma est dans `supabase/migrations/` ; la configuration locale dans `supabase/config.toml`.

```bash
npm run db:start    # démarre Supabase et applique les migrations
npm run db:reset    # recrée la base locale depuis les migrations (efface les données)
npm run db:types    # régénère src/lib/supabase/database.types.ts
npm run db:status   # adresses et clés locales
npm run db:stop     # arrête les conteneurs
```

Nouvelle migration : `npx supabase migration new <nom>`, écrire le SQL, puis `npm run db:reset`.

### Plus tard : le projet Supabase en ligne

```bash
npx supabase login
npx supabase link --project-ref <ref-du-projet>
npx supabase db push
```

Dans **Authentication → URL Configuration**, ajouter l'URL Vercel suivie de `/auth/callback` aux Redirect URLs, et mettre l'URL et la clé publique du projet dans les variables d'environnement Vercel.

## Texte du Coran

L'application sert elle-même le texte : aucun appel d'API à l'exécution.

- `data/tanzil/` : texte uthmani et métadonnées du [Tanzil Project](https://tanzil.net) (CC BY 3.0, recopié sans modification ; la mention de source est affichée dans l'app).
- `data/translations/*.raw.json` : traductions récupérées une fois depuis l'API publique de Quran.com (`npm run quran:fetch -- <id> <slug>`). Actuellement : Muhammad Hamidullah (id 31).
- `npm run quran:build` génère `src/data/quran/` (index + un fichier par sourate) à partir de ces sources.

La traduction Hamidullah est utilisée pour un usage personnel et non commercial ; vérifier sa licence avant toute diffusion publique.
