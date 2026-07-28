-- Safe development seed data only.
-- No auth users and no votes are inserted here.

insert into public.seasons (id, name, start_date, end_date, status)
values (
  '10000000-0000-4000-8000-000000000001',
  '2026/2027',
  '2026-08-01',
  '2027-05-31',
  'active'
)
on conflict (id) do update
set
  name = excluded.name,
  start_date = excluded.start_date,
  end_date = excluded.end_date,
  status = excluded.status;

insert into public.players (
  id,
  first_name,
  last_name,
  shirt_number,
  position,
  active,
  joined_at
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    'Demo',
    'Goalkeeper',
    31,
    'GK',
    true,
    '2026-07-01'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'Demo',
    'Defender',
    42,
    'DEF',
    true,
    '2026-07-01'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    'Demo',
    'Forward',
    77,
    'FWD',
    true,
    '2026-07-01'
  )
on conflict (id) do update
set
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  shirt_number = excluded.shirt_number,
  position = excluded.position,
  active = excluded.active,
  joined_at = excluded.joined_at;

insert into public.matches (
  id,
  season_id,
  opponent_name,
  competition,
  match_date,
  venue,
  is_home,
  manchester_united_score,
  opponent_score,
  status,
  voting_status,
  results_published
)
values
  (
    '30000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'Demo City',
    'Premier League',
    '2026-08-15 15:00:00+00',
    'Old Trafford',
    true,
    2,
    1,
    'finished',
    'open',
    false
  ),
  (
    '30000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'Demo Rovers',
    'Premier League',
    '2026-08-22 17:30:00+00',
    'Demo Stadium',
    false,
    null,
    null,
    'scheduled',
    'closed',
    false
  )
on conflict (id) do update
set
  season_id = excluded.season_id,
  opponent_name = excluded.opponent_name,
  competition = excluded.competition,
  match_date = excluded.match_date,
  venue = excluded.venue,
  is_home = excluded.is_home,
  manchester_united_score = excluded.manchester_united_score,
  opponent_score = excluded.opponent_score,
  status = excluded.status,
  voting_status = excluded.voting_status,
  results_published = excluded.results_published;

insert into public.match_players (
  id,
  match_id,
  player_id,
  participation_status,
  entered_minute,
  exited_minute,
  minutes_played,
  eligible_for_rating
)
values
  (
    '40000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'starter',
    null,
    null,
    90,
    true
  ),
  (
    '40000000-0000-4000-8000-000000000002',
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000002',
    'starter',
    null,
    70,
    70,
    true
  ),
  (
    '40000000-0000-4000-8000-000000000003',
    '30000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000003',
    'substitute_entered',
    70,
    null,
    20,
    true
  ),
  (
    '40000000-0000-4000-8000-000000000004',
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000001',
    'starter',
    null,
    null,
    90,
    true
  ),
  (
    '40000000-0000-4000-8000-000000000005',
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000002',
    'starter',
    null,
    null,
    90,
    true
  ),
  (
    '40000000-0000-4000-8000-000000000006',
    '30000000-0000-4000-8000-000000000002',
    '20000000-0000-4000-8000-000000000003',
    'substitute_unused',
    null,
    null,
    0,
    false
  )
on conflict (match_id, player_id) do update
set
  participation_status = excluded.participation_status,
  entered_minute = excluded.entered_minute,
  exited_minute = excluded.exited_minute,
  minutes_played = excluded.minutes_played,
  eligible_for_rating = excluded.eligible_for_rating;
