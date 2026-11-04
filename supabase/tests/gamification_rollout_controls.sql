\set ON_ERROR_STOP on

begin;

select set_config(
  'heds_test.admin_uid',
  (select admin_user_id::text from gamification_private.pilot_runs order by created_at desc limit 1),
  true
);
select set_config(
  'heds_test.student_uid',
  (select student_user_id::text from gamification_private.pilot_runs order by created_at desc limit 1),
  true
);
select set_config(
  'heds_test.other_uid',
  (
    select up.user_id::text
    from public.user_profiles up
    where up.user_id not in (
      current_setting('heds_test.admin_uid')::uuid,
      current_setting('heds_test.student_uid')::uuid
    )
      and coalesce(up.is_active, true)
      and lower(coalesce(up.role, '')) not in (
        'admin', 'super.all', 'adminphysio', 'adminsoins'
      )
      and not (
        coalesce(up.permissions, '{}'::jsonb)
        ?| array['admin', 'super.all', 'editor']
      )
      and not exists (
        select 1 from public.user_track_roles utr
        where utr.user_id = up.user_id
          and utr.is_active = true
          and utr.role::text in ('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT', 'RF', 'RM')
          and (utr.expires_at is null or utr.expires_at > now())
      )
    order by up.created_at
    limit 1
  ),
  true
);

do $preflight$
begin
  if nullif(current_setting('heds_test.admin_uid'), '') is null
     or nullif(current_setting('heds_test.student_uid'), '') is null
     or nullif(current_setting('heds_test.other_uid'), '') is null then
    raise exception 'Rollout test requires an admin, pilot student and another active user';
  end if;
end
$preflight$;

select set_config('request.jwt.claim.sub', current_setting('heds_test.admin_uid'), true);
set local role authenticated;

select public.configure_gamification_rollout(
  false, 'allowlist', 'SQL isolation test: disabled state'
);
select public.set_gamification_rollout_member(
  current_setting('heds_test.student_uid')::uuid,
  true,
  'SQL isolation test: pilot member'
);

reset role;
select set_config('request.jwt.claim.sub', current_setting('heds_test.student_uid'), true);
set local role authenticated;

do $disabled_test$
declare
  v_before integer;
  v_after integer;
  v_result jsonb;
begin
  select count(*) into v_before
  from public.xp_history where user_id = auth.uid();

  v_result := public.record_my_gamification_action('LOGIN', null, '{}'::jsonb);
  if v_result ->> 'reason' <> 'system_disabled'
     or coalesce((v_result ->> 'awarded')::boolean, true) then
    raise exception 'Disabled rollout must reject without XP: %', v_result;
  end if;

  select count(*) into v_after
  from public.xp_history where user_id = auth.uid();
  if v_after <> v_before then
    raise exception 'Disabled rollout changed XP history';
  end if;
end
$disabled_test$;

reset role;
select set_config('request.jwt.claim.sub', current_setting('heds_test.admin_uid'), true);
set local role authenticated;

select public.configure_gamification_rollout(
  true, 'allowlist', 'SQL isolation test: pilot enabled'
);

reset role;
select set_config('request.jwt.claim.sub', current_setting('heds_test.other_uid'), true);
set local role authenticated;

do $audience_test$
declare
  v_result jsonb;
  v_forbidden boolean := false;
begin
  v_result := public.record_my_gamification_action('LOGIN', null, '{}'::jsonb);
  if v_result ->> 'reason' <> 'audience_restricted'
     or coalesce((v_result ->> 'awarded')::boolean, true) then
    raise exception 'Non-allowlisted user must be rejected: %', v_result;
  end if;

  begin
    perform public.configure_gamification_rollout(
      true, 'all', 'Unauthorized rollout change'
    );
  exception when raise_exception then
    if sqlerrm = 'Insufficient privileges' then
      v_forbidden := true;
    else
      raise;
    end if;
  end;

  if not v_forbidden then
    raise exception 'A non-admin changed the rollout configuration';
  end if;
end
$audience_test$;

reset role;
select set_config('request.jwt.claim.sub', current_setting('heds_test.student_uid'), true);
set local role authenticated;

do $allowlisted_test$
declare
  v_result jsonb;
begin
  v_result := public.record_my_gamification_action('LOGIN', null, '{}'::jsonb);
  if v_result ->> 'reason' in ('system_disabled', 'audience_restricted') then
    raise exception 'Allowlisted pilot student was blocked by rollout: %', v_result;
  end if;
end
$allowlisted_test$;

reset role;
update public.user_profiles
set is_active = false
where user_id = current_setting('heds_test.student_uid')::uuid;
select set_config('request.jwt.claim.sub', current_setting('heds_test.student_uid'), true);
set local role authenticated;

do $inactive_test$
declare
  v_result jsonb;
begin
  v_result := public.record_my_gamification_action('LOGIN', null, '{}'::jsonb);
  if v_result ->> 'reason' <> 'audience_restricted'
     or coalesce((v_result ->> 'awarded')::boolean, true) then
    raise exception 'Inactive allowlisted profile must be rejected: %', v_result;
  end if;
end
$inactive_test$;

reset role;
select set_config('request.jwt.claim.sub', current_setting('heds_test.admin_uid'), true);
set local role authenticated;

do $preview_test$
declare
  v_preview jsonb := public.preview_gamification_rollout();
begin
  if v_preview ->> 'audience_mode' <> 'allowlist'
     or not coalesce((v_preview ->> 'rewards_enabled')::boolean, false)
     or (v_preview ->> 'allowlisted_users')::integer < 1
     or coalesce((v_preview ->> 'contains_personal_data')::boolean, true)
     or coalesce((v_preview ->> 'write_performed')::boolean, true) then
    raise exception 'Invalid rollout preview: %', v_preview;
  end if;
end
$preview_test$;

reset role;
rollback;

select 'gamification_rollout_controls_ok' as result;
