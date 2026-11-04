\set ON_ERROR_STOP on

begin;

select set_config(
  'heds_test.admin_uid',
  (
    select up.user_id::text
    from public.user_profiles up
    where lower(coalesce(up.role, '')) in (
      'admin', 'super.all', 'adminphysio', 'adminsoins'
    )
       or coalesce(up.permissions, '{}'::jsonb)
          ?| array['admin', 'super.all', 'editor']
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
    where gd.house_id is not null
      and lower(coalesce(up.role, '')) not in (
        'admin', 'super.all', 'adminphysio', 'adminsoins'
      )
      and not (
        coalesce(up.permissions, '{}'::jsonb)
        ?| array['admin', 'super.all', 'editor']
      )
    order by up.user_id
    limit 1
  ),
  true
);

do $setup$
begin
  if nullif(current_setting('heds_test.admin_uid', true), '') is null
     or nullif(current_setting('heds_test.student_uid', true), '') is null then
    raise exception 'Data quality test requires one admin and one student';
  end if;

  -- Reproduce the historical dual-source mismatch without creating PII.
  update public.user_profiles
  set house_id = null
  where user_id = current_setting('heds_test.student_uid')::uuid;
end
$setup$;

select set_config(
  'request.jwt.claim.sub',
  current_setting('heds_test.admin_uid'),
  true
);
set local role authenticated;

do $admin_scenario$
declare
  preview jsonb;
  applied jsonb;
  replay jsonb;
  before_badges integer;
  before_progress integer;
  before_gamification integer;
  after_badges integer;
  after_progress integer;
  after_gamification integer;
begin
  select count(*) into before_badges from public.user_badges;
  select count(*) into before_progress from public.user_quest_progress;
  select count(*) into before_gamification from public.gamification_data;

  preview := public.preview_gamification_data_quality();
  if coalesce((preview ->> 'write_performed')::boolean, true)
     or coalesce((preview ->> 'contains_personal_data')::boolean, true)
     or coalesce(
       (preview -> 'issues' ->> 'profile_house_mismatches')::integer,
       0
     ) < 1 then
    raise exception 'Preview must be aggregate, read-only and detect mismatch: %',
      preview;
  end if;

  applied := public.apply_gamification_data_quality(
    'heds25-622-isolation-test'
  );
  replay := public.apply_gamification_data_quality(
    'heds25-622-isolation-test'
  );

  select count(*) into after_badges from public.user_badges;
  select count(*) into after_progress from public.user_quest_progress;
  select count(*) into after_gamification from public.gamification_data;

  if (applied ->> 'blocking_issue_count')::integer <> 0
     or not coalesce((applied ->> 'write_performed')::boolean, false)
     or not coalesce((replay ->> 'duplicate_batch')::boolean, false)
     or coalesce((replay ->> 'write_performed')::boolean, true) then
    raise exception 'Correction must converge and replay idempotently: % / %',
      applied, replay;
  end if;

  if before_badges <> after_badges
     or before_progress <> after_progress
     or before_gamification <> after_gamification then
    raise exception 'Data quality correction must not delete public history';
  end if;

  if coalesce(
       (applied -> 'warnings'
         ->> 'historical_completed_quests_without_steps')::integer,
       0
     ) < 1 then
    raise exception 'Completed step-less quests must remain classified history';
  end if;
end
$admin_scenario$;

reset role;

do $private_evidence$
declare
  run_count integer;
  audit_count integer;
begin
  select count(*) into run_count
  from gamification_private.data_quality_runs r
  where r.batch_key = 'heds25-622-isolation-test'
    and r.status = 'applied';

  select count(*) into audit_count
  from gamification_private.profile_house_sync_audit a
  where a.run_id = (
    select r.id
    from gamification_private.data_quality_runs r
    where r.batch_key = 'heds25-622-isolation-test'
  );

  if run_count <> 1 or audit_count < 1 then
    raise exception 'Private run and synchronization audit are required';
  end if;
end
$private_evidence$;

do $orphan_prevention$
declare
  rejected_gamification boolean := false;
  rejected_progress boolean := false;
  quest_id uuid;
begin
  begin
    insert into public.gamification_data (
      user_id, email, total_xp, current_level, house_points
    ) values (
      '62200000-0000-4000-8000-000000000099',
      'orphan.invalid', 0, 1, 0
    );
  exception when others then
    rejected_gamification := true;
  end;

  select q.id into quest_id from public.quests q order by q.id limit 1;
  begin
    insert into public.user_quest_progress (
      user_id, quest_id, status, progress, current_step
    ) values (
      '62200000-0000-4000-8000-000000000099',
      quest_id, 'not_started', 0, 0
    );
  exception when others then
    rejected_progress := true;
  end;

  if not rejected_gamification or not rejected_progress then
    raise exception 'New orphan gamification records must be rejected';
  end if;
end
$orphan_prevention$;

select set_config(
  'request.jwt.claim.sub',
  current_setting('heds_test.student_uid'),
  true
);
set local role authenticated;

do $student_scenario$
declare
  forbidden_preview boolean := false;
  forbidden_apply boolean := false;
  house_id uuid;
  assigned public.gamification_data;
  profile_house_id uuid;
begin
  begin
    perform public.preview_gamification_data_quality();
  exception when others then
    forbidden_preview := true;
  end;
  begin
    perform public.apply_gamification_data_quality(
      'heds25-622-forbidden-student'
    );
  exception when others then
    forbidden_apply := true;
  end;

  if not forbidden_preview or not forbidden_apply then
    raise exception 'Student must not access data quality administration';
  end if;

  select gd.house_id into house_id
  from public.gamification_data gd
  where gd.user_id = auth.uid();

  update public.user_profiles set house_id = null where user_id = auth.uid();
  assigned := public.assign_my_house(house_id);
  select up.house_id into profile_house_id
  from public.user_profiles up where up.user_id = auth.uid();

  if assigned.house_id is distinct from house_id
     or profile_house_id is distinct from house_id then
    raise exception 'Self assignment must keep profile and gamification aligned';
  end if;
end
$student_scenario$;

reset role;

do $security$
begin
  if has_function_privilege(
       'anon', 'public.preview_gamification_data_quality()', 'EXECUTE'
     )
     or has_function_privilege(
       'anon', 'public.apply_gamification_data_quality(text)', 'EXECUTE'
     )
     or not has_function_privilege(
       'authenticated',
       'public.preview_gamification_data_quality()',
       'EXECUTE'
     )
     or not has_function_privilege(
       'authenticated',
       'public.apply_gamification_data_quality(text)',
       'EXECUTE'
     ) then
    raise exception 'Unexpected data quality RPC privileges';
  end if;
end
$security$;

rollback;

select 'gamification_data_quality_isolation_ok' as result;

