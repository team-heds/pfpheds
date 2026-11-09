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

do $setup$
declare
  current_uid uuid := current_setting('request.jwt.claim.sub')::uuid;
begin
  if current_uid is null then
    raise exception 'Gamification reward test requires one auth user';
  end if;

  update public.challenges set is_active = false where is_active = true;
  update public.badges set is_active = false where is_active = true;

  delete from public.user_badges
  where user_id = current_uid
    and badge_id in (
      '47700000-0000-4000-8000-000000000001',
      '47700000-0000-4000-8000-000000000002'
    );
  delete from public.xp_history where user_id = current_uid;
  delete from public.gamification_data where user_id = current_uid;

  insert into public.badges (id, name, xp_bonus, conditions, is_active)
  values
    (
      '47700000-0000-4000-8000-000000000001',
      'Seuil historique test',
      20,
      '{"total_xp":100}'::jsonb,
      true
    ),
    (
      '47700000-0000-4000-8000-000000000002',
      'Seuil courant test',
      20,
      '{"total_xp":100}'::jsonb,
      false
    )
  on conflict (id) do update set
    xp_bonus = excluded.xp_bonus,
    conditions = excluded.conditions,
    is_active = excluded.is_active;

  insert into public.gamification_data (user_id, email, total_xp, current_level, house_points)
  values (current_uid, 'gamification-retroactive@test.invalid', 1000, 5, 1000);

  -- Simulate a badge imported from historical data. Its presence must never
  -- create a delayed bonus on the next action.
  insert into public.user_badges (user_id, badge_id, earned_at)
  values (current_uid, '47700000-0000-4000-8000-000000000002', now());
end
$setup$;

set local role authenticated;

do $historical_state$
declare
  result jsonb;
  xp_total integer;
  badge_count integer;
  bonus_count integer;
begin
  result := public.record_my_gamification_action('LOGIN', null, '{}'::jsonb);

  select total_xp into xp_total
  from public.gamification_data
  where user_id = auth.uid();

  select count(*) into badge_count
  from public.user_badges
  where user_id = auth.uid()
    and badge_id = '47700000-0000-4000-8000-000000000001';

  select count(*) into bonus_count
  from public.xp_history
  where user_id = auth.uid()
    and event_key in (
      'badge:47700000-0000-4000-8000-000000000001',
      'badge:47700000-0000-4000-8000-000000000002'
    );

  if not coalesce((result ->> 'awarded')::boolean, false) or xp_total <> 1005 then
    raise exception 'Historical account should receive only 5 login XP: %, total %', result, xp_total;
  end if;
  if badge_count <> 0 or bonus_count <> 0 then
    raise exception 'Historical threshold must not unlock retroactively';
  end if;
end
$historical_state$;

reset role;

do $crossing_setup$
declare
  current_uid uuid := current_setting('request.jwt.claim.sub')::uuid;
begin
  delete from public.xp_history where user_id = current_uid;
  delete from public.user_badges where user_id = current_uid;
  update public.gamification_data
  set total_xp = 95, current_level = public.calculate_level_from_xp(95), house_points = 95
  where user_id = current_uid;
  update public.badges
  set is_active = id = '47700000-0000-4000-8000-000000000002'
  where id in (
    '47700000-0000-4000-8000-000000000001',
    '47700000-0000-4000-8000-000000000002'
  );
end
$crossing_setup$;

set local role authenticated;

do $real_crossing$
declare
  first_result jsonb;
  retry_result jsonb;
  xp_total integer;
  badge_count integer;
  bonus_count integer;
begin
  first_result := public.record_my_gamification_action('LOGIN', null, '{}'::jsonb);
  retry_result := public.record_my_gamification_action('LOGIN', null, '{}'::jsonb);

  select total_xp into xp_total
  from public.gamification_data
  where user_id = auth.uid();

  select count(*) into badge_count
  from public.user_badges
  where user_id = auth.uid()
    and badge_id = '47700000-0000-4000-8000-000000000002';

  select count(*) into bonus_count
  from public.xp_history
  where user_id = auth.uid()
    and event_key = 'badge:47700000-0000-4000-8000-000000000002';

  if xp_total <> 120 then
    raise exception 'Expected 95 + 5 + 20 XP, got %', xp_total;
  end if;
  if badge_count <> 1 or bonus_count <> 1 then
    raise exception 'Real threshold crossing must unlock and reward once';
  end if;
  if jsonb_array_length(first_result -> 'badges_unlocked') <> 1 then
    raise exception 'First result must report one new badge: %', first_result;
  end if;
  if not coalesce((retry_result ->> 'duplicate')::boolean, false) then
    raise exception 'Repeated login must be idempotent: %', retry_result;
  end if;
end
$real_crossing$;

reset role;
rollback;

select 'gamification_no_retroactive_rewards_ok' as result;
