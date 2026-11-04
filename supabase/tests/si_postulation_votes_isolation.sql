\set ON_ERROR_STOP on

begin;

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
)
values
  ('62800000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'teacher.one.628@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('62800000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'teacher.two.628@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('62800000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'rm.owner.628@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('62800000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'rm.other.628@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('62800000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'admin.628@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('62800000-0000-4000-8000-000000000006', '00000000-0000-0000-0000-000000000000', 'outsider.628@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated');

insert into public.user_profiles (user_id, email, role, is_active, permissions)
values
  ('62800000-0000-4000-8000-000000000001', 'teacher.one.628@example.invalid', 'EnseignantSoins', true, '[]'),
  ('62800000-0000-4000-8000-000000000002', 'teacher.two.628@example.invalid', 'user', true, '["EnseignantSoins"]'),
  ('62800000-0000-4000-8000-000000000003', 'rm.owner.628@example.invalid', 'RMSoins', true, '[]'),
  ('62800000-0000-4000-8000-000000000004', 'rm.other.628@example.invalid', 'user', true, '["RMSoins"]'),
  ('62800000-0000-4000-8000-000000000005', 'admin.628@example.invalid', 'admin', true, '[]'),
  ('62800000-0000-4000-8000-000000000006', 'outsider.628@example.invalid', 'EtudiantSoins', true, '[]')
on conflict (user_id) do update
set email = excluded.email,
    role = excluded.role,
    is_active = excluded.is_active,
    permissions = excluded.permissions;

insert into public.profiles (id, name, role)
values
  ('62800000-0000-4000-8000-000000000001', 'Teacher One', 'enseignant'),
  ('62800000-0000-4000-8000-000000000002', 'Teacher Two', 'enseignant')
on conflict (id) do update
set name = excluded.name,
    role = excluded.role;

insert into public.modules (id, code, title, responsable_email)
values
  (962801, 'HEDS25-628-A', 'Module owned by first RM', 'rm.owner.628@example.invalid'),
  (962802, 'HEDS25-628-B', 'Module owned by second RM', 'rm.other.628@example.invalid');

insert into public.planning_time_slots (
  id, class_code, week_number, day, day_index, module_code, teachers
)
values
  (9628001, 'BAC99', 40, 'lundi', 0, 'HEDS25-628-A', array['postulation']),
  (9628002, 'BAC99', 40, 'mardi', 1, 'HEDS25-628-B', array['postulation']),
  (9628003, 'BAC99', 40, 'mercredi', 2, 'HEDS25-628-A', array['postulation']);

insert into public.planning_slot_votes (slot_id, teacher_id)
values
  (9628001, '62800000-0000-4000-8000-000000000001'),
  (9628001, '62800000-0000-4000-8000-000000000002'),
  (9628002, '62800000-0000-4000-8000-000000000002');

do $grants$
begin
  if has_table_privilege('anon', 'public.planning_slot_votes', 'SELECT')
     or has_table_privilege('anon', 'public.planning_slot_votes', 'INSERT')
     or has_table_privilege('anon', 'public.planning_slot_votes', 'UPDATE')
     or has_table_privilege('anon', 'public.planning_slot_votes', 'DELETE') then
    raise exception 'anon must not hold any planning_slot_votes privilege';
  end if;
end
$grants$;

select set_config('request.jwt.claim.sub', '62800000-0000-4000-8000-000000000001', true);
set local role authenticated;

do $teacher_owner$
declare
  v_count integer;
  v_rows integer;
  v_rejected boolean := false;
begin
  select count(*) into v_count from public.planning_slot_votes;
  if v_count <> 1 then
    raise exception 'teacher must see exactly their own vote, got %', v_count;
  end if;

  insert into public.planning_slot_votes (slot_id, teacher_id)
  values (9628002, '62800000-0000-4000-8000-000000000001');

  update public.planning_slot_votes set created_at = created_at
  where slot_id = 9628002 and teacher_id = '62800000-0000-4000-8000-000000000001';
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception 'teacher could not update own vote'; end if;

  update public.planning_slot_votes set created_at = created_at
  where slot_id = 9628001 and teacher_id = '62800000-0000-4000-8000-000000000002';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'teacher updated another teacher vote'; end if;

  delete from public.planning_slot_votes
  where teacher_id = '62800000-0000-4000-8000-000000000002';
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'teacher deleted another teacher vote'; end if;

  begin
    insert into public.planning_slot_votes (slot_id, teacher_id)
    values (9628003, '62800000-0000-4000-8000-000000000002');
  exception when insufficient_privilege then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'teacher inserted a vote for another teacher'; end if;
end
$teacher_owner$;

reset role;
update public.user_profiles
set is_active = false
where user_id = '62800000-0000-4000-8000-000000000001';
select set_config('request.jwt.claim.sub', '62800000-0000-4000-8000-000000000001', true);
set local role authenticated;

do $inactive_teacher$
declare
  v_count integer;
  v_rejected boolean := false;
begin
  select count(*) into v_count from public.planning_slot_votes;
  if v_count <> 0 then raise exception 'inactive teacher read postulation votes'; end if;

  begin
    insert into public.planning_slot_votes (slot_id, teacher_id)
    values (9628003, '62800000-0000-4000-8000-000000000001');
  exception when insufficient_privilege then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'inactive teacher created a postulation vote'; end if;
end
$inactive_teacher$;

reset role;
update public.user_profiles
set is_active = true
where user_id = '62800000-0000-4000-8000-000000000001';
select set_config('request.jwt.claim.sub', '62800000-0000-4000-8000-000000000006', true);
set local role authenticated;

do $outsider$
declare
  v_count integer;
  v_rows integer;
  v_rejected boolean := false;
begin
  select count(*) into v_count from public.planning_slot_votes;
  if v_count <> 0 then raise exception 'non-SI user read postulation votes'; end if;

  begin
    insert into public.planning_slot_votes (slot_id, teacher_id)
    values (9628003, '62800000-0000-4000-8000-000000000001');
  exception when insufficient_privilege then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'non-SI user created a postulation vote'; end if;

  update public.planning_slot_votes set created_at = created_at;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'non-SI user updated postulation votes'; end if;

  delete from public.planning_slot_votes;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'non-SI user deleted postulation votes'; end if;
end
$outsider$;

reset role;
select set_config('request.jwt.claim.sub', '62800000-0000-4000-8000-000000000003', true);
set local role authenticated;

do $rm_owner$
declare
  v_count integer;
  v_rows integer;
  v_rejected boolean := false;
begin
  select count(*) into v_count from public.planning_slot_votes;
  if v_count <> 2 then raise exception 'RM must see the two votes from their module, got %', v_count; end if;

  delete from public.planning_slot_votes where slot_id = 9628002;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'RM deleted votes from another module'; end if;

  update public.planning_slot_votes set created_at = created_at
  where slot_id = 9628001;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'RM updated teacher votes'; end if;

  begin
    insert into public.planning_slot_votes (slot_id, teacher_id)
    values (9628003, '62800000-0000-4000-8000-000000000001');
  exception when insufficient_privilege then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'RM created a teacher vote'; end if;

  delete from public.planning_slot_votes
  where slot_id = 9628001 and teacher_id = '62800000-0000-4000-8000-000000000002';
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception 'RM could not clean a vote from their module'; end if;
end
$rm_owner$;

reset role;
select set_config('request.jwt.claim.sub', '62800000-0000-4000-8000-000000000004', true);
set local role authenticated;

do $rm_other$
declare
  v_count integer;
begin
  select count(*) into v_count from public.planning_slot_votes;
  if v_count <> 2 then raise exception 'second RM must see only the two votes from their module, got %', v_count; end if;
end
$rm_other$;

reset role;
select set_config('request.jwt.claim.sub', '62800000-0000-4000-8000-000000000005', true);
set local role authenticated;

do $admin$
declare
  v_count integer;
  v_rows integer;
begin
  select count(*) into v_count from public.planning_slot_votes;
  if v_count <> 3 then raise exception 'admin must see all remaining votes, got %', v_count; end if;

  update public.planning_slot_votes set created_at = created_at;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'admin updated teacher votes'; end if;

  delete from public.planning_slot_votes
  where slot_id = 9628002 and teacher_id = '62800000-0000-4000-8000-000000000002';
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception 'admin could not delete a teacher vote'; end if;
end
$admin$;

reset role;
rollback;

select 'si_postulation_votes_isolation_ok' as result;
