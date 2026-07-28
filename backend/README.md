# Manchester United Player Ratings API

Backend Express temporaire pour le projet Manchester United Player Ratings.

Cette premiere version ne configure pas encore Supabase et ne cree aucune table de base de donnees. Elle expose uniquement les routes de base et de sante.

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

## Demarrage manuel

```bash
cp .env.example .env
npm install
npm run dev
```
