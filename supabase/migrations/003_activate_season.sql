-- Atomically activate one season while closing any currently active season.

create or replace function public.activate_season(p_season_id uuid)
returns public.seasons
language plpgsql
security invoker
set search_path = public
as $$
declare
  activated_season public.seasons;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required'
      using errcode = '42501';
  end if;

  perform 1
  from public.seasons
  where id = p_season_id
     or status = 'active'
  for update;

  if not exists (
    select 1
    from public.seasons
    where id = p_season_id
  ) then
    raise exception 'Season not found'
      using errcode = 'P0002';
  end if;

  update public.seasons
  set status = 'closed',
      updated_at = now()
  where status = 'active'
    and id <> p_season_id;

  update public.seasons
  set status = 'active',
      updated_at = now()
  where id = p_season_id
  returning * into activated_season;

  return activated_season;
end;
$$;

revoke all on function public.activate_season(uuid) from public;
grant execute on function public.activate_season(uuid) to authenticated;
