\set ON_ERROR_STOP on

begin;

select set_config(
  'request.jwt.claim.sub',
  (
    select profile.user_id::text
    from public.user_profiles profile
    where (
        lower(coalesce(profile.role, '')) in ('admin', 'super.all', 'adminphysio', 'adminsoins')
        or coalesce(profile.permissions, '{}'::jsonb) ?| array['admin', 'super.all', 'editor']
        or exists (
          select 1
          from public.user_track_roles track_role
          where track_role.user_id = profile.user_id
            and track_role.is_active = true
            and track_role.role::text in ('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT', 'RF', 'RM')
            and (track_role.expires_at is null or track_role.expires_at > now())
        )
      )
      and nullif(btrim(coalesce(profile.firebase_id, '')), '') is not null
    order by profile.created_at
    limit 1
  ),
  true
);

select set_config(
  'heds_test.legacy_profile_id',
  (
    select profile.firebase_id
    from public.user_profiles profile
    where profile.user_id = current_setting('request.jwt.claim.sub')::uuid
    limit 1
  ),
  true
);

set local role authenticated;

do $test$
declare
  resolved_id uuid;
begin
  if nullif(current_setting('request.jwt.claim.sub', true), '') is null
     or nullif(current_setting('heds_test.legacy_profile_id', true), '') is null then
    raise exception 'Legacy profile resolver test requires a privileged user with a Firebase identifier';
  end if;

  select public.resolve_accessible_user_profile_id(
    current_setting('heds_test.legacy_profile_id')
  ) into resolved_id;

  if resolved_id is distinct from auth.uid() then
    raise exception 'An authorized legacy identifier must resolve to its Supabase UUID';
  end if;

  if public.resolve_accessible_user_profile_id('unknown-legacy-profile') is not null then
    raise exception 'An unknown identifier must not resolve';
  end if;
end
$test$;

reset role;
rollback;

select 'resolve_legacy_profile_ids_isolation_ok' as result;
