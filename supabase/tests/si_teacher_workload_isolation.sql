\set ON_ERROR_STOP on

begin;

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
)
values
  ('64100000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'teacher.one.641@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('64100000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'teacher.two.641@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('64100000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'student.641@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated');

insert into public.user_profiles (user_id, email, display_name, role, is_active, permissions)
values
  ('64100000-0000-4000-8000-000000000001', 'teacher.one.641@example.invalid', 'Teacher One 641', 'EnseignantSoins', true, '[]'),
  ('64100000-0000-4000-8000-000000000002', 'teacher.two.641@example.invalid', 'Teacher Two 641', 'user', true, '["EnseignantSoins"]'),
  ('64100000-0000-4000-8000-000000000003', 'student.641@example.invalid', 'Student 641', 'EtudiantSoins', true, '[]')
on conflict (user_id) do update
set email = excluded.email,
    display_name = excluded.display_name,
    role = excluded.role,
    is_active = excluded.is_active,
    permissions = excluded.permissions;

insert into public.planning_time_slots (
  id, class_code, week_number, day, day_index, module_code,
  course_title, teachers, room, start_time, end_time, activity_type
)
values
  (9641001, 'BAC99', 40, 'lundi', 0, 'SI-641', 'Private Teacher One', array['64100000-0000-4000-8000-000000000001'], 'A1', '08:00', '09:30', 'Cours'),
  (9641002, 'BAC99', 10, 'mardi', 1, 'SI-641', 'Private Teacher Two', array['{"user_id":"64100000-0000-4000-8000-000000000002","display_name":"Teacher Two 641"}'], 'A2', '10:00', '10:45', 'Atelier');

select set_config('request.jwt.claim.sub', '64100000-0000-4000-8000-000000000001', true);
set local role authenticated;

do $teacher_one$
declare
  v_rows integer;
begin
  if not public.app_is_si_teacher() then raise exception 'active SI teacher was not recognized'; end if;

  select count(*) into v_rows from public.get_my_si_workload_slots();
  if v_rows <> 1 then raise exception 'teacher one expected one personal slot, got %', v_rows; end if;

  if exists (select 1 from public.get_my_si_workload_slots() where id = 9641002) then
    raise exception 'teacher one received teacher two slot';
  end if;

  select count(*) into v_rows from public.planning_time_slots where id in (9641001, 9641002);
  if v_rows <> 0 then raise exception 'teachers must not query planning slots table directly'; end if;

  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'get_my_si_workload_slots'
      and p.pronargs = 0
  ) then
    raise exception 'personal workload RPC must not accept a target teacher ID';
  end if;
end
$teacher_one$;

reset role;
select set_config('request.jwt.claim.sub', '64100000-0000-4000-8000-000000000003', true);
set local role authenticated;
do $student_denied$
declare
  v_rejected boolean := false;
begin
  begin
    perform * from public.get_my_si_workload_slots();
  exception when insufficient_privilege then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'non-teacher was able to call personal workload RPC'; end if;
end
$student_denied$;

rollback;
