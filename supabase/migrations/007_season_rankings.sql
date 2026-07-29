-- Season rankings and admin statistics.
-- The season average is intentionally calculated as the average of each
-- player's per-match averages, never as a direct weighted average of all votes.

create or replace function public.get_public_season_rankings(p_season_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  target_season public.seasons%rowtype;
  response jsonb;
begin
  select *
    into target_season
  from public.seasons
  where id = p_season_id;

  if not found then
    raise exception 'SEASON_NOT_FOUND' using errcode = 'P0002';
  end if;

  with included_matches as (
    select id
    from public.matches
    where season_id = p_season_id
      and status = 'finished'
      and results_published = true
  ),
  played_totals as (
    select
      mp.player_id,
      count(*) filter (
        where mp.participation_status in ('starter', 'substitute_entered')
      )::integer as matches_played
    from public.match_players mp
    join included_matches im
      on im.id = mp.match_id
    group by mp.player_id
  ),
  rating_match_averages as (
    select
      v.match_id,
      v.player_id,
      count(v.id)::integer as votes_count,
      avg(v.rating) as match_average
    from public.votes v
    join included_matches im
      on im.id = v.match_id
    group by v.match_id, v.player_id
  ),
  rating_totals as (
    select
      player_id,
      count(*)::integer as rated_matches,
      coalesce(sum(votes_count), 0)::integer as total_votes,
      round(avg(match_average), 2)::numeric(4, 2) as season_average
    from rating_match_averages
    where votes_count > 0
    group by player_id
  ),
  motm_counts as (
    select
      mv.match_id,
      mv.player_id,
      count(*)::integer as selections_count
    from public.man_of_the_match_votes mv
    join included_matches im
      on im.id = mv.match_id
    group by mv.match_id, mv.player_id
  ),
  motm_winners as (
    select
      match_id,
      player_id
    from (
      select
        match_id,
        player_id,
        selections_count,
        max(selections_count) over (partition by match_id) as max_selections
      from motm_counts
    ) ranked_motm
    where selections_count = max_selections
      and selections_count > 0
  ),
  motm_totals as (
    select
      player_id,
      count(*)::integer as man_of_the_match_count
    from motm_winners
    group by player_id
  ),
  player_stats as (
    select
      p.id as player_id,
      p.first_name,
      p.last_name,
      p.shirt_number,
      p.position,
      p.photo_url,
      p.active,
      coalesce(pt.matches_played, 0)::integer as matches_played,
      coalesce(rt.rated_matches, 0)::integer as rated_matches,
      coalesce(rt.total_votes, 0)::integer as total_votes,
      rt.season_average,
      coalesce(mt.man_of_the_match_count, 0)::integer as man_of_the_match_count
    from public.players p
    left join played_totals pt
      on pt.player_id = p.id
    left join rating_totals rt
      on rt.player_id = p.id
    left join motm_totals mt
      on mt.player_id = p.id
  ),
  ranked_players as (
    select
      *,
      dense_rank() over (
        order by
          case when season_average is null then 1 else 0 end,
          season_average desc nulls last,
          rated_matches desc,
          matches_played desc
      )::integer as rank
    from player_stats
  )
  select jsonb_build_object(
    'season', jsonb_build_object(
      'id', target_season.id,
      'name', target_season.name,
      'status', target_season.status
    ),
    'ranking', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'rank', rank,
            'playerId', player_id,
            'firstName', first_name,
            'lastName', last_name,
            'shirtNumber', shirt_number,
            'position', position,
            'photoUrl', photo_url,
            'active', active,
            'matchesPlayed', matches_played,
            'ratedMatches', rated_matches,
            'totalVotes', total_votes,
            'seasonAverage', season_average,
            'manOfTheMatchCount', man_of_the_match_count
          )
          order by
            rank,
            lower(last_name),
            lower(first_name)
        )
        from ranked_players
      ),
      '[]'::jsonb
    )
  )
    into response
  ;

  return response;
end;
$$;

create or replace function public.get_admin_season_statistics(
  p_season_id uuid,
  p_published_only boolean default false
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  target_season public.seasons%rowtype;
  requester_is_admin boolean;
  response jsonb;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  )
    into requester_is_admin;

  if requester_is_admin is not true then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;

  select *
    into target_season
  from public.seasons
  where id = p_season_id;

  if not found then
    raise exception 'SEASON_NOT_FOUND' using errcode = 'P0002';
  end if;

  with included_matches as (
    select id
    from public.matches
    where season_id = p_season_id
      and status = 'finished'
      and (
        case
          when p_published_only then results_published = true
          else voting_status = 'completed'
        end
      )
  ),
  played_totals as (
    select
      mp.player_id,
      count(*) filter (
        where mp.participation_status in ('starter', 'substitute_entered')
      )::integer as matches_played
    from public.match_players mp
    join included_matches im
      on im.id = mp.match_id
    group by mp.player_id
  ),
  rating_match_averages as (
    select
      v.match_id,
      v.player_id,
      count(v.id)::integer as votes_count,
      avg(v.rating) as match_average
    from public.votes v
    join included_matches im
      on im.id = v.match_id
    group by v.match_id, v.player_id
  ),
  rating_totals as (
    select
      player_id,
      count(*)::integer as rated_matches,
      coalesce(sum(votes_count), 0)::integer as total_votes,
      round(avg(match_average), 2)::numeric(4, 2) as season_average
    from rating_match_averages
    where votes_count > 0
    group by player_id
  ),
  motm_counts as (
    select
      mv.match_id,
      mv.player_id,
      count(*)::integer as selections_count
    from public.man_of_the_match_votes mv
    join included_matches im
      on im.id = mv.match_id
    group by mv.match_id, mv.player_id
  ),
  motm_winners as (
    select
      match_id,
      player_id
    from (
      select
        match_id,
        player_id,
        selections_count,
        max(selections_count) over (partition by match_id) as max_selections
      from motm_counts
    ) ranked_motm
    where selections_count = max_selections
      and selections_count > 0
  ),
  motm_totals as (
    select
      player_id,
      count(*)::integer as man_of_the_match_count
    from motm_winners
    group by player_id
  ),
  player_stats as (
    select
      p.id as player_id,
      p.first_name,
      p.last_name,
      p.shirt_number,
      p.position,
      p.photo_url,
      p.active,
      coalesce(pt.matches_played, 0)::integer as matches_played,
      coalesce(rt.rated_matches, 0)::integer as rated_matches,
      coalesce(rt.total_votes, 0)::integer as total_votes,
      rt.season_average,
      coalesce(mt.man_of_the_match_count, 0)::integer as man_of_the_match_count
    from public.players p
    left join played_totals pt
      on pt.player_id = p.id
    left join rating_totals rt
      on rt.player_id = p.id
    left join motm_totals mt
      on mt.player_id = p.id
  ),
  ranked_players as (
    select
      *,
      dense_rank() over (
        order by
          case when season_average is null then 1 else 0 end,
          season_average desc nulls last,
          rated_matches desc,
          matches_played desc
      )::integer as rank
    from player_stats
  ),
  season_summary as (
    select
      count(m.id)::integer as total_matches,
      count(m.id) filter (where m.status = 'finished')::integer as finished_matches,
      count(m.id) filter (
        where m.status = 'finished'
          and m.voting_status = 'completed'
      )::integer as matches_with_completed_voting,
      count(m.id) filter (where m.results_published = true)::integer as published_matches
    from public.matches m
    where m.season_id = p_season_id
  ),
  vote_summary as (
    select
      count(v.id)::integer as total_ratings,
      count(distinct v.user_id)::integer as users_who_voted,
      count(distinct v.player_id)::integer as players_rated
    from public.votes v
    join included_matches im
      on im.id = v.match_id
  )
  select jsonb_build_object(
    'season', jsonb_build_object(
      'id', target_season.id,
      'name', target_season.name,
      'status', target_season.status
    ),
    'summary', jsonb_build_object(
      'seasonId', target_season.id,
      'seasonName', target_season.name,
      'seasonStatus', target_season.status,
      'publishedOnly', p_published_only,
      'totalMatches', coalesce(ss.total_matches, 0),
      'finishedMatches', coalesce(ss.finished_matches, 0),
      'matchesWithCompletedVoting', coalesce(ss.matches_with_completed_voting, 0),
      'publishedMatches', coalesce(ss.published_matches, 0),
      'totalRatings', coalesce(vs.total_ratings, 0),
      'usersWhoVoted', coalesce(vs.users_who_voted, 0),
      'playersRated', coalesce(vs.players_rated, 0)
    ),
    'ranking', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'rank', rank,
            'playerId', player_id,
            'firstName', first_name,
            'lastName', last_name,
            'shirtNumber', shirt_number,
            'position', position,
            'photoUrl', photo_url,
            'active', active,
            'matchesPlayed', matches_played,
            'ratedMatches', rated_matches,
            'totalVotes', total_votes,
            'seasonAverage', season_average,
            'manOfTheMatchCount', man_of_the_match_count
          )
          order by
            rank,
            lower(last_name),
            lower(first_name)
        )
        from ranked_players
      ),
      '[]'::jsonb
    )
  )
    into response
  from season_summary ss
  cross join vote_summary vs;

  return response;
end;
$$;

revoke all on function public.get_public_season_rankings(uuid) from public;
revoke all on function public.get_admin_season_statistics(uuid, boolean) from public;

grant execute on function public.get_public_season_rankings(uuid) to anon, authenticated;
grant execute on function public.get_admin_season_statistics(uuid, boolean) to authenticated;
