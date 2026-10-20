# Majalis : guide de passation pour les agents

Ce fichier donne tout le contexte nécessaire pour reprendre le projet. Lis-le en entier avant de coder. L'installation est décrite dans `README.md`.

## Le projet en bref

**Majalis** (« les assemblées », au sens des cercles d'étude) est une application web collaborative pour étudier le Coran à plusieurs, avec un accent sur le **tafsir et le tadabbur** (réflexion), pas sur la mémorisation.

- **Utilisateurs** : d'abord le porteur du projet et son épouse, puis ses étudiants.
- **Inspirations** : Qurannotate (bon design mais UX confuse, fonctions qui ne marchent pas), QuranSpace (espace partagé encore en bêta), Figma, tldraw, Excalidraw.
- **Ce que fait l'app** : lecture du Coran, tableau d'annotation libre (cartes de versets, notes, flèches, cadres, crayon), surlignages, commentaires avec @mentions, traduction mot à mot en **wolof**, glossaire partagé, collaboration en temps réel.
- **Le porteur du projet est développeur** et en fait son **mémoire de master 2 en génie logiciel** (voir plus bas).

## Règles à respecter

- **Langue** : toute l'interface est en **français**. Le wolof s'écrit en **alphabet latin** (lettres à é ë ó ñ ŋ).
- **Commits** : **ne jamais ajouter de ligne `Co-Authored-By`** ni aucune attribution à une IA dans les messages de commit. Messages en français.
- **Branches** : on travaille sur des branches de fonctionnalité (`feat/...`), pas sur `main`.
- **Pas d'API à l'exécution pour le Coran** : le texte est servi par l'app elle-même (voir « Données coraniques »).
- **Coût zéro** : uniquement des offres gratuites (Supabase, Vercel). Ne pas introduire de service payant ni de bibliothèque sous licence payante. **tldraw est exclu** (clé de licence payante en production) : le tableau est fait maison.
- **Le texte Tanzil ne doit jamais être modifié** (licence) : on peut seulement le découper pour l'affichage, comme la séparation de la basmala.

## Principes d'UX (demande explicite du porteur)

Le but est une app **très simple et sans ambiguïté**, en réaction aux défauts de Qurannotate :

1. **Chaque contrôle a un libellé lisible** et fait ce qu'il annonce. Aucun bouton inactif, aucune icône mystère.
2. **Afficher seulement ce qui sert à ce qu'on fait maintenant** : le reste apparaît à la demande (panneau à droite, menus ⋯, couleurs visibles seulement quand on dessine ou sélectionne).
3. **Deux zones** : la lecture à gauche (repliable) et le tableau en grand. La discussion, le tafsir, le glossaire et les repères s'ouvrent dans **un seul panneau à droite** qui se ferme.
4. Barre d'outils du tableau **en bas au centre** ; annuler, rétablir et zoom **en haut à droite** ; aide contextuelle brève qui disparaît.
5. Un verset sélectionné montre une seule rangée d'actions : Ajouter au tableau, Réflexion, Commenter, Tafsir, Surligner. Les couleurs ne s'affichent qu'au clic sur Surligner.
6. Les couleurs de surlignage ont un **sens fixe** : Thème (sauge), Question (ciel), À méditer (sable), Lien (rose).

## Référence visuelle : les prototypes

`prototypes/majalis-v2.html` est **la référence d'UX à reproduire** dans l'app Next.js. C'est un fichier HTML autonome, à ouvrir dans un navigateur. `prototypes/majalis-v1.html` est l'ancienne version (trois colonnes), gardée pour comparer. `prototypes/cercles-v1.html` est la maquette des cercles (https://claude.ai/artifact/BRv6ZaVeGgwYosnixYzxib), portée dans `src/app/cercles/`. `prototypes/landing-v1.html` est la maquette de la page d'accueil publique (publiée sur https://claude.ai/artifact/Rde9tE8osyrkJGhfKYdzpt), portée dans `src/app/page.tsx`.

Les deux sont aussi publiés en ligne (pages privées du porteur sur claude.ai) :
- v2 : https://claude.ai/artifact/Ho3AeDVMKsVHcUnf75czJe
- v1 : https://claude.ai/artifact/KQkhSLrkqGidymdfKGpEJE

Les fichiers de `prototypes/` correspondent à la dernière version publiée. Si un prototype est modifié en ligne, mettre à jour le fichier local.

La v2 contient déjà, en JavaScript pur, la logique à porter :

- **Tableau** :
  - caméra (déplacement, zoom à la molette, « Tout voir ») ;
  - éléments `verse`, `note`, `text`, `rect`, `arrow`, `stroke` ;
  - flèches **liées aux éléments** qu'elles relient, qui les suivent quand on les déplace ;
  - **flèches courbes** (propriété `bend`, poignée au milieu, bouton « Redresser ») ;
  - **style « Main levée »** (police Caveat et trait crayonné, irrégularité calculée à partir de l'identifiant de l'élément pour rester stable) ;
  - redimensionnement, dupliquer, supprimer, annuler et rétablir, double-clic sur le fond pour créer une note.
- **Mot à mot wolof** :
  - découpage en **mots entiers**, avec fusion et séparation de mots ;
  - navigation au clavier (Tab : mot suivant, Entrée : verset suivant) ;
  - **suggestions** tirées des traductions précédentes : même forme normalisée sans voyelles, ou forme proche sans le préfixe و ou ف. Tab accepte la suggestion, Échap l'ignore ;
  - barre d'insertion des lettres wolof ;
  - traduction libre du verset ;
  - glossaire avec recherche.
- **Affichage du wolof** : en mode Lecture et sur les cartes normales, le wolof s'affiche **comme une simple phrase** sous le français, dans la couleur d'accent. C'est la traduction libre si elle existe, sinon les mots mis bout à bout. Les cartes « mot à mot » gardent la présentation interlinéaire.
- **Discussion** : fils ancrés sur un verset, un mot, un élément du tableau ou toute la séance ; @mentions avec autocomplétion ; filtres Ouverts, Mentions et Résolus ; résolution des fils.
- La **présence de « Khadija »** dans le prototype est **simulée**. Dans l'app, elle doit venir de Supabase Realtime.

## Design

- Les jetons (couleurs claires et sombres) sont dans `src/app/globals.css`, repris de la v2.
- **Polices** (via `next/font`, variables posées sur `<html>`) :
  - Figtree pour l'interface ;
  - **EB Garamond pour les traductions** (français et wolof), à la demande du porteur ;
  - **Scheherazade New pour l'arabe** (texte coranique et titres), à la demande du porteur ;
  - Caveat pour le style main levée.
- Le logo « م » utilise une police arabe système, choix hérité d'Amiri Quran (l'ancienne police arabe), qui ne l'affichait pas dans la pastille.

### Style : Tailwind v4 et jetons

- **Tailwind v4** (via `@tailwindcss/postcss`, sans fichier `tailwind.config`). Tout se règle dans `src/app/globals.css`.
- **Les jetons restent la seule source** des couleurs et des polices. `@theme inline` les expose en classes : `bg-surface`, `text-muted`, `border-line`, `bg-hl-question`, `text-c-rose`, `font-ar`, `font-read`, `font-hand`, `font-mark`, `shadow-card`, `rounded-control`, `text-ar`, `text-tr`.
- La palette et les polices par défaut de Tailwind sont **retirées** (`--color-*: initial`) : `bg-red-500` n'existe pas, c'est voulu.
- **Règle** : jamais de couleur ni de police en dur dans un composant, ni de `style={{ … }}` pour de la mise en forme. Pour changer une couleur ou une police, on modifie la variable dans `:root` (et sa version sombre), rien d'autre.
- Le mode sombre passe par les variables : pas besoin de classes `dark:`. Il suit `prefers-color-scheme`, sauf si la personne a choisi avec le bouton de thème (`ThemeToggle`, choix dans `localStorage` sous `majalis-theme`, posé en `data-theme` sur `<html>` par un script du layout avant l'affichage). Les valeurs sombres existent donc **deux fois** dans `globals.css` (bloc `@media` et bloc `[data-theme="dark"]`) : les garder identiques.
- Le code qui dessine (SVG du tableau, trait main levée) lit les variables CSS (`var(--accent)`), jamais des valeurs copiées.
- Classes de composant (`@layer components`) :
  - `.btn`, `.btn.primary`, `.btn.ghost` ;
  - `.field-input` pour les champs ;
  - `dialog.sheet` pour les fenêtres (composant `Sheet`) ;
  - `.tone-<teinte>`, qui pose `--tone` et `--tone-soft` pour la teinte d'un cercle (utilisées en `bg-(--tone)`, `text-(--tone)`).

  `px-safe` donne les marges latérales qui respectent les encoches.
- **Icônes** : `lucide-react` (licence ISC), toujours à côté d'un libellé. Une icône seule doit avoir `aria-label` et `title`.

## Stack et architecture

- **Next.js 15** (App Router, TypeScript, Turbopack), `src/` comme racine, alias `@/*`.
- **Supabase** : authentification par lien e-mail, PostgreSQL avec RLS, Realtime. Clients dans `src/lib/supabase/` (`client.ts`, `server.ts`, `env.ts`). Le middleware `src/middleware.ts` rafraîchit la session et ne s'applique pas aux pages `/lire/`.
- **Sans `.env.local`**, `createClient()` renvoie `null` : la lecture fonctionne et la connexion affiche un message au lieu de planter.
- **Développement en local** : Supabase tourne dans Docker via la CLI (`supabase` en devDependency, config dans `supabase/config.toml`). `npm run db:start` démarre les conteneurs et applique les migrations ; les e-mails de connexion arrivent dans Mailpit (http://127.0.0.1:54324). Edge runtime et analytics sont désactivés pour alléger. Les adresses et commandes sont dans le README.
- **Hébergement** : Vercel. Prévoir l'app installable (PWA).

### Arborescence utile

```
data/tanzil/                 texte uthmani + métadonnées Tanzil (sources, avec licence)
data/translations/*.raw.json traductions brutes récupérées une fois (Quran.com)
scripts/build-quran.mts      génère src/data/quran/ (npm run quran:build)
scripts/fetch-translation.mts récupère une traduction (npm run quran:fetch -- <id> <slug>)
src/data/quran/              surahs.json (index) + s/<n>.json (un fichier par sourate)
src/lib/quran.ts             accès aux données (server-only), séparation de la basmala, words()
src/app/lire/[surah]/        page Lecture, 114 pages générées en statique
src/app/connexion/           formulaire de lien magique (?suite= : page où revenir après connexion)
src/app/cercles/             Mes cercles, page d'un cercle, séances ; actions.ts = server actions
src/app/rejoindre/[token]/   ouverture d'un lien d'invitation
src/lib/auth.ts              getViewer() / requireViewer(next)
src/lib/circles.ts           teintes, motifs, rythme, libellés des rôles (client et serveur)
src/lib/circles-server.ts    loadCircles(), URL signées des couvertures, noms des membres
src/components/circles/      carte, couverture (motifs SVG), avatars, fenêtres, carte du Coran
src/app/api/verset/          un verset depuis les données locales (aperçu dans la fenêtre du cercle)
src/app/auth/callback/       échange du code contre une session
src/app/auth/deconnexion/    ferme la session (POST), utilisé par le menu de l'avatar (UserMenu)
supabase/migrations/         schéma SQL
prototypes/                  prototypes HTML v1, v2 et maquette de l'accueil (référence UX)
src/components/landing/      aperçu de séance de la page d'accueil
```

### Données coraniques

- **Texte arabe** : Tanzil Uthmani 1.1 (CC BY 3.0). Mention de la source obligatoire (déjà affichée en pied de la page Lecture) et texte non modifié. Pas de signes de pause dans cette version : un découpage par espaces donne les mots.
- Tanzil place la **basmala en tête du verset 1** de chaque sourate (sauf 1 et 9). `getSurah()` la détecte (comparaison sans voyelles des 4 premiers mots) et la renvoie à part.
- **Traduction française** : Muhammad Hamidullah (Quran.com, ressource 31), appels de note `<sup>` retirés. Usage personnel et non commercial : vérifier la licence avant une diffusion publique. Autre option française sur Quran.com : Rashid Maash (ressource 779). tanzil.net ne répondait pas pour les traductions.
- **À venir** : découpage en mots et racines via le **Quranic Arabic Corpus**, pour suggérer aussi les traductions des mots de même racine.

### Schéma Supabase (`supabase/migrations/`)

- `profiles` : créé automatiquement à l'inscription par un déclencheur.
- `spaces`, `space_members` (rôles owner, editor, viewer), `space_invites` (jeton, expire après 14 jours), fonction `accept_invite(token)`.
- `sessions` : les séances d'un espace (titre, sourate).
- `board_elements` : **un élément du tableau par ligne** (`type` + `data jsonb` + `z`).
- `highlights` : par séance, un type par verset.
- `comments` (ancre en `jsonb`, `parent_id` pour les réponses, `resolved`) et `mentions`.
- `wbw_translations` : mot à mot wolof **partagé à l'échelle de l'espace**. Colonnes : `words jsonb` (index du premier mot vers traduction), `joins smallint[]`, `free`.
- RLS via `is_member(space_id)` et `can_edit(space_id)` (security definer). Publication Realtime active sur le tableau, les surlignages, les commentaires, les mentions et le mot à mot.
- `20261020000000_espaces.sql` ajoute :
  - `create_space(name)` : un insert direct suivi d'un select échoue, car le membre propriétaire est ajouté par un déclencheur après l'insert ;
  - `invite_info(token)` : ce qu'une personne invitée voit avant de rejoindre (nom du cercle, qui invite, rôle) ;
  - une politique qui laisse le propriétaire changer le rôle des autres membres.
- **Rôles affichés** : owner = « Responsable », editor = « Peut modifier », viewer = « Lecture seule ».
- `20261021000000_personnalisation.sql` ajoute aux cercles :
  - la personnalisation : `tone`, `cover_pattern`, `cover_path`, `intention`, `verse_ref`, `meet_day` (1 = lundi), `meet_time` ;
  - la réflexion épinglée : `pinned_note`, `pinned_by`, `pinned_at`, modifiée par `pin_note()` et réservée aux éditeurs ;
  - `is_owner()` ;
  - le **bucket privé `couvertures`** (`<space_id>/<fichier>`, 2 Mo au plus) : lecture par les membres via des URL signées, écriture par le responsable. Le navigateur réduit l'image (1600 px, WebP) avant la server action (`bodySizeLimit` à 3 Mo dans `next.config.ts`). L'ancienne image est supprimée quand on la remplace ou qu'on revient à un motif.
- Un non-membre qui ouvre l'adresse d'un cercle obtient la page introuvable (`not-found.tsx`) : RLS ne lui renvoie rien.
- **En local**, la migration s'applique au démarrage (`npm run db:start`) et a été vérifiée : 10 tables avec RLS, publication Realtime sur les 5 tables prévues. Types générés dans `src/lib/supabase/database.types.ts` (`npm run db:types` après chaque migration), utilisés par les clients.
- **Pas encore de projet Supabase en ligne** : à créer plus tard (`supabase link` puis `db push`, Redirect URLs, variables Vercel).
- **Port** : l'app tourne sur **http://localhost:3100** (`npm run dev`), car le 3000 est pris par un autre projet du porteur. `site_url` et les redirections de `supabase/config.toml` suivent ce port.

## État d'avancement (au 20/10/2026)

Branche `feat/fondations`, rien n'est encore poussé.

**Fait**
- Projet Next.js, polices et jetons de design.
- Coran local : 114 sourates, 6236 versets, traduction Hamidullah.
- Page Lecture statique, choix de la sourate, sourate précédente et suivante.
- Page d'accueil publique (landing) : accroche, aperçu d'une séance, fonctions, verset 47:24, trois étapes. Les versets viennent des données locales, jamais recopiés à la main.
- Supabase local dans Docker, migration appliquée, clients typés.
- Connexion par lien e-mail **testée de bout en bout en local** (e-mail reçu dans Mailpit, session ouverte, profil créé par le déclencheur).
- Schéma SQL avec RLS.
- Style migré vers Tailwind v4, branché sur les jetons.
- Bouton de thème clair/sombre (accueil et Lecture). Une fois connecté, l'en-tête de l'accueil montre un avatar (initiales) qui ouvre le nom, l'e-mail et « Se déconnecter ».
- **Cercles personnalisés** (maquette `cercles-v1`) :
  - cartes avec couverture (motif ou image), pastille, intention, rythme, dernière séance et avatars ;
  - fenêtre de création et de paramètres avec aperçu en direct : couverture, six teintes, verset du cercle, jour et heure ;
  - page d'un cercle : bandeau, verset, prochaine rencontre, séances en tuiles, réflexion épinglée, **carte du Coran** (sourates des séances), membres ;
  - fenêtres « Inviter » et « Nouvelle séance ».

  Testé avec deux comptes : image envoyée puis supprimée, et règles du stockage vérifiées en SQL.
- **Cercles et séances** (`/cercles`) : créer et renommer un cercle, liste des membres (le responsable change les rôles et retire des membres), liens d'invitation (rôle au choix, 14 jours, copier, supprimer), page `/rejoindre/<jeton>`. Séances : créer (titre, sourate), renommer, ouvrir ; une séance affiche pour l'instant le texte de sa sourate. **Testé de bout en bout avec deux comptes** et règles RLS vérifiées en SQL (un lecteur ne peut ni créer, ni renommer, ni inviter, ni changer son rôle ; un inconnu ne voit rien).
- Pas encore : supprimer un cercle ou une séance, quitter un cercle.
- Le type-check, le lint et le build passent.

**À faire, dans l'ordre conseillé**
1. Créer le projet Supabase en ligne et le relier à Vercel (quand on voudra déployer).
2. Mise en page de la v2 dans l'app : en-tête, lecture repliable, panneau à droite, actions sur un verset, surlignages.
3. **Porter le tableau** de la v2 en React, avec persistance dans `board_elements`.
4. **Temps réel** : présence (curseurs), diffusion des changements du tableau, reconnexion.
5. Mot à mot wolof, suggestions et glossaire, sur `wbw_translations`.
6. Discussion : commentaires, mentions, notifications dans l'app.
7. Tafsir (As-Sa'di, Al-Muyassar : à importer localement comme le texte).
8. PWA, puis tests (Vitest, Playwright, tests des règles RLS) et CI GitHub Actions.

<!-- ## Le mémoire de master 2

L'école **autorise l'usage de l'IA**. Il faut le déclarer dans le mémoire et le porteur doit pouvoir défendre chaque choix technique.

- **Sujet** : conception et réalisation de Majalis, une plateforme web collaborative en temps réel pour l'étude et l'annotation du Coran, en traitant la cohérence des données partagées et l'utilisabilité.
- **Problématique** : comment concevoir une application d'annotation collaborative en temps réel qui garantisse la cohérence des données entre utilisateurs simultanés, tout en restant simple à utiliser et déployable sur une infrastructure gratuite ?
- **Axes du mémoire** :
  - comparer deux stratégies de synchronisation du tableau : **« dernier écrit gagnant » via Supabase Realtime** contre **CRDT avec Yjs**, sur la latence, les conflits et la complexité ;
  - la sécurité multi-espaces par RLS ;
  - l'utilisabilité, mesurée par des tests utilisateurs et le questionnaire **SUS**, en comparaison avec Qurannotate.
- **Conséquences pour le code** :
  - concevoir la synchronisation du tableau **derrière une interface interchangeable**, pour pouvoir brancher et comparer les deux stratégies ;
  - **instrumenter** latence et conflits ;
  - garder une trace des décisions d'architecture (des ADR dans `docs/` seraient utiles).
- **Complexité estimée** : 7 sur 10. Le cœur technique est le temps réel. Le hors-ligne (PWA) est une perspective, pas un objectif de la v1. -->
