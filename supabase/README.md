# Supabase Schema

This folder contains the database schema for Manchester United Player Ratings.

It does not contain Supabase keys, does not configure frontend authentication, and does not create production data.

## Create a Supabase Project

1. Go to the Supabase dashboard.
2. Create a new project.
3. Choose the organization, project name, region, and database password.
4. Wait until the project is ready.

## Open SQL Editor

1. Open the project dashboard.
2. Select SQL Editor in the left navigation.
3. Create a new query.

## Run the Migrations

Run every SQL migration in filename order. Do not edit an already applied migration.

The migrations create enum types, tables, functions, triggers, RLS policies, indexes, aggregate
views, voting RPCs, Manchester United squad seed data, season ranking RPCs, and football provider
synchronization metadata.

## Run the Seed Separately

The seed is optional development data. It is not part of the migration.

1. Open `supabase/seed.sql`.
2. Copy the full SQL content.
3. Paste it into SQL Editor after the schema has succeeded.
4. Run the query.

The seed inserts one development season only. It does not insert Auth users, players, matches,
lineups, votes, or results.

## Verify the Tables

In SQL Editor, run:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

Expected tables:

- `profiles`
- `seasons`
- `clubs`
- `players`
- `matches`
- `match_players`
- `votes`
- `man_of_the_match_votes`
- `football_sync_runs`

Verify the views:

```sql
select table_name
from information_schema.views
where table_schema = 'public'
order by table_name;
```

Expected views:

- `player_match_ratings`
- `season_player_statistics`

Verify ranking functions:

```sql
select routine_name
from information_schema.routines
where specific_schema = 'public'
  and routine_name in (
    'get_public_season_rankings',
    'get_admin_season_statistics'
  )
order by routine_name;
```

## API-Football Synchronization

Migration `010_football_external_sync.sql` adds provider identifiers for clubs, matches, and
players. It also creates `football_sync_runs` so the admin interface can show the latest
synchronization status without exposing provider secrets.

The backend must run the synchronization because API-Football secrets must never be placed in the
frontend. Add these variables only to the backend hosting provider, for example Render:

- `FOOTBALL_API_BASE_URL`
- `FOOTBALL_API_KEY`
- `FOOTBALL_PROVIDER`
- `MANCHESTER_UNITED_EXTERNAL_ID`
- `FOOTBALL_CURRENT_SEASON`
- `FOOTBALL_INCLUDE_FRIENDLIES`
- `FOOTBALL_ALLOWED_COMPETITIONS`
- `CRON_SYNC_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`

`SUPABASE_SERVICE_ROLE_KEY` is needed only by the backend synchronization worker so it can create
clubs, matches, players, and lineups from trusted server-side code. Do not add it to Vercel, React,
Git, logs, or HTTP responses.

## Scheduled Synchronization

Migration `011_football_cron_documentation.sql` documents the cron calls but intentionally does not
store any real secret. Configure the jobs manually in Supabase Dashboard, Supabase Vault, or another
trusted scheduler.

Create two scheduled POST requests to the backend:

- Every 6 hours: `POST /api/internal/football/sync` with body `{"mode":"fixtures"}`.
- Every 5 minutes: `POST /api/internal/football/sync` with body `{"mode":"live"}`.

Both requests must include:

```text
X-Cron-Secret: value_from_secure_storage
Content-Type: application/json
```

The live job is intentionally narrow: it only asks the backend to refresh matches between 3 hours
before now and 5 hours after now, which keeps API-Football usage controlled.

Verify RLS:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

Verify policies:

```sql
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

## Reset a Development Environment Only

For a disposable development database, you can drop the public objects and re-run the schema. Do not do this in production.

Example development-only reset:

```sql
drop view if exists public.season_player_statistics;
drop view if exists public.player_match_ratings;
drop table if exists public.man_of_the_match_votes cascade;
drop table if exists public.votes cascade;
drop table if exists public.match_players cascade;
drop table if exists public.matches cascade;
drop table if exists public.players cascade;
drop table if exists public.seasons cascade;
drop table if exists public.profiles cascade;
drop type if exists public.participation_status cascade;
drop type if exists public.voting_status cascade;
drop type if exists public.match_status cascade;
drop type if exists public.season_status cascade;
drop type if exists public.app_role cascade;
```

Then run `001_initial_schema.sql` again, followed by `seed.sql` if desired.

## Production Migration Rule

After a migration has been deployed to production, do not delete it, rewrite it, or change its historical meaning. Create a new migration for every future schema change.
