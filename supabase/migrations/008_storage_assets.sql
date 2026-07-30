-- Supabase Storage assets for player photos and opponent logos.
-- Buckets are public for reads through public URLs; writes are restricted to admins.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values
  (
    'player-photos',
    'player-photos',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'opponent-logos',
    'opponent-logos',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.players
  add column if not exists photo_path text;

alter table public.matches
  add column if not exists opponent_logo_path text;


drop policy if exists storage_assets_admin_insert on storage.objects;
create policy storage_assets_admin_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id in ('player-photos', 'opponent-logos')
    and auth.uid() is not null
    and public.is_admin()
  );

drop policy if exists storage_assets_admin_update on storage.objects;
create policy storage_assets_admin_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id in ('player-photos', 'opponent-logos')
    and auth.uid() is not null
    and public.is_admin()
  )
  with check (
    bucket_id in ('player-photos', 'opponent-logos')
    and auth.uid() is not null
    and public.is_admin()
  );

drop policy if exists storage_assets_admin_delete on storage.objects;
create policy storage_assets_admin_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id in ('player-photos', 'opponent-logos')
    and auth.uid() is not null
    and public.is_admin()
  );

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
      'opponentLogoUrl', target_match.opponent_logo_url,
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

revoke all on function public.get_match_results(uuid) from public;
grant execute on function public.get_match_results(uuid) to authenticated;
