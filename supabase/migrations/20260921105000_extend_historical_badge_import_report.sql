-- Complete the historical import report with per-badge aggregates and explicit
-- zero deltas for XP and house points.

create or replace function gamification_private.historical_badge_import_summary(
  p_badge_ids uuid[] default null
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public, gamification_private
as $$
  with candidates as materialized (
    select *
    from gamification_private.historical_badge_candidates(p_badge_ids)
  ),
  per_badge as (
    select
      c.badge_id,
      b.name as badge_name,
      count(*) filter (where c.decision = 'eligible') as eligible_assignments,
      count(*) filter (where c.decision = 'already_present') as already_present_assignments,
      count(*) filter (where c.decision = 'ineligible') as ineligible_assignments,
      count(*) filter (where c.decision = 'quarantined') as quarantined_assignments
    from candidates c
    join public.badges b on b.id = c.badge_id
    group by c.badge_id, b.name
  )
  select jsonb_build_object(
    'rule_version', 'historical-badges-v1',
    'contains_personal_data', false,
    'users_evaluated', count(distinct c.user_id),
    'badges_evaluated', count(distinct c.badge_id),
    'eligible_assignments', count(*) filter (where c.decision = 'eligible'),
    'already_present_assignments', count(*) filter (where c.decision = 'already_present'),
    'ineligible_assignments', count(*) filter (where c.decision = 'ineligible'),
    'quarantined_assignments', count(*) filter (where c.decision = 'quarantined'),
    'xp_delta', 0,
    'house_points_delta', 0,
    'badge_breakdown', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'badge_id', pb.badge_id,
          'badge_name', pb.badge_name,
          'eligible_assignments', pb.eligible_assignments,
          'already_present_assignments', pb.already_present_assignments,
          'ineligible_assignments', pb.ineligible_assignments,
          'quarantined_assignments', pb.quarantined_assignments,
          'xp_delta', 0,
          'house_points_delta', 0
        )
        order by pb.badge_name, pb.badge_id
      )
      from per_badge pb
    ), '[]'::jsonb)
  )
  from candidates c;
$$;

revoke all on function gamification_private.historical_badge_import_summary(uuid[])
  from public, anon, authenticated;

create or replace function public.preview_historical_badge_import(
  p_badge_ids uuid[] default null
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, gamification_private
as $$
begin
  if (select auth.uid()) is null or not (select public.app_is_privileged()) then
    raise exception 'Insufficient privileges';
  end if;

  return gamification_private.historical_badge_import_summary(p_badge_ids)
    || jsonb_build_object('write_performed', false);
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

  v_summary := gamification_private.historical_badge_import_summary(p_badge_ids);

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

  v_summary := v_summary || jsonb_build_object(
    'write_performed', true,
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
