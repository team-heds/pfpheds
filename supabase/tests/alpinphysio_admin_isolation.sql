\set ON_ERROR_STOP on

begin;

select set_config(
  'heds_test.alpin_manager_uid',
  (select id::text from auth.users order by created_at limit 1),
  true
);
select set_config(
  'heds_test.alpin_student_uid',
  (select id::text from auth.users where id <> current_setting('heds_test.alpin_manager_uid')::uuid order by created_at limit 1),
  true
);

do $setup$
declare
  manager_uid uuid := current_setting('heds_test.alpin_manager_uid')::uuid;
  student_uid uuid := current_setting('heds_test.alpin_student_uid')::uuid;
begin
  if manager_uid is null or student_uid is null then
    raise exception 'Alp''in isolation test requires two auth users';
  end if;

  insert into public.user_track_roles (user_id, track_id, role, is_active)
  values (manager_uid, 'ALPIN', 'ADMIN', true)
  on conflict (user_id, track_id, role) do update set is_active = true;

  insert into public.events (
    id, title, description, start_date, end_date, type, association_id,
    admin_uid, status, show_on_public_site, show_in_feed
  ) values (
    'a1100000-0000-0000-0000-000000000001',
    'Événement test Alp''in',
    'Isolation RLS',
    now() + interval '1 day',
    now() + interval '1 day 2 hours',
    'alpinphysio',
    'alpinphysio',
    manager_uid::text,
    'published',
    true,
    true
  ) on conflict (id) do nothing;

  insert into public.event_registrations (event_id, user_uid, response, user_prenom)
  values ('a1100000-0000-0000-0000-000000000001', manager_uid::text, 'going', 'Manager')
  on conflict (event_id, user_uid) do update set response = excluded.response;
end
$setup$;

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('heds_test.alpin_student_uid'), true);

do $student$
declare
  visible_other integer;
  foreign_track_roles integer;
  changed_events integer;
  forbidden boolean := false;
begin
  select count(*) into foreign_track_roles
  from public.user_track_roles
  where user_id <> auth.uid();
  if foreign_track_roles <> 0 then
    raise exception 'A student must not see another person''s track roles';
  end if;

  select count(*) into visible_other
  from public.event_registrations
  where event_id = 'a1100000-0000-0000-0000-000000000001';
  if visible_other <> 0 then
    raise exception 'A student must not see another person''s attendance response';
  end if;

  insert into public.event_registrations (event_id, user_uid, response, user_prenom)
  values (
    'a1100000-0000-0000-0000-000000000001',
    auth.uid()::text,
    'maybe',
    'Student'
  );

  with changed as (
    update public.events
    set title = 'Forbidden student edit'
    where id = 'a1100000-0000-0000-0000-000000000001'
    returning 1
  ) select count(*) into changed_events from changed;
  if changed_events <> 0 then
    raise exception 'A student must not update an Alp''in event';
  end if;

  begin
    insert into public.event_material_items (event_id, label)
    values ('a1100000-0000-0000-0000-000000000001', 'Forbidden material');
  exception when insufficient_privilege or check_violation then
    forbidden := true;
  end;
  if not forbidden then
    raise exception 'A student must not create material items';
  end if;
end
$student$;

select set_config('request.jwt.claim.sub', current_setting('heds_test.alpin_manager_uid'), true);

do $manager$
declare
  visible_responses integer;
  visible_alpin_roles integer;
  changed_events integer;
begin
  if not public.app_is_alpinphysio_manager() then
    raise exception 'The ALPIN ADMIN track role must grant manager access';
  end if;

  select count(*) into visible_alpin_roles
  from public.user_track_roles
  where track_id = 'ALPIN';
  if visible_alpin_roles < 1 then
    raise exception 'The ALPIN manager must see ALPIN track roles';
  end if;

  select count(*) into visible_responses
  from public.event_registrations
  where event_id = 'a1100000-0000-0000-0000-000000000001';
  if visible_responses <> 2 then
    raise exception 'Manager expected two responses, got %', visible_responses;
  end if;

  with changed as (
    update public.events
    set meeting_point = 'Accueil'
    where id = 'a1100000-0000-0000-0000-000000000001'
    returning 1
  ) select count(*) into changed_events from changed;
  if changed_events <> 1 then
    raise exception 'Manager must be able to update Alp''in events';
  end if;

  insert into public.event_material_items (event_id, label, quantity)
  values ('a1100000-0000-0000-0000-000000000001', 'Tables de massage', 4);
end
$manager$;

reset role;
rollback;

select 'alpinphysio_admin_isolation_ok' as result;
