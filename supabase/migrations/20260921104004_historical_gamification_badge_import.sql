-- Historical badge imports are explicit, auditable and never award XP.
-- Existing rows are preserved but deliberately not guessed as earned/imported.

alter table public.user_badges
  add column if not exists reward_origin text,
  add column if not exists historical_batch_id uuid,
  add column if not exists reward_rule_version text;

update public.user_badges
set reward_origin = 'legacy_unclassified'
where reward_origin is null;

alter table public.user_badges
  alter column reward_origin set default 'earned',
  alter column reward_origin set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.user_badges'::regclass
      and conname = 'user_badges_reward_origin_check'
  ) then
    alter table public.user_badges
      add constraint user_badges_reward_origin_check
      check (reward_origin in (
        'earned',
        'challenge_reward',
        'admin_grant',
        'historical_import',
        'legacy_unclassified'
      ));
  end if;
end
$$;

create schema if not exists gamification_private;
revoke all on schema gamification_private from public, anon, authenticated;

create table if not exists gamification_private.historical_badge_import_batches (
  id uuid primary key default gen_random_uuid(),
  batch_key text not null unique,
  rule_version text not null,
  status text not null check (status in ('applying', 'applied')),
  requested_by uuid not null references auth.users(id) on delete restrict,
  requested_at timestamptz not null default now(),
  applied_at timestamptz,
  summary jsonb not null default '{}'::jsonb,
  constraint historical_badge_batch_key_check
    check (batch_key ~ '^[a-z0-9][a-z0-9._:-]{2,127}$'),
  constraint historical_badge_rule_version_check
    check (rule_version ~ '^[a-z0-9][a-z0-9._:-]{2,127}$')
);

alter table gamification_private.historical_badge_import_batches
  enable row level security;

revoke all on gamification_private.historical_badge_import_batches
  from public, anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.user_badges'::regclass
      and conname = 'user_badges_historical_batch_id_fkey'
  ) then
    alter table public.user_badges
      add constraint user_badges_historical_batch_id_fkey
      foreign key (historical_batch_id)
      references gamification_private.historical_badge_import_batches(id)
      on delete restrict;
  end if;
end
$$;

create or replace function gamification_private.historical_badge_candidates(
  p_badge_ids uuid[] default null
)
returns table (
  user_id uuid,
  badge_id uuid,
  decision text,
  reason text
)
language sql
stable
security definer
set search_path = pg_catalog, public, gamification_private
as $$
  with scoped_badges as (
    select b.id, coalesce(b.conditions, '{}'::jsonb) as conditions
    from public.badges b
    where b.is_active = true
      and (p_badge_ids is null or b.id = any(p_badge_ids))
  ),
  population as (
    select
      gd.user_id,
      coalesce(gd.total_xp, 0) as total_xp,
      coalesce(gd.current_level, 1) as current_level
    from public.gamification_data gd
    join public.user_profiles up on up.user_id = gd.user_id
  ),
  evaluated as (
    select
      p.user_id,
      b.id as badge_id,
      ub.badge_id is not null as already_present,
      b.conditions,
      (
        (b.conditions ? 'total_xp')::integer
        + (b.conditions ? 'level')::integer
        + (b.conditions ? 'action_count')::integer
      ) as supported_rule_count,
      case
        when b.conditions ? 'total_xp'
          and coalesce(b.conditions ->> 'total_xp', '') ~ '^[0-9]+$'
          then p.total_xp >= (b.conditions ->> 'total_xp')::integer
        when b.conditions ? 'level'
          and coalesce(b.conditions ->> 'level', '') ~ '^[0-9]+$'
          then p.current_level >= (b.conditions ->> 'level')::integer
        when b.conditions ? 'action_count'
          and coalesce(b.conditions ->> 'count', '') ~ '^[0-9]+$'
          and nullif(btrim(b.conditions ->> 'action_type'), '') is not null
          then (
            select count(*)
            from public.xp_history xh
            where xh.user_id = p.user_id
              and xh.action = upper(b.conditions ->> 'action_type')
          ) >= (b.conditions ->> 'count')::integer
        else false
      end as condition_met,
      case
        when b.conditions ? 'total_xp'
          and coalesce(b.conditions ->> 'total_xp', '') !~ '^[0-9]+$'
          then 'invalid_total_xp_rule'
        when b.conditions ? 'level'
          and coalesce(b.conditions ->> 'level', '') !~ '^[0-9]+$'
          then 'invalid_level_rule'
        when b.conditions ? 'action_count'
          and (
            coalesce(b.conditions ->> 'count', '') !~ '^[0-9]+$'
            or nullif(btrim(b.conditions ->> 'action_type'), '') is null
          )
          then 'invalid_action_count_rule'
        when b.conditions ? 'login_streak' then 'unsupported_login_streak_rule'
        else 'unsupported_or_ambiguous_rule'
      end as invalid_reason
    from population p
    cross join scoped_badges b
    left join public.user_badges ub
      on ub.user_id = p.user_id
      and ub.badge_id = b.id
  )
  select
    e.user_id,
    e.badge_id,
    case
      when e.already_present then 'already_present'
      when e.supported_rule_count <> 1 then 'quarantined'
      when e.invalid_reason <> 'unsupported_or_ambiguous_rule' then 'quarantined'
      when e.condition_met then 'eligible'
      else 'ineligible'
    end as decision,
    case
      when e.already_present then 'badge_already_present'
      when e.supported_rule_count <> 1 then 'unsupported_or_ambiguous_rule'
      when e.invalid_reason <> 'unsupported_or_ambiguous_rule' then e.invalid_reason
      when e.condition_met then 'condition_met_without_retroactive_xp'
      else 'condition_not_met'
    end as reason
  from evaluated e;
$$;

revoke all on function gamification_private.historical_badge_candidates(uuid[])
  from public, anon, authenticated;

create or replace function public.preview_historical_badge_import(
  p_badge_ids uuid[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, gamification_private
as $$
declare
  v_summary jsonb;
begin
  if (select auth.uid()) is null or not (select public.app_is_privileged()) then
    raise exception 'Insufficient privileges';
  end if;

  select jsonb_build_object(
    'rule_version', 'historical-badges-v1',
    'write_performed', false,
    'contains_personal_data', false,
    'users_evaluated', count(distinct c.user_id),
    'badges_evaluated', count(distinct c.badge_id),
    'eligible_assignments', count(*) filter (where c.decision = 'eligible'),
    'already_present_assignments', count(*) filter (where c.decision = 'already_present'),
    'ineligible_assignments', count(*) filter (where c.decision = 'ineligible'),
    'quarantined_assignments', count(*) filter (where c.decision = 'quarantined')
  )
  into v_summary
  from gamification_private.historical_badge_candidates(p_badge_ids) c;

  return v_summary;
end;
$$;

revoke all on function public.preview_historical_badge_import(uuid[])
  from public, anon;
grant execute on function public.preview_historical_badge_import(uuid[])
  to authenticated;

create or replace function public.apply_historical_badge_import(
  p_batch_key text,
  p_rule_version text default 'historical-badges-v1',
  p_badge_ids uuid[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, gamification_private
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_batch_id uuid;
  v_existing_rule_version text;
  v_existing_status text;
  v_summary jsonb;
  v_users_evaluated integer;
  v_badges_evaluated integer;
  v_eligible integer;
  v_already_present integer;
  v_ineligible integer;
  v_quarantined integer;
  v_inserted integer;
begin
  if v_user_id is null or not (select public.app_is_privileged()) then
    raise exception 'Insufficient privileges';
  end if;

  p_batch_key := lower(btrim(coalesce(p_batch_key, '')));
  p_rule_version := lower(btrim(coalesce(p_rule_version, '')));

  if p_batch_key !~ '^[a-z0-9][a-z0-9._:-]{2,127}$' then
    raise exception 'Invalid batch key';
  end if;
  if p_rule_version !~ '^[a-z0-9][a-z0-9._:-]{2,127}$' then
    raise exception 'Invalid rule version';
  end if;

  select b.id, b.rule_version, b.status, b.summary
  into v_batch_id, v_existing_rule_version, v_existing_status, v_summary
  from gamification_private.historical_badge_import_batches b
  where b.batch_key = p_batch_key;

  if v_batch_id is not null then
    if v_existing_rule_version <> p_rule_version then
      raise exception 'Batch key already exists with another rule version';
    end if;

    return v_summary || jsonb_build_object(
      'batch_id', v_batch_id,
      'batch_key', p_batch_key,
      'status', v_existing_status,
      'duplicate', true
    );
  end if;

  insert into gamification_private.historical_badge_import_batches (
    batch_key,
    rule_version,
    status,
    requested_by
  )
  values (p_batch_key, p_rule_version, 'applying', v_user_id)
  on conflict (batch_key) do nothing
  returning id into v_batch_id;

  -- A concurrent request may have created the same lot after the first read.
  if v_batch_id is null then
    select b.id, b.rule_version, b.status, b.summary
    into v_batch_id, v_existing_rule_version, v_existing_status, v_summary
    from gamification_private.historical_badge_import_batches b
    where b.batch_key = p_batch_key;

    if v_existing_rule_version <> p_rule_version then
      raise exception 'Batch key already exists with another rule version';
    end if;

    return v_summary || jsonb_build_object(
      'batch_id', v_batch_id,
      'batch_key', p_batch_key,
      'status', v_existing_status,
      'duplicate', true
    );
  end if;

  select
    count(distinct c.user_id),
    count(distinct c.badge_id),
    count(*) filter (where c.decision = 'eligible'),
    count(*) filter (where c.decision = 'already_present'),
    count(*) filter (where c.decision = 'ineligible'),
    count(*) filter (where c.decision = 'quarantined')
  into
    v_users_evaluated,
    v_badges_evaluated,
    v_eligible,
    v_already_present,
    v_ineligible,
    v_quarantined
  from gamification_private.historical_badge_candidates(p_badge_ids) c;

  insert into public.user_badges (
    user_id,
    badge_id,
    earned_at,
    notified,
    reward_origin,
    historical_batch_id,
    reward_rule_version
  )
  select
    c.user_id,
    c.badge_id,
    now(),
    true,
    'historical_import',
    v_batch_id,
    p_rule_version
  from gamification_private.historical_badge_candidates(p_badge_ids) c
  where c.decision = 'eligible'
  on conflict (user_id, badge_id) do nothing;

  get diagnostics v_inserted = row_count;

  v_summary := jsonb_build_object(
    'rule_version', p_rule_version,
    'write_performed', true,
    'contains_personal_data', false,
    'users_evaluated', coalesce(v_users_evaluated, 0),
    'badges_evaluated', coalesce(v_badges_evaluated, 0),
    'eligible_assignments', coalesce(v_eligible, 0),
    'already_present_assignments', coalesce(v_already_present, 0),
    'ineligible_assignments', coalesce(v_ineligible, 0),
    'quarantined_assignments', coalesce(v_quarantined, 0),
    'inserted_assignments', coalesce(v_inserted, 0)
  );

  update gamification_private.historical_badge_import_batches
  set status = 'applied',
      applied_at = now(),
      summary = v_summary
  where id = v_batch_id;

  return v_summary || jsonb_build_object(
    'batch_id', v_batch_id,
    'batch_key', p_batch_key,
    'status', 'applied',
    'duplicate', false
  );
end;
$$;

revoke all on function public.apply_historical_badge_import(text, text, uuid[])
  from public, anon;
grant execute on function public.apply_historical_badge_import(text, text, uuid[])
  to authenticated;
