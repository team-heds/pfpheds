\set ON_ERROR_STOP on

begin;

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
)
values
  (
    '61700000-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'admin.gamification.isolation@example.invalid',
    crypt('test-only-not-a-real-secret', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb, false, 'authenticated', 'authenticated'
  ),
  (
    '61700000-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'student.gamification.isolation@example.invalid',
    crypt('test-only-not-a-real-secret', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb, false, 'authenticated', 'authenticated'
  );

insert into public.user_profiles (
  user_id, email, forname, family_name, display_name, role, is_active, permissions
)
values
  (
    '61700000-0000-4000-8000-000000000001',
    'admin.gamification.isolation@example.invalid',
    'Admin', 'Pilote', 'TEST ADMIN GAMIFICATION', 'admin', true,
    '["admin"]'::jsonb
  ),
  (
    '61700000-0000-4000-8000-000000000002',
    'student.gamification.isolation@example.invalid',
    'Étudiant', 'Pilote', 'TEST ÉTUDIANT GAMIFICATION', 'etudiant', true,
    '["student"]'::jsonb
  )
on conflict (user_id) do update set
  email = excluded.email,
  forname = excluded.forname,
  family_name = excluded.family_name,
  display_name = excluded.display_name,
  role = excluded.role,
  is_active = excluded.is_active,
  permissions = excluded.permissions,
  updated_at = now();

select set_config(
  'request.jwt.claim.sub',
  '61700000-0000-4000-8000-000000000001',
  true
);

set local role authenticated;

do $admin_install_test$
declare
  preview_result jsonb;
  install_result jsonb;
  duplicate_result jsonb;
  before_xp_history integer;
  before_badges integer;
  before_challenges integer;
  before_quests integer;
  before_posts integer;
begin
  select count(*) into before_xp_history from public.xp_history;
  select count(*) into before_badges from public.user_badges;
  select count(*) into before_challenges from public.challenges;
  select count(*) into before_quests from public.quests;
  select count(*) into before_posts from public.posts;

  perform set_config('heds_test.before_xp_history', before_xp_history::text, true);
  perform set_config('heds_test.before_badges', before_badges::text, true);
  perform set_config('heds_test.before_challenges', before_challenges::text, true);
  perform set_config('heds_test.before_quests', before_quests::text, true);
  perform set_config('heds_test.before_posts', before_posts::text, true);

  preview_result := public.preview_gamification_pilot(
    'heds25-617-isolation',
    '61700000-0000-4000-8000-000000000001',
    '61700000-0000-4000-8000-000000000002',
    current_date,
    current_date + 7
  );

  if coalesce((preview_result ->> 'write_performed')::boolean, true)
     or coalesce((preview_result ->> 'contains_personal_data')::boolean, true)
     or not coalesce((preview_result ->> 'install_allowed')::boolean, false) then
    raise exception 'Pilot preview must be safe and read-only: %', preview_result;
  end if;

  install_result := public.install_gamification_pilot(
    'heds25-617-isolation',
    '61700000-0000-4000-8000-000000000001',
    '61700000-0000-4000-8000-000000000002',
    current_date,
    current_date + 7
  );

  if not coalesce((install_result ->> 'write_performed')::boolean, false)
     or (install_result ->> 'pilot_quests')::integer <> 1
     or (install_result ->> 'pilot_challenges')::integer <> 3
     or (install_result ->> 'pilot_badges')::integer <> 1 then
    raise exception 'Pilot install is incomplete: %', install_result;
  end if;

  duplicate_result := public.install_gamification_pilot(
    'heds25-617-isolation',
    '61700000-0000-4000-8000-000000000001',
    '61700000-0000-4000-8000-000000000002',
    current_date,
    current_date + 7
  );

  if not coalesce((duplicate_result ->> 'duplicate')::boolean, false)
     or coalesce((duplicate_result ->> 'write_performed')::boolean, true) then
    raise exception 'Pilot install retry must be idempotent: %', duplicate_result;
  end if;
end
$admin_install_test$;

select public.set_gamification_rollout_member(
  '61700000-0000-4000-8000-000000000002',
  true,
  'SQL pilot isolation: authorize synthetic pilot student'
);
select public.configure_gamification_rollout(
  true,
  'allowlist',
  'SQL pilot isolation: keep rewards limited to pilot audience'
);

reset role;

update public.user_profiles
set updated_at = now()
where user_id = '61700000-0000-4000-8000-000000000002';

insert into public.posts (id, user_id, author_name, content)
values (
  gamification_private.pilot_asset_uuid('heds25-617-isolation', 'post'),
  '61700000-0000-4000-8000-000000000002',
  'Étudiant pilote',
  'Publication synthétique HEDS25-617'
);

select set_config(
  'heds_test.post_id',
  gamification_private.pilot_asset_uuid('heds25-617-isolation', 'post')::text,
  true
);
select set_config(
  'heds_test.post_challenge_id',
  gamification_private.pilot_asset_uuid('heds25-617-isolation', 'challenge-post')::text,
  true
);
select set_config(
  'heds_test.post_badge_id',
  gamification_private.pilot_asset_uuid('heds25-617-isolation', 'badge-post')::text,
  true
);
select set_config(
  'heds_test.quest_id',
  gamification_private.pilot_asset_uuid('heds25-617-isolation', 'quest')::text,
  true
);

select set_config(
  'request.jwt.claim.sub',
  '61700000-0000-4000-8000-000000000002',
  true
);

set local role authenticated;

do $student_scenario_test$
declare
  login_result jsonb;
  profile_result jsonb;
  post_result jsonb;
  replay_result jsonb;
  forbidden boolean := false;
  total_xp integer;
  ledger_xp integer;
begin
  begin
    perform public.preview_gamification_pilot(
      'heds25-617-isolation',
      '61700000-0000-4000-8000-000000000001',
      '61700000-0000-4000-8000-000000000002',
      current_date,
      current_date + 7
    );
  exception when others then
    forbidden := true;
  end;

  if not forbidden then
    raise exception 'Student must not preview pilot administration';
  end if;

  login_result := public.record_my_gamification_action('LOGIN', null, '{}'::jsonb);
  profile_result := public.record_my_gamification_action('PROFILE_UPDATE', null, '{}'::jsonb);
  post_result := public.record_my_gamification_action(
    'POST',
    current_setting('heds_test.post_id')::uuid,
    '{}'::jsonb
  );
  replay_result := public.record_my_gamification_action(
    'POST',
    current_setting('heds_test.post_id')::uuid,
    '{}'::jsonb
  );

  if not coalesce((login_result ->> 'awarded')::boolean, false)
     or not coalesce((profile_result ->> 'awarded')::boolean, false)
     or not coalesce((post_result ->> 'awarded')::boolean, false)
     or not coalesce((replay_result ->> 'duplicate')::boolean, false) then
    raise exception 'Pilot action scenario failed: %, %, %, %',
      login_result, profile_result, post_result, replay_result;
  end if;

  if not exists (
    select 1
    from jsonb_array_elements(
      coalesce(post_result -> 'badges_unlocked', '[]'::jsonb)
    ) returned_badge
    where returned_badge ->> 'id' = current_setting('heds_test.post_badge_id')
  ) then
    raise exception 'Challenge badge must be returned immediately: %', post_result;
  end if;

  select gd.total_xp into total_xp
  from public.gamification_data gd
  where gd.user_id = auth.uid();

  select coalesce(sum(xh.amount), 0)::integer into ledger_xp
  from public.xp_history xh
  where xh.user_id = auth.uid();

  if total_xp <> ledger_xp
     or total_xp < 55
     or not exists (
       select 1 from public.xp_history xh
       where xh.user_id = auth.uid()
         and xh.event_key = 'login:' || current_date::text
         and xh.amount = 5
     )
     or not exists (
       select 1 from public.xp_history xh
       where xh.user_id = auth.uid()
         and xh.event_key = 'profile_update:' || current_date::text
         and xh.amount = 10
     )
     or not exists (
       select 1 from public.xp_history xh
       where xh.user_id = auth.uid()
         and xh.event_key = 'post:' || current_setting('heds_test.post_id')
         and xh.amount = 25
     )
     or not exists (
       select 1 from public.xp_history xh
       where xh.user_id = auth.uid()
         and xh.event_key = 'challenge:' || current_setting('heds_test.post_challenge_id')
         and xh.amount = 15
     ) then
    raise exception 'Pilot events or ledger are inconsistent: total %, ledger %', total_xp, ledger_xp;
  end if;

  if not exists (
    select 1
    from public.user_challenge_progress ucp
    where ucp.user_id = auth.uid()
      and ucp.challenge_id = current_setting('heds_test.post_challenge_id')::uuid
      and ucp.completed = true
  ) then
    raise exception 'Pilot post challenge was not completed';
  end if;

  if not exists (
    select 1
    from public.user_badges ub
    where ub.user_id = auth.uid()
      and ub.badge_id = current_setting('heds_test.post_badge_id')::uuid
  ) then
    raise exception 'Pilot post badge was not assigned';
  end if;

  if exists (
    select 1
    from public.user_quest_progress uqp
    where uqp.user_id = auth.uid()
      and uqp.quest_id = current_setting('heds_test.quest_id')::uuid
      and uqp.status = 'completed'
  ) then
    raise exception 'Quest completion must remain pending its server engine';
  end if;

  forbidden := false;
  begin
    perform public.reset_gamification_pilot('heds25-617-isolation');
  exception when others then
    forbidden := true;
  end;

  if not forbidden then
    raise exception 'Student must not reset a pilot run';
  end if;
end
$student_scenario_test$;

reset role;

select set_config(
  'request.jwt.claim.sub',
  '61700000-0000-4000-8000-000000000001',
  true
);

set local role authenticated;

do $admin_reset_test$
declare
  reset_result jsonb;
  duplicate_reset jsonb;
  reinstall_result jsonb;
  current_count integer;
begin
  reset_result := public.reset_gamification_pilot('heds25-617-isolation');

  if not coalesce((reset_result ->> 'write_performed')::boolean, false)
     or (reset_result ->> 'gamification_profiles')::integer <> 0
     or (reset_result ->> 'xp_events')::integer <> 0
     or (reset_result ->> 'badges')::integer <> 0
     or (reset_result ->> 'challenge_progress')::integer <> 0
     or (reset_result ->> 'quest_progress')::integer <> 0
     or (reset_result ->> 'posts')::integer <> 0
     or (reset_result ->> 'pilot_quests')::integer <> 0
     or (reset_result ->> 'pilot_challenges')::integer <> 0
     or (reset_result ->> 'pilot_badges')::integer <> 0 then
    raise exception 'Pilot reset left scoped data behind: %', reset_result;
  end if;

  duplicate_reset := public.reset_gamification_pilot('heds25-617-isolation');
  if not coalesce((duplicate_reset ->> 'duplicate')::boolean, false)
     or coalesce((duplicate_reset ->> 'write_performed')::boolean, true) then
    raise exception 'Pilot reset retry must be idempotent: %', duplicate_reset;
  end if;

  select count(*) into current_count from public.xp_history;
  if current_count <> current_setting('heds_test.before_xp_history')::integer then
    raise exception 'Reset changed XP history outside the pilot';
  end if;
  select count(*) into current_count from public.user_badges;
  if current_count <> current_setting('heds_test.before_badges')::integer then
    raise exception 'Reset changed badges outside the pilot';
  end if;
  select count(*) into current_count from public.challenges;
  if current_count <> current_setting('heds_test.before_challenges')::integer then
    raise exception 'Reset changed challenges outside the pilot';
  end if;
  select count(*) into current_count from public.quests;
  if current_count <> current_setting('heds_test.before_quests')::integer then
    raise exception 'Reset changed quests outside the pilot';
  end if;
  select count(*) into current_count from public.posts;
  if current_count <> current_setting('heds_test.before_posts')::integer then
    raise exception 'Reset changed posts outside the pilot';
  end if;

  reinstall_result := public.install_gamification_pilot(
    'heds25-617-isolation',
    '61700000-0000-4000-8000-000000000001',
    '61700000-0000-4000-8000-000000000002',
    current_date,
    current_date + 7
  );

  if not coalesce((reinstall_result ->> 'write_performed')::boolean, false)
     or (reinstall_result ->> 'pilot_challenges')::integer <> 3 then
    raise exception 'Pilot must reinstall after a reset: %', reinstall_result;
  end if;
end
$admin_reset_test$;

reset role;

do $grant_test$
begin
  if has_function_privilege(
       'anon',
       'public.preview_gamification_pilot(text,uuid,uuid,date,date)',
       'EXECUTE'
     )
     or has_function_privilege(
       'anon',
       'public.install_gamification_pilot(text,uuid,uuid,date,date)',
       'EXECUTE'
     )
     or has_function_privilege(
       'anon',
       'public.reset_gamification_pilot(text)',
       'EXECUTE'
     ) then
    raise exception 'Anonymous role must not execute pilot administration';
  end if;
end
$grant_test$;

rollback;

select 'gamification_pilot_isolation_ok' as result;
