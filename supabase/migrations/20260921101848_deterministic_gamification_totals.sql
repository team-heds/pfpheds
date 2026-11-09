-- HEDS25-616: deterministic gamification balances, levels and house totals.
-- Nothing is repaired implicitly when this migration is installed. Privileged
-- users must preview, then explicitly apply a versioned reconciliation batch.

create or replace function public.calculate_level_from_xp(xp integer)
returns integer
language sql
immutable
parallel safe
set search_path = pg_catalog
as $$
  select greatest(
    1,
    least(
      20,
      floor(sqrt(greatest(coalesce(xp, 0), 0)::numeric / 100.0))::integer + 1
    )
  );
$$;

create or replace function public.xp_for_next_level(current_level integer)
returns integer
language sql
immutable
parallel safe
set search_path = pg_catalog
as $$
  select case
    when coalesce(current_level, 1) >= 20 then 0
    else greatest(coalesce(current_level, 1), 1)
      * greatest(coalesce(current_level, 1), 1)
      * 100
  end;
$$;

create or replace function public.update_house_level()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.level := public.calculate_house_level(coalesce(new.total_xp, 0));
  return new;
end;
$$;

-- The same legacy trigger was installed twice under two names. Keep only the
-- trigger that handles INSERT, UPDATE and DELETE.
drop trigger if exists sync_house_stats on public.gamification_data;

alter function public.update_house_stats()
  set search_path = pg_catalog, public;
revoke all on function public.update_house_stats()
  from public, anon, authenticated;

create schema if not exists gamification_private;
revoke all on schema gamification_private from public, anon, authenticated;

create table if not exists gamification_private.reconciliation_runs (
  id uuid primary key default gen_random_uuid(),
  batch_key text not null unique,
  rule_version text not null,
  status text not null check (status in ('applying', 'applied')),
  requested_by uuid not null references auth.users(id) on delete restrict,
  requested_at timestamptz not null default now(),
  applied_at timestamptz,
  summary jsonb not null default '{}'::jsonb,
  constraint gamification_reconciliation_batch_key_check
    check (batch_key ~ '^[a-z0-9][a-z0-9._:-]{2,127}$')
);

alter table gamification_private.reconciliation_runs enable row level security;
revoke all on gamification_private.reconciliation_runs
  from public, anon, authenticated;

create table if not exists gamification_private.house_assignment_audit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  previous_house_id uuid references public.houses(id) on delete restrict,
  new_house_id uuid not null references public.houses(id) on delete restrict,
  changed_by uuid not null references auth.users(id) on delete restrict,
  changed_at timestamptz not null default now()
);

alter table gamification_private.house_assignment_audit enable row level security;
revoke all on gamification_private.house_assignment_audit
  from public, anon, authenticated;

create or replace function gamification_private.reconciliation_summary()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public, gamification_private
as $$
  with ledger as (
    select xh.user_id, coalesce(sum(xh.amount), 0)::bigint as ledger_xp
    from public.xp_history xh
    group by xh.user_id
  ),
  profiles as (
    select
      gd.user_id,
      coalesce(gd.total_xp, 0)::bigint as total_xp,
      coalesce(gd.current_level, 1) as current_level,
      coalesce(gd.house_points, 0)::bigint as house_points,
      coalesce(l.ledger_xp, 0)::bigint as ledger_xp,
      up.user_id is not null as profile_linked
    from public.gamification_data gd
    left join ledger l on l.user_id = gd.user_id
    left join public.user_profiles up on up.user_id = gd.user_id
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
  )
  select jsonb_build_object(
    'rule_version', 'deterministic-gamification-v1',
    'contains_personal_data', false,
    'profiles_evaluated', (select count(*) from profiles),
    'level_mismatches', (
      select count(*) from profiles p
      where p.current_level <> public.calculate_level_from_xp(p.total_xp::integer)
    ),
    'ledger_mismatches', (
      select count(*) from profiles p where p.total_xp <> p.ledger_xp
    ),
    'linked_ledger_mismatches', (
      select count(*) from profiles p
      where p.profile_linked and p.total_xp <> p.ledger_xp
    ),
    'quarantined_orphan_profiles', (
      select count(*) from profiles p where not p.profile_linked
    ),
    'quarantined_orphan_ledger_mismatches', (
      select count(*) from profiles p
      where not p.profile_linked and p.total_xp <> p.ledger_xp
    ),
    'positive_ledger_gaps', (
      select count(*) from profiles p
      where p.profile_linked and p.total_xp > p.ledger_xp
    ),
    'negative_ledger_gaps', (
      select count(*) from profiles p
      where p.profile_linked and p.total_xp < p.ledger_xp
    ),
    'absolute_xp_gap', (
      select coalesce(sum(abs(p.total_xp - p.ledger_xp)), 0) from profiles p
    ),
    'house_point_mismatches', (
      select count(*) from profiles p where p.house_points <> p.total_xp
    ),
    'house_total_mismatches', (
      select count(*) from house_rollup h
      where h.stored_total_xp <> h.expected_total_xp
         or h.stored_member_count <> h.expected_member_count
    ),
    'house_level_mismatches', (
      select count(*) from house_rollup h
      where h.stored_level <> public.calculate_house_level(h.expected_total_xp)
    )
  );
$$;

revoke all on function gamification_private.reconciliation_summary()
  from public, anon, authenticated;

create or replace function public.get_house_gamification_totals()
returns table (
  name text,
  color text,
  description text,
  total_points bigint,
  member_count bigint,
  house_level integer
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  return query
  select
    h.name,
    h.color,
    h.description,
    coalesce(sum(gd.total_xp), 0)::bigint as total_points,
    count(gd.user_id)::bigint as member_count,
    public.calculate_house_level(coalesce(sum(gd.total_xp), 0)::bigint) as house_level
  from public.houses h
  left join public.gamification_data gd on gd.house_id = h.id
  group by h.id, h.name, h.color, h.description
  order by total_points desc, h.name asc;
end;
$$;

revoke all on function public.get_house_gamification_totals()
  from public, anon;
grant execute on function public.get_house_gamification_totals()
  to authenticated;

create or replace function public.admin_assign_user_gamification_house(
  p_user_id uuid,
  p_house_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, gamification_private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_previous_house_id uuid;
begin
  if v_actor is null or not (select public.app_is_privileged()) then
    raise exception 'Insufficient privileges';
  end if;

  if p_user_id is null
     or p_house_id is null
     or not exists (select 1 from public.houses h where h.id = p_house_id) then
    raise exception 'Invalid house assignment';
  end if;

  select gd.house_id
  into v_previous_house_id
  from public.gamification_data gd
  where gd.user_id = p_user_id
  for update;

  if not found then
    raise exception 'Gamification profile not found';
  end if;

  if v_previous_house_id is not distinct from p_house_id then
    return jsonb_build_object('changed', false, 'duplicate', true);
  end if;

  update public.gamification_data
  set house_id = p_house_id,
      updated_at = now()
  where user_id = p_user_id;

  insert into gamification_private.house_assignment_audit (
    user_id,
    previous_house_id,
    new_house_id,
    changed_by
  ) values (
    p_user_id,
    v_previous_house_id,
    p_house_id,
    v_actor
  );

  return jsonb_build_object(
    'changed', true,
    'duplicate', false,
    'previous_house_id', v_previous_house_id,
    'new_house_id', p_house_id
  );
end;
$$;

revoke all on function public.admin_assign_user_gamification_house(uuid, uuid)
  from public, anon;
grant execute on function public.admin_assign_user_gamification_house(uuid, uuid)
  to authenticated;

create or replace function public.preview_gamification_reconciliation()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, gamification_private
as $$
begin
  if (select auth.uid()) is null or not (select public.app_is_privileged()) then
    raise exception 'Insufficient privileges';
  end if;

  return gamification_private.reconciliation_summary()
    || jsonb_build_object('write_performed', false);
end;
$$;

revoke all on function public.preview_gamification_reconciliation()
  from public, anon;
grant execute on function public.preview_gamification_reconciliation()
  to authenticated;

create or replace function public.apply_gamification_reconciliation(
  p_batch_key text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, gamification_private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_before jsonb;
  v_after jsonb;
  v_existing jsonb;
  v_run_id uuid;
  v_opening_balances integer := 0;
  v_profiles_updated integer := 0;
begin
  if v_actor is null or not (select public.app_is_privileged()) then
    raise exception 'Insufficient privileges';
  end if;

  if p_batch_key is null
     or p_batch_key !~ '^[a-z0-9][a-z0-9._:-]{2,127}$' then
    raise exception 'Invalid reconciliation batch key';
  end if;

  perform pg_advisory_xact_lock(hashtext('gamification-reconciliation-v1'));

  select rr.summary
  into v_existing
  from gamification_private.reconciliation_runs rr
  where rr.batch_key = p_batch_key
    and rr.status = 'applied';

  if v_existing is not null then
    return v_existing || jsonb_build_object(
      'write_performed', false,
      'duplicate_batch', true
    );
  end if;

  v_before := gamification_private.reconciliation_summary();

  if coalesce((v_before ->> 'negative_ledger_gaps')::integer, 0) > 0 then
    raise exception 'Negative ledger gaps require manual review';
  end if;

  insert into gamification_private.reconciliation_runs (
    batch_key,
    rule_version,
    status,
    requested_by
  ) values (
    p_batch_key,
    'deterministic-gamification-v1',
    'applying',
    v_actor
  )
  returning id into v_run_id;

  with ledger as (
    select xh.user_id, coalesce(sum(xh.amount), 0)::integer as ledger_xp
    from public.xp_history xh
    group by xh.user_id
  )
  insert into public.xp_history (
    user_id,
    amount,
    action,
    description,
    source_type,
    source_id,
    total_xp_after,
    event_key
  )
  select
    gd.user_id,
    coalesce(gd.total_xp, 0) - coalesce(l.ledger_xp, 0),
    'OPENING_BALANCE',
    'Solde historique de référence — aucune récompense',
    'reconciliation',
    v_run_id,
    coalesce(gd.total_xp, 0),
    'reconciliation-opening-balance-v1'
  from public.gamification_data gd
  join public.user_profiles up on up.user_id = gd.user_id
  left join ledger l on l.user_id = gd.user_id
  where coalesce(gd.total_xp, 0) > coalesce(l.ledger_xp, 0)
  on conflict (user_id, event_key) where event_key is not null do nothing;

  get diagnostics v_opening_balances = row_count;

  update public.gamification_data gd
  set current_level = public.calculate_level_from_xp(coalesce(gd.total_xp, 0)),
      house_points = coalesce(gd.total_xp, 0),
      updated_at = now()
  where coalesce(gd.current_level, 1)
          <> public.calculate_level_from_xp(coalesce(gd.total_xp, 0))
     or coalesce(gd.house_points, 0) <> coalesce(gd.total_xp, 0);

  get diagnostics v_profiles_updated = row_count;

  update public.houses h
  set total_xp = rollup.total_xp,
      member_count = rollup.member_count,
      updated_at = now()
  from (
    select
      house.id,
      coalesce(sum(gd.total_xp), 0)::bigint as total_xp,
      count(gd.user_id)::integer as member_count
    from public.houses house
    left join public.gamification_data gd on gd.house_id = house.id
    group by house.id
  ) rollup
  where h.id = rollup.id;

  v_after := gamification_private.reconciliation_summary();

  if coalesce((v_after ->> 'level_mismatches')::integer, 0) <> 0
     or coalesce((v_after ->> 'linked_ledger_mismatches')::integer, 0) <> 0
     or coalesce((v_after ->> 'house_point_mismatches')::integer, 0) <> 0
     or coalesce((v_after ->> 'house_total_mismatches')::integer, 0) <> 0
     or coalesce((v_after ->> 'house_level_mismatches')::integer, 0) <> 0 then
    raise exception 'Gamification reconciliation did not converge';
  end if;

  v_after := v_after || jsonb_build_object(
    'write_performed', true,
    'duplicate_batch', false,
    'batch_key', p_batch_key,
    'opening_balances_created', v_opening_balances,
    'profiles_updated', v_profiles_updated,
    'before', v_before
  );

  update gamification_private.reconciliation_runs
  set status = 'applied',
      applied_at = now(),
      summary = v_after
  where id = v_run_id;

  return v_after;
end;
$$;

revoke all on function public.apply_gamification_reconciliation(text)
  from public, anon;
grant execute on function public.apply_gamification_reconciliation(text)
  to authenticated;

create or replace function public.admin_adjust_user_gamification_xp(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_adjustment_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, gamification_private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_history_id uuid;
  v_old_total integer;
  v_old_level integer;
  v_new_total integer;
  v_new_level integer;
  v_event_key text;
begin
  if v_actor is null or not (select public.app_is_privileged()) then
    raise exception 'Insufficient privileges';
  end if;

  if p_user_id is null
     or p_adjustment_id is null
     or p_amount is null
     or p_amount = 0
     or abs(p_amount) > 1000
     or char_length(btrim(coalesce(p_reason, ''))) < 5
     or char_length(btrim(p_reason)) > 200 then
    raise exception 'Invalid gamification adjustment';
  end if;

  v_event_key := 'admin-adjustment:' || p_adjustment_id::text;

  select gd.total_xp, gd.current_level
  into v_old_total, v_old_level
  from public.gamification_data gd
  where gd.user_id = p_user_id
  for update;

  if not found then
    raise exception 'Gamification profile not found';
  end if;

  v_new_total := coalesce(v_old_total, 0) + p_amount;
  if v_new_total < 0 then
    raise exception 'Gamification balance cannot be negative';
  end if;

  v_new_level := public.calculate_level_from_xp(v_new_total);

  insert into public.xp_history (
    user_id,
    amount,
    action,
    description,
    source_type,
    source_id,
    total_xp_after,
    event_key
  ) values (
    p_user_id,
    p_amount,
    'ADMIN_ADJUSTMENT',
    btrim(p_reason),
    'admin_adjustment',
    v_actor,
    v_new_total,
    v_event_key
  )
  on conflict (user_id, event_key) where event_key is not null do nothing
  returning id into v_history_id;

  if v_history_id is null then
    return jsonb_build_object(
      'adjusted', false,
      'duplicate', true,
      'total_xp', v_old_total,
      'current_level', v_old_level
    );
  end if;

  update public.gamification_data
  set total_xp = v_new_total,
      current_level = v_new_level,
      house_points = v_new_total,
      updated_at = now()
  where user_id = p_user_id;

  return jsonb_build_object(
    'adjusted', true,
    'duplicate', false,
    'xp_delta', p_amount,
    'old_total_xp', v_old_total,
    'total_xp', v_new_total,
    'old_level', v_old_level,
    'current_level', v_new_level,
    'level_changed', v_old_level <> v_new_level
  );
end;
$$;

revoke all on function public.admin_adjust_user_gamification_xp(uuid, integer, text, uuid)
  from public, anon;
grant execute on function public.admin_adjust_user_gamification_xp(uuid, integer, text, uuid)
  to authenticated;
