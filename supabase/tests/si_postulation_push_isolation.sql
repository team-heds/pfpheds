\set ON_ERROR_STOP on

begin;

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
)
values
  ('62900000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'postulant.629@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('62900000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'module.rm.629@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('62900000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'no.profile.rm.629@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated');

insert into public.user_profiles (user_id, email, role, is_active, permissions, display_name)
values
  ('62900000-0000-4000-8000-000000000001', 'postulant.629@example.invalid', 'EnseignantSoins', true, '[]', 'Postulant Test'),
  ('62900000-0000-4000-8000-000000000002', 'module.rm.629@example.invalid', 'RMSoins', true, '[]', 'RM Test')
on conflict (user_id) do update
set email = excluded.email,
    role = excluded.role,
    is_active = excluded.is_active,
    permissions = excluded.permissions,
    display_name = excluded.display_name;

insert into public.profiles (id, name, role)
values ('62900000-0000-4000-8000-000000000001', 'Postulant Test', 'enseignant')
on conflict (id) do update set name = excluded.name, role = excluded.role;

insert into public.modules (id, code, title, responsable_email)
values
  (962901, 'HEDS25-629-A', 'Module test push', ' MODULE.RM.629@EXAMPLE.INVALID '),
  (962902, 'HEDS25-629-B', 'Module sans responsable', null),
  (962903, 'HEDS25-629-C', 'Module sans profil', 'no.profile.rm.629@example.invalid');

insert into public.planning_time_slots (
  id, class_code, week_number, day, day_index, start_time, end_time, module_code, course_title, teachers
)
values
  (9629001, 'BAC99', 40, 'lundi', 0, '08:00', '09:30', 'HEDS25-629-A', 'Cours test A', array['postulation']),
  (9629002, 'BAC99', 40, 'mardi', 1, '10:00', '11:30', 'HEDS25-629-B', 'Cours test B', array['postulation']),
  (9629003, 'BAC99', 40, 'mercredi', 2, '13:00', '14:30', 'HEDS25-629-C', 'Cours test C', array['postulation']);

insert into public.planning_slot_votes (slot_id, teacher_id)
values
  (9629001, '62900000-0000-4000-8000-000000000001'),
  (9629002, '62900000-0000-4000-8000-000000000001'),
  (9629003, '62900000-0000-4000-8000-000000000001');

do $assertions$
begin
  if (select count(*) from public.push_outbox where title = 'Nouvelle postulation') <> 1 then
    raise exception 'expected exactly one push for the module with a responsible profile';
  end if;

  if not exists (
    select 1 from public.push_outbox
    where user_id = '62900000-0000-4000-8000-000000000002'
      and title = 'Nouvelle postulation'
      and body like '%Module test push%'
      and body like '%Cours test A%'
      and body like '%BAC99%'
      and body like '%S40%'
      and url = '/admin/soins-infirmiers/cours-postulation'
  ) then
    raise exception 'notification content or recipient is incorrect';
  end if;

  if exists (
    select 1 from public.push_outbox
    where user_id = '62900000-0000-4000-8000-000000000003'
  ) then
    raise exception 'notification was sent without a matching user profile';
  end if;
end
$assertions$;

-- A vote removal does not invoke the AFTER INSERT notification trigger.
delete from public.planning_slot_votes
where slot_id = 9629001 and teacher_id = '62900000-0000-4000-8000-000000000001';

do $delete_assertion$
begin
  if (select count(*) from public.push_outbox where title = 'Nouvelle postulation') <> 1 then
    raise exception 'removing a vote created an extra push notification';
  end if;
end
$delete_assertion$;

rollback;

select 'si_postulation_push_isolation_ok' as result;
