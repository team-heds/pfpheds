\set ON_ERROR_STOP on

begin;

select set_config(
  'heds_test.admin_uid',
  (
    select up.user_id::text
    from public.user_profiles up
    where lower(coalesce(up.role, '')) in ('admin', 'super.all', 'adminphysio', 'adminsoins')
       or coalesce(up.permissions, '{}'::jsonb) ?| array['admin', 'super.all', 'editor']
       or exists (
         select 1
         from public.user_track_roles utr
         where utr.user_id = up.user_id
           and utr.is_active = true
           and utr.role::text in ('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT', 'RF', 'RM')
           and (utr.expires_at is null or utr.expires_at > now())
       )
    order by up.user_id
    limit 1
  ),
  true
);

select set_config(
  'heds_test.student_uid',
  (
    select up.user_id::text
    from public.user_profiles up
    where lower(coalesce(up.role, '')) not in ('admin', 'super.all', 'adminphysio', 'adminsoins')
      and not (coalesce(up.permissions, '{}'::jsonb) ?| array['admin', 'super.all', 'editor'])
      and not exists (
        select 1
        from public.user_track_roles utr
        where utr.user_id = up.user_id
          and utr.is_active = true
          and utr.role::text in ('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT', 'RF', 'RM')
          and (utr.expires_at is null or utr.expires_at > now())
      )
    order by up.user_id
    limit 1
  ),
  true
);

do $setup$
declare
  admin_uid uuid := current_setting('heds_test.admin_uid')::uuid;
  student_uid uuid := current_setting('heds_test.student_uid')::uuid;
begin
  if admin_uid is null or student_uid is null then
    raise exception 'Historical import test requires one admin and one student';
  end if;

  delete from public.user_badges
  where badge_id in (
    '61400000-0000-4000-8000-000000000001',
    '61400000-0000-4000-8000-000000000002'
  );
  delete from public.xp_history
  where event_key in (
    'badge:61400000-0000-4000-8000-000000000001',
    'badge:61400000-0000-4000-8000-000000000002'
  );
  delete from gamification_private.historical_badge_import_batches
  where batch_key = 'heds25-614-test';

  insert into public.badges (id, name, xp_bonus, conditions, is_active)
  values
    (
      '61400000-0000-4000-8000-000000000001',
      'Import historique éligible',
      500,
      '{"total_xp":1900000000}'::jsonb,
      true
    ),
    (
      '61400000-0000-4000-8000-000000000002',
      'Import historique ambigu',
      500,
      '{"unknown_rule":true}'::jsonb,
      false
    )
  on conflict (id) do update set
    xp_bonus = excluded.xp_bonus,
    conditions = excluded.conditions,
    is_active = excluded.is_active;

  insert into public.gamification_data (
    user_id,
    email,
    total_xp,
    current_level,
    house_points
  )
  values (
    student_uid,
    'historical-import-test@example.invalid',
    2000000000,
    100,
    0
  )
  on conflict (user_id) do update set
    total_xp = excluded.total_xp,
    current_level = excluded.current_level;
end
$setup$;

select set_config('request.jwt.claim.sub', current_setting('heds_test.admin_uid'), true);
set local role authenticated;

do $admin_test$
declare
  preview_result jsonb;
  apply_result jsonb;
  retry_result jsonb;
  before_count integer;
  after_preview_count integer;
  imported_count integer;
  xp_bonus_count integer;
begin
  select count(*) into before_count
  from public.user_badges
  where badge_id in (
    '61400000-0000-4000-8000-000000000001',
    '61400000-0000-4000-8000-000000000002'
  );

  preview_result := public.preview_historical_badge_import(array[
    '61400000-0000-4000-8000-000000000001'::uuid,
    '61400000-0000-4000-8000-000000000002'::uuid
  ]);

  select count(*) into after_preview_count
  from public.user_badges
  where badge_id in (
    '61400000-0000-4000-8000-000000000001',
    '61400000-0000-4000-8000-000000000002'
  );

  if before_count <> after_preview_count
     or coalesce((preview_result ->> 'write_performed')::boolean, true) then
    raise exception 'Preview must be read-only: %', preview_result;
  end if;
  if coalesce((preview_result ->> 'contains_personal_data')::boolean, true) then
    raise exception 'Preview must declare that it contains no personal data';
  end if;
  if (preview_result ->> 'eligible_assignments')::integer <> 1 then
    raise exception 'Expected one eligible assignment: %', preview_result;
  end if;
  if (preview_result ->> 'quarantined_assignments')::integer <> 0 then
    raise exception 'Inactive unsupported rules must stay outside the import: %', preview_result;
  end if;
  if (preview_result ->> 'xp_delta')::integer <> 0
     or (preview_result ->> 'house_points_delta')::integer <> 0
     or jsonb_array_length(preview_result -> 'badge_breakdown') <> 1 then
    raise exception 'Preview must report badges and explicit zero reward deltas: %', preview_result;
  end if;

  apply_result := public.apply_historical_badge_import(
    'heds25-614-test',
    'historical-badges-v1',
    array[
      '61400000-0000-4000-8000-000000000001'::uuid,
      '61400000-0000-4000-8000-000000000002'::uuid
    ]
  );
  retry_result := public.apply_historical_badge_import(
    'heds25-614-test',
    'historical-badges-v1',
    array[
      '61400000-0000-4000-8000-000000000001'::uuid,
      '61400000-0000-4000-8000-000000000002'::uuid
    ]
  );

  select count(*) into imported_count
  from public.user_badges ub
  where ub.user_id = current_setting('heds_test.student_uid')::uuid
    and ub.badge_id = '61400000-0000-4000-8000-000000000001'
    and ub.reward_origin = 'historical_import'
    and ub.historical_batch_id = (apply_result ->> 'batch_id')::uuid
    and ub.reward_rule_version = 'historical-badges-v1';

  select count(*) into xp_bonus_count
  from public.xp_history
  where event_key in (
    'badge:61400000-0000-4000-8000-000000000001',
    'badge:61400000-0000-4000-8000-000000000002'
  );

  if imported_count <> 1 or xp_bonus_count <> 0 then
    raise exception 'Historical import provenance/XP assertion failed';
  end if;
  if coalesce((apply_result ->> 'duplicate')::boolean, true) then
    raise exception 'First application must not be a duplicate: %', apply_result;
  end if;
  if (apply_result ->> 'xp_delta')::integer <> 0
     or (apply_result ->> 'house_points_delta')::integer <> 0 then
    raise exception 'Applied report must keep reward deltas at zero: %', apply_result;
  end if;
  if not coalesce((retry_result ->> 'duplicate')::boolean, false) then
    raise exception 'Second application must be idempotent: %', retry_result;
  end if;

  perform set_config('heds_test.batch_id', apply_result ->> 'batch_id', true);
end
$admin_test$;

reset role;

do $private_audit_test$
declare
  audit_count integer;
begin
  select count(*) into audit_count
  from gamification_private.historical_badge_import_batches b
  where b.id = current_setting('heds_test.batch_id')::uuid
    and b.status = 'applied'
    and b.requested_by = current_setting('heds_test.admin_uid')::uuid
    and not coalesce((b.summary ->> 'contains_personal_data')::boolean, true);

  if audit_count <> 1 then
    raise exception 'Private historical import audit is missing or invalid';
  end if;
end
$private_audit_test$;

select set_config('request.jwt.claim.sub', current_setting('heds_test.student_uid'), true);
set local role authenticated;

do $student_test$
declare
  forbidden boolean := false;
begin
  begin
    perform public.preview_historical_badge_import(null);
  exception when others then
    forbidden := true;
  end;
  if not forbidden then
    raise exception 'Student preview must be denied';
  end if;

  forbidden := false;
  begin
    perform public.apply_historical_badge_import('heds25-614-student-test');
  exception when others then
    forbidden := true;
  end;
  if not forbidden then
    raise exception 'Student import must be denied';
  end if;
end
$student_test$;

reset role;

do $privilege_test$
begin
  if has_function_privilege('anon', 'public.preview_historical_badge_import(uuid[])', 'EXECUTE')
     or has_function_privilege('anon', 'public.apply_historical_badge_import(text,text,uuid[])', 'EXECUTE')
     or exists (
       select 1
       from pg_proc p,
       lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
       where p.oid in (
         'public.preview_historical_badge_import(uuid[])'::regprocedure,
         'public.apply_historical_badge_import(text,text,uuid[])'::regprocedure
       )
         and acl.grantee = 0
         and acl.privilege_type = 'EXECUTE'
     ) then
    raise exception 'Historical import RPCs must not be executable by anon or PUBLIC';
  end if;
end
$privilege_test$;

rollback;

select 'historical_gamification_badge_import_isolation_ok' as result;
