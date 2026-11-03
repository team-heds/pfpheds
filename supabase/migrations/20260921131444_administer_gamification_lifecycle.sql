-- HEDS25-620: server-authoritative lifecycle for quests and challenges.

-- Replace the legacy trigger which silently wrote the unsupported `expired`
-- status during unrelated updates. Expiration is now handled by the audited
-- lifecycle scheduler below.
drop trigger if exists trigger_check_quest_expiration on public.quests;
drop function if exists public.check_quest_expiration();

alter table public.quests
  add column if not exists published_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists archived_at timestamptz;

update public.quests
set status = case lower(status)
  when 'draft' then 'draft'
  when 'scheduled' then 'scheduled'
  when 'active' then 'active'
  when 'completed' then 'completed'
  when 'expired' then 'completed'
  when 'archived' then 'archived'
  else 'draft'
end;

alter table public.quests
  drop constraint if exists quests_lifecycle_status_check,
  add constraint quests_lifecycle_status_check
    check (status in ('draft', 'scheduled', 'active', 'completed', 'archived'));

alter table public.challenges
  add column if not exists status text not null default 'active',
  add column if not exists published_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists archived_at timestamptz;

update public.challenges
set status = case when coalesce(is_active, false) then 'active' else 'completed' end;

alter table public.challenges
  drop constraint if exists challenges_lifecycle_status_check,
  add constraint challenges_lifecycle_status_check
    check (status in ('draft', 'scheduled', 'active', 'completed', 'archived'));

create table if not exists gamification_private.lifecycle_audit (
  id bigint generated always as identity primary key,
  entity_kind text not null check (entity_kind in ('quest', 'challenge')),
  entity_id uuid not null,
  previous_status text not null,
  next_status text not null,
  actor_id uuid references auth.users(id) on delete set null,
  transition_source text not null check (transition_source in ('admin', 'scheduler')),
  reason text,
  validation_result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint gamification_lifecycle_audit_status_check check (
    previous_status in ('draft', 'scheduled', 'active', 'completed', 'archived')
    and next_status in ('draft', 'scheduled', 'active', 'completed', 'archived')
  )
);

alter table gamification_private.lifecycle_audit enable row level security;
revoke all on gamification_private.lifecycle_audit from public, anon, authenticated;

create index if not exists gamification_lifecycle_audit_entity_idx
  on gamification_private.lifecycle_audit (entity_kind, entity_id, created_at desc);

create or replace function gamification_private.validate_lifecycle_entity(
  p_entity_kind text,
  p_entity_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_errors jsonb := '[]'::jsonb;
  v_warnings jsonb := '[]'::jsonb;
  v_quest public.quests%rowtype;
  v_challenge public.challenges%rowtype;
  v_step_count integer;
  v_invalid_steps integer;
begin
  if p_entity_kind = 'quest' then
    select * into v_quest from public.quests where id = p_entity_id;
    if not found then
      return jsonb_build_object('valid', false, 'errors', jsonb_build_array('quest_not_found'), 'warnings', v_warnings);
    end if;

    if nullif(btrim(v_quest.title), '') is null then
      v_errors := v_errors || jsonb_build_array('title_required');
    end if;
    if nullif(btrim(v_quest.description), '') is null then
      v_errors := v_errors || jsonb_build_array('description_required');
    end if;
    if v_quest.start_date is null or v_quest.end_date is null then
      v_errors := v_errors || jsonb_build_array('dates_required');
    elsif v_quest.end_date <= v_quest.start_date then
      v_errors := v_errors || jsonb_build_array('invalid_date_range');
    end if;
    if coalesce(v_quest.xp_reward, -1) < 0 or coalesce(v_quest.points, -1) < 0 then
      v_errors := v_errors || jsonb_build_array('invalid_reward');
    end if;

    select count(*) into v_step_count
    from public.quest_steps where quest_id = p_entity_id;
    if v_step_count = 0 then
      v_errors := v_errors || jsonb_build_array('steps_required');
    end if;

    select count(*) into v_invalid_steps
    from public.quest_steps qs
    where qs.quest_id = p_entity_id
      and (
        nullif(btrim(qs.title), '') is null
        or qs.action_type is null
        or qs.target_value <= 0
        or not exists (
          select 1
          from gamification_private.action_rules ar
          where ar.action_code = qs.action_type and ar.is_active = true
        )
      );
    if v_invalid_steps > 0 then
      v_errors := v_errors || jsonb_build_array('invalid_steps');
    end if;

    return jsonb_build_object(
      'valid', jsonb_array_length(v_errors) = 0,
      'errors', v_errors,
      'warnings', v_warnings,
      'step_count', v_step_count
    );
  elsif p_entity_kind = 'challenge' then
    select * into v_challenge from public.challenges where id = p_entity_id;
    if not found then
      return jsonb_build_object('valid', false, 'errors', jsonb_build_array('challenge_not_found'), 'warnings', v_warnings);
    end if;

    if nullif(btrim(v_challenge.name), '') is null then
      v_errors := v_errors || jsonb_build_array('name_required');
    end if;
    if v_challenge.start_date is null or v_challenge.end_date is null then
      v_errors := v_errors || jsonb_build_array('dates_required');
    elsif v_challenge.end_date < v_challenge.start_date then
      v_errors := v_errors || jsonb_build_array('invalid_date_range');
    end if;
    if v_challenge.target_value <= 0 or coalesce(v_challenge.xp_reward, -1) < 0 then
      v_errors := v_errors || jsonb_build_array('invalid_reward_or_target');
    end if;
    if not exists (
      select 1 from gamification_private.action_rules ar
      where ar.challenge_action = lower(v_challenge.action_type) and ar.is_active = true
    ) then
      v_errors := v_errors || jsonb_build_array('unsupported_action');
    end if;

    return jsonb_build_object(
      'valid', jsonb_array_length(v_errors) = 0,
      'errors', v_errors,
      'warnings', v_warnings
    );
  end if;

  return jsonb_build_object('valid', false, 'errors', jsonb_build_array('unsupported_entity_kind'), 'warnings', v_warnings);
end;
$$;

revoke all on function gamification_private.validate_lifecycle_entity(text, uuid)
  from public, anon, authenticated;

create or replace function gamification_private.assign_eligible_quest_users(p_quest_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inserted integer;
begin
  insert into public.user_quest_progress (
    user_id, quest_id, status, progress, current_step, created_at, updated_at
  )
  select
    up.user_id, q.id, 'not_started', 0, 0, now(), now()
  from public.quests q
  join public.user_profiles up
    on coalesce(up.is_active, true)
   and lower(coalesce(up.role, '')) in ('etudiantphysio', 'etudiant', 'student')
  left join public.gamification_data gd on gd.user_id = up.user_id
  left join public.houses h on h.id = gd.house_id
  where q.id = p_quest_id
    and coalesce(gd.current_level, 1) >= coalesce(q.min_level, 1)
    and (q.max_level is null or coalesce(gd.current_level, 1) <= q.max_level)
    and (
      coalesce(array_length(q.target_houses, 1), 0) = 0
      or exists (
        select 1 from unnest(q.target_houses) target_house(name)
        where lower(target_house.name) = lower(coalesce(h.name, ''))
      )
    )
  on conflict (user_id, quest_id) do nothing;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

revoke all on function gamification_private.assign_eligible_quest_users(uuid)
  from public, anon, authenticated;

create or replace function public.preview_gamification_lifecycle(
  p_entity_kind text,
  p_entity_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_validation jsonb;
  v_status text;
  v_start timestamptz;
  v_end timestamptz;
  v_effective_status text;
  v_audience integer := 0;
  v_assigned integer := 0;
  v_not_started integer := 0;
begin
  if v_actor is null or not (select public.app_is_privileged()) then
    raise exception 'Insufficient privileges';
  end if;

  v_validation := gamification_private.validate_lifecycle_entity(p_entity_kind, p_entity_id);

  if p_entity_kind = 'quest' then
    select status, start_date, end_date into v_status, v_start, v_end
    from public.quests where id = p_entity_id;
    if not found then raise exception 'Quest not found'; end if;

    select count(*) into v_audience
    from public.quests q
    join public.user_profiles up
      on coalesce(up.is_active, true)
     and lower(coalesce(up.role, '')) in ('etudiantphysio', 'etudiant', 'student')
    left join public.gamification_data gd on gd.user_id = up.user_id
    left join public.houses h on h.id = gd.house_id
    where q.id = p_entity_id
      and coalesce(gd.current_level, 1) >= coalesce(q.min_level, 1)
      and (q.max_level is null or coalesce(gd.current_level, 1) <= q.max_level)
      and (
        coalesce(array_length(q.target_houses, 1), 0) = 0
        or exists (
          select 1 from unnest(q.target_houses) target_house(name)
          where lower(target_house.name) = lower(coalesce(h.name, ''))
        )
      );

    select count(*), count(*) filter (where status = 'not_started')
    into v_assigned, v_not_started
    from public.user_quest_progress where quest_id = p_entity_id;
  elsif p_entity_kind = 'challenge' then
    select status, start_date::timestamptz, (end_date + 1)::timestamptz
    into v_status, v_start, v_end
    from public.challenges where id = p_entity_id;
    if not found then raise exception 'Challenge not found'; end if;

    select count(*) into v_audience from public.user_profiles up
    where coalesce(up.is_active, true)
      and lower(coalesce(up.role, '')) in ('etudiantphysio', 'etudiant', 'student');
  else
    raise exception 'Unsupported entity kind';
  end if;

  v_effective_status := case
    when v_status = 'archived' then 'archived'
    when v_status = 'completed' then 'completed'
    when v_end is not null and v_end <= now() then 'completed'
    when v_status = 'scheduled' and v_start is not null and v_start <= now() then 'active'
    else v_status
  end;

  return jsonb_build_object(
    'entity_kind', p_entity_kind,
    'entity_id', p_entity_id,
    'current_status', v_status,
    'effective_status', v_effective_status,
    'validation', v_validation,
    'audience_count', v_audience,
    'assigned_count', v_assigned,
    'not_started_count', v_not_started,
    'write_performed', false
  );
end;
$$;

revoke all on function public.preview_gamification_lifecycle(text, uuid)
  from public, anon;
grant execute on function public.preview_gamification_lifecycle(text, uuid)
  to authenticated;

create or replace function public.transition_gamification_lifecycle(
  p_entity_kind text,
  p_entity_id uuid,
  p_next_status text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_previous text;
  v_next text := lower(btrim(coalesce(p_next_status, '')));
  v_validation jsonb;
  v_start timestamptz;
  v_end timestamptz;
  v_assigned integer := 0;
begin
  if v_actor is null or not (select public.app_is_privileged()) then
    raise exception 'Insufficient privileges';
  end if;
  if v_next not in ('draft', 'scheduled', 'active', 'completed', 'archived') then
    raise exception 'Unsupported lifecycle status';
  end if;

  if p_entity_kind = 'quest' then
    select status, start_date, end_date into v_previous, v_start, v_end
    from public.quests where id = p_entity_id for update;
  elsif p_entity_kind = 'challenge' then
    select status, start_date::timestamptz, (end_date + 1)::timestamptz
    into v_previous, v_start, v_end
    from public.challenges where id = p_entity_id for update;
  else
    raise exception 'Unsupported entity kind';
  end if;
  if not found then raise exception 'Lifecycle entity not found'; end if;

  if v_previous = v_next then
    return jsonb_build_object('changed', false, 'duplicate', true, 'status', v_previous, 'assigned_count', 0);
  end if;

  if not (
    (v_previous = 'draft' and v_next in ('scheduled', 'active', 'archived'))
    or (v_previous = 'scheduled' and v_next in ('draft', 'active', 'completed', 'archived'))
    or (v_previous = 'active' and v_next in ('completed', 'archived'))
    or (v_previous = 'completed' and v_next = 'archived')
  ) then
    raise exception 'Invalid lifecycle transition: % -> %', v_previous, v_next;
  end if;

  v_validation := gamification_private.validate_lifecycle_entity(p_entity_kind, p_entity_id);
  if v_next in ('scheduled', 'active') and not coalesce((v_validation ->> 'valid')::boolean, false) then
    raise exception 'Lifecycle validation failed: %', v_validation -> 'errors';
  end if;
  if v_next = 'scheduled' and (v_start is null or v_start <= now()) then
    raise exception 'A scheduled item requires a future start date';
  end if;
  if v_next = 'active' and (v_start is null or v_start > now() or v_end is null or v_end <= now()) then
    raise exception 'An active item must be inside its publication window';
  end if;

  if p_entity_kind = 'quest' then
    update public.quests
    set status = v_next,
        published_at = case when v_next = 'active' then coalesce(published_at, now()) else published_at end,
        completed_at = case when v_next = 'completed' then coalesce(completed_at, now()) else completed_at end,
        archived_at = case when v_next = 'archived' then coalesce(archived_at, now()) else archived_at end,
        updated_at = now()
    where id = p_entity_id;
    if v_next = 'active' then
      v_assigned := gamification_private.assign_eligible_quest_users(p_entity_id);
    end if;
  else
    update public.challenges
    set status = v_next,
        is_active = v_next = 'active',
        published_at = case when v_next = 'active' then coalesce(published_at, now()) else published_at end,
        completed_at = case when v_next = 'completed' then coalesce(completed_at, now()) else completed_at end,
        archived_at = case when v_next = 'archived' then coalesce(archived_at, now()) else archived_at end
    where id = p_entity_id;
  end if;

  insert into gamification_private.lifecycle_audit (
    entity_kind, entity_id, previous_status, next_status, actor_id,
    transition_source, reason, validation_result
  ) values (
    p_entity_kind, p_entity_id, v_previous, v_next, v_actor,
    'admin', left(nullif(btrim(p_reason), ''), 500), v_validation
  );

  return jsonb_build_object(
    'changed', true,
    'duplicate', false,
    'previous_status', v_previous,
    'status', v_next,
    'assigned_count', v_assigned,
    'validation', v_validation
  );
end;
$$;

revoke all on function public.transition_gamification_lifecycle(text, uuid, text, text)
  from public, anon;
grant execute on function public.transition_gamification_lifecycle(text, uuid, text, text)
  to authenticated;

create or replace function gamification_private.refresh_lifecycle()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row record;
  v_validation jsonb;
  v_activated integer := 0;
  v_completed integer := 0;
begin
  for v_row in
    select 'quest'::text as kind, id, status
    from public.quests
    where status in ('scheduled', 'active') and end_date <= now()
    for update
  loop
    update public.quests set status = 'completed', completed_at = coalesce(completed_at, now()), updated_at = now()
    where id = v_row.id;
    insert into gamification_private.lifecycle_audit (
      entity_kind, entity_id, previous_status, next_status, transition_source, reason, validation_result
    ) values (v_row.kind, v_row.id, v_row.status, 'completed', 'scheduler', 'end_date_reached', '{}'::jsonb);
    v_completed := v_completed + 1;
  end loop;

  for v_row in
    select 'challenge'::text as kind, id, status
    from public.challenges
    where status in ('scheduled', 'active') and end_date < (now() at time zone 'Europe/Zurich')::date
    for update
  loop
    update public.challenges set status = 'completed', is_active = false, completed_at = coalesce(completed_at, now())
    where id = v_row.id;
    insert into gamification_private.lifecycle_audit (
      entity_kind, entity_id, previous_status, next_status, transition_source, reason, validation_result
    ) values (v_row.kind, v_row.id, v_row.status, 'completed', 'scheduler', 'end_date_reached', '{}'::jsonb);
    v_completed := v_completed + 1;
  end loop;

  for v_row in
    select 'quest'::text as kind, id, status
    from public.quests
    where status = 'scheduled' and start_date <= now() and end_date > now()
    for update
  loop
    v_validation := gamification_private.validate_lifecycle_entity(v_row.kind, v_row.id);
    if coalesce((v_validation ->> 'valid')::boolean, false) then
      update public.quests set status = 'active', published_at = coalesce(published_at, now()), updated_at = now()
      where id = v_row.id;
      perform gamification_private.assign_eligible_quest_users(v_row.id);
      insert into gamification_private.lifecycle_audit (
        entity_kind, entity_id, previous_status, next_status, transition_source, reason, validation_result
      ) values (v_row.kind, v_row.id, v_row.status, 'active', 'scheduler', 'start_date_reached', v_validation);
      v_activated := v_activated + 1;
    end if;
  end loop;

  for v_row in
    select 'challenge'::text as kind, id, status
    from public.challenges
    where status = 'scheduled'
      and start_date <= (now() at time zone 'Europe/Zurich')::date
      and end_date >= (now() at time zone 'Europe/Zurich')::date
    for update
  loop
    v_validation := gamification_private.validate_lifecycle_entity(v_row.kind, v_row.id);
    if coalesce((v_validation ->> 'valid')::boolean, false) then
      update public.challenges set status = 'active', is_active = true, published_at = coalesce(published_at, now())
      where id = v_row.id;
      insert into gamification_private.lifecycle_audit (
        entity_kind, entity_id, previous_status, next_status, transition_source, reason, validation_result
      ) values (v_row.kind, v_row.id, v_row.status, 'active', 'scheduler', 'start_date_reached', v_validation);
      v_activated := v_activated + 1;
    end if;
  end loop;

  return jsonb_build_object('activated', v_activated, 'completed', v_completed);
end;
$$;

revoke all on function gamification_private.refresh_lifecycle()
  from public, anon, authenticated;

notify pgrst, 'reload schema';
