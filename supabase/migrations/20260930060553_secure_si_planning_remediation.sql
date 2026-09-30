-- Auditable, one-at-a-time remediation workflow for SI planning data.
-- Browser clients never receive direct write access: the backend calls the
-- service-role-only functions after authenticating and authorizing the actor.

create table public.si_planning_remediation_history (
  id uuid primary key default gen_random_uuid(),
  slot_id bigint not null,
  category text not null check (category in ('course', 'teacher', 'room', 'time')),
  actor_user_id uuid not null references auth.users(id),
  reason text not null check (char_length(trim(reason)) between 8 and 500),
  before_value jsonb not null,
  after_value jsonb not null,
  status text not null default 'applied' check (status in ('applied', 'reverted')),
  created_at timestamptz not null default now(),
  reverted_at timestamptz,
  reverted_by uuid references auth.users(id),
  constraint si_planning_remediation_distinct_values check (before_value <> after_value)
);

create index si_planning_remediation_slot_created_idx
  on public.si_planning_remediation_history (slot_id, created_at desc);
create index si_planning_remediation_actor_created_idx
  on public.si_planning_remediation_history (actor_user_id, created_at desc);

alter table public.si_planning_remediation_history enable row level security;
revoke all on table public.si_planning_remediation_history from public, anon, authenticated;
grant all on table public.si_planning_remediation_history to service_role;

create or replace function public.app_actor_can_remediate_si_planning(p_actor_user_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.user_profiles profile
    where profile.user_id = p_actor_user_id
      and coalesce(profile.is_active, true)
      and (
        lower(coalesce(profile.role, '')) in ('admin', 'super.all', 'adminsoins')
        or coalesce(profile.permissions, '[]'::jsonb) ?| array[
          'admin', 'super.all', 'AdminSoins', 'page2.access'
        ]
      )
  );
$$;

create or replace function public.apply_si_planning_remediation(
  p_actor_user_id uuid,
  p_slot_id bigint,
  p_category text,
  p_expected_value jsonb,
  p_replacement_value jsonb,
  p_reason text
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_slot public.planning_time_slots%rowtype;
  v_before jsonb;
  v_after jsonb;
  v_history_id uuid;
  v_course_id uuid;
  v_teachers text[];
  v_room text;
  v_start_time text;
  v_end_time text;
  v_start_minutes integer;
  v_end_minutes integer;
begin
  if p_actor_user_id is null or not public.app_actor_can_remediate_si_planning(p_actor_user_id) then
    raise exception using errcode = '42501', message = 'Insufficient privileges';
  end if;
  if p_slot_id is null or p_category not in ('course', 'teacher', 'room', 'time') then
    raise exception using errcode = '22023', message = 'Invalid remediation request';
  end if;
  if char_length(trim(coalesce(p_reason, ''))) not between 8 and 500 then
    raise exception using errcode = '22023', message = 'A reason between 8 and 500 characters is required';
  end if;

  select * into v_slot
  from public.planning_time_slots
  where id = p_slot_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Planning slot not found';
  end if;

  case p_category
    when 'course' then
      v_before := jsonb_build_object('id', v_slot.course_id);
      if v_before is distinct from p_expected_value then
        raise exception using errcode = '40001', message = 'Planning slot changed since preview';
      end if;
      begin
        v_course_id := nullif(trim(p_replacement_value ->> 'id'), '')::uuid;
      exception when invalid_text_representation then
        raise exception using errcode = '22023', message = 'Invalid course identifier';
      end;
      if v_course_id is null or not exists (
        select 1
        from public.courses course
        where course.id = v_course_id
          and lower(regexp_replace(trim(coalesce(course.name, '')), '\s+', ' ', 'g'))
            = lower(regexp_replace(trim(coalesce(v_slot.course_title, '')), '\s+', ' ', 'g'))
          and exists (
            select 1
            from public.planning_time_slots donor
            where donor.course_id = v_course_id
              and lower(trim(coalesce(donor.module_code, '')))
                = lower(trim(coalesce(v_slot.module_code, '')))
          )
      ) then
        raise exception using errcode = '22023', message = 'Course does not match the planning slot title and module';
      end if;
      update public.planning_time_slots
      set course_id = v_course_id, updated_at = now()
      where id = p_slot_id;
      v_after := jsonb_build_object('id', v_course_id);

    when 'teacher' then
      v_before := jsonb_build_object('value', coalesce(v_slot.teachers, '{}'::text[]));
      if v_before is distinct from p_expected_value then
        raise exception using errcode = '40001', message = 'Planning slot changed since preview';
      end if;
      select coalesce(array_agg(trim(value) order by ordinal), '{}'::text[])
      into v_teachers
      from jsonb_array_elements_text(coalesce(p_replacement_value -> 'value', '[]'::jsonb))
        with ordinality source(value, ordinal)
      where nullif(trim(value), '') is not null;
      if cardinality(v_teachers) = 0 or cardinality(v_teachers) > 20 then
        raise exception using errcode = '22023', message = 'Between 1 and 20 teachers are required';
      end if;
      update public.planning_time_slots
      set teachers = v_teachers, updated_at = now()
      where id = p_slot_id;
      v_after := jsonb_build_object('value', v_teachers);

    when 'room' then
      v_before := jsonb_build_object('value', v_slot.room);
      if v_before is distinct from p_expected_value then
        raise exception using errcode = '40001', message = 'Planning slot changed since preview';
      end if;
      v_room := trim(coalesce(p_replacement_value ->> 'value', ''));
      if char_length(v_room) not between 1 and 100 then
        raise exception using errcode = '22023', message = 'A room between 1 and 100 characters is required';
      end if;
      update public.planning_time_slots
      set room = v_room, updated_at = now()
      where id = p_slot_id;
      v_after := jsonb_build_object('value', v_room);

    when 'time' then
      v_before := jsonb_build_object(
        'startTime', v_slot.start_time,
        'endTime', v_slot.end_time
      );
      if v_before is distinct from p_expected_value then
        raise exception using errcode = '40001', message = 'Planning slot changed since preview';
      end if;
      v_start_time := trim(coalesce(p_replacement_value ->> 'startTime', ''));
      v_end_time := trim(coalesce(p_replacement_value ->> 'endTime', ''));
      if v_start_time !~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
         or v_end_time !~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$' then
        raise exception using errcode = '22023', message = 'Times must use HH:MM';
      end if;
      v_start_minutes := split_part(v_start_time, ':', 1)::integer * 60 + split_part(v_start_time, ':', 2)::integer;
      v_end_minutes := split_part(v_end_time, ':', 1)::integer * 60 + split_part(v_end_time, ':', 2)::integer;
      if v_end_minutes <= v_start_minutes then
        raise exception using errcode = '22023', message = 'End time must be after start time';
      end if;
      update public.planning_time_slots
      set start_time = v_start_time, end_time = v_end_time, updated_at = now()
      where id = p_slot_id;
      v_after := jsonb_build_object('startTime', v_start_time, 'endTime', v_end_time);
  end case;

  if v_before = v_after then
    raise exception using errcode = '22023', message = 'The replacement is identical to the current value';
  end if;

  insert into public.si_planning_remediation_history (
    slot_id,
    category,
    actor_user_id,
    reason,
    before_value,
    after_value
  ) values (
    p_slot_id,
    p_category,
    p_actor_user_id,
    trim(p_reason),
    v_before,
    v_after
  ) returning id into v_history_id;

  return jsonb_build_object(
    'historyId', v_history_id,
    'slotId', p_slot_id,
    'category', p_category,
    'beforeValue', v_before,
    'afterValue', v_after,
    'status', 'applied'
  );
end;
$$;

create or replace function public.revert_si_planning_remediation(
  p_actor_user_id uuid,
  p_history_id uuid
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_history public.si_planning_remediation_history%rowtype;
  v_slot public.planning_time_slots%rowtype;
  v_current jsonb;
begin
  if p_actor_user_id is null or not public.app_actor_can_remediate_si_planning(p_actor_user_id) then
    raise exception using errcode = '42501', message = 'Insufficient privileges';
  end if;

  select * into v_history
  from public.si_planning_remediation_history
  where id = p_history_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Remediation history not found';
  end if;
  if v_history.status <> 'applied' then
    raise exception using errcode = '22023', message = 'Remediation is already reverted';
  end if;

  select * into v_slot
  from public.planning_time_slots
  where id = v_history.slot_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Planning slot not found';
  end if;

  case v_history.category
    when 'course' then v_current := jsonb_build_object('id', v_slot.course_id);
    when 'teacher' then v_current := jsonb_build_object('value', coalesce(v_slot.teachers, '{}'::text[]));
    when 'room' then v_current := jsonb_build_object('value', v_slot.room);
    when 'time' then v_current := jsonb_build_object(
      'startTime', v_slot.start_time,
      'endTime', v_slot.end_time
    );
  end case;

  if v_current is distinct from v_history.after_value then
    raise exception using errcode = '40001', message = 'Planning slot changed after remediation';
  end if;

  case v_history.category
    when 'course' then
      update public.planning_time_slots
      set course_id = nullif(v_history.before_value ->> 'id', '')::uuid, updated_at = now()
      where id = v_history.slot_id;
    when 'teacher' then
      update public.planning_time_slots
      set teachers = array(
        select value
        from jsonb_array_elements_text(v_history.before_value -> 'value') source(value)
      ), updated_at = now()
      where id = v_history.slot_id;
    when 'room' then
      update public.planning_time_slots
      set room = v_history.before_value ->> 'value', updated_at = now()
      where id = v_history.slot_id;
    when 'time' then
      update public.planning_time_slots
      set start_time = v_history.before_value ->> 'startTime',
          end_time = v_history.before_value ->> 'endTime',
          updated_at = now()
      where id = v_history.slot_id;
  end case;

  update public.si_planning_remediation_history
  set status = 'reverted', reverted_at = now(), reverted_by = p_actor_user_id
  where id = v_history.id;

  return jsonb_build_object(
    'historyId', v_history.id,
    'slotId', v_history.slot_id,
    'category', v_history.category,
    'restoredValue', v_history.before_value,
    'status', 'reverted'
  );
end;
$$;

revoke all on function public.app_actor_can_remediate_si_planning(uuid) from public, anon, authenticated;
revoke all on function public.apply_si_planning_remediation(uuid, bigint, text, jsonb, jsonb, text) from public, anon, authenticated;
revoke all on function public.revert_si_planning_remediation(uuid, uuid) from public, anon, authenticated;
grant execute on function public.app_actor_can_remediate_si_planning(uuid) to service_role;
grant execute on function public.apply_si_planning_remediation(uuid, bigint, text, jsonb, jsonb, text) to service_role;
grant execute on function public.revert_si_planning_remediation(uuid, uuid) to service_role;

comment on table public.si_planning_remediation_history is
  'Append-only audit trail for manually confirmed SI planning corrections.';
