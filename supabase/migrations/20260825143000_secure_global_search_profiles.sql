-- HEDS25-589: expose only authorized, minimal profile data to global search.

create or replace function public.app_can_view_user_profile(p_target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    (select auth.uid()) is not null
    and (
      p_target_user_id = (select auth.uid())
      or (select public.app_is_privileged())
      or exists (
        select 1
        from public."StudentsPhysio" student
        where student.user_id = p_target_user_id
          and student.repond_hes_id = (select auth.uid())::text
      )
    );
$$;

create or replace function public.search_accessible_user_profiles(
  p_query text,
  p_limit integer default 10
)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  role_label text
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    profile.user_id,
    coalesce(
      nullif(btrim(profile.display_name), ''),
      nullif(btrim(concat_ws(' ', profile.forname, profile.family_name)), ''),
      'Utilisateur'
    )::text as display_name,
    profile.avatar_url,
    case
      when lower(coalesce(profile.role, '')) like '%student%'
        or lower(coalesce(profile.role, '')) like '%etudiant%'
        then 'Étudiant'
      when lower(coalesce(profile.role, '')) like '%enseignant%'
        then 'Enseignant'
      when lower(coalesce(profile.role, '')) like '%admin%'
        then 'Administration'
      else 'Utilisateur'
    end::text as role_label
  from public.user_profiles profile
  where (select auth.uid()) is not null
    and public.app_can_view_user_profile(profile.user_id)
    and coalesce(profile.is_active, true)
    and char_length(btrim(coalesce(p_query, ''))) >= 2
    and (
      profile.display_name ilike '%' || btrim(p_query) || '%'
      or profile.forname ilike '%' || btrim(p_query) || '%'
      or profile.family_name ilike '%' || btrim(p_query) || '%'
      or concat_ws(' ', profile.forname, profile.family_name) ilike '%' || btrim(p_query) || '%'
    )
  order by
    case when lower(coalesce(profile.display_name, '')) = lower(btrim(p_query)) then 0 else 1 end,
    coalesce(profile.display_name, concat_ws(' ', profile.forname, profile.family_name))
  limit greatest(1, least(coalesce(p_limit, 10), 20));
$$;

create or replace function public.get_accessible_user_profile(p_target_user_id uuid)
returns table (
  user_id uuid,
  forname text,
  family_name text,
  display_name text,
  bio text,
  city text,
  avatar_url text,
  role text,
  classe text,
  pfp_cohort text
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    profile.user_id,
    profile.forname,
    profile.family_name,
    coalesce(
      nullif(btrim(profile.display_name), ''),
      nullif(btrim(concat_ws(' ', profile.forname, profile.family_name)), ''),
      'Utilisateur'
    )::text,
    profile.bio,
    profile.city,
    profile.avatar_url,
    profile.role::text,
    profile.classe,
    profile.pfp_cohort
  from public.user_profiles profile
  where profile.user_id = p_target_user_id
    and public.app_can_view_user_profile(profile.user_id)
  limit 1;
$$;

revoke all on function public.app_can_view_user_profile(uuid) from public, anon;
revoke all on function public.search_accessible_user_profiles(text, integer) from public, anon;
revoke all on function public.get_accessible_user_profile(uuid) from public, anon;

grant execute on function public.app_can_view_user_profile(uuid) to authenticated, service_role;
grant execute on function public.search_accessible_user_profiles(text, integer) to authenticated, service_role;
grant execute on function public.get_accessible_user_profile(uuid) to authenticated, service_role;

create policy "heds25_589_assigned_respondent_read"
  on public."StudentsPhysio"
  for select
  to authenticated
  using (repond_hes_id = (select auth.uid())::text);

comment on function public.search_accessible_user_profiles(text, integer) is
  'HEDS25-589 minimal global-search directory. Never returns email or academic details.';
comment on function public.app_can_view_user_profile(uuid) is
  'HEDS25-589 shared profile authorization: self, privileged staff, or assigned HES respondent.';
