# Mise en ligne (usage personnel : Lecture, Traduire, Mes notes)

> État au 02/11/2026 : en ligne sur https://majalis.bayanun.com (projet Supabase `majalis`, `ytaqsethdedaeiszbayx`). Connexion Google faite avec le projet Google Cloud « deenshare ». Reste l'étape 4 (Google Drive).

En ligne, les cercles et les séances sont coupés (`NEXT_PUBLIC_CERCLES=off`) et le site n'est pas indexé par les moteurs de recherche. Tout est gratuit : Supabase (offre Free), Vercel (offre Hobby), Google Drive.

## 1. Pousser le code sur GitHub

Le dépôt doit être sur GitHub (privé, de préférence) pour que Vercel le déploie à chaque `git push`.

## 2. Supabase

1. Sur https://supabase.com, crée un projet (région proche : `eu-west-3` Paris ou `eu-central-1`). Garde le mot de passe de la base.
2. Dans le dossier du projet :
   ```bash
   npx supabase login
   npx supabase link --project-ref <ref du projet>
   npx supabase db push
   ```
   `db push` envoie toutes les migrations de `supabase/migrations/` (tables, règles RLS, notes).
3. **Authentication → URL Configuration** :
   - Site URL : `https://<ton-projet>.vercel.app`
   - Redirect URLs : `https://<ton-projet>.vercel.app/auth/callback`
4. Connecte-toi une fois sur le site en ligne (lien e-mail) pour créer ton compte, puis, dans **SQL Editor** :
   ```sql
   insert into public.translators (user_id) select id from auth.users where email = 'ton@adresse';
   ```
5. **Connexion Google** (conseillée : l'e-mail intégré n'envoie que 2 e-mails par heure) : dans Google Cloud, **Credentials → OAuth client ID**, type *Web application*, redirection `https://<ref>.supabase.co/auth/v1/callback` ; puis Supabase → **Authentication → Sign In / Providers → Google** : ID client et code secret. Si l'écran de consentement est en mode *Testing*, ajoute ton adresse dans les *Test users*.
6. (Facultatif) **Authentication → Sign In / Providers → section « User Signups » → désactive « Allow new users to sign up »** : plus personne ne peut créer de compte. Ton compte continue de se connecter. Attention, la ligne « Enable email signups » du fournisseur Email ne ferme que les inscriptions par e-mail.
7. **Project Settings → API Keys** : note l'URL du projet, la *Publishable key* et la *Secret key* (cette dernière ne va que dans Vercel).

> E-mails : le service d'e-mail intégré de Supabase est limité (quelques e-mails par heure), largement assez pour une personne.

## 3. Vercel

1. Sur https://vercel.com, « Add New → Project », importe le dépôt GitHub (framework Next.js détecté).
2. **Environment Variables** (Production) :

   | Variable | Valeur |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key |
   | `SUPABASE_SECRET_KEY` | Secret key (jamais ailleurs) |
   | `NEXT_PUBLIC_CERCLES` | `off` |
   | `CRON_SECRET` | une longue valeur aléatoire (`openssl rand -hex 32`) |
   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` | voir étape 4 (facultatif) |

3. Déploie. La tâche quotidienne (`vercel.json`) est créée toute seule : elle appelle `/api/cron/sauvegarde` chaque jour vers 4 h (UTC), avec `CRON_SECRET`.

## 4. Sauvegarde quotidienne vers Google Drive

La tâche quotidienne lit toute la base (ce qui **empêche la pause** du projet Supabase gratuit, qui s'endort après 7 jours sans activité), puis dépose `majalis-sauvegarde-AAAA-MM-JJ.json` dans un dossier **« Majalis — sauvegardes »** de ton Drive. Les 60 dernières sont gardées ; les plus anciennes vont à la corbeille du Drive.

Accès demandé : `drive.file`, c'est-à-dire seulement les fichiers créés par Majalis, rien d'autre de ton Drive.

1. https://console.cloud.google.com : crée un projet (« Majalis »).
2. **APIs & Services → Library** : active **Google Drive API**.
3. **OAuth consent screen** : type « External », nom « Majalis », ton e-mail. Ajoute le scope `.../auth/drive.file`. Puis **Publish app** (statut « In production ») : sinon Google coupe l'accès au bout de 7 jours. Pas besoin de validation par Google pour ce scope ; à la connexion, Google affichera « application non vérifiée » : continue, c'est la tienne.
4. **Credentials → Create credentials → OAuth client ID**, type **Desktop app**. Note l'identifiant et le secret.
5. Dans le dossier du projet :
   ```bash
   GOOGLE_CLIENT_ID=… GOOGLE_CLIENT_SECRET=… npm run drive:token
   ```
   Ouvre l'adresse affichée, accepte ; le terminal affiche `GOOGLE_REFRESH_TOKEN=…`.
6. Ajoute les trois variables `GOOGLE_*` dans Vercel et redéploie.

### Vérifier

```bash
curl -H "Authorization: Bearer <CRON_SECRET>" https://<ton-projet>.vercel.app/api/cron/sauvegarde
```
Réponse attendue : `{"ok":true,"counts":{…},"drive":{"name":"majalis-sauvegarde-…json",…}}`, et le fichier dans ton Drive. Sans les variables Google, `"drive":"non configuré"` : la base est quand même lue (pas de pause).

Vercel → projet → **Settings → Cron Jobs** montre les exécutions et permet d'en lancer une à la main.

## 5. Sauvegarde à la main

« Exporter mes traductions et notes » (Traduire et Mes notes) télécharge le même fichier JSON.
