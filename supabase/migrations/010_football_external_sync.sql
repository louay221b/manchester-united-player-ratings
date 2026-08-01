-- External football provider identifiers and synchronization support.
-- No API key or cron secret belongs in migrations.

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  country text,
  logo_url text,
  active boolean not null default true,
  external_provider text,
  external_id text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clubs
  add column if not exists external_provider text,
  add column if not exists external_id text,
  add column if not exists last_synced_at timestamptz;

alter table public.matches
  add column if not exists opponent_club_id uuid references public.clubs(id) on delete restrict,
  add column if not exists external_provider text,
  add column if not exists external_fixture_id text,
  add column if not exists external_status text,
  add column if not exists last_synced_at timestamptz,
  add column if not exists sync_locked boolean not null default false,
  add column if not exists manually_corrected boolean not null default false;

alter table public.players
  add column if not exists external_provider text,
  add column if not exists external_player_id text,
  add column if not exists last_synced_at timestamptz;

create unique index if not exists clubs_external_provider_external_id_unique
  on public.clubs (external_provider, external_id)
  where external_provider is not null and external_id is not null;

create unique index if not exists matches_external_provider_fixture_id_unique
  on public.matches (external_provider, external_fixture_id)
  where external_provider is not null and external_fixture_id is not null;

create unique index if not exists players_external_provider_player_id_unique
  on public.players (external_provider, external_player_id)
  where external_provider is not null and external_player_id is not null;

create index if not exists clubs_name_idx on public.clubs(name);
create index if not exists matches_opponent_club_id_idx on public.matches(opponent_club_id);
create index if not exists matches_last_synced_at_idx on public.matches(last_synced_at);
create index if not exists players_external_player_id_idx on public.players(external_player_id);

drop trigger if exists set_clubs_updated_at on public.clubs;
create trigger set_clubs_updated_at
  before update on public.clubs
  for each row
  execute function public.set_updated_at();

alter table public.clubs enable row level security;

drop policy if exists clubs_select_public on public.clubs;
create policy clubs_select_public
  on public.clubs
  for select
  using (true);

drop policy if exists clubs_insert_admin on public.clubs;
create policy clubs_insert_admin
  on public.clubs
  for insert
  with check (public.is_admin());

drop policy if exists clubs_update_admin on public.clubs;
create policy clubs_update_admin
  on public.clubs
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists clubs_delete_admin on public.clubs;
create policy clubs_delete_admin
  on public.clubs
  for delete
  using (public.is_admin());

grant select on public.clubs to anon, authenticated;
grant select, insert, update, delete on public.clubs to authenticated;

create table if not exists public.football_sync_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  mode text not null,
  status text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_count integer not null default 0,
  updated_count integer not null default 0,
  unchanged_count integer not null default 0,
  error_count integer not null default 0,
  message text,
  created_at timestamptz not null default now(),
  constraint football_sync_runs_mode_check check (mode in ('fixtures', 'live', 'fixture', 'test')),
  constraint football_sync_runs_status_check check (status in ('running', 'success', 'error'))
);

alter table public.football_sync_runs enable row level security;

drop policy if exists football_sync_runs_select_admin on public.football_sync_runs;
create policy football_sync_runs_select_admin
  on public.football_sync_runs
  for select
  using (public.is_admin());

grant select on public.football_sync_runs to authenticated;

create or replace function public.sync_finish_match_and_open_voting(
  p_match_id uuid,
  p_manchester_united_score integer,
  p_opponent_score integer
)
returns public.matches
language plpgsql
security definer
set search_path = public
as $$
declare
  target_match public.matches;
  updated_match public.matches;
begin
  if current_user not in ('postgres', 'service_role', 'supabase_admin')
     and not public.is_admin() then
    raise exception 'Administrator access required'
      using errcode = '42501';
  end if;

  select *
  into target_match
  from public.matches
  where id = p_match_id
  for update;

  if not found then
    raise exception 'Match not found'
      using errcode = 'P0002';
  end if;

  if target_match.voting_status = 'completed' then
    return target_match;
  end if;

  if p_manchester_united_score is null
     or p_opponent_score is null
     or p_manchester_united_score < 0
     or p_opponent_score < 0 then
    raise exception 'Scores must be positive integers or zero'
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.match_players
    where match_id = p_match_id
      and eligible_for_rating is true
      and participation_status in ('starter', 'substitute_entered')
  ) then
    raise exception 'A match cannot open voting without eligible participants'
      using errcode = '23514';
  end if;

  update public.matches
  set
    manchester_united_score = p_manchester_united_score,
    opponent_score = p_opponent_score,
    status = 'finished',
    voting_status = case
      when voting_status = 'completed' then 'completed'::public.voting_status
      else 'open'::public.voting_status
    end,
    results_published = case
      when voting_status = 'completed' then results_published
      else false
    end,
    updated_at = now()
  where id = p_match_id
  returning * into updated_match;

  return updated_match;
end;
$$;

revoke all on function public.sync_finish_match_and_open_voting(uuid, integer, integer) from public;
grant execute on function public.sync_finish_match_and_open_voting(uuid, integer, integer)
  to authenticated, service_role;

comment on table public.clubs is
  'Football clubs synchronized from server-side providers. External identifiers prevent duplicates.';

comment on table public.football_sync_runs is
  'Non-sensitive football synchronization history for admin diagnostics. API keys and cron secrets are never stored here.';

comment on column public.matches.sync_locked is
  'When true, automated football synchronization records differences but does not overwrite match fields.';

comment on column public.matches.manually_corrected is
  'When true, automated football synchronization records differences but preserves admin-corrected match fields.';
