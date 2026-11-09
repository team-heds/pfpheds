\set ON_ERROR_STOP on

begin;

select set_config(
  'request.jwt.claim.sub',
  (
    select au.id::text
    from auth.users au
    join public.user_profiles up on up.user_id = au.id
    where lower(coalesce(up.role, '')) in ('admin', 'super.all', 'adminphysio', 'adminsoins')
    order by au.created_at
    limit 1
  ),
  true
);

select set_config(
  'heds_test.student_uid',
  (
    select au.id::text
    from auth.users au
    join public.user_profiles up on up.user_id = au.id
    where lower(coalesce(up.role, '')) in ('etudiantphysio', 'etudiant', 'student')
      and coalesce(up.is_active, true)
    order by au.created_at
    limit 1
  ),
  true
);

do $setup$
begin
  if nullif(current_setting('request.jwt.claim.sub', true), '') is null
     or nullif(current_setting('heds_test.student_uid', true), '') is null then
    raise exception 'Lifecycle test requires one admin and one student';
  end if;

  insert into public.quests (
    id, title, description, type, difficulty, points, xp_reward, status,
    start_date, end_date, min_level
  ) values
    (
      '62010000-0000-4000-8000-000000000001',
      'Quête cycle HEDS25-620', 'Fixture valide', 'progression', 'easy',
      10, 10, 'draft', now() - interval '1 hour', now() + interval '1 hour', 1
    ),
    (
      '62010000-0000-4000-8000-000000000002',
      'Quête invalide HEDS25-620', 'Sans étape', 'progression', 'easy',
      10, 10, 'draft', now() - interval '1 hour', now() + interval '1 hour', 1
    ),
    (
      '62010000-0000-4000-8000-000000000003',
      'Quête planifiée HEDS25-620', 'Fixture scheduler', 'progression', 'easy',
      10, 10, 'scheduled', now() + interval '1 hour', now() + interval '2 hours', 1
    );

  insert into public.quest_steps (
    id, quest_id, step_order, title, required, action_type, target_value
  ) values
    (
      '62011000-0000-4000-8000-000000000001',
      '62010000-0000-4000-8000-000000000001',
      1, 'Connexion', true, 'LOGIN', 1
    ),
    (
      '62011000-0000-4000-8000-000000000003',
      '62010000-0000-4000-8000-000000000003',
      1, 'Connexion', true, 'LOGIN', 1
    );

  insert into public.challenges (
    id, name, description, target_value, action_type, xp_reward,
    start_date, end_date, is_active, status
  ) values (
    '62020000-0000-4000-8000-000000000001',
    'Défi cycle HEDS25-620', 'Fixture valide', 1, 'daily_login', 5,
    current_date, current_date + 1, false, 'draft'
  );
end
$setup$;

set local role authenticated;

do $admin_scenario$
declare
  preview jsonb;
  activated jsonb;
  duplicate_result jsonb;
  completed jsonb;
  challenge_active jsonb;
  assignment_count integer;
  failed boolean := false;
begin
  preview := public.preview_gamification_lifecycle(
    'quest', '62010000-0000-4000-8000-000000000001'
  );
  if (preview ->> 'write_performed')::boolean
     or (preview ->> 'audience_count')::integer < 1
     or (preview ->> 'assigned_count')::integer <> 0
     or not (preview -> 'validation' ->> 'valid')::boolean then
    raise exception 'Preview must be valid and read-only: %', preview;
  end if;

  activated := public.transition_gamification_lifecycle(
    'quest', '62010000-0000-4000-8000-000000000001', 'active', 'test activation'
  );
  if not (activated ->> 'changed')::boolean
     or activated ->> 'status' <> 'active'
     or (activated ->> 'assigned_count')::integer < 1 then
    raise exception 'Quest activation failed: %', activated;
  end if;

  duplicate_result := public.transition_gamification_lifecycle(
    'quest', '62010000-0000-4000-8000-000000000001', 'active', 'duplicate'
  );
  if not (duplicate_result ->> 'duplicate')::boolean then
    raise exception 'Same-state transition must be idempotent: %', duplicate_result;
  end if;

  select count(*) into assignment_count
  from public.user_quest_progress
  where quest_id = '62010000-0000-4000-8000-000000000001';
  if assignment_count <> (activated ->> 'assigned_count')::integer then
    raise exception 'Activation assignments are inconsistent';
  end if;

  challenge_active := public.transition_gamification_lifecycle(
    'challenge', '62020000-0000-4000-8000-000000000001', 'active', 'test activation'
  );
  if challenge_active ->> 'status' <> 'active' then
    raise exception 'Challenge activation failed: %', challenge_active;
  end if;

  completed := public.transition_gamification_lifecycle(
    'quest', '62010000-0000-4000-8000-000000000001', 'completed', 'test closure'
  );
  if completed ->> 'status' <> 'completed' then
    raise exception 'Quest closure failed: %', completed;
  end if;

  begin
    perform public.transition_gamification_lifecycle(
      'quest', '62010000-0000-4000-8000-000000000002', 'active', 'must fail'
    );
  exception when others then
    failed := true;
  end;
  if not failed then
    raise exception 'Invalid quest must not be published';
  end if;
end
$admin_scenario$;

reset role;

do $scheduler_scenario$
declare
  refresh_result jsonb;
  audit_count integer;
begin
  update public.quests
  set start_date = now() - interval '2 hours', end_date = now() - interval '1 hour'
  where id = '62010000-0000-4000-8000-000000000003';

  refresh_result := gamification_private.refresh_lifecycle();
  if (refresh_result ->> 'completed')::integer < 1 then
    raise exception 'Scheduler did not complete expired items: %', refresh_result;
  end if;

  if (select status from public.quests where id = '62010000-0000-4000-8000-000000000003') <> 'completed' then
    raise exception 'Expired scheduled quest must be completed';
  end if;

  perform gamification_private.refresh_lifecycle();

  select count(*) into audit_count
  from gamification_private.lifecycle_audit
  where entity_kind = 'quest'
    and entity_id = '62010000-0000-4000-8000-000000000003'
    and next_status = 'completed';
  if audit_count <> 1 then
    raise exception 'Scheduler refresh must be idempotent, audit count %', audit_count;
  end if;
end
$scheduler_scenario$;

select set_config('request.jwt.claim.sub', current_setting('heds_test.student_uid'), true);
set local role authenticated;

do $student_scope$
declare
  before_progress integer;
  after_progress integer;
  forbidden boolean := false;
begin
  select progress into before_progress
  from public.user_quest_progress
  where user_id = auth.uid()
    and quest_id = '62010000-0000-4000-8000-000000000001';

  perform public.record_my_gamification_action('LOGIN', null, '{}'::jsonb);

  select progress into after_progress
  from public.user_quest_progress
  where user_id = auth.uid()
    and quest_id = '62010000-0000-4000-8000-000000000001';
  if after_progress is distinct from before_progress then
    raise exception 'Completed quest must not progress';
  end if;

  begin
    perform public.preview_gamification_lifecycle(
      'quest', '62010000-0000-4000-8000-000000000001'
    );
  exception when others then
    forbidden := true;
  end;
  if not forbidden then
    raise exception 'Student must not access lifecycle administration';
  end if;
end
$student_scope$;

reset role;

do $security$
begin
  if has_function_privilege('anon', 'public.preview_gamification_lifecycle(text,uuid)', 'EXECUTE')
     or has_function_privilege('anon', 'public.transition_gamification_lifecycle(text,uuid,text,text)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.preview_gamification_lifecycle(text,uuid)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.transition_gamification_lifecycle(text,uuid,text,text)', 'EXECUTE') then
    raise exception 'Unexpected lifecycle RPC privileges';
  end if;
end
$security$;

rollback;

select 'gamification_lifecycle_isolation_ok' as result;
