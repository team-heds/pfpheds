-- Give SI teachers access to their own workload through a fixed-scope RPC.
-- Direct reads of planning_time_slots remain limited to privileged users.

create or replace function public.app_is_si_teacher()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.user_profiles up
    where up.user_id = (select auth.uid())
      and coalesce(up.is_active, true)
      and (
        lower(coalesce(up.role, '')) = 'enseignantsoins'
        or coalesce(up.permissions, '[]'::jsonb) ? 'EnseignantSoins'
      )
  );
$$;

revoke all on function public.app_is_si_teacher() from public, anon;
grant execute on function public.app_is_si_teacher() to authenticated, service_role;

create or replace function public.get_my_si_workload_slots()
returns setof public.planning_time_slots
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  current_user_id uuid := (select auth.uid());
  profile_email text;
  profile_display_name text;
begin
  if current_user_id is null or not (select public.app_is_si_teacher()) then
    raise exception 'Insufficient privileges' using errcode = '42501';
  end if;

  select lower(nullif(trim(up.email), '')), nullif(trim(coalesce(up.display_name, concat_ws(' ', up.forname, up.family_name))), '')
  into profile_email, profile_display_name
  from public.user_profiles up
  where up.user_id = current_user_id
    and coalesce(up.is_active, true)
    and (
      lower(coalesce(up.role, '')) = 'enseignantsoins'
      or coalesce(up.permissions, '[]'::jsonb) ? 'EnseignantSoins'
    );

  if profile_email is null and profile_display_name is null then
    raise exception 'Active SI teacher profile not found' using errcode = '42501';
  end if;

  return query
  select pts.*
  from public.planning_time_slots pts
  where pts.archived_at is null
    and exists (
      select 1
      from unnest(coalesce(pts.teachers, '{}'::text[])) as raw_teacher(value)
      where
        case
          when left(trim(raw_teacher.value), 1) = '{' then
            (
              coalesce(
                nullif(raw_teacher.value::jsonb ->> 'user_id', ''),
                nullif(raw_teacher.value::jsonb ->> 'id', ''),
                nullif(raw_teacher.value::jsonb ->> 'profile_id', '')
              ) = current_user_id::text
              or (profile_email is not null and lower(trim(coalesce(raw_teacher.value::jsonb ->> 'email', ''))) = profile_email)
              or (
                profile_display_name is not null
                and lower(trim(coalesce(raw_teacher.value::jsonb ->> 'display_name', raw_teacher.value::jsonb ->> 'name', ''))) = lower(profile_display_name)
              )
            )
          else
            lower(trim(raw_teacher.value)) = current_user_id::text
            or (profile_email is not null and lower(trim(raw_teacher.value)) = profile_email)
            or (
              profile_display_name is not null
              and lower(trim(raw_teacher.value)) = lower(profile_display_name)
            )
        end
    )
  order by pts.week_number, pts.day_index, pts.start_time;
end;
$$;

revoke all on function public.get_my_si_workload_slots() from public, anon;
grant execute on function public.get_my_si_workload_slots() to authenticated, service_role;

comment on function public.get_my_si_workload_slots() is
  'Returns only planning slots assigned to the authenticated active SI teacher; no target user ID is accepted.';

revoke select on table public.planning_time_slots from anon, authenticated;
grant select on table public.planning_time_slots to service_role;

drop policy if exists "p0_authenticated_read" on public.planning_time_slots;
drop policy if exists "si_teacher_workload_privileged_read" on public.planning_time_slots;
create policy "si_teacher_workload_privileged_read"
  on public.planning_time_slots
  for select
  to authenticated
  using ((select public.app_is_privileged()));

notify pgrst, 'reload schema';
