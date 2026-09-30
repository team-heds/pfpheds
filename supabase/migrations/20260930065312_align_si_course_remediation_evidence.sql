-- Align course remediation evidence with the audit engine: a candidate is safe
-- only when an existing donor slot uses the same module and exact normalized
-- planning title. The catalog name may legitimately differ from that title.
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
          and exists (
            select 1
            from public.planning_time_slots donor
            where donor.course_id = v_course_id
              and lower(trim(coalesce(donor.module_code, '')))
                = lower(trim(coalesce(v_slot.module_code, '')))
              and lower(regexp_replace(trim(coalesce(donor.course_title, '')), '\s+', ' ', 'g'))
                = lower(regexp_replace(trim(coalesce(v_slot.course_title, '')), '\s+', ' ', 'g'))
          )
      ) then
        raise exception using errcode = '22023', message = 'Course does not match a verified planning donor';
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
      v_before := jsonb_build_object('startTime', v_slot.start_time, 'endTime', v_slot.end_time);
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
    slot_id, category, actor_user_id, reason, before_value, after_value
  ) values (
    p_slot_id, p_category, p_actor_user_id, trim(p_reason), v_before, v_after
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

revoke all on function public.apply_si_planning_remediation(uuid, bigint, text, jsonb, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.apply_si_planning_remediation(uuid, bigint, text, jsonb, jsonb, text)
  to service_role;
