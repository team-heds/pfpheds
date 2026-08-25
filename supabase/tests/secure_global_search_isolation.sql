\set ON_ERROR_STOP on

begin;

select set_config(
  'request.jwt.claim.sub',
  (
    select profile.user_id::text
    from public.user_profiles profile
    where lower(coalesce(profile.role, '')) not in ('admin', 'super.all', 'adminphysio', 'adminsoins')
      and not (coalesce(profile.permissions, '{}'::jsonb) ?| array['admin', 'super.all', 'editor'])
      and not exists (
        select 1
        from public.user_track_roles track_role
        where track_role.user_id = profile.user_id
          and track_role.is_active = true
          and track_role.role::text in ('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT', 'RF', 'RM')
          and (track_role.expires_at is null or track_role.expires_at > now())
      )
    order by profile.created_at
    limit 1
  ),
  true
);

select set_config(
  'heds_test.other_uid',
  (
    select profile.user_id::text
    from public.user_profiles profile
    where profile.user_id <> current_setting('request.jwt.claim.sub')::uuid
      and not exists (
        select 1
        from public."StudentsPhysio" student
        where student.user_id = profile.user_id
          and student.repond_hes_id = current_setting('request.jwt.claim.sub')
      )
    order by profile.created_at
    limit 1
  ),
  true
);

set local role authenticated;

do $test$
begin
  if nullif(current_setting('request.jwt.claim.sub', true), '') is null
     or nullif(current_setting('heds_test.other_uid', true), '') is null then
    raise exception 'Global search isolation test requires two non-assigned users';
  end if;

  if not public.app_can_view_user_profile(auth.uid()) then
    raise exception 'A user must be able to view their own profile';
  end if;

  if public.app_can_view_user_profile(current_setting('heds_test.other_uid')::uuid) then
    raise exception 'An ordinary user must not be able to view another profile';
  end if;
end
$test$;

reset role;
rollback;

select 'secure_global_search_isolation_ok' as result;
