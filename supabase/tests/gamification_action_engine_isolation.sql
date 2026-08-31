\set ON_ERROR_STOP on

begin;

select set_config(
  'request.jwt.claim.sub',
  (
    select au.id::text
    from auth.users au
    join public.user_profiles up on up.user_id = au.id
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
    raise exception 'Gamification isolation test requires two auth users';
  end if;

  delete from public.gamification_data where user_id = current_uid;

  -- Make reward assertions independent from production challenge/badge setup.
  update public.challenges set is_active = false where is_active = true;
  update public.badges set is_active = false where is_active = true;

  insert into public.gamification_data (user_id, email, total_xp, current_level)
  values (other_uid, 'gamification-other@test.invalid', 0, 1)
  on conflict (user_id) do update
    set total_xp = 0,
        current_level = 1;

  insert into public.posts (id, user_id, author_name, content)
  values
    ('10000000-0000-0000-0000-000000000001', current_uid, 'Owner', 'Own post'),
    ('10000000-0000-0000-0000-000000000002', other_uid, 'Other', 'Other post'),
    ('10000000-0000-0000-0000-000000000003', current_uid, 'Owner', 'Old post')
  on conflict (id) do nothing;

  update public.posts
  set created_at = now() - interval '1 day'
  where id = '10000000-0000-0000-0000-000000000003';

  -- Seed a genuinely stale profile without the normal updated_at trigger.
  alter table public.user_profiles disable trigger handle_updated_at;
  update public.user_profiles
  set updated_at = now() - interval '1 day'
  where user_id = current_uid;
  alter table public.user_profiles enable trigger handle_updated_at;
end
$setup$;

set local role authenticated;

do $test$
declare
  first_result jsonb;
  retry_result jsonb;
  profile_first_result jsonb;
  profile_retry_result jsonb;
  xp_total integer;
  history_count integer;
  changed_other integer;
  forbidden boolean := false;
begin
  begin
    insert into public.gamification_data (user_id, email, total_xp, current_level)
    values (auth.uid(), 'browser-bypass@test.invalid', 1000, 10);
  exception when others then
    forbidden := true;
  end;

  if not forbidden then
    raise exception 'Direct owner insert must be denied';
  end if;

  forbidden := false;

  first_result := public.record_my_gamification_action(
    'POST',
    '10000000-0000-0000-0000-000000000001',
    '{}'::jsonb
  );

  retry_result := public.record_my_gamification_action(
    'POST',
    '10000000-0000-0000-0000-000000000001',
    '{}'::jsonb
  );

  if not coalesce((first_result ->> 'awarded')::boolean, false) then
    raise exception 'First verified action should award XP: %', first_result;
  end if;

  if not coalesce((retry_result ->> 'duplicate')::boolean, false) then
    raise exception 'Retry should be idempotent: %', retry_result;
  end if;

  select total_xp into xp_total
  from public.gamification_data
  where user_id = auth.uid();

  if xp_total <> 25 then
    raise exception 'Expected exactly 25 XP after retry, got %', xp_total;
  end if;

  select count(*) into history_count
  from public.xp_history
  where user_id = auth.uid()
    and event_key = 'post:10000000-0000-0000-0000-000000000001';

  if history_count <> 1 then
    raise exception 'Expected one history event, got %', history_count;
  end if;

  forbidden := false;
  begin
    perform public.record_my_gamification_action(
      'PROFILE_UPDATE',
      null,
      '{}'::jsonb
    );
  exception when others then
    forbidden := true;
  end;

  if not forbidden then
    raise exception 'A stale profile must not receive profile-update XP';
  end if;

  update public.user_profiles
  set updated_at = now()
  where user_id = auth.uid();

  profile_first_result := public.record_my_gamification_action(
    'PROFILE_UPDATE',
    null,
    '{}'::jsonb
  );

  profile_retry_result := public.record_my_gamification_action(
    'PROFILE_UPDATE',
    null,
    '{}'::jsonb
  );

  if not coalesce((profile_first_result ->> 'awarded')::boolean, false) then
    raise exception 'First profile update of the day should award XP: %', profile_first_result;
  end if;

  if not coalesce((profile_retry_result ->> 'duplicate')::boolean, false) then
    raise exception 'Profile update reward must be limited to once per day: %', profile_retry_result;
  end if;

  select count(*) into history_count
  from public.xp_history
  where user_id = auth.uid()
    and event_key = 'profile_update:' || current_date::text;

  if history_count <> 1 then
    raise exception 'Expected one daily profile reward, got %', history_count;
  end if;

  with changed as (
    update public.gamification_data
    set total_xp = total_xp + 1000
    where user_id = auth.uid()
    returning 1
  )
  select count(*) into changed_other from changed;

  if changed_other <> 0 then
    raise exception 'Direct owner XP update expected 0 rows, got %', changed_other;
  end if;

  begin
    perform public.record_my_gamification_action(
      'POST',
      '10000000-0000-0000-0000-000000000002',
      '{}'::jsonb
    );
  exception when others then
    forbidden := true;
  end;

  if not forbidden then
    raise exception 'A user must not reward an action owned by another user';
  end if;

  forbidden := false;
  begin
    perform public.record_my_gamification_action(
      'POST',
      '10000000-0000-0000-0000-000000000003',
      '{}'::jsonb
    );
  exception when others then
    forbidden := true;
  end;

  if not forbidden then
    raise exception 'Historical posts must not be replayed for XP';
  end if;

  with changed as (
    update public.gamification_data
    set total_xp = total_xp + 1000
    where user_id = current_setting('heds_test.other_uid')::uuid
    returning 1
  )
  select count(*) into changed_other from changed;

  if changed_other <> 0 then
    raise exception 'Cross-user XP update expected 0 rows, got %', changed_other;
  end if;

  forbidden := false;
  begin
    perform public.add_user_xp(
      auth.uid(),
      'POST',
      1000,
      null,
      null,
      'legacy bypass'
    );
  exception when insufficient_privilege then
    forbidden := true;
  end;

  if not forbidden then
    raise exception 'Legacy arbitrary-user XP function must be denied';
  end if;
end
$test$;

reset role;
rollback;

select 'gamification_action_engine_isolation_ok' as result;
