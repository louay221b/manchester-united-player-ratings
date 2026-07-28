-- Manchester United Player Ratings - initial Supabase schema.
-- This migration is intentionally database-only: no frontend/backend connection,
-- no Supabase keys, and no seed data.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('user', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'season_status') then
    create type public.season_status as enum ('draft', 'active', 'closed');
  end if;

  if not exists (select 1 from pg_type where typname = 'match_status') then
    create type public.match_status as enum ('scheduled', 'finished', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'voting_status') then
    create type public.voting_status as enum ('closed', 'open', 'completed');
  end if;

  if not exists (select 1 from pg_type where typname = 'participation_status') then
    create type public.participation_status as enum (
      'starter',
      'substitute_entered',
      'substitute_unused'
    );
  end if;
end
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  start_date date not null,
  end_date date not null,
  status public.season_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint seasons_valid_dates_check check (end_date > start_date)
);

create unique index if not exists seasons_one_active_idx
  on public.seasons (status)
  where status = 'active';

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  shirt_number integer,
  position text not null,
  photo_url text,
  active boolean not null default true,
  joined_at date,
  left_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint players_shirt_number_check check (
    shirt_number is null or shirt_number between 1 and 99
  ),
  constraint players_dates_check check (
    joined_at is null or left_at is null or left_at >= joined_at
  )
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons(id) on delete restrict,
  opponent_name text not null,
  opponent_logo_url text,
  competition text not null,
  match_date timestamptz not null,
  venue text,
  is_home boolean not null default true,
  manchester_united_score integer,
  opponent_score integer,
  status public.match_status not null default 'scheduled',
  voting_status public.voting_status not null default 'closed',
  results_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint matches_scores_non_negative_check check (
    (manchester_united_score is null or manchester_united_score >= 0)
    and (opponent_score is null or opponent_score >= 0)
  ),
  constraint matches_finished_scores_required_check check (
    status <> 'finished'
    or (manchester_united_score is not null and opponent_score is not null)
  )
);

create table if not exists public.match_players (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete restrict,
  participation_status public.participation_status not null,
  entered_minute integer,
  exited_minute integer,
  minutes_played integer not null default 0,
  eligible_for_rating boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint match_players_match_player_unique unique (match_id, player_id),
  constraint match_players_minutes_range_check check (
    minutes_played between 0 and 130
    and (entered_minute is null or entered_minute between 0 and 130)
    and (exited_minute is null or exited_minute between 0 and 130)
  ),
  constraint match_players_minute_order_check check (
    entered_minute is null
    or exited_minute is null
    or exited_minute >= entered_minute
  ),
  constraint match_players_unused_check check (
    participation_status <> 'substitute_unused'
    or (minutes_played = 0 and eligible_for_rating = false)
  ),
  constraint match_players_participated_check check (
    participation_status = 'substitute_unused'
    or minutes_played > 0
  )
);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null,
  player_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating numeric(3, 1) not null,
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint votes_match_player_fk foreign key (match_id, player_id)
    references public.match_players(match_id, player_id)
    on delete cascade,
  constraint votes_match_player_user_unique unique (match_id, player_id, user_id),
  constraint votes_rating_range_check check (rating between 1 and 10),
  constraint votes_rating_step_check check (rating * 2 = floor(rating * 2)),
  constraint votes_comment_length_check check (
    comment is null or char_length(comment) <= 500
  )
);

create table if not exists public.man_of_the_match_votes (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null,
  player_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint man_of_the_match_votes_match_player_fk foreign key (match_id, player_id)
    references public.match_players(match_id, player_id)
    on delete cascade,
  constraint man_of_the_match_votes_one_per_match_unique unique (match_id, user_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      new.email
    ),
    'user'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.prevent_non_admin_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role is distinct from new.role
     and not public.is_admin()
     and current_user not in ('postgres', 'service_role', 'supabase_admin') then
    raise exception 'Only admins can modify profile roles'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create or replace function public.is_match_open_for_voting(
  target_match_id uuid,
  target_player_id uuid
)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.matches m
    join public.match_players mp
      on mp.match_id = m.id
     and mp.player_id = target_player_id
    where m.id = target_match_id
      and m.status = 'finished'
      and m.voting_status = 'open'
      and mp.eligible_for_rating = true
      and mp.participation_status <> 'substitute_unused'
  );
$$;

create or replace function public.validate_vote_allowed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_match_status public.match_status;
  target_voting_status public.voting_status;
  target_participation_status public.participation_status;
  target_eligible_for_rating boolean;
begin
  select
    m.status,
    m.voting_status,
    mp.participation_status,
    mp.eligible_for_rating
  into
    target_match_status,
    target_voting_status,
    target_participation_status,
    target_eligible_for_rating
  from public.matches m
  join public.match_players mp
    on mp.match_id = m.id
   and mp.player_id = new.player_id
  where m.id = new.match_id;

  if not found then
    raise exception 'Player is not linked to this match'
      using errcode = '23503';
  end if;

  if target_match_status <> 'finished' then
    raise exception 'Votes are allowed only for finished matches'
      using errcode = '23514';
  end if;

  if target_voting_status <> 'open' then
    raise exception 'Voting is not open for this match'
      using errcode = '23514';
  end if;

  if target_eligible_for_rating is not true
     or target_participation_status = 'substitute_unused' then
    raise exception 'Player is not eligible for rating'
      using errcode = '23514';
  end if;

  if new.user_id is distinct from auth.uid()
     and not public.is_admin()
     and current_user not in ('postgres', 'service_role', 'supabase_admin') then
    raise exception 'Vote user_id must match the authenticated user'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

drop trigger if exists prevent_non_admin_profile_role_change on public.profiles;
create trigger prevent_non_admin_profile_role_change
  before update of role on public.profiles
  for each row
  execute function public.prevent_non_admin_role_change();

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();

drop trigger if exists set_seasons_updated_at on public.seasons;
create trigger set_seasons_updated_at
  before update on public.seasons
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_players_updated_at on public.players;
create trigger set_players_updated_at
  before update on public.players
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_matches_updated_at on public.matches;
create trigger set_matches_updated_at
  before update on public.matches
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_match_players_updated_at on public.match_players;
create trigger set_match_players_updated_at
  before update on public.match_players
  for each row
  execute function public.set_updated_at();

drop trigger if exists set_votes_updated_at on public.votes;
create trigger set_votes_updated_at
  before update on public.votes
  for each row
  execute function public.set_updated_at();

drop trigger if exists validate_votes_allowed on public.votes;
create trigger validate_votes_allowed
  before insert or update on public.votes
  for each row
  execute function public.validate_vote_allowed();

drop trigger if exists validate_man_of_the_match_votes_allowed on public.man_of_the_match_votes;
create trigger validate_man_of_the_match_votes_allowed
  before insert or update on public.man_of_the_match_votes
  for each row
  execute function public.validate_vote_allowed();

alter table public.profiles enable row level security;
alter table public.seasons enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.match_players enable row level security;
alter table public.votes enable row level security;
alter table public.man_of_the_match_votes enable row level security;

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin
  on public.profiles
  for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_insert_admin on public.profiles;
create policy profiles_insert_admin
  on public.profiles
  for insert
  with check (public.is_admin());

drop policy if exists profiles_update_own_or_admin on public.profiles;
create policy profiles_update_own_or_admin
  on public.profiles
  for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists profiles_delete_admin on public.profiles;
create policy profiles_delete_admin
  on public.profiles
  for delete
  using (public.is_admin());

drop policy if exists seasons_select_public on public.seasons;
create policy seasons_select_public
  on public.seasons
  for select
  using (true);

drop policy if exists seasons_insert_admin on public.seasons;
create policy seasons_insert_admin
  on public.seasons
  for insert
  with check (public.is_admin());

drop policy if exists seasons_update_admin on public.seasons;
create policy seasons_update_admin
  on public.seasons
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists seasons_delete_admin on public.seasons;
create policy seasons_delete_admin
  on public.seasons
  for delete
  using (public.is_admin());

drop policy if exists players_select_public on public.players;
create policy players_select_public
  on public.players
  for select
  using (true);

drop policy if exists players_insert_admin on public.players;
create policy players_insert_admin
  on public.players
  for insert
  with check (public.is_admin());

drop policy if exists players_update_admin on public.players;
create policy players_update_admin
  on public.players
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists players_delete_admin on public.players;
create policy players_delete_admin
  on public.players
  for delete
  using (public.is_admin());

drop policy if exists matches_select_public on public.matches;
create policy matches_select_public
  on public.matches
  for select
  using (true);

drop policy if exists matches_insert_admin on public.matches;
create policy matches_insert_admin
  on public.matches
  for insert
  with check (public.is_admin());

drop policy if exists matches_update_admin on public.matches;
create policy matches_update_admin
  on public.matches
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists matches_delete_admin on public.matches;
create policy matches_delete_admin
  on public.matches
  for delete
  using (public.is_admin());

drop policy if exists match_players_select_public on public.match_players;
create policy match_players_select_public
  on public.match_players
  for select
  using (true);

drop policy if exists match_players_insert_admin on public.match_players;
create policy match_players_insert_admin
  on public.match_players
  for insert
  with check (public.is_admin());

drop policy if exists match_players_update_admin on public.match_players;
create policy match_players_update_admin
  on public.match_players
  for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists match_players_delete_admin on public.match_players;
create policy match_players_delete_admin
  on public.match_players
  for delete
  using (public.is_admin());

drop policy if exists votes_select_own on public.votes;
create policy votes_select_own
  on public.votes
  for select
  using (user_id = auth.uid());

drop policy if exists votes_select_admin on public.votes;
create policy votes_select_admin
  on public.votes
  for select
  using (public.is_admin());

drop policy if exists votes_insert_own_when_open on public.votes;
create policy votes_insert_own_when_open
  on public.votes
  for insert
  with check (
    user_id = auth.uid()
    and public.is_match_open_for_voting(match_id, player_id)
  );

drop policy if exists votes_update_own_when_open on public.votes;
create policy votes_update_own_when_open
  on public.votes
  for update
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.is_match_open_for_voting(match_id, player_id)
  );

drop policy if exists man_of_the_match_votes_select_own on public.man_of_the_match_votes;
create policy man_of_the_match_votes_select_own
  on public.man_of_the_match_votes
  for select
  using (user_id = auth.uid());

drop policy if exists man_of_the_match_votes_select_admin on public.man_of_the_match_votes;
create policy man_of_the_match_votes_select_admin
  on public.man_of_the_match_votes
  for select
  using (public.is_admin());

drop policy if exists man_of_the_match_votes_insert_own_when_open on public.man_of_the_match_votes;
create policy man_of_the_match_votes_insert_own_when_open
  on public.man_of_the_match_votes
  for insert
  with check (
    user_id = auth.uid()
    and public.is_match_open_for_voting(match_id, player_id)
  );

drop policy if exists man_of_the_match_votes_update_own_when_open on public.man_of_the_match_votes;
create policy man_of_the_match_votes_update_own_when_open
  on public.man_of_the_match_votes
  for update
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and public.is_match_open_for_voting(match_id, player_id)
  );

-- This aggregate view intentionally runs with the view owner's privileges so public
-- users can see published aggregates without seeing individual vote rows.
create or replace view public.player_match_ratings
with (security_barrier = true)
as
select
  mp.match_id,
  mp.player_id,
  count(v.id)::integer as votes_count,
  round(avg(v.rating), 2)::numeric(4, 2) as average_rating
from public.match_players mp
join public.matches m
  on m.id = mp.match_id
left join public.votes v
  on v.match_id = mp.match_id
 and v.player_id = mp.player_id
where m.results_published = true
group by mp.match_id, mp.player_id;

create or replace view public.season_player_statistics
with (security_invoker = true, security_barrier = true)
as
with published_match_players as (
  select
    m.season_id,
    mp.match_id,
    mp.player_id,
    mp.participation_status
  from public.match_players mp
  join public.matches m
    on m.id = mp.match_id
  where m.results_published = true
),
played_totals as (
  select
    season_id,
    player_id,
    count(*) filter (
      where participation_status in ('starter', 'substitute_entered')
    )::integer as matches_played
  from published_match_players
  group by season_id, player_id
),
rating_totals as (
  select
    m.season_id,
    pmr.player_id,
    count(*) filter (where pmr.votes_count > 0)::integer as rated_matches,
    coalesce(sum(pmr.votes_count), 0)::integer as total_votes,
    round(
      avg(pmr.average_rating) filter (where pmr.votes_count > 0),
      2
    )::numeric(4, 2) as season_average
  from public.player_match_ratings pmr
  join public.matches m
    on m.id = pmr.match_id
  group by m.season_id, pmr.player_id
),
motm_counts as (
  select
    m.season_id,
    mv.match_id,
    mv.player_id,
    count(*)::integer as selections_count
  from public.man_of_the_match_votes mv
  join public.matches m
    on m.id = mv.match_id
  where m.results_published = true
  group by m.season_id, mv.match_id, mv.player_id
),
motm_winners as (
  select
    season_id,
    match_id,
    player_id
  from (
    select
      season_id,
      match_id,
      player_id,
      selections_count,
      max(selections_count) over (partition by season_id, match_id) as max_selections
    from motm_counts
  ) ranked
  where selections_count = max_selections
    and selections_count > 0
),
motm_totals as (
  select
    season_id,
    player_id,
    count(*)::integer as man_of_the_match_count
  from motm_winners
  group by season_id, player_id
)
select
  s.id as season_id,
  p.id as player_id,
  coalesce(pt.matches_played, 0) as matches_played,
  coalesce(rt.rated_matches, 0) as rated_matches,
  coalesce(rt.total_votes, 0) as total_votes,
  rt.season_average,
  coalesce(mt.man_of_the_match_count, 0) as man_of_the_match_count
from public.seasons s
cross join public.players p
left join played_totals pt
  on pt.season_id = s.id
 and pt.player_id = p.id
left join rating_totals rt
  on rt.season_id = s.id
 and rt.player_id = p.id
left join motm_totals mt
  on mt.season_id = s.id
 and mt.player_id = p.id;

create index if not exists seasons_status_idx on public.seasons(status);
create index if not exists players_active_idx on public.players(active);
create index if not exists matches_season_id_idx on public.matches(season_id);
create index if not exists matches_match_date_idx on public.matches(match_date);
create index if not exists matches_status_idx on public.matches(status);
create index if not exists matches_voting_status_idx on public.matches(voting_status);
create index if not exists match_players_match_id_idx on public.match_players(match_id);
create index if not exists match_players_player_id_idx on public.match_players(player_id);
create index if not exists votes_match_id_idx on public.votes(match_id);
create index if not exists votes_player_id_idx on public.votes(player_id);
create index if not exists votes_user_id_idx on public.votes(user_id);
create index if not exists man_of_the_match_votes_match_id_idx
  on public.man_of_the_match_votes(match_id);
create index if not exists man_of_the_match_votes_user_id_idx
  on public.man_of_the_match_votes(user_id);

grant usage on schema public to anon, authenticated;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_match_open_for_voting(uuid, uuid) to authenticated;

grant select on public.seasons to anon, authenticated;
grant select on public.players to anon, authenticated;
grant select on public.matches to anon, authenticated;
grant select on public.match_players to anon, authenticated;
grant select on public.player_match_ratings to anon, authenticated;
grant select on public.season_player_statistics to anon, authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.seasons to authenticated;
grant select, insert, update, delete on public.players to authenticated;
grant select, insert, update, delete on public.matches to authenticated;
grant select, insert, update, delete on public.match_players to authenticated;
grant select, insert, update on public.votes to authenticated;
grant select, insert, update on public.man_of_the_match_votes to authenticated;
