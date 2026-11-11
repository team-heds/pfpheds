\set ON_ERROR_STOP on
-- Présence aux événements par QR code : seuls les organisateurs créent des codes, la
-- validation est décidée par le serveur (code expiré, hors horaire, double scan), les
-- points sont réservés aux joueurs. Tout est annulé à la fin.

begin;

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
)
values
  ('72000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'checkin.staff@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('72000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'checkin.player@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('72000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'checkin.guest@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('72000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'checkin.student@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('72000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'checkin.player2@example.invalid', crypt('test-only', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated');

insert into public.user_profiles (user_id, email, forname, family_name, display_name, classe, role, is_active)
values
  ('72000000-0000-4000-8000-000000000001', 'checkin.staff@example.invalid', 'Odile', 'Organisatrice', 'Odile Organisatrice', null, 'admin', true),
  ('72000000-0000-4000-8000-000000000002', 'checkin.player@example.invalid', 'Paul', 'Joueur', 'Paul Joueur', 'BA25', 'user', true),
  ('72000000-0000-4000-8000-000000000003', 'checkin.guest@example.invalid', 'Ines', 'Invitee', 'Ines Invitee', 'BA23', 'user', true),
  ('72000000-0000-4000-8000-000000000004', 'checkin.student@example.invalid', 'Sam', 'Etudiant', 'Sam Etudiant', 'BA24', 'user', true),
  ('72000000-0000-4000-8000-000000000005', 'checkin.player2@example.invalid', 'Lea', 'Joueuse', 'Lea Joueuse', 'BA26', 'user', true)
on conflict (user_id) do update
  set role = excluded.role, is_active = true, forname = excluded.forname, family_name = excluded.family_name;

-- Récompenses actives, deux joueurs dans l'audience (valable en mode liste comme en mode « tous »).
insert into gamification_private.rollout_config (singleton, rewards_enabled, audience_mode)
values (true, true, 'allowlist')
on conflict (singleton) do update set rewards_enabled = true, audience_mode = 'allowlist';

insert into gamification_private.rollout_audience (user_id)
values ('72000000-0000-4000-8000-000000000002'), ('72000000-0000-4000-8000-000000000005')
on conflict (user_id) do nothing;

insert into public.events (id, title, lieu, start_date, end_date, type, status, admin_uid)
values
  ('72000000-0000-4000-8000-0000000000e1', 'Conférence de test', 'Aula', now() - interval '10 minutes', now() + interval '50 minutes', 'private', 'published', '72000000-0000-4000-8000-000000000001'),
  ('72000000-0000-4000-8000-0000000000e2', 'Atelier d''un étudiant', 'Salle 12', now() - interval '10 minutes', now() + interval '50 minutes', 'private', 'published', '72000000-0000-4000-8000-000000000004');

-- 1. Aucun accès direct : ni anonyme sur les fonctions, ni personne sur les tables.
do $grants$
declare
  v_table text;
  v_function text;
begin
  foreach v_table in array array['event_checkin_settings', 'scan_codes', 'scan_redemptions', 'scan_attempts'] loop
    if has_table_privilege('authenticated', 'gamification_private.' || v_table, 'select')
      or has_table_privilege('authenticated', 'gamification_private.' || v_table, 'insert')
      or has_table_privilege('anon', 'gamification_private.' || v_table, 'select') then
      raise exception 'Direct access left on gamification_private.%', v_table;
    end if;
    if not (select c.relrowsecurity from pg_class c where c.oid = ('gamification_private.' || v_table)::regclass) then
      raise exception 'RLS disabled on gamification_private.%', v_table;
    end if;
  end loop;

  foreach v_function in array array[
    'public.get_event_checkin_overview(uuid)',
    'public.configure_event_checkin(uuid, integer)',
    'public.issue_event_checkin_code(uuid)',
    'public.get_event_attendance(uuid)',
    'public.redeem_scan_code(text)',
    'public.get_my_event_attendances(integer)'
  ] loop
    if has_function_privilege('anon', v_function, 'execute') then
      raise exception 'Anonymous can execute %', v_function;
    end if;
    if not has_function_privilege('authenticated', v_function, 'execute') then
      raise exception 'Authenticated cannot execute %', v_function;
    end if;
  end loop;

  if has_function_privilege('authenticated', 'gamification_private.can_manage_scan_codes(uuid)', 'execute') then
    raise exception 'Internal helper exposed to authenticated';
  end if;
end
$grants$;

-- 2. Un étudiant ne règle pas les points, ne crée pas de code et ne voit pas la liste,
--    même sur un événement qu'il a créé lui-même.
select set_config('request.jwt.claim.sub', '72000000-0000-4000-8000-000000000004', true);
set local role authenticated;

do $student_forbidden$
declare
  v_denied integer := 0;
begin
  begin
    perform public.configure_event_checkin('72000000-0000-4000-8000-0000000000e2', 100);
  exception when others then v_denied := v_denied + 1;
  end;
  begin
    perform public.issue_event_checkin_code('72000000-0000-4000-8000-0000000000e2');
  exception when others then v_denied := v_denied + 1;
  end;
  begin
    perform public.get_event_attendance('72000000-0000-4000-8000-0000000000e1');
  exception when others then v_denied := v_denied + 1;
  end;
  if v_denied <> 3 then
    raise exception 'A student reached % organizer function(s)', 3 - v_denied;
  end if;
end
$student_forbidden$;

-- 3. L'organisatrice règle les points (10 à 100) et obtient un code.
reset role;
select set_config('request.jwt.claim.sub', '72000000-0000-4000-8000-000000000001', true);
set local role authenticated;

do $organizer$
declare
  v_denied integer := 0;
  v_first jsonb;
  v_second jsonb;
begin
  begin
    perform public.configure_event_checkin('72000000-0000-4000-8000-0000000000e1', 5);
  exception when others then v_denied := v_denied + 1;
  end;
  begin
    perform public.configure_event_checkin('72000000-0000-4000-8000-0000000000e1', 101);
  exception when others then v_denied := v_denied + 1;
  end;
  if v_denied <> 2 then
    raise exception 'XP reward outside 10..100 was accepted';
  end if;

  if (public.get_event_checkin_overview('72000000-0000-4000-8000-0000000000e1') ->> 'xp_reward')::integer <> 30 then
    raise exception 'Default reward must be 30 XP';
  end if;

  perform public.configure_event_checkin('72000000-0000-4000-8000-0000000000e1', 40);

  v_first := public.issue_event_checkin_code('72000000-0000-4000-8000-0000000000e1');
  if not (v_first ->> 'issued')::boolean
    or (v_first ->> 'token') !~ '^[0-9a-f]{32}$'
    or (v_first ->> 'short_code') !~ '^[A-HJ-NP-Z2-9]{6}$'
    or (v_first ->> 'xp_reward')::integer <> 40
    or (v_first ->> 'expires_at')::timestamptz > now() + interval '91 seconds' then
    raise exception 'Unexpected issued code: %', v_first;
  end if;

  v_second := public.issue_event_checkin_code('72000000-0000-4000-8000-0000000000e1');
  if v_second ->> 'token' <> v_first ->> 'token' then
    raise exception 'A second call within 20 seconds must return the same code';
  end if;

  perform set_config('heds_test.token', v_first ->> 'token', true);
  perform set_config('heds_test.short_code', v_first ->> 'short_code', true);
end
$organizer$;

-- 4. Un joueur scanne : présent, +40 XP, comptés aussi pour sa maison. Second scan : rien.
reset role;
select set_config('request.jwt.claim.sub', '72000000-0000-4000-8000-000000000002', true);
set local role authenticated;

do $player$
declare
  v_result jsonb;
  v_again jsonb;
begin
  v_result := public.redeem_scan_code(current_setting('heds_test.token'));
  if v_result ->> 'status' <> 'ok' or (v_result ->> 'xp_gained')::integer <> 40
    or not (v_result ->> 'is_player')::boolean then
    raise exception 'Player check-in failed: %', v_result;
  end if;

  v_again := public.redeem_scan_code(current_setting('heds_test.token'));
  if v_again ->> 'status' <> 'already' or (v_again ->> 'xp_gained')::integer <> 0 then
    raise exception 'Double scan must be rejected: %', v_again;
  end if;

  v_again := public.redeem_scan_code(current_setting('heds_test.short_code'));
  if v_again ->> 'status' <> 'already' then
    raise exception 'Double scan by short code must be rejected: %', v_again;
  end if;

  if jsonb_array_length(public.get_my_event_attendances()) <> 1 then
    raise exception 'Player must see exactly one attendance';
  end if;

  v_result := public.get_event_checkin_overview('72000000-0000-4000-8000-0000000000e1');
  if v_result -> 'my_attendance' = 'null'::jsonb
    or (v_result ->> 'can_manage')::boolean
    or v_result -> 'attendee_count' <> 'null'::jsonb then
    raise exception 'Unexpected participant overview: %', v_result;
  end if;
end
$player$;

reset role;

do $player_totals$
begin
  if (
    select count(*) from public.xp_history h
    where h.user_id = '72000000-0000-4000-8000-000000000002'
      and h.action = 'EVENT_CHECKIN' and h.amount = 40
      and h.source_id = '72000000-0000-4000-8000-0000000000e1'
  ) <> 1 then
    raise exception 'Exactly one EVENT_CHECKIN history row expected';
  end if;
  if (
    select gd.total_xp = 40 and gd.house_points = 40 from public.gamification_data gd
    where gd.user_id = '72000000-0000-4000-8000-000000000002'
  ) is not true then
    raise exception 'XP and house points must both increase by 40';
  end if;
end
$player_totals$;

-- 5. Hors audience : présent sans points, ici avec le code court saisi à la main.
select set_config('request.jwt.claim.sub', '72000000-0000-4000-8000-000000000003', true);
set local role authenticated;

do $guest$
declare
  v_result jsonb;
  v_code text := current_setting('heds_test.short_code');
begin
  v_result := public.redeem_scan_code(' ' || lower(substr(v_code, 1, 3)) || '-' || substr(v_code, 4) || ' ');
  if v_result ->> 'status' <> 'ok' or (v_result ->> 'xp_gained')::integer <> 0
    or (v_result ->> 'is_player')::boolean then
    raise exception 'Non-player must be recorded without XP: %', v_result;
  end if;
end
$guest$;

reset role;

do $guest_totals$
begin
  if exists (select 1 from public.xp_history h where h.user_id = '72000000-0000-4000-8000-000000000003') then
    raise exception 'A non-player received XP';
  end if;
end
$guest_totals$;

-- 6. Code expiré (une photo envoyée plus tard ne sert à rien).
update gamification_private.scan_codes
set expires_at = now() - interval '1 second'
where token = current_setting('heds_test.token');

select set_config('request.jwt.claim.sub', '72000000-0000-4000-8000-000000000004', true);
set local role authenticated;

do $expired$
declare
  v_result jsonb;
begin
  v_result := public.redeem_scan_code(current_setting('heds_test.token'));
  if v_result ->> 'status' <> 'expired' then
    raise exception 'Expired token must be rejected: %', v_result;
  end if;
  v_result := public.redeem_scan_code(current_setting('heds_test.short_code'));
  if v_result ->> 'status' <> 'expired' then
    raise exception 'Expired short code must be rejected: %', v_result;
  end if;
  v_result := public.redeem_scan_code('ZZZZZZ');
  if v_result ->> 'status' <> 'invalid' then
    raise exception 'Unknown code must be invalid: %', v_result;
  end if;
  v_result := public.redeem_scan_code('https://exemple.invalid/?c=zzz');
  if v_result ->> 'status' <> 'invalid' then
    raise exception 'Garbage must be invalid: %', v_result;
  end if;
end
$expired$;

-- 7. Hors horaire : un code encore « frais » ne vaut plus rien quand l'événement est
--    terminé, pas encore commencé ou annulé ; l'organisatrice n'obtient plus de code.
reset role;
select set_config('request.jwt.claim.sub', '72000000-0000-4000-8000-000000000001', true);
set local role authenticated;

do $fresh_code$
declare
  v_code jsonb;
begin
  v_code := public.issue_event_checkin_code('72000000-0000-4000-8000-0000000000e1');
  if v_code ->> 'token' = current_setting('heds_test.token') then
    raise exception 'An expired code must not be reused';
  end if;
  perform set_config('heds_test.token', v_code ->> 'token', true);
end
$fresh_code$;

reset role;
update public.events
set start_date = now() - interval '3 hours', end_date = now() - interval '2 hours'
where id = '72000000-0000-4000-8000-0000000000e1';

select set_config('request.jwt.claim.sub', '72000000-0000-4000-8000-000000000004', true);
set local role authenticated;

do $ended$
declare
  v_result jsonb;
begin
  v_result := public.redeem_scan_code(current_setting('heds_test.token'));
  if v_result ->> 'status' <> 'event_ended' then
    raise exception 'Scan after the event must be rejected: %', v_result;
  end if;
end
$ended$;

reset role;
update public.events
set start_date = now() + interval '2 hours', end_date = now() + interval '3 hours'
where id = '72000000-0000-4000-8000-0000000000e1';

select set_config('request.jwt.claim.sub', '72000000-0000-4000-8000-000000000004', true);
set local role authenticated;

do $upcoming$
declare
  v_result jsonb;
begin
  v_result := public.redeem_scan_code(current_setting('heds_test.token'));
  if v_result ->> 'status' <> 'event_not_started' then
    raise exception 'Scan before the event must be rejected: %', v_result;
  end if;
end
$upcoming$;

reset role;
select set_config('request.jwt.claim.sub', '72000000-0000-4000-8000-000000000001', true);
set local role authenticated;

do $no_code_outside_hours$
declare
  v_code jsonb;
begin
  v_code := public.issue_event_checkin_code('72000000-0000-4000-8000-0000000000e1');
  if (v_code ->> 'issued')::boolean or v_code ->> 'state' <> 'upcoming' then
    raise exception 'No code may be issued outside the event window: %', v_code;
  end if;
end
$no_code_outside_hours$;

reset role;
update public.events
set start_date = now() - interval '10 minutes', end_date = now() + interval '50 minutes', status = 'cancelled'
where id = '72000000-0000-4000-8000-0000000000e1';

select set_config('request.jwt.claim.sub', '72000000-0000-4000-8000-000000000004', true);
set local role authenticated;

do $cancelled$
declare
  v_result jsonb;
begin
  v_result := public.redeem_scan_code(current_setting('heds_test.token'));
  if v_result ->> 'status' <> 'event_unavailable' then
    raise exception 'Scan on a cancelled event must be rejected: %', v_result;
  end if;
  if exists (
    select 1 from jsonb_array_elements(public.get_my_event_attendances()) item
  ) then
    raise exception 'Rejected scans must not create an attendance';
  end if;
end
$cancelled$;

-- 8. Récompenses coupées : la présence reste enregistrée, sans points.
reset role;
update public.events set status = 'published' where id = '72000000-0000-4000-8000-0000000000e1';
update gamification_private.rollout_config set rewards_enabled = false where singleton;

select set_config('request.jwt.claim.sub', '72000000-0000-4000-8000-000000000005', true);
set local role authenticated;

do $rewards_disabled$
declare
  v_result jsonb;
begin
  v_result := public.redeem_scan_code(current_setting('heds_test.token'));
  if v_result ->> 'status' <> 'ok' or (v_result ->> 'xp_gained')::integer <> 0 then
    raise exception 'Disabled rewards must record attendance without XP: %', v_result;
  end if;
end
$rewards_disabled$;

-- 9. Liste des présents pour l'organisatrice.
reset role;
select set_config('request.jwt.claim.sub', '72000000-0000-4000-8000-000000000001', true);
set local role authenticated;

do $attendance$
declare
  v_list jsonb;
begin
  v_list := public.get_event_attendance('72000000-0000-4000-8000-0000000000e1');
  if (v_list ->> 'count')::integer <> 3 or jsonb_array_length(v_list -> 'attendees') <> 3 then
    raise exception 'Three attendees expected: %', v_list;
  end if;
  if not exists (
    select 1 from jsonb_array_elements(v_list -> 'attendees') a
    where a ->> 'display_name' = 'Paul Joueur' and a ->> 'classe' = 'BA25'
      and (a ->> 'xp_awarded')::integer = 40 and a ->> 'method' = 'qr'
  ) or not exists (
    select 1 from jsonb_array_elements(v_list -> 'attendees') a
    where a ->> 'display_name' = 'Ines Invitee' and (a ->> 'xp_awarded')::integer = 0 and a ->> 'method' = 'code'
  ) then
    raise exception 'Unexpected attendee details: %', v_list;
  end if;
  if (public.get_event_checkin_overview('72000000-0000-4000-8000-0000000000e1') ->> 'attendee_count')::integer <> 3 then
    raise exception 'Organizer overview must count three attendees';
  end if;
end
$attendance$;

-- 10. Recherche de codes au hasard : bloquée après 12 essais refusés en 10 minutes.
reset role;
select set_config('request.jwt.claim.sub', '72000000-0000-4000-8000-000000000004', true);
set local role authenticated;

do $rate_limit$
declare
  v_result jsonb;
  i integer;
begin
  for i in 1..12 loop
    v_result := public.redeem_scan_code('ZZZZZ' || substr('23456789ABCD', i, 1));
  end loop;
  v_result := public.redeem_scan_code(current_setting('heds_test.token'));
  if v_result ->> 'status' <> 'rate_limited' then
    raise exception 'Guessing must be rate limited: %', v_result;
  end if;
end
$rate_limit$;

reset role;
rollback;

select 'gamification_event_checkin_isolation_ok' as result;
