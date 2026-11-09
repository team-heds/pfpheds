-- HEDS25-622: aggregate diagnostics, reversible quarantine and prevention of
-- new orphan gamification records. No public history is deleted.

create schema if not exists gamification_private;
revoke all on schema gamification_private from public, anon, authenticated;

create table if not exists gamification_private.data_quality_runs (
  id uuid primary key default gen_random_uuid(),
  batch_key text not null unique,
  rule_version text not null,
  status text not null check (status in ('applying', 'applied')),
  requested_by uuid not null references auth.users(id) on delete restrict,
  requested_at timestamptz not null default now(),
  applied_at timestamptz,
  summary jsonb not null default '{}'::jsonb,
  constraint gamification_data_quality_batch_key_check
    check (batch_key ~ '^[a-z0-9][a-z0-9._:-]{2,127}$')
);

alter table gamification_private.data_quality_runs enable row level security;
revoke all on gamification_private.data_quality_runs
  from public, anon, authenticated;

create table if not exists gamification_private.data_quality_quarantine (
  id bigint generated always as identity primary key,
  run_id uuid not null
    references gamification_private.data_quality_runs(id) on delete restrict,
  entity_type text not null
    check (entity_type in ('gamification_data', 'user_quest_progress')),
  entity_key text not null,
  reason text not null check (reason = 'missing_user_profile'),
  snapshot jsonb not null,
  quarantined_at timestamptz not null default now(),
  unique (entity_type, entity_key, reason)
);

alter table gamification_private.data_quality_quarantine enable row level security;
revoke all on gamification_private.data_quality_quarantine
  from public, anon, authenticated;

create table if not exists gamification_private.profile_house_sync_audit (
  id bigint generated always as identity primary key,
  run_id uuid
    references gamification_private.data_quality_runs(id) on delete restrict,
  user_id uuid not null references public.user_profiles(user_id) on delete restrict,
  previous_house_id uuid references public.houses(id) on delete restrict,
  new_house_id uuid not null references public.houses(id) on delete restrict,
  reason text not null check (
    reason in ('data_quality_alignment', 'self_assignment', 'admin_assignment')
  ),
  changed_by uuid not null references auth.users(id) on delete restrict,
  changed_at timestamptz not null default now()
);

alter table gamification_private.profile_house_sync_audit enable row level security;
revoke all on gamification_private.profile_house_sync_audit
  from public, anon, authenticated;

create or replace function gamification_private.data_quality_summary()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with ledger as (
    select xh.user_id, coalesce(sum(xh.amount), 0)::bigint as ledger_xp
    from public.xp_history xh
    group by xh.user_id
  ),
  house_rollup as (
    select
      h.id,
      coalesce(h.total_xp, 0)::bigint as stored_total_xp,
      coalesce(h.member_count, 0)::bigint as stored_member_count,
      coalesce(h.level, 1) as stored_level,
      coalesce(sum(gd.total_xp), 0)::bigint as expected_total_xp,
      count(gd.user_id)::bigint as expected_member_count
    from public.houses h
    left join public.gamification_data gd on gd.house_id = h.id
    group by h.id, h.total_xp, h.member_count, h.level
  ),
  issue_counts as (
    select
      (
        select count(*)
        from public.gamification_data gd
        where not exists (
          select 1 from public.user_profiles up where up.user_id = gd.user_id
        )
          and not exists (
            select 1
            from gamification_private.data_quality_quarantine q
            where q.entity_type = 'gamification_data'
              and q.entity_key = gd.id::text
              and q.reason = 'missing_user_profile'
          )
      )::integer as unquarantined_gamification_orphans,
      (
        select count(*)
        from public.user_quest_progress uqp
        where not exists (
          select 1 from public.user_profiles up where up.user_id = uqp.user_id
        )
          and not exists (
            select 1
            from gamification_private.data_quality_quarantine q
            where q.entity_type = 'user_quest_progress'
              and q.entity_key = uqp.id::text
              and q.reason = 'missing_user_profile'
          )
      )::integer as unquarantined_quest_progress_orphans,
      (
        select count(*)
        from public.gamification_data gd
        join public.user_profiles up on up.user_id = gd.user_id
        where gd.house_id is not null
          and up.house_id is distinct from gd.house_id
      )::integer as profile_house_mismatches,
      (
        select count(*)
        from public.gamification_data gd
        where gd.house_id is not null
          and not exists (select 1 from public.houses h where h.id = gd.house_id)
      )::integer as invalid_houses,
      (
        select count(*) from (
          select ub.user_id, ub.badge_id
          from public.user_badges ub
          group by ub.user_id, ub.badge_id
          having count(*) > 1
        ) duplicate_awards
      )::integer as duplicate_badge_awards,
      (
        select count(*)
        from public.user_quest_progress uqp
        join (
          select q.id, coalesce(max(qs.step_order), 0) as max_step
          from public.quests q
          left join public.quest_steps qs on qs.quest_id = q.id
          group by q.id
        ) bounds on bounds.id = uqp.quest_id
        where uqp.current_step < 0 or uqp.current_step > bounds.max_step
      )::integer as unknown_quest_steps,
      (
        select count(*)
        from public.gamification_data gd
        join public.user_profiles up on up.user_id = gd.user_id
        left join ledger l on l.user_id = gd.user_id
        where gd.total_xp <> coalesce(l.ledger_xp, 0)
      )::integer as linked_ledger_mismatches,
      (
        select count(*)
        from public.gamification_data gd
        where gd.current_level
          <> public.calculate_level_from_xp(coalesce(gd.total_xp, 0))
      )::integer as level_mismatches,
      (
        select count(*)
        from public.gamification_data gd
        where coalesce(gd.house_points, 0) <> coalesce(gd.total_xp, 0)
      )::integer as house_point_mismatches,
      (
        select count(*)
        from house_rollup hr
        where hr.stored_total_xp <> hr.expected_total_xp
           or hr.stored_member_count <> hr.expected_member_count
           or hr.stored_level
              <> public.calculate_house_level(hr.expected_total_xp)
      )::integer as house_rollup_mismatches,
      (
        select count(*)
        from public.badges b
        where b.is_active
          and not coalesce(
            (gamification_private.validate_badge_conditions(b.conditions)
              ->> 'valid')::boolean,
            false
          )
      )::integer as unsupported_active_badges,
      (
        select count(*)
        from public.challenges c
        where c.is_active
          and not exists (
            select 1
            from gamification_private.action_rules ar
            where ar.is_active
              and ar.challenge_action = lower(btrim(c.action_type))
          )
      )::integer as unsupported_active_challenges,
      (
        select count(*)
        from public.quests q
        where q.status in ('active', 'scheduled')
          and not exists (
            select 1 from public.quest_steps qs where qs.quest_id = q.id
          )
      )::integer as active_quests_without_steps
  )
  select jsonb_build_object(
    'rule_version', 'gamification-data-quality-v1',
    'contains_personal_data', false,
    'write_performed', false,
    'blocking_issue_count',
      unquarantined_gamification_orphans
      + unquarantined_quest_progress_orphans
      + profile_house_mismatches
      + invalid_houses
      + duplicate_badge_awards
      + unknown_quest_steps
      + linked_ledger_mismatches
      + level_mismatches
      + house_point_mismatches
      + house_rollup_mismatches
      + unsupported_active_badges
      + unsupported_active_challenges
      + active_quests_without_steps,
    'issues', jsonb_build_object(
      'unquarantined_gamification_orphans', unquarantined_gamification_orphans,
      'unquarantined_quest_progress_orphans', unquarantined_quest_progress_orphans,
      'profile_house_mismatches', profile_house_mismatches,
      'invalid_houses', invalid_houses,
      'duplicate_badge_awards', duplicate_badge_awards,
      'unknown_quest_steps', unknown_quest_steps,
      'linked_ledger_mismatches', linked_ledger_mismatches,
      'level_mismatches', level_mismatches,
      'house_point_mismatches', house_point_mismatches,
      'house_rollup_mismatches', house_rollup_mismatches,
      'unsupported_active_badges', unsupported_active_badges,
      'unsupported_active_challenges', unsupported_active_challenges,
      'active_quests_without_steps', active_quests_without_steps
    ),
    'warnings', jsonb_build_object(
      'profiles_without_house', (
        select count(*) from public.gamification_data gd where gd.house_id is null
      ),
      'historical_completed_quests_without_steps', (
        select count(*)
        from public.quests q
        where q.status in ('completed', 'archived')
          and not exists (
            select 1 from public.quest_steps qs where qs.quest_id = q.id
          )
      ),
      'quarantined_records', (
        select count(*)
        from gamification_private.data_quality_quarantine
      )
    )
  )
  from issue_counts;
$$;

revoke all on function gamification_private.data_quality_summary()
  from public, anon, authenticated;

create or replace function public.preview_gamification_data_quality()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not (select public.app_is_privileged()) then
    raise exception 'Insufficient privileges';
  end if;

  return gamification_private.data_quality_summary();
end;
$$;

revoke all on function public.preview_gamification_data_quality()
  from public, anon;
grant execute on function public.preview_gamification_data_quality()
  to authenticated;

create or replace function public.apply_gamification_data_quality(
  p_batch_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_run_id uuid;
  v_existing jsonb;
  v_before jsonb;
  v_after jsonb;
  v_quarantined_gamification integer := 0;
  v_quarantined_quest_progress integer := 0;
  v_houses_synchronized integer := 0;
begin
  if v_actor is null or not (select public.app_is_privileged()) then
    raise exception 'Insufficient privileges';
  end if;

  if p_batch_key is null
     or p_batch_key !~ '^[a-z0-9][a-z0-9._:-]{2,127}$' then
    raise exception 'Invalid data quality batch key';
  end if;

  perform pg_advisory_xact_lock(hashtext('gamification-data-quality-v1'));

  select r.summary into v_existing
  from gamification_private.data_quality_runs r
  where r.batch_key = p_batch_key and r.status = 'applied';

  if v_existing is not null then
    return v_existing || jsonb_build_object(
      'write_performed', false,
      'duplicate_batch', true
    );
  end if;

  v_before := gamification_private.data_quality_summary();

  insert into gamification_private.data_quality_runs (
    batch_key, rule_version, status, requested_by
  ) values (
    p_batch_key, 'gamification-data-quality-v1', 'applying', v_actor
  ) returning id into v_run_id;

  insert into gamification_private.data_quality_quarantine (
    run_id, entity_type, entity_key, reason, snapshot
  )
  select
    v_run_id,
    'gamification_data',
    gd.id::text,
    'missing_user_profile',
    to_jsonb(gd)
  from public.gamification_data gd
  where not exists (
    select 1 from public.user_profiles up where up.user_id = gd.user_id
  )
  on conflict (entity_type, entity_key, reason) do nothing;

  get diagnostics v_quarantined_gamification = row_count;

  insert into gamification_private.data_quality_quarantine (
    run_id, entity_type, entity_key, reason, snapshot
  )
  select
    v_run_id,
    'user_quest_progress',
    uqp.id::text,
    'missing_user_profile',
    to_jsonb(uqp)
  from public.user_quest_progress uqp
  where not exists (
    select 1 from public.user_profiles up where up.user_id = uqp.user_id
  )
  on conflict (entity_type, entity_key, reason) do nothing;

  get diagnostics v_quarantined_quest_progress = row_count;

  insert into gamification_private.profile_house_sync_audit (
    run_id, user_id, previous_house_id, new_house_id, reason, changed_by
  )
  select
    v_run_id,
    up.user_id,
    up.house_id,
    gd.house_id,
    'data_quality_alignment',
    v_actor
  from public.user_profiles up
  join public.gamification_data gd on gd.user_id = up.user_id
  where gd.house_id is not null
    and up.house_id is distinct from gd.house_id;

  update public.user_profiles up
  set house_id = gd.house_id,
      updated_at = now()
  from public.gamification_data gd
  where gd.user_id = up.user_id
    and gd.house_id is not null
    and up.house_id is distinct from gd.house_id;

  get diagnostics v_houses_synchronized = row_count;

  v_after := gamification_private.data_quality_summary();

  if coalesce((v_after ->> 'blocking_issue_count')::integer, -1) <> 0 then
    raise exception 'Gamification data quality correction did not converge: %',
      v_after;
  end if;

  v_after := v_after || jsonb_build_object(
    'write_performed', true,
    'duplicate_batch', false,
    'batch_key', p_batch_key,
    'quarantined_gamification_records', v_quarantined_gamification,
    'quarantined_quest_progress_records', v_quarantined_quest_progress,
    'houses_synchronized', v_houses_synchronized,
    'before', v_before
  );

  update gamification_private.data_quality_runs
  set status = 'applied', applied_at = now(), summary = v_after
  where id = v_run_id;

  return v_after;
end;
$$;

revoke all on function public.apply_gamification_data_quality(text)
  from public, anon;
grant execute on function public.apply_gamification_data_quality(text)
  to authenticated;

create or replace function gamification_private.require_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.user_profiles up where up.user_id = new.user_id
  ) then
    raise exception 'Gamification data requires an application profile';
  end if;
  return new;
end;
$$;

revoke all on function gamification_private.require_user_profile()
  from public, anon, authenticated;

drop trigger if exists require_profile_for_gamification_data
  on public.gamification_data;
create trigger require_profile_for_gamification_data
before insert or update of user_id on public.gamification_data
for each row execute function gamification_private.require_user_profile();

drop trigger if exists require_profile_for_quest_progress
  on public.user_quest_progress;
create trigger require_profile_for_quest_progress
before insert or update of user_id on public.user_quest_progress
for each row execute function gamification_private.require_user_profile();

create or replace function public.assign_my_house(p_house_id uuid)
returns public.gamification_data
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_previous_house_id uuid;
  v_effective_house_id uuid;
  v_result public.gamification_data;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if not exists (
    select 1 from public.user_profiles up where up.user_id = v_user_id
  ) then
    raise exception 'Application profile required';
  end if;
  if not exists (select 1 from public.houses h where h.id = p_house_id) then
    raise exception 'House not found';
  end if;

  select gd.house_id into v_previous_house_id
  from public.gamification_data gd
  where gd.user_id = v_user_id
  for update;

  if not found or v_previous_house_id is null then
    perform public.gamification_award_xp_internal(
      v_user_id,
      'HOUSE_ASSIGNMENT',
      50,
      'house-assignment:v1',
      'house',
      p_house_id,
      'Maison attribuée'
    );
    v_effective_house_id := p_house_id;
    update public.gamification_data
    set house_id = v_effective_house_id,
        gamification_metadata = coalesce(gamification_metadata, '{}'::jsonb)
          || jsonb_build_object('quiz_completed', true, 'quiz_date', now()),
        updated_at = now()
    where user_id = v_user_id;
  else
    v_effective_house_id := v_previous_house_id;
  end if;

  if exists (
    select 1
    from public.user_profiles up
    where up.user_id = v_user_id
      and up.house_id is distinct from v_effective_house_id
  ) then
    insert into gamification_private.profile_house_sync_audit (
      user_id, previous_house_id, new_house_id, reason, changed_by
    )
    select
      up.user_id, up.house_id, v_effective_house_id,
      'self_assignment', v_user_id
    from public.user_profiles up
    where up.user_id = v_user_id;

    update public.user_profiles
    set house_id = v_effective_house_id, updated_at = now()
    where user_id = v_user_id;
  end if;

  select gd.* into v_result
  from public.gamification_data gd
  where gd.user_id = v_user_id;

  return v_result;
end;
$$;

revoke all on function public.assign_my_house(uuid) from public, anon;
grant execute on function public.assign_my_house(uuid) to authenticated;

create or replace function public.admin_assign_user_gamification_house(
  p_user_id uuid,
  p_house_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_previous_house_id uuid;
  v_previous_profile_house_id uuid;
  v_gamification_changed boolean;
  v_profile_changed boolean;
begin
  if v_actor is null or not (select public.app_is_privileged()) then
    raise exception 'Insufficient privileges';
  end if;
  if p_user_id is null or p_house_id is null
     or not exists (select 1 from public.houses h where h.id = p_house_id)
     or not exists (
       select 1 from public.user_profiles up where up.user_id = p_user_id
     ) then
    raise exception 'Invalid house assignment';
  end if;

  select gd.house_id into v_previous_house_id
  from public.gamification_data gd
  where gd.user_id = p_user_id
  for update;
  if not found then
    raise exception 'Gamification profile not found';
  end if;

  select up.house_id into v_previous_profile_house_id
  from public.user_profiles up
  where up.user_id = p_user_id
  for update;

  v_gamification_changed := v_previous_house_id is distinct from p_house_id;
  v_profile_changed := v_previous_profile_house_id is distinct from p_house_id;

  if v_gamification_changed then
    update public.gamification_data
    set house_id = p_house_id, updated_at = now()
    where user_id = p_user_id;

    insert into gamification_private.house_assignment_audit (
      user_id, previous_house_id, new_house_id, changed_by
    ) values (
      p_user_id, v_previous_house_id, p_house_id, v_actor
    );
  end if;

  if v_profile_changed then
    insert into gamification_private.profile_house_sync_audit (
      user_id, previous_house_id, new_house_id, reason, changed_by
    ) values (
      p_user_id, v_previous_profile_house_id, p_house_id,
      'admin_assignment', v_actor
    );

    update public.user_profiles
    set house_id = p_house_id, updated_at = now()
    where user_id = p_user_id;
  end if;

  return jsonb_build_object(
    'changed', v_gamification_changed or v_profile_changed,
    'duplicate', not (v_gamification_changed or v_profile_changed),
    'gamification_changed', v_gamification_changed,
    'profile_synchronized', v_profile_changed,
    'previous_house_id', v_previous_house_id,
    'new_house_id', p_house_id
  );
end;
$$;

revoke all on function public.admin_assign_user_gamification_house(uuid, uuid)
  from public, anon;
grant execute on function public.admin_assign_user_gamification_house(uuid, uuid)
  to authenticated;
