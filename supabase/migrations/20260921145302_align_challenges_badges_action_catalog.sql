-- HEDS25-619: align badges and challenges with the authoritative action
-- catalogue. Existing awards are preserved and never replayed.

create schema if not exists gamification_private;
revoke all on schema gamification_private from public, anon, authenticated;

create table if not exists gamification_private.badge_condition_audit (
  id bigint generated always as identity primary key,
  badge_id uuid not null references public.badges(id) on delete restrict,
  previous_conditions jsonb not null,
  next_conditions jsonb not null,
  previous_active boolean not null,
  next_active boolean not null,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (badge_id, reason)
);

alter table gamification_private.badge_condition_audit enable row level security;
revoke all on gamification_private.badge_condition_audit
  from public, anon, authenticated;

create or replace function gamification_private.normalize_badge_conditions(
  p_conditions jsonb
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_conditions jsonb := coalesce(p_conditions, '{}'::jsonb);
  v_nested jsonb;
begin
  if jsonb_typeof(v_conditions -> 'action_count') = 'object' then
    v_nested := v_conditions -> 'action_count';
    v_conditions := (v_conditions - 'action_count') || jsonb_build_object(
      'action_count', true,
      'action_type', upper(btrim(coalesce(v_nested ->> 'action_type', ''))),
      'count', case
        when coalesce(v_nested ->> 'count', '') ~ '^[0-9]{1,10}$'
          and (v_nested ->> 'count')::numeric <= 2147483647
          then (v_nested ->> 'count')::integer
        else 0
      end
    );
  end if;

  return v_conditions;
end;
$$;

revoke all on function gamification_private.normalize_badge_conditions(jsonb)
  from public, anon, authenticated;

create or replace function gamification_private.validate_badge_conditions(
  p_conditions jsonb
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_conditions jsonb := gamification_private.normalize_badge_conditions(p_conditions);
  v_errors jsonb := '[]'::jsonb;
  v_kind text;
  v_target integer;
  v_action text;
  v_supported_count integer := 0;
begin
  if v_conditions ? 'total_xp' then
    v_supported_count := v_supported_count + 1;
    v_kind := 'total_xp';
    if not (case
      when coalesce(v_conditions ->> 'total_xp', '') ~ '^[0-9]{1,10}$'
        then (v_conditions ->> 'total_xp')::numeric between 1 and 2147483647
      else false
    end) then
      v_errors := v_errors || jsonb_build_array('invalid_total_xp');
    else
      v_target := (v_conditions ->> 'total_xp')::integer;
    end if;
  end if;

  if v_conditions ? 'level' then
    v_supported_count := v_supported_count + 1;
    v_kind := 'level';
    if not (case
      when coalesce(v_conditions ->> 'level', '') ~ '^[0-9]{1,10}$'
        then (v_conditions ->> 'level')::numeric between 1 and 2147483647
      else false
    end) then
      v_errors := v_errors || jsonb_build_array('invalid_level');
    else
      v_target := (v_conditions ->> 'level')::integer;
    end if;
  end if;

  if v_conditions ? 'action_count' then
    v_supported_count := v_supported_count + 1;
    v_kind := 'action_count';
    v_action := upper(btrim(coalesce(v_conditions ->> 'action_type', '')));
    if not (case
      when coalesce(v_conditions ->> 'count', '') ~ '^[0-9]{1,10}$'
        then (v_conditions ->> 'count')::numeric between 1 and 2147483647
      else false
    end) then
      v_errors := v_errors || jsonb_build_array('invalid_action_count');
    else
      v_target := (v_conditions ->> 'count')::integer;
    end if;
    if not exists (
      select 1
      from gamification_private.action_rules ar
      where ar.action_code = v_action and ar.is_active = true
    ) then
      v_errors := v_errors || jsonb_build_array('unsupported_action');
    end if;
  end if;

  if v_supported_count = 0 then
    v_errors := v_errors || jsonb_build_array('unsupported_condition');
  elsif v_supported_count > 1 then
    v_errors := v_errors || jsonb_build_array('multiple_conditions');
  end if;

  -- These legacy keys change the business meaning and must not be silently
  -- approximated by a supported condition.
  if v_conditions ?| array['quiz_complete', 'has_house', 'login_streak'] then
    v_errors := v_errors || jsonb_build_array('unsupported_condition');
  end if;

  return jsonb_build_object(
    'valid', jsonb_array_length(v_errors) = 0,
    'errors', v_errors,
    'kind', v_kind,
    'target', v_target,
    'action_type', v_action,
    'normalized', v_conditions
  );
end;
$$;

revoke all on function gamification_private.validate_badge_conditions(jsonb)
  from public, anon, authenticated;

-- Normalize only published definitions that the old engine could not read.
insert into gamification_private.badge_condition_audit (
  badge_id, previous_conditions, next_conditions,
  previous_active, next_active, reason
)
select
  b.id,
  b.conditions,
  gamification_private.normalize_badge_conditions(b.conditions),
  b.is_active,
  b.is_active,
  'normalize_nested_action_count'
from public.badges b
where b.is_active = true
  and jsonb_typeof(b.conditions -> 'action_count') = 'object'
  and b.conditions is distinct from gamification_private.normalize_badge_conditions(b.conditions)
on conflict (badge_id, reason) do nothing;

update public.badges b
set conditions = a.next_conditions
from gamification_private.badge_condition_audit a
where a.badge_id = b.id
  and a.reason = 'normalize_nested_action_count'
  and b.conditions is distinct from a.next_conditions;

-- Keep unsupported definitions visible to administrators while making it
-- impossible for them to progress or award a badge.
insert into gamification_private.badge_condition_audit (
  badge_id, previous_conditions, next_conditions,
  previous_active, next_active, reason
)
select
  b.id, b.conditions, b.conditions, b.is_active, false,
  'disable_unsupported_active_condition'
from public.badges b
where b.is_active = true
  and not coalesce(
    (gamification_private.validate_badge_conditions(b.conditions) ->> 'valid')::boolean,
    false
  )
on conflict (badge_id, reason) do nothing;

update public.badges b
set is_active = false
from gamification_private.badge_condition_audit a
where a.badge_id = b.id
  and a.reason = 'disable_unsupported_active_condition'
  and b.is_active = true;

-- Classify challenge rewards before insertion. Generic condition awards keep
-- the default `earned` origin. No client-provided origin is accepted here.
create or replace function gamification_private.classify_badge_award()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.reward_origin = 'earned' and exists (
    select 1
    from public.challenges c
    join public.user_challenge_progress ucp
      on ucp.challenge_id = c.id
     and ucp.user_id = new.user_id
     and ucp.completed = true
    where c.badge_reward = new.badge_id
      and ucp.completed_at >= (statement_timestamp() at time zone 'UTC') - interval '5 seconds'
  ) then
    new.reward_origin := 'challenge_reward';
  end if;

  if new.reward_origin in ('earned', 'challenge_reward')
    and new.reward_rule_version is null then
    new.reward_rule_version := 'gamification-badges-v1';
  end if;

  return new;
end;
$$;

revoke all on function gamification_private.classify_badge_award()
  from public, anon, authenticated;

drop trigger if exists classify_badge_award_before_insert on public.user_badges;
create trigger classify_badge_award_before_insert
before insert on public.user_badges
for each row execute function gamification_private.classify_badge_award();

create or replace function gamification_private.apply_badge_bonus_internal(
  p_user_id uuid,
  p_badge_id uuid,
  p_reward_origin text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_badge public.badges%rowtype;
  v_result jsonb;
begin
  if p_reward_origin not in ('earned', 'challenge_reward') then
    return jsonb_build_object('awarded', false, 'reason', 'non_rewarding_origin');
  end if;

  select * into v_badge
  from public.badges b
  where b.id = p_badge_id and b.is_active = true;

  if not found or coalesce(v_badge.xp_bonus, 0) <= 0 then
    return jsonb_build_object('awarded', false, 'reason', 'no_active_bonus');
  end if;

  v_result := public.gamification_award_xp_internal(
    p_user_id,
    'BADGE_UNLOCK',
    v_badge.xp_bonus,
    'badge:' || v_badge.id::text,
    'badge',
    v_badge.id,
    'Badge débloqué: ' || v_badge.name
  );

  return coalesce(v_result, jsonb_build_object('awarded', false));
end;
$$;

revoke all on function gamification_private.apply_badge_bonus_internal(uuid, uuid, text)
  from public, anon, authenticated;

create or replace function gamification_private.apply_badge_bonus_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform gamification_private.apply_badge_bonus_internal(
    new.user_id,
    new.badge_id,
    new.reward_origin
  );
  return new;
end;
$$;

revoke all on function gamification_private.apply_badge_bonus_after_insert()
  from public, anon, authenticated;

drop trigger if exists apply_badge_bonus_after_insert on public.user_badges;
create trigger apply_badge_bonus_after_insert
after insert on public.user_badges
for each row execute function gamification_private.apply_badge_bonus_after_insert();

create or replace function public.get_my_badge_progress()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select coalesce(jsonb_agg(item order by item ->> 'created_at'), '[]'::jsonb)
  into v_result
  from (
    select jsonb_build_object(
      'id', b.id,
      'name', b.name,
      'description', b.description,
      'icon', b.icon,
      'rarity', b.rarity,
      'xp_bonus', b.xp_bonus,
      'conditions', b.conditions,
      'is_active', b.is_active,
      'created_at', b.created_at,
      'earned_at', ub.earned_at,
      'condition_kind', condition_check.result ->> 'kind',
      'action_type', condition_check.result ->> 'action_type',
      'current_value', case condition_check.result ->> 'kind'
        when 'total_xp' then coalesce(gd.total_xp, 0)
        when 'level' then coalesce(gd.current_level, 1)
        when 'action_count' then (
          select count(*)
          from public.xp_history xh
          where xh.user_id = v_user_id
            and xh.action = condition_check.result ->> 'action_type'
        )
        else 0
      end,
      'target_value', coalesce((condition_check.result ->> 'target')::integer, 0)
    ) as item
    from public.badges b
    cross join lateral (
      select gamification_private.validate_badge_conditions(b.conditions) as result
    ) condition_check
    left join public.user_badges ub
      on ub.user_id = v_user_id and ub.badge_id = b.id
    left join public.gamification_data gd on gd.user_id = v_user_id
    where b.is_active = true
      and coalesce((condition_check.result ->> 'valid')::boolean, false)
  ) progress_rows;

  return v_result;
end;
$$;

revoke all on function public.get_my_badge_progress() from public, anon;
grant execute on function public.get_my_badge_progress() to authenticated;

create or replace function public.preview_gamification_catalog_alignment()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_result jsonb;
begin
  if v_actor is null or not (select public.app_is_privileged()) then
    raise exception 'Insufficient privileges';
  end if;

  select jsonb_build_object(
    'active_badges', count(*) filter (where b.is_active),
    'inactive_badges', count(*) filter (where not b.is_active),
    'unsupported_active_badges', count(*) filter (
      where b.is_active and not coalesce((v.result ->> 'valid')::boolean, false)
    ),
    'nested_active_conditions', count(*) filter (
      where b.is_active and jsonb_typeof(b.conditions -> 'action_count') = 'object'
    ),
    'unsupported_active_challenges', (
      select count(*)
      from public.challenges c
      where c.is_active = true
        and not exists (
          select 1 from gamification_private.action_rules ar
          where ar.is_active = true
            and ar.challenge_action = lower(c.action_type)
        )
    ),
    'duplicate_badge_awards', (
      select count(*) from (
        select ub.user_id, ub.badge_id
        from public.user_badges ub
        group by ub.user_id, ub.badge_id
        having count(*) > 1
      ) duplicates
    ),
    'write_performed', false
  ) into v_result
  from public.badges b
  cross join lateral (
    select gamification_private.validate_badge_conditions(b.conditions) as result
  ) v;

  return v_result;
end;
$$;

revoke all on function public.preview_gamification_catalog_alignment()
  from public, anon;
grant execute on function public.preview_gamification_catalog_alignment()
  to authenticated;

create or replace function gamification_private.enforce_active_catalog_entry()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_validation jsonb;
begin
  if tg_table_name = 'badges' then
    if new.is_active then
      v_validation := gamification_private.validate_badge_conditions(new.conditions);
      if not coalesce((v_validation ->> 'valid')::boolean, false) then
        raise exception 'Unsupported active badge condition: %', v_validation -> 'errors';
      end if;
    end if;
  elsif tg_table_name = 'challenges' then
    if new.is_active or coalesce(new.status, '') = 'active' then
      if not exists (
        select 1 from gamification_private.action_rules ar
        where ar.is_active = true
          and ar.challenge_action = lower(btrim(coalesce(new.action_type, '')))
      ) then
        raise exception 'Unsupported active challenge action';
      end if;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function gamification_private.enforce_active_catalog_entry()
  from public, anon, authenticated;

drop trigger if exists enforce_active_badge_condition on public.badges;
create trigger enforce_active_badge_condition
before insert or update of conditions, is_active on public.badges
for each row execute function gamification_private.enforce_active_catalog_entry();

drop trigger if exists enforce_active_challenge_action on public.challenges;
create trigger enforce_active_challenge_action
before insert or update of action_type, is_active, status on public.challenges
for each row execute function gamification_private.enforce_active_catalog_entry();

revoke all on gamification_private.badge_condition_audit
  from public, anon, authenticated;
revoke all on function gamification_private.normalize_badge_conditions(jsonb)
  from public, anon, authenticated;
revoke all on function gamification_private.validate_badge_conditions(jsonb)
  from public, anon, authenticated;

notify pgrst, 'reload schema';
