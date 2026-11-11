\set ON_ERROR_STOP on

-- Badges à seuil attribués quel que soit le gain (20261111180000_unlock_threshold_badges_on_any_award.sql).
-- Tout est exécuté dans une transaction annulée à la fin : aucune donnée n'est conservée.
-- Le test crée un badge de seuil temporaire, placé juste au-dessus du total d'un joueur.

begin;

set constraints all immediate;

select set_config(
  'heds_test.player_uid',
  (
    select up.user_id::text
    from public.user_profiles up
    where gamification_private.is_rollout_member(up.user_id)
    order by up.created_at
    limit 1
  ),
  true
);

do $preflight$
begin
  if nullif(current_setting('heds_test.player_uid'), '') is null then
    raise exception 'Threshold badge test requires at least one gamification player';
  end if;
end
$preflight$;

-- Le joueur a une ligne de gamification, sans rien gagner.
insert into public.gamification_data (user_id, email, total_xp, current_level, house_points)
select current_setting('heds_test.player_uid')::uuid, '', 0, 1, 0
on conflict (user_id) do nothing;

create temporary table threshold_test on commit drop as
select gd.total_xp as start_xp,
       gd.total_xp + 30 as threshold,
       gen_random_uuid() as badge_id
from public.gamification_data gd
where gd.user_id = current_setting('heds_test.player_uid')::uuid;

insert into public.badges (id, name, description, icon, rarity, xp_bonus, conditions, is_active)
select t.badge_id, 'Test seuil (transaction annulée)', 'Badge temporaire de test.', 'pi pi-star', 'common', 7,
       jsonb_build_object('total_xp', t.threshold), true
from threshold_test t;

-- Gain hors moteur d'actions qui ne franchit pas le seuil : pas de badge.
select public.gamification_award_xp_internal(
  current_setting('heds_test.player_uid')::uuid, 'TEST_GAIN', 20, 'test-threshold:1', 'test', null, 'Test seuil'
) is not null;

do $below$
begin
  if exists (
    select 1 from public.user_badges ub, threshold_test t
    where ub.user_id = current_setting('heds_test.player_uid')::uuid and ub.badge_id = t.badge_id
  ) then
    raise exception 'The badge must not be granted below its threshold';
  end if;
end
$below$;

-- Gain hors moteur d'actions qui franchit le seuil : badge et bonus, une seule fois.
create temporary table threshold_result on commit drop as
select public.gamification_award_xp_internal(
  current_setting('heds_test.player_uid')::uuid, 'TEST_GAIN', 15, 'test-threshold:2', 'test', null, 'Test seuil'
) as r;

do $crossed$
declare
  v_user uuid := current_setting('heds_test.player_uid')::uuid;
  v_badge uuid := (select badge_id from threshold_test);
  v_result jsonb := (select r from threshold_result);
begin
  if not exists (select 1 from public.user_badges ub where ub.user_id = v_user and ub.badge_id = v_badge) then
    raise exception 'The badge must be granted when an award crosses its threshold';
  end if;
  if not exists (
    select 1 from jsonb_array_elements(coalesce(v_result -> 'badges_unlocked', '[]'::jsonb)) b
    where b ->> 'id' = v_badge::text
  ) then
    raise exception 'The award result must list the unlocked badge: %', v_result;
  end if;
  if (select count(*) from public.xp_history xh
      where xh.user_id = v_user and xh.event_key = 'badge:' || v_badge::text and xh.amount = 7) <> 1 then
    raise exception 'The badge bonus must be paid exactly once';
  end if;
end
$crossed$;

-- Rejouer le même gain ne change rien ; le total reste égal à la somme attendue.
select public.gamification_award_xp_internal(
  current_setting('heds_test.player_uid')::uuid, 'TEST_GAIN', 15, 'test-threshold:2', 'test', null, 'Test seuil'
) is not null;

do $totals$
declare
  v_user uuid := current_setting('heds_test.player_uid')::uuid;
  v_start integer := (select start_xp from threshold_test);
  v_gained integer;
  v_total integer;
begin
  select gd.total_xp into v_total from public.gamification_data gd where gd.user_id = v_user;
  select coalesce(sum(xh.amount), 0) into v_gained
  from public.xp_history xh
  where xh.user_id = v_user
    and xh.event_key in ('test-threshold:1', 'test-threshold:2')
     or (xh.user_id = v_user and xh.action = 'BADGE_UNLOCK' and xh.occurred_at >= transaction_timestamp());
  if v_total <> v_start + v_gained or v_gained < 42 then
    raise exception 'Totals must follow the ledger (start %, gained %, total %)', v_start, v_gained, v_total;
  end if;
end
$totals$;

-- La fonction centrale et la vérification des badges restent inaccessibles aux comptes.
select set_config('request.jwt.claim.sub', current_setting('heds_test.player_uid'), true);
set local role authenticated;

do $privileges$
begin
  begin
    perform public.gamification_award_xp_internal(
      current_setting('heds_test.player_uid')::uuid, 'TEST_GAIN', 1000, 'test-threshold:forbidden', 'test', null, 'Test'
    );
    raise exception 'A player must not award XP directly';
  exception when insufficient_privilege then
    null;
  end;

  begin
    perform gamification_private.unlock_threshold_badges(
      current_setting('heds_test.player_uid')::uuid, 0, 100000, 1, 20
    );
    raise exception 'A player must not unlock badges directly';
  exception when insufficient_privilege then
    null;
  end;
end
$privileges$;

reset role;

rollback;
