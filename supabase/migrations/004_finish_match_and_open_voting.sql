-- Match lineup replacement and match lifecycle actions.

create or replace function public.replace_match_lineup(
  p_match_id uuid,
  p_players jsonb
)
returns setof public.match_players
language plpgsql
security invoker
set search_path = public
as $$
declare
  target_match public.matches;
  total_players integer;
  unique_players integer;
begin
  if not public.is_admin() then
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
    raise exception 'Lineup cannot be changed after voting is completed'
      using errcode = '23514';
  end if;

  if p_players is null
     or jsonb_typeof(p_players) <> 'array'
     or jsonb_array_length(p_players) = 0 then
    raise exception 'Lineup must contain at least one player'
      using errcode = '23514';
  end if;

  drop table if exists pg_temp.match_lineup_input;

  create temporary table match_lineup_input on commit drop as
  select
    (item.value ->> 'player_id')::uuid as player_id,
    (item.value ->> 'participation_status')::public.participation_status as participation_status,
    nullif(item.value ->> 'entered_minute', '')::integer as entered_minute,
    nullif(item.value ->> 'exited_minute', '')::integer as exited_minute,
    (item.value ->> 'minutes_played')::integer as minutes_played,
    (item.value ->> 'eligible_for_rating')::boolean as eligible_for_rating
  from jsonb_array_elements(p_players) as item(value);

  select count(*), count(distinct player_id)
  into total_players, unique_players
  from match_lineup_input;

  if total_players <> unique_players then
    raise exception 'A player can appear only once in a lineup'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from match_lineup_input
    where player_id is null
       or participation_status is null
       or minutes_played is null
       or eligible_for_rating is null
  ) then
    raise exception 'Lineup contains incomplete player data'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from match_lineup_input input
    left join public.players player
      on player.id = input.player_id
    where player.id is null
       or player.active is not true
  ) then
    raise exception 'Only active players can be added to a lineup'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from match_lineup_input
    where minutes_played < 0
       or minutes_played > 130
       or entered_minute < 0
       or entered_minute > 130
       or exited_minute < 0
       or exited_minute > 130
       or (
          entered_minute is not null
          and exited_minute is not null
          and exited_minute < entered_minute
       )
  ) then
    raise exception 'Lineup minutes are not coherent'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from match_lineup_input
    where participation_status = 'substitute_unused'
      and (
        minutes_played <> 0
        or eligible_for_rating is true
        or entered_minute is not null
        or exited_minute is not null
      )
  ) then
    raise exception 'Unused substitutes must have 0 minutes and must not be eligible'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from match_lineup_input
    where participation_status <> 'substitute_unused'
      and minutes_played <= 0
  ) then
    raise exception 'Participants must have minutes played'
      using errcode = '23514';
  end if;

  delete from public.match_players
  where match_id = p_match_id;

  insert into public.match_players (
    match_id,
    player_id,
    participation_status,
    entered_minute,
    exited_minute,
    minutes_played,
    eligible_for_rating
  )
  select
    p_match_id,
    player_id,
    participation_status,
    entered_minute,
    exited_minute,
    minutes_played,
    eligible_for_rating
  from match_lineup_input;

  return query
  select *
  from public.match_players
  where match_id = p_match_id
  order by
    case participation_status
      when 'starter' then 1
      when 'substitute_entered' then 2
      else 3
    end,
    minutes_played desc;
end;
$$;

create or replace function public.finish_match_and_open_voting(
  p_match_id uuid,
  p_manchester_united_score integer,
  p_opponent_score integer
)
returns public.matches
language plpgsql
security invoker
set search_path = public
as $$
declare
  target_match public.matches;
  updated_match public.matches;
begin
  if not public.is_admin() then
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

  if target_match.status <> 'scheduled' then
    raise exception 'Only scheduled matches can be finished'
      using errcode = '23514';
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
      and participation_status in ('starter', 'substitute_entered')
  ) then
    raise exception 'A match cannot be finished without participants'
      using errcode = '23514';
  end if;

  update public.matches
  set
    manchester_united_score = p_manchester_united_score,
    opponent_score = p_opponent_score,
    status = 'finished',
    voting_status = 'open',
    results_published = false,
    updated_at = now()
  where id = p_match_id
  returning * into updated_match;

  return updated_match;
end;
$$;

create or replace function public.close_match_voting(p_match_id uuid)
returns public.matches
language plpgsql
security invoker
set search_path = public
as $$
declare
  target_match public.matches;
  updated_match public.matches;
begin
  if not public.is_admin() then
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

  if target_match.status <> 'finished'
     or target_match.voting_status <> 'open' then
    raise exception 'Only open voting for a finished match can be closed'
      using errcode = '23514';
  end if;

  update public.matches
  set voting_status = 'completed',
      updated_at = now()
  where id = p_match_id
  returning * into updated_match;

  return updated_match;
end;
$$;

create or replace function public.set_match_results_publication(
  p_match_id uuid,
  p_published boolean
)
returns public.matches
language plpgsql
security invoker
set search_path = public
as $$
declare
  target_match public.matches;
  updated_match public.matches;
begin
  if not public.is_admin() then
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

  if target_match.status <> 'finished'
     or target_match.voting_status <> 'completed' then
    raise exception 'Results can be published only after voting is completed'
      using errcode = '23514';
  end if;

  update public.matches
  set results_published = p_published,
      updated_at = now()
  where id = p_match_id
  returning * into updated_match;

  return updated_match;
end;
$$;

revoke all on function public.replace_match_lineup(uuid, jsonb) from public;
revoke all on function public.finish_match_and_open_voting(uuid, integer, integer) from public;
revoke all on function public.close_match_voting(uuid) from public;
revoke all on function public.set_match_results_publication(uuid, boolean) from public;

grant execute on function public.replace_match_lineup(uuid, jsonb) to authenticated;
grant execute on function public.finish_match_and_open_voting(uuid, integer, integer) to authenticated;
grant execute on function public.close_match_voting(uuid) to authenticated;
grant execute on function public.set_match_results_publication(uuid, boolean) to authenticated;
