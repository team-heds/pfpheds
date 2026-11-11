\set ON_ERROR_STOP on

-- Vérifie que le nombre de places d'un événement est appliqué par la base.
-- Tout est annulé à la fin (rollback).

begin;

select set_config('heds_test.cap_manager_uid',
  (select id::text from auth.users order by created_at, id limit 1), true);
-- Les deux comptes « étudiants » ne doivent avoir aucun droit de gestion,
-- sinon ils verraient légitimement les brouillons.
create temporary table heds_test_cap_students on commit drop as
select u.id
from auth.users u
left join public.user_profiles up on up.user_id = u.id
where u.id <> current_setting('heds_test.cap_manager_uid')::uuid
  and coalesce(up.role, '') not in ('admin', 'superadmin')
  and not (coalesce(up.permissions, '[]'::jsonb) ?| array[
    'admin', 'super.all', 'alpinphysio.events.manage', 'alpinphysio.attendance.manage',
    'alpinphysio.material.manage', 'alpinphysio.site.manage'])
  and not exists (
    select 1 from public.user_track_roles r
    where r.user_id = u.id and r.is_active
  )
order by u.created_at, u.id
limit 2;

select set_config('heds_test.cap_student_a_uid',
  (select id::text from heds_test_cap_students limit 1), true);
select set_config('heds_test.cap_student_b_uid',
  (select id::text from heds_test_cap_students offset 1 limit 1), true);

do $setup$
declare
  manager_uid uuid := current_setting('heds_test.cap_manager_uid')::uuid;
begin
  if current_setting('heds_test.cap_student_b_uid') is null or current_setting('heds_test.cap_student_b_uid') = '' then
    raise exception 'Capacity test requires one account plus two accounts without management rights';
  end if;

  insert into public.user_track_roles (user_id, track_id, role, is_active)
  values (manager_uid, 'ALPIN', 'COORDINATOR', true)
  on conflict (user_id, track_id, role) do update set is_active = true;

  insert into public.events (id, title, start_date, end_date, type, association_id, admin_uid, status, capacity)
  values
    ('a1300000-0000-0000-0000-000000000001', 'Une seule place', now() + interval '3 days', now() + interval '3 days 2 hours', 'alpinphysio', 'alpinphysio', manager_uid::text, 'published', 1),
    ('a1300000-0000-0000-0000-000000000002', 'Sans limite', now() + interval '4 days', now() + interval '4 days 2 hours', 'alpinphysio', 'alpinphysio', manager_uid::text, 'published', null),
    ('a1300000-0000-0000-0000-000000000003', 'Brouillon', now() + interval '5 days', now() + interval '5 days 2 hours', 'alpinphysio', 'alpinphysio', manager_uid::text, 'draft', 5);
end
$setup$;

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('heds_test.cap_student_a_uid'), true);

do $student_a$
declare
  v_going integer;
begin
  insert into public.event_registrations (event_id, user_uid, response)
  values ('a1300000-0000-0000-0000-000000000001', auth.uid()::text, 'going'),
         ('a1300000-0000-0000-0000-000000000002', auth.uid()::text, 'going');

  -- Déjà inscrit·e : modifier sa propre réponse reste possible.
  update public.event_registrations set note = 'Je viens en train'
  where event_id = 'a1300000-0000-0000-0000-000000000001' and user_uid = auth.uid()::text;

  select going_count into v_going from public.event_places(array['a1300000-0000-0000-0000-000000000001'::uuid]);
  if v_going <> 1 then
    raise exception 'event_places must report one taken place, got %', v_going;
  end if;
end
$student_a$;

select set_config('request.jwt.claim.sub', current_setting('heds_test.cap_student_b_uid'), true);

do $student_b$
declare
  v_refused boolean := false;
  v_row record;
  v_visible integer;
begin
  if public.app_is_alpinphysio_manager() then
    raise exception 'Test setup: student accounts must not be Alp''in managers';
  end if;

  -- L'événement est complet : « présent » est refusé…
  begin
    insert into public.event_registrations (event_id, user_uid, response)
    values ('a1300000-0000-0000-0000-000000000001', auth.uid()::text, 'going');
  exception when raise_exception then
    v_refused := sqlerrm = 'Cet événement est complet.';
  end;
  if not v_refused then
    raise exception 'A full event must refuse a new "going" response';
  end if;

  -- … mais « peut-être » reste possible, sans pouvoir ensuite passer à « présent ».
  insert into public.event_registrations (event_id, user_uid, response)
  values ('a1300000-0000-0000-0000-000000000001', auth.uid()::text, 'maybe');
  v_refused := false;
  begin
    update public.event_registrations set response = 'going'
    where event_id = 'a1300000-0000-0000-0000-000000000001' and user_uid = auth.uid()::text;
  exception when raise_exception then
    v_refused := true;
  end;
  if not v_refused then
    raise exception 'Switching to "going" on a full event must be refused';
  end if;

  -- Un événement sans limite accepte tout le monde.
  insert into public.event_registrations (event_id, user_uid, response)
  values ('a1300000-0000-0000-0000-000000000002', auth.uid()::text, 'going');

  -- Le total est visible, pas les réponses des autres ni les brouillons.
  select * into v_row from public.event_places(array['a1300000-0000-0000-0000-000000000001'::uuid]);
  if v_row.capacity <> 1 or v_row.going_count <> 1 then
    raise exception 'Unexpected places for the full event: %/%', v_row.going_count, v_row.capacity;
  end if;
  select count(*) into v_visible from public.event_places(array['a1300000-0000-0000-0000-000000000003'::uuid]);
  if v_visible <> 0 then
    raise exception 'A student must not read places of a draft event';
  end if;
  select count(*) into v_visible from public.event_registrations
  where event_id = 'a1300000-0000-0000-0000-000000000001' and user_uid <> auth.uid()::text;
  if v_visible <> 0 then
    raise exception 'A student must still not see other people''s responses';
  end if;
end
$student_b$;

select set_config('request.jwt.claim.sub', current_setting('heds_test.cap_student_a_uid'), true);

do $release$
begin
  -- La personne inscrite se désiste : la place se libère.
  update public.event_registrations set response = 'not_going'
  where event_id = 'a1300000-0000-0000-0000-000000000001' and user_uid = auth.uid()::text;
end
$release$;

select set_config('request.jwt.claim.sub', current_setting('heds_test.cap_student_b_uid'), true);

do $retry$
begin
  update public.event_registrations set response = 'going'
  where event_id = 'a1300000-0000-0000-0000-000000000001' and user_uid = auth.uid()::text;
end
$retry$;

select set_config('request.jwt.claim.sub', current_setting('heds_test.cap_manager_uid'), true);

do $manager$
declare
  v_visible integer;
begin
  select count(*) into v_visible from public.event_places(array['a1300000-0000-0000-0000-000000000003'::uuid]);
  if v_visible <> 1 then
    raise exception 'A manager must read places of an Alp''in draft';
  end if;
end
$manager$;

reset role;
select set_config('request.jwt.claim.sub', '', true);

do $anonymous$
begin
  if exists (select 1 from public.event_places(array['a1300000-0000-0000-0000-000000000001'::uuid])) then
    raise exception 'event_places must return nothing without a signed-in user';
  end if;
  if has_function_privilege('anon', 'public.event_places(uuid[])', 'execute') then
    raise exception 'anon must not be allowed to call event_places';
  end if;
end
$anonymous$;

rollback;

select 'alpinphysio_event_capacity_isolation_ok' as result;
