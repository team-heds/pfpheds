\set ON_ERROR_STOP on

begin;

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
)
values
  ('63900000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'admin.639@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('63900000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'outsider.639@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated');

insert into public.user_profiles (user_id, email, role, is_active, permissions)
values
  ('63900000-0000-4000-8000-000000000001', 'admin.639@example.invalid', 'AdminSoins', true, '[]'),
  ('63900000-0000-4000-8000-000000000002', 'outsider.639@example.invalid', 'EtudiantSoins', true, '[]')
on conflict (user_id) do update
set role = excluded.role, is_active = excluded.is_active, permissions = excluded.permissions;

insert into public.planning_time_slots (
  id, class_code, week_number, day, day_index, module_code,
  course_title, teachers, room, start_time, end_time
)
values (
  9639001, 'BAC99', 40, 'lundi', 0, 'HEDS25-639',
  'Créneau de test', array['Enseignant Test'], null, '08:00', '09:00'
);

do $grants$
begin
  if has_table_privilege('authenticated', 'public.si_planning_remediation_history', 'SELECT')
     or has_function_privilege('authenticated', 'public.apply_si_planning_remediation(uuid,bigint,text,jsonb,jsonb,text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'public.revert_si_planning_remediation(uuid,uuid)', 'EXECUTE') then
    raise exception 'authenticated must not access remediation storage or RPCs directly';
  end if;
end
$grants$;

set local role service_role;

do $apply_and_revert$
declare
  v_result jsonb;
  v_history_id uuid;
  v_room text;
  v_status text;
  v_rejected boolean := false;
begin
  v_result := public.apply_si_planning_remediation(
    '63900000-0000-4000-8000-000000000001',
    9639001,
    'room',
    '{"value":null}'::jsonb,
    '{"value":"A101"}'::jsonb,
    'Salle confirmée dans le planning de référence.'
  );
  v_history_id := (v_result ->> 'historyId')::uuid;

  select room into v_room from public.planning_time_slots where id = 9639001;
  if v_room <> 'A101' then raise exception 'room remediation was not applied'; end if;

  begin
    perform public.apply_si_planning_remediation(
      '63900000-0000-4000-8000-000000000001', 9639001, 'room',
      '{"value":null}'::jsonb, '{"value":"A102"}'::jsonb,
      'Tentative avec une valeur devenue obsolète.'
    );
  exception when serialization_failure then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'stale optimistic value was accepted'; end if;

  perform public.revert_si_planning_remediation(
    '63900000-0000-4000-8000-000000000001', v_history_id
  );
  select room into v_room from public.planning_time_slots where id = 9639001;
  if v_room is not null then raise exception 'room remediation was not reverted'; end if;
  select status into v_status from public.si_planning_remediation_history where id = v_history_id;
  if v_status <> 'reverted' then raise exception 'history was not marked reverted'; end if;

  v_rejected := false;
  begin
    perform public.apply_si_planning_remediation(
      '63900000-0000-4000-8000-000000000002', 9639001, 'room',
      '{"value":null}'::jsonb, '{"value":"A103"}'::jsonb,
      'Tentative par un compte étudiant non autorisé.'
    );
  exception when insufficient_privilege then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'unauthorized actor applied a remediation'; end if;
end
$apply_and_revert$;

rollback;
