# Majalis : guide de passation pour les agents

Ce fichier donne tout le contexte nécessaire pour reprendre le projet. Lis-le en entier avant de coder. L'installation est décrite dans `README.md`.

## Le projet en bref

**Majalis** (« les assemblées », au sens des cercles d'étude) est une application web collaborative pour étudier le Coran à plusieurs, avec un accent sur le **tafsir et le tadabbur** (réflexion), pas sur la mémorisation.

- **Utilisateurs** : d'abord le porteur du projet et son épouse, puis ses étudiants.
- **Inspirations** : Qurannotate (bon design mais UX confuse, fonctions qui ne marchent pas), QuranSpace (espace partagé encore en bêta), Figma, tldraw, Excalidraw.
- **Ce que fait l'app** : lecture du Coran, tableau d'annotation libre (cartes de versets, notes, flèches, cadres, crayon), surlignages, commentaires avec @mentions, traduction mot à mot en **wolof** (faite par le porteur seul, lue par tous), glossaire, collaboration en temps réel.
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

  **Attention** : la regex de normalisation de la v2 (`norm`) est fausse. Écrite en lettres arabes, ses plages sont inversées par l'affichage bidirectionnel et elle efface aussi les lettres (tous les mots finissent par se ressembler). Utiliser `norm()` de `src/lib/wolof.ts`, écrite avec des `\u`.
- **Affichage du wolof** : en mode Lecture et sur les cartes normales, le wolof s'affiche **comme une simple phrase** sous le français, dans la couleur d'accent. C'est la traduction libre si elle existe, sinon les mots mis bout à bout. Les cartes « mot à mot » gardent la présentation interlinéaire.
- **Discussion** : fils ancrés sur un verset, un mot, un élément du tableau ou toute la séance ; @mentions avec autocomplétion ; filtres Ouverts, Mentions et Résolus ; résolution des fils.
- La **présence de « Khadija »** dans le prototype est **simulée**. Dans l'app, elle doit venir de Supabase Realtime.

## Design

- Les jetons (couleurs claires et sombres) sont dans `src/app/globals.css`, repris de la v2.
- **Polices** (via `next/font`, variables posées sur `<html>`) :
  - Figtree pour l'interface ;
  - **Figtree aussi pour les traductions** (français et wolof), à la demande du porteur, qui a écarté EB Garamond. La classe `font-read` reste, pour pouvoir changer la police des traductions à un seul endroit (`--f-read`) ;
  - **Scheherazade New pour l'arabe** (texte coranique et titres), à la demande du porteur ;
  - Caveat pour le style main levée.
- Le logo « م » utilise une police arabe système, choix hérité d'Amiri Quran (l'ancienne police arabe), qui ne l'affichait pas dans la pastille.

### Style : Tailwind v4 et jetons

- **Tailwind v4** (via `@tailwindcss/postcss`, sans fichier `tailwind.config`). Tout se règle dans `src/app/globals.css`.
- **Les jetons restent la seule source** des couleurs et des polices. `@theme inline` les expose en classes : `bg-surface`, `text-muted`, `border-line`, `bg-hl-question`, `text-c-rose`, `font-ar`, `font-read`, `font-hand`, `font-mark`, `shadow-card`, `rounded-control`, `text-ar`, `text-tr`.
- La palette et les polices par défaut de Tailwind sont **retirées** (`--color-*: initial`) : `bg-red-500` n'existe pas, c'est voulu.
- **Règle** : jamais de couleur ni de police en dur dans un composant, ni de `style={{ … }}` pour de la mise en forme. Pour changer une couleur ou une police, on modifie la variable dans `:root` (et sa version sombre), rien d'autre.
- Le mode sombre passe par les variables : pas besoin de classes `dark:`. Il suit `prefers-color-scheme`, sauf si la personne a choisi avec le bouton de thème (`ThemeToggle`, choix dans `localStorage` sous `majalis-theme`, posé en `data-theme` sur `<html>` par un script du layout avant l'affichage). Les valeurs sombres existent donc **deux fois** dans `globals.css` (bloc `@media` et bloc `[data-theme="dark"]`) : les garder identiques.
- Le code qui dessine (SVG du tableau, trait main levée) passe par les classes des jetons (`stroke-c-sage`, `fill-surface`), jamais des valeurs copiées. Les fonds des notes ont leurs jetons (`--note-ink`, `--note-sand`…, classes `bg-note-*`). Les seuls styles en ligne du tableau sont géométriques (position, largeur, caméra).
- Classes de composant (`@layer components`) :
  - `.btn`, `.btn.primary`, `.btn.ghost` ;
  - `.field-input` pour les champs ;
  - `dialog.sheet` pour les fenêtres (composant `Sheet`) ;
  - `.tone-<teinte>`, qui pose `--tone` et `--tone-soft` pour la teinte d'un cercle (utilisées en `bg-(--tone)`, `text-(--tone)`).

  `px-safe` donne les marges latérales qui respectent les encoches.
- **En-tête commun** (`SiteHeader`, demande du porteur : la navigation changeait d'une page à l'autre) : **le même partout**, 56 px, **pleine largeur** (logo au bord gauche, compte au bord droit, comme la séance), mêmes éléments aux mêmes places. Le contenu des pages reste centré (1080 px), sauf la Lecture. À gauche le logo et « Majalis » (Mes cercles une fois connecté, sinon l'accueil) ; au centre la navigation (connecté : Mes cercles, Lire le Coran, Traduire pour les traducteurs ; visiteur : Fonctions, Lire le Coran), la page en cours mise en évidence, et un bouton « Menu » sur téléphone ; à droite le thème puis l'avatar ou « Se connecter ».
  - **Il est posé une seule fois**, par `src/app/(site)/layout.tsx` (groupe de routes : toutes les pages sauf la séance). Il **reste en place quand on change de page** : seul le contenu change, l'en-tête n'est ni redessiné ni relu. Ne pas remettre d'en-tête dans une page.
  - Il lit la personne connectée **dans le navigateur, une fois par visite** (événement `INITIAL_SESSION` de Supabase, puis seulement si la personne change), ce qui garde la page Lecture générée à l'avance. Le dernier compte vu est gardé dans `localStorage` (`majalis-compte`) pour afficher l'avatar tout de suite ; « Se déconnecter » l'efface. Les liens n'apparaissent qu'une fois qu'on sait qui lit. En développement, React monte tout deux fois : deux lectures au chargement, c'est normal.
  - Ce qui est propre à une page va dans **sa barre** (`PageBar`, collée sous l'en-tête) : fil d'Ariane d'un cercle (`Breadcrumbs`), façon de lire (Lecture, sur ordinateur ; bouton « Sourates » sur téléphone), sourate, glossaire, progression, lettres et Publier (Traduire).
  - **Exception** : la séance (`src/app/cercles/[id]/seances/`, hors du groupe), espace de travail plein écran, garde une seule barre compacte de même hauteur, avec la même gauche (logo) et la même droite (thème, avatar). La page introuvable, hors du groupe aussi, pose `SiteHeader` elle-même.
  - Les server actions restent dans `src/app/cercles/actions.ts` et `src/app/traduire/actions.ts` (importées par `@/app/...`).
- **Chargement des pages** : un squelette (`loading.tsx`) qui reprend la forme de la page qui arrive, pour Mes cercles, la page d'un cercle, Traduire et la séance. Pas pour la page Lecture, générée à l'avance et instantanée. Composants dans `src/components/Skeleton.tsx` (`SkeletonPage`, `Bone`, `BarBones`), style `.skeleton` dans `globals.css` : blocs faits des jetons (`--faint` mêlé à `--surface-2`, donc clairs et sombres), reflet doux coupé si la personne demande moins d'animations, et **affichage après 150 ms** pour ne pas clignoter quand la page arrive vite. Les actions (Publier, Créer…) n'ont pas d'indicateur à part : le bouton dit ce qui se passe (« Publication… »).
- **Icônes** : `lucide-react` (licence ISC), toujours à côté d'un libellé. Une icône seule doit avoir `aria-label` et `title`.

## Stack et architecture

- **Next.js 15** (App Router, TypeScript, Turbopack), `src/` comme racine, alias `@/*`.
- **Supabase** : authentification par **Google** (« Continuer avec Google ») ou par lien e-mail, PostgreSQL avec RLS, Realtime. Le service d'e-mail intégré de Supabase n'envoie que **2 e-mails par heure** : d'où Google, sans limite. Un lien de connexion qui retombe sur l'accueil (`/?code=`) est renvoyé vers `/auth/callback` par le middleware ; un refus (`?error=`) mène à `/connexion?erreur=acces`. Clients dans `src/lib/supabase/` (`client.ts`, `server.ts`, `env.ts`). Le middleware `src/middleware.ts` rafraîchit la session et ne s'applique pas aux pages `/lire/`.
- **Sans `.env.local`**, `createClient()` renvoie `null` : la lecture fonctionne et la connexion affiche un message au lieu de planter.
- **Développement en local** : Supabase tourne dans Docker via la CLI (`supabase` en devDependency, config dans `supabase/config.toml`). `npm run db:start` démarre les conteneurs et applique les migrations ; les e-mails de connexion arrivent dans Mailpit (http://127.0.0.1:54324). Edge runtime et analytics sont désactivés pour alléger. Les adresses et commandes sont dans le README. Si le conteneur Studio reste « unhealthy » au démarrage, lancer `npx supabase start -x studio`.
- **Hébergement** : Vercel. Prévoir l'app installable (PWA). Guide pas à pas : `docs/mise-en-ligne.md`.
- **Mise en ligne personnelle (décision du 02/11/2026)** : le porteur met d'abord en ligne, pour lui seul, la Lecture, Traduire et ses notes. Les cercles et les séances, pas finis, sont **coupés en ligne** par `NEXT_PUBLIC_CERCLES=off` (`src/lib/features.ts` : liens retirés, pages introuvables, l'accueil mène à la Lecture, on arrive sur Traduire une fois connecté) ; en local, tout reste visible. Le site n'est pas annoncé et ne s'indexe pas (`robots: noindex`). Les inscriptions sont fermées dans Supabase une fois le compte du porteur créé.
- **Supabase renvoie 1000 lignes au plus par requête** : pour lire une table entière (brouillons, notes…), passer par `fetchAll` (`src/lib/supabase/fetch-all.ts`), requête triée.
- **Sauvegarde quotidienne** (`vercel.json` → `/api/cron/sauvegarde`, protégée par `CRON_SECRET`) : lit toute la base avec `SUPABASE_SECRET_KEY` (ce passage empêche la pause du projet gratuit après 7 jours), puis dépose le JSON (`buildExport`, `src/lib/export.ts`) dans le dossier « Majalis — sauvegardes » du Google Drive du porteur (`src/lib/google-drive.ts`, API REST, accès `drive.file`, 60 sauvegardes gardées). Jeton Google obtenu une fois par `npm run drive:token`. Le bouton « Exporter mes traductions et notes » (`/api/export`) donne le même fichier.

### Arborescence utile

```
data/tanzil/                 texte uthmani + métadonnées Tanzil (sources, avec licence)
data/translations/*.raw.json traductions brutes récupérées une fois (Quran.com)
scripts/build-quran.mts      génère src/data/quran/ (npm run quran:build)
scripts/fetch-translation.mts récupère une traduction (npm run quran:fetch -- <id> <slug>)
src/data/quran/              surahs.json (index) + s/<n>.json (un fichier par sourate)
src/lib/quran.ts             accès aux données (server-only), séparation de la basmala, words()
src/app/(site)/lire/          layout.tsx (barre latérale des sourates, gardée d'une sourate à l'autre) ; [surah]/ = page Lecture, 114 pages générées en statique
src/components/reader/       SurahNav (liste des sourates et versets, panneau du téléphone), SurahText, ReadingModes
src/app/(site)/connexion/    formulaire de lien magique (?suite= : page où revenir après connexion)
src/app/(site)/cercles/      Mes cercles, page d'un cercle
src/app/cercles/             actions.ts (server actions) et seances/ (la séance, hors du groupe)
src/app/(site)/rejoindre/[token]/ ouverture d'un lien d'invitation
src/lib/auth.ts              getViewer() / requireViewer(next)
src/lib/circles.ts           teintes, motifs, rythme, libellés des rôles (client et serveur)
src/lib/circles-server.ts    loadCircles(), URL signées des couvertures, noms des membres
src/components/circles/      carte, couverture (motifs SVG), avatars, fenêtres, carte du Coran
src/components/session/      SessionView : page de séance (lecture, tableau, panneau Repères)
src/app/(site)/traduire/[surah]/ mot à mot wolof (traducteurs seulement) ; src/app/traduire/actions.ts = publishWolof
src/components/wolof/        TranslateView : tuiles des mots, suggestions, fusions, lettres, glossaire, Publier
src/lib/wolof.ts             découpage, normalisation, suggestions, texte wolof affiché (client et serveur)
src/lib/wolof-server.ts      isTranslator(), publishedWolof() (lisible sans session)
src/app/(site)/traduire/page.tsx accueil de Traduire (TranslateHome) : avancement, reprise, recherche, export
src/app/(site)/notes/        Mes notes (NotesList) ; src/components/notes/ : VerseNote, ReadingNotes (notes dans la Lecture)
src/lib/notes.ts             saveNote(), ordre des versets
src/lib/features.ts          parties coupées en ligne (NEXT_PUBLIC_CERCLES=off)
src/lib/export.ts            sauvegarde JSON (export et tâche quotidienne) ; src/lib/google-drive.ts : dépôt dans Drive
src/app/api/export/, src/app/api/cron/sauvegarde/ export à télécharger, tâche quotidienne
scripts/google-drive-token.mts jeton Google Drive, une fois (npm run drive:token)
docs/mise-en-ligne.md        guide de mise en ligne (Supabase, Vercel, Drive)
src/lib/reading.ts           façon de lire : modes, langues, script d'avant affichage, numéro de fin de verset
src/components/board/        Board (caméra, outils, historique, enregistrement) et BoardItems (cartes, formes SVG)
src/lib/board.ts             modèle du tableau, lecture/écriture des lignes, géométrie, tracés main levée
src/lib/board-sync.ts        interface BoardSync et sa version Supabase (écritures en file, Realtime, écho ignoré)
src/lib/highlights.ts        les quatre surlignages et leur sens
src/app/api/verset/          un verset depuis les données locales (aperçu dans la fenêtre du cercle)
src/app/auth/callback/       échange du code contre une session
src/app/auth/deconnexion/    ferme la session (POST), utilisé par le menu de l'avatar (UserMenu)
supabase/migrations/         schéma SQL
prototypes/                  prototypes HTML v1, v2 et maquette de l'accueil (référence UX)
src/components/landing/      aperçu de séance de la page d'accueil
src/components/SiteHeader.tsx en-tête commun et PageBar (Breadcrumbs : fil d'Ariane des cercles)
src/components/Skeleton.tsx  squelettes de chargement (utilisés par les loading.tsx)
src/app/(site)/               pages qui partagent l'en-tête (layout.tsx) : accueil, cercles, lire, traduire, connexion, rejoindre
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
- RLS via `is_member(space_id)` et `can_edit(space_id)` (security definer). Publication Realtime active sur le tableau, les surlignages, les commentaires et les mentions.
- `20261023000000_wolof.sql` : le **mot à mot wolof est une seule traduction pour toute l'app**, faite par le porteur (décision du 23/10/2026), et non plus une traduction par cercle (`wbw_translations` est supprimée). Colonnes : `words jsonb` (index du premier mot vers traduction), `joins smallint[]` (mots fusionnés avec le suivant), `free` (traduction libre). Les index sont ceux du texte affiché, basmala séparée.
  - `translators` : qui peut traduire. **On ne devient traducteur qu'en SQL**, jamais depuis l'app : `insert into public.translators (user_id) select id from auth.users where email = '…';`. Fonction `is_translator()`.
  - `wolof_drafts` : le brouillon, lisible et modifiable par les traducteurs seulement, enregistré tout seul pendant la frappe.
  - `wolof` : la version publiée, **lisible par tous, même sans compte**. On n'y écrit que par `publish_wolof(refs)`, qui recopie les brouillons (un brouillon vide retire la publication).
- `20261102000000_notes.sql` : **notes personnelles**, une par verset et par personne (`user_id`, `ref`, `surah`, `body`), lues et écrites par leur auteur seul (RLS vérifiée : un autre compte n'en voit aucune et ne peut pas en écrire au nom d'un autre). Une note vidée est supprimée.
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
- **En ligne** (depuis le 02/11/2026) : projet Supabase `majalis` (`ytaqsethdedaeiszbayx`, `eu-west-1`), relié par `supabase link` ; migrations envoyées par `npx supabase db push`. Sur Supabase en ligne, **les fonctions de pgcrypto sont dans le schéma `extensions`** : les appeler `extensions.gen_random_bytes(…)` (l'appel nu passe en local mais échoue en ligne). Connexion Google : identifiant OAuth « Web » dans le projet Google Cloud **deenshare** du porteur (limite de projets atteinte), redirection `https://ytaqsethdedaeiszbayx.supabase.co/auth/v1/callback`.
- **Port** : l'app tourne sur **http://localhost:3100** (`npm run dev`), car le 3000 est pris par un autre projet du porteur. `site_url` et les redirections de `supabase/config.toml` suivent ce port.

## État d'avancement (au 02/11/2026)

**En ligne sur https://majalis.bayanun.com** (Vercel, branche `main`, fusionnée depuis `feat/fondations`). Branche `feat/fondations`, poussée sur GitHub (ahmadgueye/majalis). Ne jamais mettre de clé, même locale, dans le dépôt : GitHub bloque le push (protection des secrets).

**Fait**
- Projet Next.js, polices et jetons de design.
- Coran local : 114 sourates, 6236 versets, traduction Hamidullah.
- Page Lecture statique. **Barre latérale des sourates** (`SurahNav`, posée par `lire/layout.tsx`, donc gardée quand on change de sourate) :
  - fixe et **collée au bord gauche** sur ordinateur (312 px), le texte centré dans le reste de l'écran (780 px au plus, pour garder des lignes faciles à suivre) ; `PageBar wide` pour aligner les choix de lecture sur le texte ; panneau ouvert par « Sourates » sur téléphone (`<dialog class="drawer">`) ;
  - recherche par numéro, nom translittéré (sans accents ni lettres doublées : « ikhlas » trouve Al-Ikhlaas) ou nom arabe, et **par verset** : `2:255`, `2 255`, `baqara 255`. Entrée ouvre le premier résultat (au verset, même dans une autre sourate : `/lire/2#v255`) ; un verset qui n'existe pas l'indique (« N'a que 286 versets ») ;
  - la sourate ouverte est mise en évidence. **La liste ne bouge pas quand on clique une sourate visible** (demande du porteur) ; elle ne se déplace que si la sourate ouverte est hors de vue (ouverture de la page, sourate voisine, recherche) ; **à côté, une colonne « Versets »** avec ses numéros, qui défile à part (demande du porteur : une grille sous la sourate dépassait de l'écran pour les longues sourates). Le verset en haut de l'écran y est mis en évidence et gardé visible pendant le défilement. Les versets portent `data-verse` (verset par verset et texte continu), et le saut va à celui qui est affiché ; doux pour un saut court, direct au-delà de deux écrans ;
  - sourate précédente et suivante en bas du texte.

  `body` a `min-height: 100%` (et non `height`) : sinon l'en-tête collant partait avec le texte après un écran.
- Page d'accueil publique (landing) : accroche, aperçu d'une séance, fonctions, verset 47:24, trois étapes. Les versets viennent des données locales, jamais recopiés à la main.
- Supabase local dans Docker, migration appliquée, clients typés.
- Connexion par lien e-mail **testée de bout en bout en local** (e-mail reçu dans Mailpit, session ouverte, profil créé par le déclencheur).
- Schéma SQL avec RLS.
- Style migré vers Tailwind v4, branché sur les jetons.
- En-tête commun à tout le site (voir Design), avec le bouton de thème et, une fois connecté, l'avatar (initiales) qui ouvre le nom, l'e-mail, « Traduire en wolof » (traducteurs) et « Se déconnecter ».
- **Cercles personnalisés** (maquette `cercles-v1`) :
  - cartes avec couverture (motif ou image), pastille, intention, rythme, dernière séance et avatars ;
  - fenêtre de création et de paramètres avec aperçu en direct : couverture, six teintes, verset du cercle, jour et heure ;
  - page d'un cercle : bandeau, verset, prochaine rencontre, séances en tuiles, réflexion épinglée, **carte du Coran** (sourates des séances), membres ;
  - fenêtres « Inviter » et « Nouvelle séance ».

  Testé avec deux comptes : image envoyée puis supprimée, et règles du stockage vérifiées en SQL.
- **Cercles et séances** (`/cercles`) : créer et renommer un cercle, liste des membres (le responsable change les rôles et retire des membres), liens d'invitation (rôle au choix, 14 jours, copier, supprimer), page `/rejoindre/<jeton>`. Séances : créer (titre, sourate), renommer, ouvrir ; une séance affiche pour l'instant le texte de sa sourate. **Testé de bout en bout avec deux comptes** et règles RLS vérifiées en SQL (un lecteur ne peut ni créer, ni renommer, ni inviter, ni changer son rôle ; un inconnu ne voit rien).
- **Page de séance** (mise en page de la v2) :
  - en-tête avec titre modifiable sur place (éditeurs) ;
  - lecture à gauche, repliable (« Masquer la lecture » / « Afficher la lecture »), avec choix de la sourate (`?sourate=`). Sur ordinateur, c'est un **panneau fixe posé sur le tableau** : le tableau garde toute la largeur et **la vue ne bouge pas** quand on ouvre ou ferme la lecture. La barre d'outils ne bouge pas non plus. Seuls « Tout voir » et le centrage d'un verset ajouté tiennent compte de la partie cachée (prop `inset` de `Board`) ;
  - le tableau (voir plus bas) ;
  - panneau à droite « Repères de couleurs » (légende, versets surlignés, clic pour y aller) ;
  - sur téléphone, onglets Lecture / Tableau.

  Un éditeur sélectionne un verset : la rangée d'actions ne montre que **Surligner**, et les couleurs n'apparaissent qu'au clic. Les surlignages sont écrits dans `highlights` par le client navigateur (RLS) et **reçus en direct** par les autres membres (Supabase Realtime, `postgres_changes`). Testé : ajout, retrait, réception en direct, lecture seule.
- **Tableau** (porté de la v2, `src/components/board/`) :
  - caméra : glisser le fond ou outil Main, molette, Ctrl + molette pour zoomer, « Tout voir », 100 % ; la vue s'ajuste à l'ouverture ;
  - outils en bas : Sélection, Main, Crayon, Cadre, Flèche, Note, Texte (raccourcis V H P R A N T) ; palette de cinq couleurs et style Net / Main levée, visibles seulement quand on dessine ou qu'un élément est sélectionné ;
  - flèches liées aux éléments (elles les suivent), courbées par la poignée du milieu, « Redresser » ;
  - barre d'actions sur l'élément sélectionné : Voir le texte, Réflexion (verset), Écrire (note, titre), Redresser, Dupliquer, Supprimer (avec « Annuler » dans le message) ;
  - redimensionnement, double-clic sur le fond pour une note, Suppr, Entrée pour écrire, Échap ;
  - versets ajoutés par « Ajouter au tableau » ou « Réflexion » dans la lecture, ou glissés depuis la lecture ; la bordure de la carte prend la couleur du surlignage.

  **Enregistrement** : un élément par ligne de `board_elements` (`type`, `z`, reste dans `data`). Chaque changement terminé (fin d'un glisser, fin de l'écriture, suppression, annuler) est comparé à l'état déjà envoyé, et seuls les éléments touchés sont écrits. Les changements des autres membres arrivent par Realtime ; l'écho de ses propres écritures est reconnu et ignoré. **Annuler ne défait que ses propres changements**, jamais ceux des autres. Si la base refuse une écriture, le tableau se recharge. Les lecteurs (« Lecture seule ») voient le tableau et s'y déplacent, sans outils.

  Testé : création, déplacement, flèches liées et courbées, annuler et rétablir, rechargement, réception en direct (ajout, modification, suppression), téléphone et mode sombre. Le glisser-déposer depuis la lecture n'a pas pu être testé automatiquement.
- **Façon de lire** (page Lecture et lecture des séances) : **Arabe** · **Arabe et traduction** · **Traduction**, et pour les traductions une liste « Langue » faite maison, au style des onglets (Français, Wolof, Français et wolof ; flèches, Entrée, Échap) (composant `ReadingModes`). En mode Arabe, la page Lecture montre le texte d'un seul tenant, comme un mushaf (fin de verset ۝ suivi du numéro en chiffres arabes) ; la lecture d'une séance garde un verset par ligne, pour pouvoir sélectionner, surligner et glisser. En mode Wolof, un verset pas encore publié montre le français en gris avec « Pas encore traduit en wolof ». Le choix est retenu dans `localStorage` (`majalis-lecture`) et posé sur `<html>` (`data-read`, `data-lang`) par un script du layout avant l'affichage ; les règles en fin de `globals.css` cachent les parties marquées `data-part` (`ar`, `fr`, `wo`, `wo-missing`, `lang-choice`). Les cartes du tableau ne changent pas.
- **Mot à mot wolof** (`/traduire/<sourate>`, lien « Traduire en wolof » dans le menu du compte, pour les traducteurs seulement ; les autres obtiennent la page introuvable) :
  - tuiles par mot avec la logique de la v2 : Tab, Entrée, suggestions (Tab accepte, Échap ignore), fusionner et séparer (clic sur le mot arabe) ; **fusionner un groupe de mots** d'un coup, pour une expression : « Fusionner un groupe de mots » dans le menu d'un mot, puis clic sur le dernier mot (avant ou après), le groupe s'entoure, « Fusionner les N mots » ou Annuler (Échap). Les traductions déjà écrites sont gardées bout à bout, lettres wolof, traduction libre, glossaire avec recherche, progression ;
  - sous les tuiles, la **phrase wolof du verset** (`free`) : tant qu'elle n'est pas retouchée, le champ montre les mots mis bout à bout et les suit (`free` reste vide) ; dès qu'on la retouche, la phrase écrite est enregistrée et remplace les mots. Les lecteurs lisent la phrase si elle existe, sinon les mots mis bout à bout ;
  - le brouillon s'enregistre tout seul (600 ms après la frappe) ; chaque verset montre « Brouillon » ou « Publié », avec « Publier » (ou « Retirer la publication » si le brouillon est vidé), et l'en-tête propose de publier tous les versets modifiés ;
  - **le wolof publié** s'affiche en une phrase, en couleur d'accent, sous le français : page Lecture (régénérée par `revalidatePath` à chaque publication), lecture de la séance, cartes de versets du tableau (et `/api/verset`).

  Testé : saisie, suggestion acceptée, fusion, lettres, rechargement, publication d'un verset (le brouillon d'un autre reste invisible), glossaire, affichage dans la Lecture et la séance. Règles vérifiées en SQL : un visiteur lit seulement le publié ; un membre non traducteur ne lit pas les brouillons, n'écrit rien et ne peut pas publier.
- **Traduire, accueil** (`/traduire`) : avancement global et par sourate (mots traduits, mots fusionnés comptés une fois ; versets publiés ; notes), « Reprendre au verset … » (dernier verset modifié), **recherche dans les traductions** (sans tenir compte des accents), filtre Toutes / Commencées, « Exporter mes traductions et notes ». Chaque sourate de Traduire a « Toutes les sourates ».
- **Notes personnelles** (`VerseNote`) : « Ajouter une note » sous chaque verset, dans Traduire et dans la Lecture (une fois connecté ; la Lecture étant générée à l'avance, les notes y sont lues dans le navigateur, sourate par sourate). Enregistrées toutes seules (700 ms), « Visible par toi seul ». Page **Mes notes** (`/notes`, lien de l'en-tête) : chaque note sous son verset, modifiable sur place, recherche, export. Testé : écriture, relecture dans la Lecture et Mes notes, règles RLS, export.
- **Règle suivie** : la rangée d'un verset montre « Ajouter au tableau », « Réflexion » et « Surligner ». « Commenter » et « Tafsir » y seront ajoutés **quand leur fonction existera** (aucun bouton inactif).
- Pas encore : supprimer un cercle ou une séance, quitter un cercle.
- Le type-check, le lint et le build passent.

**À faire, dans l'ordre conseillé**
1. **Mise en ligne personnelle** : faite (Supabase, Vercel, domaine, connexion Google, compte du porteur traducteur). Reste la **sauvegarde vers Google Drive** (`docs/mise-en-ligne.md`, étape 4 : identifiant « Desktop app » dans le projet deenshare, `npm run drive:token`, variables `GOOGLE_*` dans Vercel). Les inscriptions restent **ouvertes**, par choix du porteur (site non annoncé ; RLS protège son travail) : les fermer si le site devient connu.
2. **Temps réel** : présence (curseurs), diffusion des déplacements pendant le glisser (aujourd'hui, les autres voient l'élément à la fin du geste), reconnexion.
3. Suite du wolof : cartes « mot à mot » (interlinéaires) sur le tableau, glossaire consultable par tous, choix d'afficher ou non le wolof, propositions de correction des membres (avec « Commenter »).
4. Discussion : commentaires, mentions, notifications dans l'app (« Commenter » sur un verset ou un élément du tableau).
5. Tafsir (As-Sa'di, Al-Muyassar : à importer localement comme le texte).
6. PWA, puis tests (Vitest, Playwright, tests des règles RLS) et CI GitHub Actions.

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
