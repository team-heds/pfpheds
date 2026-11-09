\set ON_ERROR_STOP on

begin;

select set_config(
  'request.jwt.claim.sub',
  (
    select au.id::text
    from auth.users au
    join public.user_profiles up on up.user_id = au.id
    where lower(coalesce(up.role, '')) not in (
      'admin', 'super.all', 'adminphysio', 'adminsoins'
    )
    order by au.created_at
    limit 1
  ),
  true
);

select set_config(
  'heds_test.other_uid',
  (
    select au.id::text
    from auth.users au
    join public.user_profiles up on up.user_id = au.id
    where au.id <> current_setting('request.jwt.claim.sub')::uuid
    order by au.created_at
    limit 1
  ),
  true
);

do $setup$
declare
  current_uid uuid := current_setting('request.jwt.claim.sub')::uuid;
  other_uid uuid := current_setting('heds_test.other_uid')::uuid;
begin
  if current_uid is null or other_uid is null then
    raise exception 'Gamification cap/quest test requires two auth users';
  end if;

  update public.challenges set is_active = false where is_active = true;
  update public.badges set is_active = false where is_active = true;

  delete from gamification_private.user_quest_step_progress
  where user_id in (current_uid, other_uid);
  delete from public.user_quest_progress
  where user_id in (current_uid, other_uid)
    and quest_id in (
      '47710000-0000-4000-8000-000000000001',
      '47710000-0000-4000-8000-000000000002',
      '47710000-0000-4000-8000-000000000003'
    );
  delete from public.quest_steps
  where quest_id in (
    '47710000-0000-4000-8000-000000000001',
    '47710000-0000-4000-8000-000000000002',
    '47710000-0000-4000-8000-000000000003'
  );
  delete from public.quests
  where id in (
    '47710000-0000-4000-8000-000000000001',
    '47710000-0000-4000-8000-000000000002',
    '47710000-0000-4000-8000-000000000003'
  );
  delete from public.posts
  where id between
    '47720000-0000-4000-8000-000000000001'::uuid and
    '47720000-0000-4000-8000-000000000005'::uuid;
  delete from public.xp_history where user_id = current_uid;
  delete from public.gamification_data where user_id = current_uid;

  insert into public.quests (
    id, title, description, type, difficulty, points, xp_reward, status,
    start_date, end_date
  ) values
    (
      '47710000-0000-4000-8000-000000000001',
      'Quête moteur HEDS25-477',
      'Fixture atomique',
      'progression',
      'easy',
      40,
      40,
      'active',
      now() - interval '1 day',
      now() + interval '1 day'
    ),
    (
      '47710000-0000-4000-8000-000000000002',
      'Quête expirée HEDS25-477',
      'Ne doit jamais progresser',
      'progression',
      'easy',
      40,
      40,
      'active',
      now() - interval '2 days',
      now() - interval '1 day'
    ),
    (
      '47710000-0000-4000-8000-000000000003',
      'Quête non assignée HEDS25-477',
      'Ne doit jamais progresser',
      'progression',
      'easy',
      40,
      40,
      'active',
      now() - interval '1 day',
      now() + interval '1 day'
    );

  insert into public.quest_steps (
    id, quest_id, step_order, title, description, required,
    action_type, target_value
  ) values
    (
      '47711000-0000-4000-8000-000000000001',
      '47710000-0000-4000-8000-000000000001',
      1,
      'Se connecter',
      'Connexion vérifiée',
      true,
      'LOGIN',
      1
    ),
    (
      '47711000-0000-4000-8000-000000000002',
      '47710000-0000-4000-8000-000000000001',
      2,
      'Publier deux fois',
      'Publications vérifiées',
      true,
      'POST',
      2
    ),
    (
      '47711000-0000-4000-8000-000000000003',
      '47710000-0000-4000-8000-000000000002',
      1,
      'Étape expirée',
      'Ne doit pas progresser',
      true,
      'LOGIN',
      1
    ),
    (
      '47711000-0000-4000-8000-000000000004',
      '47710000-0000-4000-8000-000000000003',
      1,
      'Étape non assignée',
      'Ne doit pas progresser',
      true,
      'LOGIN',
      1
    );

  insert into public.user_quest_progress (
    user_id, quest_id, status, progress, current_step
  ) values
    (current_uid, '47710000-0000-4000-8000-000000000001', 'not_started', 0, 0),
    (current_uid, '47710000-0000-4000-8000-000000000002', 'not_started', 0, 0),
    (other_uid, '47710000-0000-4000-8000-000000000003', 'not_started', 0, 0);

  insert into public.posts (id, user_id, author_name, content, created_at)
  select
    ('47720000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
    current_uid,
    'Pilot',
    'Publication ' || n,
    now()
  from generate_series(1, 5) as n;
end
$setup$;

set local role authenticated;

do $scenario$
declare
  login_result jsonb;
  post_one jsonb;
  post_two jsonb;
  post_three jsonb;
  post_four jsonb;
  replay_result jsonb;
  xp_total integer;
  post_events integer;
  quest_status text;
  quest_progress integer;
  forbidden boolean := false;
begin
  login_result := public.record_my_gamification_action('LOGIN', null, '{}'::jsonb);

  if not coalesce((login_result ->> 'awarded')::boolean, false)
     or login_result ->> 'window_key'
        <> ((now() at time zone 'Europe/Zurich')::date)::text
     or jsonb_array_length(login_result -> 'quests_progressed') <> 1 then
    raise exception 'Login must use the Zurich day and progress step 1: %', login_result;
  end if;

  post_one := public.record_my_gamification_action(
    'POST', '47720000-0000-4000-8000-000000000001', '{}'::jsonb
  );
  post_two := public.record_my_gamification_action(
    'POST', '47720000-0000-4000-8000-000000000002', '{}'::jsonb
  );
  post_three := public.record_my_gamification_action(
    'POST', '47720000-0000-4000-8000-000000000003', '{}'::jsonb
  );
  post_four := public.record_my_gamification_action(
    'POST', '47720000-0000-4000-8000-000000000004', '{}'::jsonb
  );
  replay_result := public.record_my_gamification_action(
    'POST', '47720000-0000-4000-8000-000000000003', '{}'::jsonb
  );

  if not coalesce((post_one ->> 'awarded')::boolean, false)
     or not coalesce((post_two ->> 'awarded')::boolean, false)
     or not coalesce((post_two -> 'quests_progressed' -> 0 ->> 'quest_completed')::boolean, false)
     or not coalesce((post_three ->> 'awarded')::boolean, false) then
    raise exception 'First three posts must be rewarded and complete the quest: %, %, %',
      post_one, post_two, post_three;
  end if;

  if coalesce((post_four ->> 'awarded')::boolean, false)
     or not coalesce((post_four ->> 'cap_reached')::boolean, false)
     or post_four ->> 'reason' <> 'cap_reached'
     or (post_four ->> 'awards_in_window')::integer <> 3 then
    raise exception 'Fourth post must be capped explicitly: %', post_four;
  end if;

  if not coalesce((replay_result ->> 'duplicate')::boolean, false)
     or coalesce((replay_result ->> 'cap_reached')::boolean, false) then
    raise exception 'A replay must remain duplicate even after the cap: %', replay_result;
  end if;

  select total_xp into xp_total
  from public.gamification_data where user_id = auth.uid();

  select count(*) into post_events
  from public.xp_history
  where user_id = auth.uid() and action = 'POST';

  select status, progress into quest_status, quest_progress
  from public.user_quest_progress
  where user_id = auth.uid()
    and quest_id = '47710000-0000-4000-8000-000000000001';

  if xp_total <> 120 or post_events <> 3
     or quest_status <> 'completed' or quest_progress <> 100 then
    raise exception 'Totals after cap/quest are inconsistent: xp %, posts %, quest %/%',
      xp_total, post_events, quest_status, quest_progress;
  end if;

  begin
    perform count(*) from gamification_private.action_rules;
  exception when insufficient_privilege then
    forbidden := true;
  end;

  if not forbidden then
    raise exception 'Authenticated users must not read private action rules';
  end if;
end
$scenario$;

reset role;

do $quest_scope$
declare
  current_uid uuid := current_setting('request.jwt.claim.sub')::uuid;
  other_uid uuid := current_setting('heds_test.other_uid')::uuid;
  step_rows integer;
begin
  select count(*) into step_rows
  from gamification_private.user_quest_step_progress
  where (user_id = current_uid and quest_id = '47710000-0000-4000-8000-000000000002')
     or (user_id = current_uid and quest_id = '47710000-0000-4000-8000-000000000003')
     or (user_id = other_uid and quest_id = '47710000-0000-4000-8000-000000000003');

  if step_rows <> 0 then
    raise exception 'Expired or unassigned quests must not progress';
  end if;
end
$quest_scope$;

do $atomic_setup$
declare
  current_uid uuid := current_setting('request.jwt.claim.sub')::uuid;
  rejected boolean := false;
begin
  begin
    insert into public.badges (
      id, name, xp_bonus, conditions, is_active
    ) values (
      '47730000-0000-4000-8000-000000000001',
      'Condition invalide atomique',
      10,
      '{"total_xp":"invalid"}'::jsonb,
      true
    )
    on conflict (id) do update set
      conditions = excluded.conditions,
      is_active = true;
  exception when others then
    rejected := true;
  end;

  if not rejected then
    raise exception 'Invalid active badge definitions must be rejected before publication';
  end if;

  update public.user_profiles set updated_at = now() where user_id = current_uid;
end
$atomic_setup$;

set local role authenticated;

do $atomic_rollback$
declare
  result jsonb;
  profile_events integer;
begin
  result := public.record_my_gamification_action('PROFILE_UPDATE', null, '{}'::jsonb);
  if not coalesce((result ->> 'awarded')::boolean, false) then
    raise exception 'A valid action must remain available after an invalid badge is rejected: %', result;
  end if;

  select count(*) into profile_events
  from public.xp_history
  where user_id = auth.uid() and action = 'PROFILE_UPDATE';

  if profile_events <> 1 then
    raise exception 'The valid action must produce exactly one XP event';
  end if;
end
$atomic_rollback$;

reset role;

do $security$
declare
  anon_can_execute boolean;
  public_can_execute boolean;
  authenticated_can_execute boolean;
  function_definition text;
begin
  select has_function_privilege(
    'anon',
    'public.record_my_gamification_action(text,uuid,jsonb)',
    'EXECUTE'
  ) into anon_can_execute;
  select exists (
    select 1
    from pg_proc p
    cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) acl
    where p.oid = 'public.record_my_gamification_action(text,uuid,jsonb)'::regprocedure
      and acl.grantee = 0
      and acl.privilege_type = 'EXECUTE'
  ) into public_can_execute;
  select has_function_privilege(
    'authenticated',
    'public.record_my_gamification_action(text,uuid,jsonb)',
    'EXECUTE'
  ) into authenticated_can_execute;

  if anon_can_execute or public_can_execute or not authenticated_can_execute then
    raise exception 'Unexpected RPC privileges anon %, public %, authenticated %',
      anon_can_execute, public_can_execute, authenticated_can_execute;
  end if;

  select pg_get_functiondef(
    'public.record_my_gamification_action(text,uuid,jsonb)'::regprocedure
  ) into function_definition;

  if position('pg_advisory_xact_lock' in function_definition) = 0
     or position('Europe/Zurich' in function_definition) = 0 then
    raise exception 'The action engine must lock cap windows and use Europe/Zurich';
  end if;
end
$security$;

rollback;

select 'gamification_caps_quests_isolation_ok' as result;
