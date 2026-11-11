\set ON_ERROR_STOP on

-- Série de connexions (20261111100000_gamification_login_streak.sql).
-- Tout est exécuté dans une transaction annulée à la fin : aucune donnée n'est conservée.
-- Les connexions simulées sont datées d'octobre 2001 pour ne toucher aucune série réelle.

begin;

-- Le déclencheur de série est différé à la fin de transaction ; on le rend immédiat ici.
set constraints all immediate;

select set_config(
  'heds_test.player_uid',
  (
    select up.user_id::text
    from public.user_profiles up
    where gamification_private.is_login_streak_player(up.user_id)
    order by up.created_at
    limit 1
  ),
  true
);

do $preflight$
begin
  if nullif(current_setting('heds_test.player_uid'), '') is null then
    raise exception 'Login streak test requires at least one gamification player';
  end if;
end
$preflight$;

create temporary table streak_test_before on commit drop as
select coalesce(gd.total_xp, 0) as total_xp, coalesce(gd.house_points, 0) as house_points
from (select current_setting('heds_test.player_uid')::uuid as user_id) u
left join public.gamification_data gd on gd.user_id = u.user_id;

-- Six jours de suite : aucun palier.
insert into public.xp_history (user_id, amount, action, description, event_key, occurred_at, total_xp_after)
select current_setting('heds_test.player_uid')::uuid, 5, 'LOGIN', 'Test série',
       'login:' || d::date::text, (d::date + time '12:00') at time zone 'Europe/Zurich', 0
from generate_series('2001-10-01'::date, '2001-10-06'::date, interval '1 day') d;

do $six_days$
declare
  v_user uuid := current_setting('heds_test.player_uid')::uuid;
  v_streak record;
begin
  select * into v_streak from gamification_private.login_streak_for(v_user, '2001-10-06');
  if v_streak.current_streak <> 6 then
    raise exception 'Expected a 6-day streak, got %', v_streak.current_streak;
  end if;
  if exists (
    select 1 from public.xp_history xh
    where xh.user_id = v_user and xh.event_key = 'login-streak:2001-2002:7'
  ) then
    raise exception 'The 7-day milestone must not be paid after 6 days';
  end if;
end
$six_days$;

-- Septième jour : +20 XP pour le joueur et pour sa maison, badge attribué.
insert into public.xp_history (user_id, amount, action, description, event_key, occurred_at, total_xp_after)
values (current_setting('heds_test.player_uid')::uuid, 5, 'LOGIN', 'Test série',
        'login:2001-10-07', ('2001-10-07 12:00'::timestamp) at time zone 'Europe/Zurich', 0);

do $seventh_day$
declare
  v_user uuid := current_setting('heds_test.player_uid')::uuid;
  v_before record;
  v_after record;
begin
  select * into v_before from streak_test_before;
  select gd.total_xp, gd.house_points into v_after
  from public.gamification_data gd where gd.user_id = v_user;

  if not exists (
    select 1 from public.xp_history xh
    where xh.user_id = v_user and xh.event_key = 'login-streak:2001-2002:7'
      and xh.action = 'LOGIN_STREAK' and xh.amount = 20
  ) then
    raise exception 'The 7-day milestone must pay 20 XP';
  end if;
  if v_after.total_xp <> v_before.total_xp + 20 or v_after.house_points <> v_before.house_points + 20 then
    raise exception 'The bonus must be added once to the player and house points';
  end if;
  if not exists (
    select 1 from public.user_badges ub
    join gamification_private.login_streak_tiers t on t.badge_id = ub.badge_id
    where ub.user_id = v_user and t.milestone_days = 7
  ) then
    raise exception 'The 7-day badge must be granted';
  end if;
end
$seventh_day$;

-- Série perdue (8 octobre manqué) puis refaite la même année : pas de second paiement.
insert into public.xp_history (user_id, amount, action, description, event_key, occurred_at, total_xp_after)
select current_setting('heds_test.player_uid')::uuid, 5, 'LOGIN', 'Test série',
       'login:' || d::date::text, (d::date + time '12:00') at time zone 'Europe/Zurich', 0
from generate_series('2001-10-09'::date, '2001-10-16'::date, interval '1 day') d;

do $rebuilt$
declare
  v_user uuid := current_setting('heds_test.player_uid')::uuid;
  v_before record;
  v_total integer;
  v_streak record;
begin
  select * into v_before from streak_test_before;
  select gd.total_xp into v_total from public.gamification_data gd where gd.user_id = v_user;
  select * into v_streak from gamification_private.login_streak_for(v_user, '2001-10-16');

  if v_streak.current_streak <> 8 then
    raise exception 'Expected an 8-day streak after the missed day, got %', v_streak.current_streak;
  end if;
  if v_total <> v_before.total_xp + 20 then
    raise exception 'A milestone must be paid only once per academic year';
  end if;
  if (select count(*) from gamification_private.login_streak_milestones m
      where m.user_id = v_user and m.academic_year = '2001-2002') <> 1 then
    raise exception 'Expected exactly one paid milestone for 2001-2002';
  end if;
end
$rebuilt$;

-- Le joueur lit sa série par la RPC, jamais les tables privées.
select set_config('request.jwt.claim.sub', current_setting('heds_test.player_uid'), true);
set local role authenticated;

do $player_read$
declare
  v_result jsonb := public.get_my_login_streak();
begin
  if not coalesce((v_result ->> 'is_player')::boolean, false)
     or jsonb_array_length(v_result -> 'milestones') <> 3 then
    raise exception 'The player must read their streak with the three milestones: %', v_result;
  end if;

  begin
    perform 1 from gamification_private.login_streak_milestones limit 1;
    raise exception 'Private streak tables must not be readable';
  exception when insufficient_privilege then
    null;
  end;

  begin
    perform gamification_private.apply_login_streak_milestones(
      current_setting('heds_test.player_uid')::uuid, '2001-10-16'
    );
    raise exception 'The milestone engine must not be callable by a player';
  exception when insufficient_privilege then
    null;
  end;
end
$player_read$;

reset role;
set local role anon;

do $anon_read$
begin
  begin
    perform public.get_my_login_streak();
    raise exception 'Anonymous callers must not read a streak';
  exception when insufficient_privilege then
    null;
  end;
end
$anon_read$;

reset role;

rollback;
