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
         select 1 from public.user_track_roles utr
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
    join public.gamification_data gd on gd.user_id = up.user_id
    where lower(coalesce(up.role, '')) not in ('admin', 'super.all', 'adminphysio', 'adminsoins')
      and not (coalesce(up.permissions, '{}'::jsonb) ?| array['admin', 'super.all', 'editor'])
      and not exists (
        select 1 from public.user_track_roles utr
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

do $formula_test$
begin
  if public.calculate_level_from_xp(-10) <> 1
     or public.calculate_level_from_xp(0) <> 1
     or public.calculate_level_from_xp(99) <> 1
     or public.calculate_level_from_xp(100) <> 2
     or public.calculate_level_from_xp(399) <> 2
     or public.calculate_level_from_xp(400) <> 3
     or public.calculate_level_from_xp(36100) <> 20
     or public.calculate_level_from_xp(40000) <> 20 then
    raise exception 'User level formula boundaries are inconsistent';
  end if;

  if public.xp_for_next_level(1) <> 100
     or public.xp_for_next_level(2) <> 400
     or public.xp_for_next_level(20) <> 0 then
    raise exception 'Next-level thresholds are inconsistent';
  end if;
end
$formula_test$;

select set_config('request.jwt.claim.sub', current_setting('heds_test.admin_uid'), true);
set local role authenticated;

do $admin_test$
declare
  preview_result jsonb;
  apply_result jsonb;
  retry_result jsonb;
  adjustment_result jsonb;
  duplicate_adjustment jsonb;
  before_history integer;
  after_preview_history integer;
  after_apply_history integer;
  before_total bigint;
  after_total bigint;
  student_before integer;
  student_after integer;
  student_ledger integer;
  target_house uuid;
  original_house uuid;
  assignment_result jsonb;
begin
  select count(*) into before_history from public.xp_history;
  select coalesce(sum(total_xp), 0) into before_total from public.gamification_data;

  preview_result := public.preview_gamification_reconciliation();
  select count(*) into after_preview_history from public.xp_history;

  if before_history <> after_preview_history
     or coalesce((preview_result ->> 'write_performed')::boolean, true)
     or coalesce((preview_result ->> 'contains_personal_data')::boolean, true) then
    raise exception 'Preview must be read-only and non-personal: %', preview_result;
  end if;

  apply_result := public.apply_gamification_reconciliation('heds25-616-isolation-test');
  retry_result := public.apply_gamification_reconciliation('heds25-616-isolation-test');

  select count(*) into after_apply_history from public.xp_history;
  select coalesce(sum(total_xp), 0) into after_total from public.gamification_data;

  if before_total <> after_total then
    raise exception 'Reconciliation must preserve XP balances';
  end if;
  if (apply_result ->> 'level_mismatches')::integer <> 0
     or (apply_result ->> 'linked_ledger_mismatches')::integer <> 0
     or (apply_result ->> 'house_point_mismatches')::integer <> 0
     or (apply_result ->> 'house_total_mismatches')::integer <> 0
     or (apply_result ->> 'house_level_mismatches')::integer <> 0 then
    raise exception 'Reconciliation did not converge: %', apply_result;
  end if;
  if (apply_result ->> 'ledger_mismatches')::integer
       <> (apply_result ->> 'quarantined_orphan_ledger_mismatches')::integer then
    raise exception 'Only orphan profiles may remain outside the XP ledger: %', apply_result;
  end if;
  if not coalesce((retry_result ->> 'duplicate_batch')::boolean, false)
     or coalesce((retry_result ->> 'write_performed')::boolean, true) then
    raise exception 'Reconciliation retry must be idempotent: %', retry_result;
  end if;
  if after_apply_history < before_history then
    raise exception 'Reconciliation unexpectedly removed XP history';
  end if;

  select total_xp into student_before
  from public.gamification_data
  where user_id = current_setting('heds_test.student_uid')::uuid;

  adjustment_result := public.admin_adjust_user_gamification_xp(
    current_setting('heds_test.student_uid')::uuid,
    25,
    'Ajustement de test HEDS25-616',
    '61600000-0000-4000-8000-000000000001'::uuid
  );
  duplicate_adjustment := public.admin_adjust_user_gamification_xp(
    current_setting('heds_test.student_uid')::uuid,
    25,
    'Ajustement de test HEDS25-616',
    '61600000-0000-4000-8000-000000000001'::uuid
  );

  select gd.total_xp, coalesce(sum(xh.amount), 0)
  into student_after, student_ledger
  from public.gamification_data gd
  left join public.xp_history xh on xh.user_id = gd.user_id
  where gd.user_id = current_setting('heds_test.student_uid')::uuid
  group by gd.total_xp;

  if student_after <> student_before + 25
     or student_ledger <> student_after
     or not coalesce((adjustment_result ->> 'adjusted')::boolean, false)
     or not coalesce((duplicate_adjustment ->> 'duplicate')::boolean, false) then
    raise exception 'Admin adjustment is not deterministic or idempotent';
  end if;

  select gd.house_id into original_house
  from public.gamification_data gd
  where gd.user_id = current_setting('heds_test.student_uid')::uuid;

  select h.id into target_house
  from public.houses h
  where h.id is distinct from original_house
  order by h.id
  limit 1;

  assignment_result := public.admin_assign_user_gamification_house(
    current_setting('heds_test.student_uid')::uuid,
    target_house
  );

  if not coalesce((assignment_result ->> 'changed')::boolean, false) then
    raise exception 'Admin house assignment should be applied once';
  end if;
end
$admin_test$;

reset role;

do $audit_test$
declare
  run_count integer;
  assignment_count integer;
begin
  select count(*) into run_count
  from gamification_private.reconciliation_runs rr
  where rr.batch_key = 'heds25-616-isolation-test'
    and rr.status = 'applied'
    and rr.requested_by = current_setting('heds_test.admin_uid')::uuid;

  select count(*) into assignment_count
  from gamification_private.house_assignment_audit ha
  where ha.user_id = current_setting('heds_test.student_uid')::uuid
    and ha.changed_by = current_setting('heds_test.admin_uid')::uuid;

  if run_count <> 1 or assignment_count < 1 then
    raise exception 'Private reconciliation or house assignment audit is missing';
  end if;
end
$audit_test$;

select set_config('request.jwt.claim.sub', current_setting('heds_test.student_uid'), true);
set local role authenticated;

do $student_test$
declare
  forbidden boolean;
begin
  forbidden := false;
  begin
    perform public.preview_gamification_reconciliation();
  exception when others then forbidden := true;
  end;
  if not forbidden then raise exception 'Student preview must be denied'; end if;

  forbidden := false;
  begin
    perform public.apply_gamification_reconciliation('heds25-616-student-test');
  exception when others then forbidden := true;
  end;
  if not forbidden then raise exception 'Student reconciliation must be denied'; end if;

  forbidden := false;
  begin
    perform public.admin_adjust_user_gamification_xp(
      auth.uid(), 25, 'Tentative étudiante interdite', gen_random_uuid()
    );
  exception when others then forbidden := true;
  end;
  if not forbidden then raise exception 'Student XP adjustment must be denied'; end if;

  forbidden := false;
  begin
    perform public.admin_assign_user_gamification_house(
      auth.uid(), (select id from public.houses order by id limit 1)
    );
  exception when others then forbidden := true;
  end;
  if not forbidden then raise exception 'Student house assignment must be denied'; end if;
end
$student_test$;

reset role;

do $privilege_test$
begin
  if has_function_privilege('anon', 'public.preview_gamification_reconciliation()', 'EXECUTE')
     or has_function_privilege('anon', 'public.apply_gamification_reconciliation(text)', 'EXECUTE')
     or has_function_privilege('anon', 'public.admin_adjust_user_gamification_xp(uuid,integer,text,uuid)', 'EXECUTE')
     or has_function_privilege('anon', 'public.admin_assign_user_gamification_house(uuid,uuid)', 'EXECUTE') then
    raise exception 'Anonymous role must not execute privileged gamification functions';
  end if;
end
$privilege_test$;

rollback;

select 'gamification_deterministic_totals_isolation_ok' as result;
