\set ON_ERROR_STOP on
-- Un étudiant propriétaire d'un événement ordinaire ne peut pas le transformer en événement
-- Alp'in Physio (site public et fil signé « Alp'in Physio »). Un responsable le peut toujours.
-- Tout est annulé à la fin.

begin;

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
)
values
  ('7c000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'evt.student@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('7c000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'evt.manager@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated');

insert into public.user_profiles (user_id, email, forname, family_name, display_name, classe, role, permissions, is_active)
values
  ('7c000000-0000-4000-8000-000000000001', 'evt.student@example.invalid', 'Eve', 'Etudiante', 'Eve Etudiante', 'BA25', 'user', '[]'::jsonb, true),
  ('7c000000-0000-4000-8000-000000000002', 'evt.manager@example.invalid', 'Max', 'Responsable', 'Max Responsable', null, 'user', '["alpinphysio.events.manage"]'::jsonb, true)
on conflict (user_id) do update
  set role = excluded.role, permissions = excluded.permissions, is_active = true, classe = excluded.classe;

set local role authenticated;
select set_config('request.jwt.claim.sub', '7c000000-0000-4000-8000-000000000001', true);

insert into public.events (id, title, description, start_date, end_date, admin_uid, type, status)
values ('7c000000-0000-4000-8000-0000000000e1', 'Soirée de classe', 'Texte', now() + interval '2 days',
        now() + interval '2 days 2 hours', '7c000000-0000-4000-8000-000000000001', 'public', 'published');

do $student$
declare
  v_refused boolean := false;
begin
  -- Le propriétaire peut toujours modifier son événement ordinaire.
  update public.events set title = 'Soirée de classe (modifiée)'
  where id = '7c000000-0000-4000-8000-0000000000e1';

  begin
    update public.events
    set type = 'alpinphysio', show_in_feed = true, show_on_public_site = true
    where id = '7c000000-0000-4000-8000-0000000000e1';
  exception when insufficient_privilege then v_refused := true;
  end;
  if not v_refused then
    raise exception 'A student must not turn an event into an Alp''in Physio event';
  end if;
end
$student$;

reset role;

do $check$
begin
  if exists (select 1 from public.posts where event_id = '7c000000-0000-4000-8000-0000000000e1') then
    raise exception 'No Alp''in Physio feed post may exist for the student event';
  end if;
  if (select type from public.events where id = '7c000000-0000-4000-8000-0000000000e1') <> 'public' then
    raise exception 'The event type must be unchanged';
  end if;
end
$check$;

-- Un responsable Alp'in Physio peut créer et modifier un événement Alp'in Physio.
set local role authenticated;
select set_config('request.jwt.claim.sub', '7c000000-0000-4000-8000-000000000002', true);

insert into public.events (id, title, description, start_date, end_date, admin_uid, type, status, show_in_feed)
values ('7c000000-0000-4000-8000-0000000000e2', 'Course de montagne', 'Massages', now() + interval '3 days',
        now() + interval '3 days 4 hours', '7c000000-0000-4000-8000-000000000002', 'alpinphysio', 'published', true);
update public.events set show_on_public_site = true where id = '7c000000-0000-4000-8000-0000000000e2';

reset role;

do $manager$
begin
  if not exists (select 1 from public.posts where event_id = '7c000000-0000-4000-8000-0000000000e2') then
    raise exception 'A manager event must still be published in the feed';
  end if;
end
$manager$;

rollback;

select 'alpinphysio_event_type_escalation_isolation_ok' as result;
