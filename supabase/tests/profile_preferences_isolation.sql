\set ON_ERROR_STOP on

begin;

select set_config(
  'heds_test.owner_uid',
  (
    select up.user_id::text
    from public.user_profiles up
    where coalesce(up.is_active, true)
      and lower(coalesce(up.role, '')) not in (
        'admin', 'super.all', 'adminphysio', 'adminsoins'
      )
      and not (
        coalesce(up.permissions, '{}'::jsonb)
        ?| array['admin', 'super.all', 'editor']
      )
      and not exists (
        select 1
        from public.user_track_roles utr
        where utr.user_id = up.user_id
          and utr.is_active = true
          and utr.role::text in ('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT', 'RF', 'RM')
          and (utr.expires_at is null or utr.expires_at > now())
      )
    order by up.created_at nulls last, up.user_id
    limit 1
  ),
  true
);

select set_config(
  'heds_test.other_uid',
  (
    select up.user_id::text
    from public.user_profiles up
    where up.user_id <> current_setting('heds_test.owner_uid')::uuid
      and coalesce(up.is_active, true)
    order by up.created_at nulls last, up.user_id
    limit 1
  ),
  true
);

do $preflight$
begin
  if nullif(current_setting('heds_test.owner_uid'), '') is null
     or nullif(current_setting('heds_test.other_uid'), '') is null then
    raise exception 'Profile preference test requires two active profiles';
  end if;
end
$preflight$;

select set_config('request.jwt.claim.sub', current_setting('heds_test.owner_uid'), true);
set local role authenticated;

update public.user_profiles
set city = 'Sion', preferred_language = 'fr', canton_of_origin = 'VS'
where user_id = current_setting('heds_test.owner_uid')::uuid;

do $own_update$
begin
  if not exists (
    select 1
    from public.user_profiles
    where user_id = current_setting('heds_test.owner_uid')::uuid
      and city = 'Sion'
      and preferred_language = 'fr'
      and canton_of_origin = 'VS'
  ) then
    raise exception 'The owner could not update personal profile preferences';
  end if;
end
$own_update$;

do $other_update$
declare
  v_rows integer;
begin
  update public.user_profiles
  set city = 'Interdit'
  where user_id = current_setting('heds_test.other_uid')::uuid;
  get diagnostics v_rows = row_count;

  if v_rows <> 0 then
    raise exception 'A user updated another profile';
  end if;
end
$other_update$;

do $invalid_values$
declare
  v_language_rejected boolean := false;
  v_canton_rejected boolean := false;
begin
  begin
    update public.user_profiles
    set preferred_language = 'it'
    where user_id = current_setting('heds_test.owner_uid')::uuid;
  exception when check_violation then
    v_language_rejected := true;
  end;

  begin
    update public.user_profiles
    set canton_of_origin = 'XX'
    where user_id = current_setting('heds_test.owner_uid')::uuid;
  exception when check_violation then
    v_canton_rejected := true;
  end;

  if not v_language_rejected or not v_canton_rejected then
    raise exception 'Invalid profile preference values were accepted';
  end if;
end
$invalid_values$;

rollback;
