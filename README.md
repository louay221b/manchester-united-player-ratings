# Manchester United Player Ratings

Plateforme web permettant aux supporters de noter les joueurs de Manchester United apres chaque
match, puis de consulter les resultats publies et le classement de saison.

## Fonctionnalites

- Authentification Supabase pour les supporters et administrateurs.
- Roles `user` et `admin` bases sur `profiles.role`.
- Gestion admin des saisons, joueurs, matchs et compositions.
- Fin de match avec ouverture automatique des votes.
- Vote complet des joueurs eligibles avec homme du match.
- Cloture, publication et masquage des resultats.
- Classement de saison calcule depuis les moyennes par match.
- Statistiques administrateur par saison.

## Architecture

- `frontend/` : React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query.
- `backend/` : Node.js, Express, TypeScript, Zod, client Supabase.
- `supabase/` : migrations SQL, fonctions PostgreSQL, politiques RLS et seed de developpement.

Le frontend ne parle pas directement aux tables metier pour les operations sensibles. Les actions
admin et les votes passent par le backend ou par des fonctions PostgreSQL securisees.

## Installation

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Variables d'environnement

Copier les fichiers d'exemple puis renseigner les valeurs locales ou de production.

Frontend, dans `frontend/.env` :

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_API_URL=
```

Backend, dans `backend/.env` :

```bash
NODE_ENV=production
PORT=3001
FRONTEND_URL=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
```

Les vrais fichiers `.env` et `.env.*` sont ignores par Git. Ne jamais placer de service role key
dans le frontend.

## Lancement

Frontend :

```bash
cd frontend
npm run dev
```

Backend :

```bash
cd backend
npm run dev
```

Le backend expose l'API sur `PORT`, par defaut `3001` en developpement si la variable est absente.

## Migrations Supabase

Les migrations sont dans `supabase/migrations`.

Ordre actuel :

- `001_initial_schema.sql`
- `003_activate_season.sql`
- `004_finish_match_and_open_voting.sql`
- `005_submit_match_ballot.sql`
- `006_seed_manchester_united_squad.sql`
- `007_season_rankings.sql`

Appliquer les migrations avec la CLI Supabase ou le workflow SQL de l'environnement cible. Ne pas
modifier une migration deja appliquee ; ajouter une nouvelle migration numerotee.

## Premier administrateur

1. Creer un utilisateur via l'inscription de l'application ou Supabase Auth.
2. Recuperer son `id` dans `auth.users`.
3. Passer son profil en admin :

```sql
update public.profiles
set role = 'admin'
where id = '<USER_UUID>';
```

Ne jamais transmettre un role depuis le frontend pour autoriser une action. Le backend verifie le
JWT Supabase, puis lit `profiles.role`.

## Scripts

Backend :

- `npm run dev`
- `npm run typecheck`
- `npm run lint`
- `npm run format`
- `npm run format:check`
- `npm run build`
- `npm run start`
- `npm run test`

Frontend :

- `npm run dev`
- `npm run typecheck`
- `npm run lint`
- `npm run format`
- `npm run format:check`
- `npm run build`
- `npm run test`

## Procedure de test

Commandes automatiques :

```bash
cd backend
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run test

cd ../frontend
npm run typecheck
npm run lint
npm run build
npm run test
```

Parcours manuel admin :

1. Creer une saison, puis l'activer.
2. Creer et modifier un joueur.
3. Creer un match et sa composition.
4. Terminer le match et verifier l'ouverture des votes.
5. Consulter les votes, les cloturer, publier les resultats.
6. Consulter les statistiques de saison.

Parcours manuel supporter :

1. S'inscrire, confirmer l'email, se connecter.
2. Ouvrir un match disponible au vote.
3. Noter tous les joueurs eligibles et choisir l'homme du match.
4. Modifier le vote tant que les votes sont ouverts.
5. Verifier le refus apres cloture.
6. Consulter les resultats publies et le classement.

## Securite

- RLS active sur les tables sensibles.
- Operations admin protegees par JWT Supabase et `profiles.role = 'admin'`.
- Votes individuels limites au proprietaire ou aux agregats autorises.
- Resultats publics limites aux matchs publies.
- Aucune identite de votant exposee dans les routes de classement/statistiques.
- Erreurs backend au format uniforme `{ success: false, error: { code, message } }`.

## Deploiement prevu

- Frontend statique deploye sur une plateforme compatible Vite.
- Backend Express deploye comme service Node.js.
- Supabase gere Auth, Postgres, RLS et fonctions RPC.
- Configurer `FRONTEND_URL` cote backend pour CORS.
- Configurer `VITE_API_URL` cote frontend vers l'URL publique du backend.
- Appliquer les migrations Supabase avant d'ouvrir l'application aux utilisateurs.
