-- Atomic ballot submission and aggregate match results.

create or replace function public.submit_match_ballot(
  p_match_id uuid,
  p_ratings jsonb,
  p_man_of_the_match_player_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  current_user_id uuid;
  target_match public.matches;
  ratings_count integer;
  unique_players_count integer;
  eligible_players_count integer;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'AUTH_REQUIRED: Authentication required'
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
    raise exception 'VOTING_CLOSED: Voting is not open for this match'
      using errcode = '23514';
  end if;

  if p_ratings is null
     or jsonb_typeof(p_ratings) <> 'array'
     or jsonb_array_length(p_ratings) = 0 then
    raise exception 'INCOMPLETE_BALLOT: Ratings must be a non-empty list'
      using errcode = '23514';
  end if;

  drop table if exists pg_temp.ballot_rating_input;

  create temporary table ballot_rating_input on commit drop as
  select
    (item.value ->> 'playerId')::uuid as player_id,
    (item.value ->> 'rating')::numeric as rating
  from jsonb_array_elements(p_ratings) as item(value);

  select count(*), count(distinct player_id)
  into ratings_count, unique_players_count
  from ballot_rating_input;

  if ratings_count <> unique_players_count then
    raise exception 'VALIDATION_ERROR: Duplicate players are not allowed'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from ballot_rating_input
    where player_id is null
       or rating is null
       or rating < 1
       or rating > 10
       or rating * 2 <> floor(rating * 2)
  ) then
    raise exception 'VALIDATION_ERROR: Ratings must be between 1 and 10 with a 0.5 step'
      using errcode = '23514';
  end if;

  select count(*)
  into eligible_players_count
  from public.match_players
  where match_id = p_match_id
    and participation_status in ('starter', 'substitute_entered')
    and eligible_for_rating = true;

  if ratings_count <> eligible_players_count then
    raise exception 'INCOMPLETE_BALLOT: A rating is required for every eligible player'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from ballot_rating_input input
    where not exists (
      select 1
      from public.match_players mp
      where mp.match_id = p_match_id
        and mp.player_id = input.player_id
        and mp.participation_status in ('starter', 'substitute_entered')
        and mp.eligible_for_rating = true
    )
  ) then
    raise exception 'PLAYER_NOT_ELIGIBLE: Player is not eligible for rating'
      using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.match_players mp
    where mp.match_id = p_match_id
      and mp.player_id = p_man_of_the_match_player_id
      and mp.participation_status in ('starter', 'substitute_entered')
      and mp.eligible_for_rating = true
  ) then
    raise exception 'PLAYER_NOT_ELIGIBLE: Man of the match player is not eligible'
      using errcode = '23514';
  end if;

  insert into public.votes (
    match_id,
    player_id,
    user_id,
    rating,
    comment
  )
  select
    p_match_id,
    input.player_id,
    current_user_id,
    input.rating,
    null
  from ballot_rating_input input
  on conflict (match_id, player_id, user_id)
  do update
  set rating = excluded.rating,
      comment = null;

  insert into public.man_of_the_match_votes (
    match_id,
    player_id,
    user_id
  )
  values (
    p_match_id,
    p_man_of_the_match_player_id,
    current_user_id
  )
  on conflict (match_id, user_id)
  do update
  set player_id = excluded.player_id;
end;
$$;

create or replace function public.get_match_results(p_match_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  target_match public.matches;
  is_current_user_admin boolean;
  result_payload jsonb;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED: Authentication required'
      using errcode = '42501';
  end if;

  select *
  into target_match
  from public.matches
  where id = p_match_id;

  if not found then
    raise exception 'Match not found'
      using errcode = 'P0002';
  end if;

  is_current_user_admin := public.is_admin();

  if target_match.results_published is not true
     and is_current_user_admin is not true then
    raise exception 'RESULTS_NOT_PUBLISHED: Results are not published'
      using errcode = '42501';
  end if;

  with eligible_players as (
    select
      mp.match_id,
      mp.player_id,
      mp.participation_status,
      mp.minutes_played,
      p.first_name,
      p.last_name,
      p.position,
      p.shirt_number,
      p.photo_url
    from public.match_players mp
    join public.players p
      on p.id = mp.player_id
    where mp.match_id = p_match_id
      and mp.participation_status in ('starter', 'substitute_entered')
      and mp.eligible_for_rating = true
  ),
  rating_counts as (
    select
      v.player_id,
      count(v.id)::integer as votes_count,
      round(avg(v.rating), 2)::numeric(4, 2) as average_rating
    from public.votes v
    where v.match_id = p_match_id
    group by v.player_id
  ),
  motm_counts as (
    select
      mv.player_id,
      count(mv.id)::integer as man_of_the_match_votes
    from public.man_of_the_match_votes mv
    where mv.match_id = p_match_id
    group by mv.player_id
  ),
  ranked_players as (
    select
      ep.player_id,
      ep.first_name,
      ep.last_name,
      ep.position,
      ep.shirt_number,
      ep.photo_url,
      coalesce(rc.votes_count, 0) as votes_count,
      rc.average_rating,
      coalesce(mc.man_of_the_match_votes, 0) as man_of_the_match_votes,
      rank() over (
        order by
          rc.average_rating desc nulls last,
          coalesce(rc.votes_count, 0) desc,
          ep.last_name asc,
          ep.first_name asc
      )::integer as rank
    from eligible_players ep
    left join rating_counts rc
      on rc.player_id = ep.player_id
    left join motm_counts mc
      on mc.player_id = ep.player_id
  ),
  summary as (
    select
      (select count(*)::integer from eligible_players) as eligible_players,
      (select count(distinct user_id)::integer from public.votes where match_id = p_match_id) as users_who_voted,
      (select count(*)::integer from public.votes where match_id = p_match_id) as ratings_count
  ),
  motm_max as (
    select max(man_of_the_match_votes) as max_votes
    from ranked_players
  )
  select jsonb_build_object(
    'match', jsonb_build_object(
      'id', target_match.id,
      'opponentName', target_match.opponent_name,
      'competition', target_match.competition,
      'matchDate', target_match.match_date,
      'manchesterUnitedScore', target_match.manchester_united_score,
      'opponentScore', target_match.opponent_score,
      'votingStatus', target_match.voting_status,
      'resultsPublished', target_match.results_published
    ),
    'summary', jsonb_build_object(
      'eligiblePlayers', summary.eligible_players,
      'usersWhoVoted', summary.users_who_voted,
      'ratingsCount', summary.ratings_count
    ),
    'ranking', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'playerId', player_id,
          'firstName', first_name,
          'lastName', last_name,
          'displayName', first_name || ' ' || last_name,
          'photoUrl', photo_url,
          'position', position,
          'shirtNumber', shirt_number,
          'votesCount', votes_count,
          'averageRating', average_rating,
          'manOfTheMatchVotes', man_of_the_match_votes,
          'rank', rank
        )
        order by rank asc, last_name asc, first_name asc
      )
      from ranked_players
    ), '[]'::jsonb),
    'manOfTheMatch', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'playerId', player_id,
          'firstName', first_name,
          'lastName', last_name,
          'displayName', first_name || ' ' || last_name,
          'photoUrl', photo_url,
          'position', position,
          'shirtNumber', shirt_number,
          'selections', man_of_the_match_votes
        )
        order by last_name asc, first_name asc
      )
      from ranked_players, motm_max
      where motm_max.max_votes > 0
        and ranked_players.man_of_the_match_votes = motm_max.max_votes
    ), '[]'::jsonb)
  )
  into result_payload
  from summary;

  return result_payload;
end;
$$;

revoke all on function public.submit_match_ballot(uuid, jsonb, uuid) from public;
revoke all on function public.get_match_results(uuid) from public;

grant execute on function public.submit_match_ballot(uuid, jsonb, uuid) to authenticated;
grant execute on function public.get_match_results(uuid) to authenticated;
