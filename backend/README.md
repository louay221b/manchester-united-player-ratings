# Manchester United Player Ratings API

Backend Express pour le projet Manchester United Player Ratings.

Il expose les routes applicatives, protege les routes administrateur avec Supabase Auth, et
prepare la synchronisation serveur avec API-Football. Les secrets API-Football restent uniquement
cote backend.

## Scripts

- `npm run dev` : demarre le serveur avec `tsx watch`.
- `npm run build` : compile TypeScript vers `dist`.
- `npm run start` : execute le JavaScript compile.
- `npm run typecheck` : verifie TypeScript sans emission.
- `npm run lint` : execute ESLint.
- `npm run format:check` : verifie le format Prettier.

## Routes

- `GET /`
- `GET /api/health`
- `POST /api/admin/football/sync/fixtures`
- `POST /api/admin/football/sync/fixtures/:externalFixtureId`
- `POST /api/internal/football/sync`

Les routes `/api/admin/football/*` exigent une session authentifiee avec le role `admin`.
La route `/api/internal/football/sync` n'utilise pas de session utilisateur et exige
`X-Cron-Secret`.

## Variables API-Football

Configurer uniquement dans Render ou dans l'environnement backend:

- `FOOTBALL_API_BASE_URL`
- `FOOTBALL_API_KEY`
- `FOOTBALL_PROVIDER`
- `MANCHESTER_UNITED_EXTERNAL_ID`
- `FOOTBALL_CURRENT_SEASON`
- `FOOTBALL_INCLUDE_FRIENDLIES`
- `FOOTBALL_ALLOWED_COMPETITIONS`
- `CRON_SYNC_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

`SUPABASE_SERVICE_ROLE_KEY` est necessaire pour la synchronisation serveur: le backend doit pouvoir
creer ou mettre a jour les clubs, matchs, joueurs et compositions sans exposer ce pouvoir au
frontend.

Ne jamais ajouter `FOOTBALL_API_KEY`, `CRON_SYNC_SECRET` ou `SUPABASE_SERVICE_ROLE_KEY` dans React,
Vercel, Git, les logs ou les reponses HTTP.

## Tester manuellement la synchronisation

Apres configuration des variables backend et des migrations Supabase:

```bash
npm run build
npm run start
```

Puis appeler depuis une session admin:

```bash
POST /api/admin/football/sync/fixtures
```

Pour le cron, envoyer:

```bash
POST /api/internal/football/sync
X-Cron-Secret: value_from_secure_storage
Content-Type: application/json

{"mode":"fixtures"}
```

## Demarrage manuel

```bash
cp .env.example .env
npm install
npm run dev
```
