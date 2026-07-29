-- Replace demo players with the Manchester United squad seed.

with demo_players as (
  select id
  from public.players
  where (lower(first_name), lower(last_name)) in (
    ('demo', 'defender'),
    ('demo', 'forward'),
    ('demo', 'goalkeeper')
  )
)
update public.players
set active = false,
    updated_at = now()
where id in (select id from demo_players)
  and exists (
    select 1
    from public.match_players mp
    where mp.player_id = players.id
  );

with demo_players as (
  select id
  from public.players
  where (lower(first_name), lower(last_name)) in (
    ('demo', 'defender'),
    ('demo', 'forward'),
    ('demo', 'goalkeeper')
  )
)
delete from public.players
where id in (select id from demo_players)
  and not exists (
    select 1
    from public.match_players mp
    where mp.player_id = players.id
  );

with squad(first_name, last_name, shirt_number, position, active) as (
  values
    ('Altay', 'Bayindir', 1, 'Goalkeeper', true),
    ('Karl', 'Darlow', 12, 'Goalkeeper', true),
    ('Tom', 'Heaton', 22, 'Goalkeeper', true),
    ('Senne', 'Lammens', 31, 'Goalkeeper', true),
    ('Dermot', 'Mee', 45, 'Goalkeeper', true),
    ('Andre', 'Onana', 24, 'Goalkeeper', false),
    ('Harry', 'Amass', 41, 'Defender', true),
    ('Patrick', 'Dorgu', 13, 'Defender', true),
    ('Diogo', 'Dalot', 2, 'Defender', true),
    ('Matthijs', 'de Ligt', 4, 'Defender', true),
    ('Tyler', 'Fredricson', 33, 'Defender', true),
    ('Ayden', 'Heaven', 26, 'Defender', true),
    ('Harry', 'Maguire', 5, 'Defender', true),
    ('Lisandro', 'Martinez', 6, 'Defender', true),
    ('Noussair', 'Mazraoui', 3, 'Defender', true),
    ('Luke', 'Shaw', 23, 'Defender', true),
    ('Leny', 'Yoro', 15, 'Defender', true),
    ('Toby', 'Collyer', 43, 'Midfielder', true),
    ('Bruno', 'Fernandes', 8, 'Midfielder', true),
    ('Jack', 'Fletcher', 38, 'Midfielder', true),
    ('Tyler', 'Fletcher', 39, 'Midfielder', true),
    ('Kobbie', 'Mainoo', 37, 'Midfielder', true),
    ('Mason', 'Mount', 7, 'Midfielder', true),
    ('Andrey', 'Santos', 17, 'Midfielder', true),
    ('Youri', 'Tielemans', 18, 'Midfielder', true),
    ('Manuel', 'Ugarte', 25, 'Midfielder', true),
    ('Matheus', 'Cunha', 10, 'Forward', true),
    ('Amad', 'Diallo', 16, 'Forward', true),
    ('Shea', 'Lacey', 61, 'Forward', true),
    ('Bryan', 'Mbeumo', 19, 'Forward', true),
    ('Marcus', 'Rashford', null, 'Forward', true),
    ('Benjamin', 'Sesko', 30, 'Forward', true),
    ('Joshua', 'Zirkzee', 11, 'Forward', true)
)
insert into public.players (
  first_name,
  last_name,
  shirt_number,
  position,
  photo_url,
  active,
  joined_at,
  left_at
)
select
  squad.first_name,
  squad.last_name,
  squad.shirt_number,
  squad.position,
  null,
  squad.active,
  null,
  null
from squad
where not exists (
  select 1
  from public.players existing_player
  where lower(existing_player.first_name) = lower(squad.first_name)
    and lower(existing_player.last_name) = lower(squad.last_name)
);
