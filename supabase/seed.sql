-- Safe development seed data only.
-- No auth users, players, matches, lineups, votes, or results are inserted here.

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
