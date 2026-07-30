-- Account management helpers.
-- Profile role remains owned by public.profiles.role and is never accepted by this RPC.

create or replace function public.update_own_profile(p_full_name text)
returns table (
  id uuid,
  full_name text,
  role public.app_role
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid;
  normalized_full_name text;
begin
  current_user_id := auth.uid();

  if current_user_id is null then
    raise exception 'AUTH_REQUIRED: Authentication required'
      using errcode = '42501';
  end if;

  normalized_full_name := btrim(coalesce(p_full_name, ''));

  if length(normalized_full_name) < 2 or length(normalized_full_name) > 100 then
    raise exception 'VALIDATION_ERROR: full_name must contain between 2 and 100 characters'
      using errcode = '22023';
  end if;

  return query
    update public.profiles as profiles
    set
      full_name = normalized_full_name,
      updated_at = now()
    where profiles.id = current_user_id
    returning profiles.id, profiles.full_name, profiles.role;

  if not found then
    raise exception 'PROFILE_NOT_FOUND: Profile not found'
      using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.update_own_profile(text) from public;
revoke all on function public.update_own_profile(text) from anon;
grant execute on function public.update_own_profile(text) to authenticated;
