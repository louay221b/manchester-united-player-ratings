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
views, voting RPCs, Manchester United squad seed data, and season ranking RPCs.

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
- `players`
- `matches`
- `match_players`
- `votes`
- `man_of_the_match_votes`

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
