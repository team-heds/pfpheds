\set ON_ERROR_STOP on
-- Mentorat : proposer, réserver, annuler, confirmer, points, vie privée et administration.
-- Tout est annulé à la fin (aucune donnée ne reste).
--
-- Comptes : A mentor (joueur), B étudiant (joueur), C tiers (joueur), D non-joueur, E admin.

begin;

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
)
select
  u.id, '00000000-0000-0000-0000-000000000000', u.email, 'test-only-not-a-hash', now(),
  now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'
from (values
  ('72000000-0000-4000-8000-00000000000a'::uuid, 'mentor.a@example.invalid'),
  ('72000000-0000-4000-8000-00000000000b'::uuid, 'mentee.b@example.invalid'),
  ('72000000-0000-4000-8000-00000000000c'::uuid, 'other.c@example.invalid'),
  ('72000000-0000-4000-8000-00000000000d'::uuid, 'guest.d@example.invalid'),
  ('72000000-0000-4000-8000-00000000000e'::uuid, 'admin.e@example.invalid')
) as u(id, email);

insert into public.user_profiles (user_id, email, display_name, is_active, classe, role)
values
  ('72000000-0000-4000-8000-00000000000a', 'mentor.a@example.invalid', 'Mentor A', true, 'BA24', 'user'),
  ('72000000-0000-4000-8000-00000000000b', 'mentee.b@example.invalid', 'Mentee B', true, 'BA26', 'user'),
  ('72000000-0000-4000-8000-00000000000c', 'other.c@example.invalid', 'Other C', true, 'BA25', 'user'),
  ('72000000-0000-4000-8000-00000000000d', 'guest.d@example.invalid', 'Guest D', true, null, 'user'),
  ('72000000-0000-4000-8000-00000000000e', 'admin.e@example.invalid', 'Admin E', true, null, 'admin')
on conflict (user_id) do update
set display_name = excluded.display_name, classe = excluded.classe, role = excluded.role, is_active = true;

-- Récompenses ouvertes au public « joueurs » : A, B et C seulement.
update gamification_private.rollout_config
set rewards_enabled = true, audience_mode = 'allowlist'
where singleton;

insert into gamification_private.rollout_audience (user_id, added_by)
values
  ('72000000-0000-4000-8000-00000000000a', '72000000-0000-4000-8000-00000000000e'),
  ('72000000-0000-4000-8000-00000000000b', '72000000-0000-4000-8000-00000000000e'),
  ('72000000-0000-4000-8000-00000000000c', '72000000-0000-4000-8000-00000000000e')
on conflict (user_id) do nothing;

do $grants$
begin
  if has_table_privilege('anon', 'public.mentoring_slots', 'select')
     or has_table_privilege('anon', 'public.mentoring_bookings', 'select') then
    raise exception 'anon must not read mentoring tables';
  end if;
  if has_table_privilege('authenticated', 'public.mentoring_slots', 'insert')
     or has_table_privilege('authenticated', 'public.mentoring_slots', 'update')
     or has_table_privilege('authenticated', 'public.mentoring_slots', 'delete')
     or has_table_privilege('authenticated', 'public.mentoring_bookings', 'insert')
     or has_table_privilege('authenticated', 'public.mentoring_bookings', 'update')
     or has_table_privilege('authenticated', 'public.mentoring_bookings', 'delete') then
    raise exception 'authenticated must not write mentoring tables directly';
  end if;
  if has_function_privilege('anon', 'public.book_mentoring_slot(uuid, text)', 'execute')
     or has_function_privilege('anon', 'public.get_mentoring_slots()', 'execute')
     or has_function_privilege('anon', 'public.confirm_mentoring_session(uuid)', 'execute') then
    raise exception 'anon must not call mentoring functions';
  end if;
  if has_function_privilege('authenticated', 'gamification_private.mentoring_award(uuid, uuid, uuid, timestamptz)', 'execute')
     or has_function_privilege('authenticated', 'gamification_private.mentoring_notify(uuid, text, text)', 'execute') then
    raise exception 'internal mentoring helpers must stay private';
  end if;
  if not (select relrowsecurity from pg_class where oid = 'public.mentoring_slots'::regclass)
     or not (select relrowsecurity from pg_class where oid = 'public.mentoring_bookings'::regclass) then
    raise exception 'RLS must be enabled on mentoring tables';
  end if;
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'mentoring_bookings_one_active_per_slot'
      and indexdef ilike '%unique%'
  ) then
    raise exception 'missing unique index: one active booking per slot';
  end if;
end
$grants$;

create temporary table mentoring_test_ids (name text primary key, id uuid not null) on commit drop;
grant select, insert on mentoring_test_ids to authenticated;

set local role authenticated;

-- ---------------------------------------------------------------------------
-- 1. Proposer, réserver, vie privée, annuler
-- ---------------------------------------------------------------------------
do $flow$
declare
  v_a constant text := '72000000-0000-4000-8000-00000000000a';
  v_b constant text := '72000000-0000-4000-8000-00000000000b';
  v_c constant text := '72000000-0000-4000-8000-00000000000c';
  v_slot uuid;
  v_rejected boolean;
  v_count integer;
  v_row record;
begin
  perform set_config('request.jwt.claim.sub', v_a, true);

  -- Écriture directe refusée.
  v_rejected := false;
  begin
    insert into public.mentoring_slots (mentor_id, starts_at, ends_at, location, topics)
    values (v_a::uuid, now() + interval '1 day', now() + interval '1 day 1 hour', 'Cafétéria', 'Anatomie');
  exception when insufficient_privilege then v_rejected := true;
  end;
  if not v_rejected then raise exception 'direct slot insert accepted'; end if;

  -- Créneau dans le passé refusé.
  v_rejected := false;
  begin
    perform public.create_mentoring_slot(now() - interval '1 hour', now(), 'Cafétéria', 'Anatomie');
  exception when others then v_rejected := sqlerrm = 'mentoring_slot_in_past';
  end;
  if not v_rejected then raise exception 'past slot accepted'; end if;

  -- Durée invalide refusée.
  v_rejected := false;
  begin
    perform public.create_mentoring_slot(now() + interval '1 day', now() + interval '1 day 5 minutes', 'Cafétéria', 'Anatomie');
  exception when others then v_rejected := sqlerrm = 'mentoring_invalid_duration';
  end;
  if not v_rejected then raise exception 'too short slot accepted'; end if;

  v_slot := public.create_mentoring_slot(
    now() + interval '1 day', now() + interval '1 day 1 hour',
    '  Cafétéria HEdS, Loèche-les-Bains ', 'Anatomie du membre inférieur',
    array['Anatomie', ' anatomie ', 'Stages PFP', ''], 'Apportez vos questions'
  );
  insert into mentoring_test_ids values ('slot1', v_slot);

  select * into v_row from public.mentoring_slots where id = v_slot;
  if v_row.tags <> array['anatomie', 'stages pfp'] or v_row.location <> 'Cafétéria HEdS, Loèche-les-Bains' then
    raise exception 'slot not normalised: % / %', v_row.tags, v_row.location;
  end if;

  -- Chevauchement avec un de ses créneaux refusé.
  v_rejected := false;
  begin
    perform public.create_mentoring_slot(now() + interval '1 day 30 minutes', now() + interval '1 day 2 hours', 'Visio', 'Examens');
  exception when others then v_rejected := sqlerrm = 'mentoring_slot_overlap';
  end;
  if not v_rejected then raise exception 'overlapping slot accepted'; end if;

  -- Réserver son propre créneau : refusé.
  v_rejected := false;
  begin
    perform public.book_mentoring_slot(v_slot, null);
  exception when others then v_rejected := sqlerrm = 'mentoring_own_slot';
  end;
  if not v_rejected then raise exception 'own slot booking accepted'; end if;

  -- B réserve avec un message privé.
  perform set_config('request.jwt.claim.sub', v_b, true);
  select count(*) into v_count from public.get_mentoring_slots() s where s.slot_id = v_slot and not s.is_booked and s.mentor_classe = 'BA24';
  if v_count <> 1 then raise exception 'free slot not listed with mentor class'; end if;
  perform public.book_mentoring_slot(v_slot, 'Message privé pour le mentor');

  -- C : créneau pris, aucun détail de réservation.
  perform set_config('request.jwt.claim.sub', v_c, true);
  v_rejected := false;
  begin
    perform public.book_mentoring_slot(v_slot, 'Moi aussi');
  exception when others then v_rejected := sqlerrm = 'mentoring_slot_taken';
  end;
  if not v_rejected then raise exception 'double booking accepted'; end if;

  select count(*) into v_count from public.mentoring_bookings;
  if v_count <> 0 then raise exception 'third party reads % booking rows', v_count; end if;
  select count(*) into v_count from public.get_my_mentoring_slots();
  if v_count <> 0 then raise exception 'third party sees private slots'; end if;
  select count(*) into v_count from public.get_mentoring_slots() s where s.slot_id = v_slot and s.is_booked and not s.booked_by_me;
  if v_count <> 1 then raise exception 'third party must only see that the slot is taken'; end if;
  if to_jsonb((select s from public.get_mentoring_slots() s where s.slot_id = v_slot))::text like '%Message privé%' then
    raise exception 'booking message leaked in public list';
  end if;

  v_rejected := false;
  begin
    perform public.cancel_mentoring_booking(v_slot);
  exception when others then v_rejected := sqlerrm = 'mentoring_booking_not_found';
  end;
  if not v_rejected then raise exception 'third party cancelled a booking'; end if;

  v_rejected := false;
  begin
    perform public.cancel_mentoring_slot(v_slot);
  exception when others then v_rejected := sqlerrm = 'mentoring_slot_not_found';
  end;
  if not v_rejected then raise exception 'third party cancelled a slot'; end if;

  v_rejected := false;
  begin
    perform public.confirm_mentoring_session(v_slot);
  exception when others then v_rejected := sqlerrm = 'mentoring_booking_not_found';
  end;
  if not v_rejected then raise exception 'third party confirmed a session'; end if;

  -- Mentor et étudiant voient le message.
  perform set_config('request.jwt.claim.sub', v_a, true);
  select * into v_row from public.get_my_mentoring_slots() s where s.slot_id = v_slot;
  if v_row.my_role <> 'mentor' or v_row.booking_message <> 'Message privé pour le mentor' or v_row.other_name <> 'Mentee B' or v_row.other_classe <> 'BA26' then
    raise exception 'mentor does not see booking detail';
  end if;

  perform set_config('request.jwt.claim.sub', v_b, true);
  select * into v_row from public.get_my_mentoring_slots() s where s.slot_id = v_slot;
  if v_row.my_role <> 'mentee' or v_row.booking_message <> 'Message privé pour le mentor' or v_row.other_name <> 'Mentor A' then
    raise exception 'mentee does not see booking detail';
  end if;

  -- Confirmer avant la fin : refusé.
  v_rejected := false;
  begin
    perform public.confirm_mentoring_session(v_slot);
  exception when others then v_rejected := sqlerrm = 'mentoring_session_not_finished';
  end;
  if not v_rejected then raise exception 'confirmation accepted before the end'; end if;

  -- B annule : le créneau redevient libre, puis B réserve de nouveau.
  perform public.cancel_mentoring_booking(v_slot);
  select count(*) into v_count from public.get_mentoring_slots() s where s.slot_id = v_slot and not s.is_booked;
  if v_count <> 1 then raise exception 'slot not free again after cancellation'; end if;
  perform public.book_mentoring_slot(v_slot, 'Deuxième réservation');
end
$flow$;

reset role;

do $notifications$
declare
  v_count integer;
begin
  -- Le mentor est prévenu : 2 réservations + 1 annulation.
  select count(*) into v_count from public.push_outbox
  where user_id = '72000000-0000-4000-8000-00000000000a' and url like '/mentorat%';
  if v_count <> 3 then raise exception 'mentor notifications: % (expected 3)', v_count; end if;
end
$notifications$;

-- La rencontre a eu lieu : on recule le créneau dans le passé (même transaction, now() fixe).
update public.mentoring_slots
set starts_at = now() - interval '3 hours', ends_at = now() - interval '2 hours'
where id = (select id from mentoring_test_ids where name = 'slot1');

set local role authenticated;

-- ---------------------------------------------------------------------------
-- 2. Confirmation à deux et points
-- ---------------------------------------------------------------------------
do $confirm$
declare
  v_a constant text := '72000000-0000-4000-8000-00000000000a';
  v_b constant text := '72000000-0000-4000-8000-00000000000b';
  v_slot uuid := (select id from mentoring_test_ids where name = 'slot1');
  v_rejected boolean;
  v_result jsonb;
begin
  -- Après le début : plus d'annulation.
  perform set_config('request.jwt.claim.sub', v_b, true);
  v_rejected := false;
  begin
    perform public.cancel_mentoring_booking(v_slot);
  exception when others then v_rejected := sqlerrm = 'mentoring_slot_started';
  end;
  if not v_rejected then raise exception 'booking cancelled after start'; end if;

  perform set_config('request.jwt.claim.sub', v_a, true);
  v_rejected := false;
  begin
    perform public.cancel_mentoring_slot(v_slot);
  exception when others then v_rejected := sqlerrm = 'mentoring_slot_started';
  end;
  if not v_rejected then raise exception 'slot cancelled after start'; end if;

  -- Une seule confirmation : aucun point.
  perform set_config('request.jwt.claim.sub', v_b, true);
  v_result := public.confirm_mentoring_session(v_slot);
  if v_result ->> 'status' <> 'waiting_other' or (v_result ->> 'xp_gained')::integer <> 0 then
    raise exception 'single confirmation result wrong: %', v_result;
  end if;
  v_result := public.confirm_mentoring_session(v_slot);
  if v_result ->> 'status' <> 'waiting_other' then
    raise exception 'repeated single confirmation result wrong: %', v_result;
  end if;
end
$confirm$;

reset role;

do $no_xp_yet$
begin
  if exists (
    select 1 from public.xp_history
    where user_id in ('72000000-0000-4000-8000-00000000000a', '72000000-0000-4000-8000-00000000000b')
      and action = 'MENTORING_SESSION'
  ) then
    raise exception 'XP awarded with a single confirmation';
  end if;
end
$no_xp_yet$;

set local role authenticated;

do $both$
declare
  v_slot uuid := (select id from mentoring_test_ids where name = 'slot1');
  v_result jsonb;
begin
  perform set_config('request.jwt.claim.sub', '72000000-0000-4000-8000-00000000000a', true);
  v_result := public.confirm_mentoring_session(v_slot);
  if v_result ->> 'status' <> 'completed' or (v_result ->> 'xp_gained')::integer <> 30 then
    raise exception 'double confirmation result wrong: %', v_result;
  end if;
  -- Rejouer : aucun point supplémentaire.
  v_result := public.confirm_mentoring_session(v_slot);
  if not (v_result ->> 'already_confirmed')::boolean or (v_result ->> 'xp_gained')::integer <> 30 then
    raise exception 'replayed confirmation result wrong: %', v_result;
  end if;
end
$both$;

reset role;

do $xp_once$
declare
  v_count integer;
  v_total integer;
  v_house integer;
begin
  select count(*) into v_count from public.xp_history
  where action = 'MENTORING_SESSION'
    and user_id in ('72000000-0000-4000-8000-00000000000a', '72000000-0000-4000-8000-00000000000b');
  if v_count <> 2 then raise exception 'expected one award each, got % rows', v_count; end if;

  select total_xp, house_points into v_total, v_house from public.gamification_data
  where user_id = '72000000-0000-4000-8000-00000000000b';
  if v_total <> 30 or v_house <> 30 then
    raise exception 'mentee totals wrong: xp %, house points %', v_total, v_house;
  end if;
  select total_xp, house_points into v_total, v_house from public.gamification_data
  where user_id = '72000000-0000-4000-8000-00000000000a';
  if v_total <> 30 or v_house <> 30 then
    raise exception 'mentor totals wrong: xp %, house points %', v_total, v_house;
  end if;
end
$xp_once$;

-- ---------------------------------------------------------------------------
-- 3. Plafond hebdomadaire, non-joueur, créneau annulé, confirmation unique
-- ---------------------------------------------------------------------------
set local role authenticated;

do $more_slots$
declare
  v_a constant text := '72000000-0000-4000-8000-00000000000a';
  v_b constant text := '72000000-0000-4000-8000-00000000000b';
  v_c constant text := '72000000-0000-4000-8000-00000000000c';
  v_d constant text := '72000000-0000-4000-8000-00000000000d';
  v_slot uuid;
begin
  -- slot2 : A mentor, B étudiant (2e rencontre récompensée de la semaine).
  perform set_config('request.jwt.claim.sub', v_a, true);
  v_slot := public.create_mentoring_slot(now() + interval '2 days', now() + interval '2 days 1 hour', 'Visio', 'Examens');
  insert into mentoring_test_ids values ('slot2', v_slot);
  perform set_config('request.jwt.claim.sub', v_b, true);
  perform public.book_mentoring_slot(v_slot, null);

  -- slot3 : A mentor (plafond atteint), D non-joueur.
  perform set_config('request.jwt.claim.sub', v_a, true);
  v_slot := public.create_mentoring_slot(now() + interval '3 days', now() + interval '3 days 1 hour', 'Visio', 'Organisation');
  insert into mentoring_test_ids values ('slot3', v_slot);
  perform set_config('request.jwt.claim.sub', v_d, true);
  perform public.book_mentoring_slot(v_slot, null);

  -- slot4 : A mentor, C étudiant, puis A annule.
  perform set_config('request.jwt.claim.sub', v_a, true);
  v_slot := public.create_mentoring_slot(now() + interval '4 days', now() + interval '4 days 1 hour', 'Visio', 'Stages PFP');
  insert into mentoring_test_ids values ('slot4', v_slot);
  perform set_config('request.jwt.claim.sub', v_c, true);
  perform public.book_mentoring_slot(v_slot, null);
  perform set_config('request.jwt.claim.sub', v_a, true);
  perform public.cancel_mentoring_slot(v_slot);

  -- slot5 : C mentor, B étudiant ; seul B confirmera.
  perform set_config('request.jwt.claim.sub', v_c, true);
  v_slot := public.create_mentoring_slot(now() + interval '5 days', now() + interval '5 days 1 hour', 'Cafétéria', 'Texte inapproprié');
  insert into mentoring_test_ids values ('slot5', v_slot);
  perform set_config('request.jwt.claim.sub', v_b, true);
  perform public.book_mentoring_slot(v_slot, null);
end
$more_slots$;

reset role;

-- Toutes ces rencontres tombent dans la même semaine que la première.
update public.mentoring_slots
set starts_at = now() - interval '3 hours', ends_at = now() - interval '2 hours'
where id in (select id from mentoring_test_ids where name in ('slot2', 'slot3', 'slot4', 'slot5'));

set local role authenticated;

do $caps$
declare
  v_a constant text := '72000000-0000-4000-8000-00000000000a';
  v_b constant text := '72000000-0000-4000-8000-00000000000b';
  v_c constant text := '72000000-0000-4000-8000-00000000000c';
  v_d constant text := '72000000-0000-4000-8000-00000000000d';
  v_slot2 uuid := (select id from mentoring_test_ids where name = 'slot2');
  v_slot3 uuid := (select id from mentoring_test_ids where name = 'slot3');
  v_slot4 uuid := (select id from mentoring_test_ids where name = 'slot4');
  v_slot5 uuid := (select id from mentoring_test_ids where name = 'slot5');
  v_result jsonb;
  v_rejected boolean;
  v_count integer;
begin
  -- 2e rencontre de la semaine : encore récompensée.
  perform set_config('request.jwt.claim.sub', v_a, true);
  perform public.confirm_mentoring_session(v_slot2);
  perform set_config('request.jwt.claim.sub', v_b, true);
  v_result := public.confirm_mentoring_session(v_slot2);
  if (v_result ->> 'xp_gained')::integer <> 30 then
    raise exception 'second weekly session not rewarded: %', v_result;
  end if;

  -- 3e rencontre : plafond pour A, pas de points pour D (non-joueur).
  perform set_config('request.jwt.claim.sub', v_d, true);
  perform public.confirm_mentoring_session(v_slot3);
  perform set_config('request.jwt.claim.sub', v_a, true);
  v_result := public.confirm_mentoring_session(v_slot3);
  if v_result ->> 'status' <> 'completed' or (v_result ->> 'xp_gained')::integer <> 0 or v_result ->> 'reason' <> 'weekly_cap' then
    raise exception 'weekly cap not applied: %', v_result;
  end if;
  perform set_config('request.jwt.claim.sub', v_d, true);
  v_result := public.confirm_mentoring_session(v_slot3);
  if (v_result ->> 'xp_gained')::integer <> 0 or v_result ->> 'reason' <> 'not_player' then
    raise exception 'non-player rewarded: %', v_result;
  end if;

  -- Créneau annulé : aucune confirmation possible.
  perform set_config('request.jwt.claim.sub', v_c, true);
  v_rejected := false;
  begin
    perform public.confirm_mentoring_session(v_slot4);
  exception when others then v_rejected := sqlerrm = 'mentoring_booking_not_found';
  end;
  if not v_rejected then raise exception 'cancelled slot confirmed'; end if;

  -- Une seule personne confirme (B) : aucun point, y compris la 3e de B.
  perform set_config('request.jwt.claim.sub', v_b, true);
  v_result := public.confirm_mentoring_session(v_slot5);
  if v_result ->> 'status' <> 'waiting_other' then
    raise exception 'one-sided confirmation result wrong: %', v_result;
  end if;

  -- Un non-admin ne peut pas retirer un créneau.
  v_rejected := false;
  begin
    perform public.admin_remove_mentoring_slot(v_slot5, 'test');
  exception when others then v_rejected := sqlerrm = 'mentoring_admin_required';
  end;
  if not v_rejected then raise exception 'non-admin removed a slot'; end if;

  -- L'admin retire le créneau inapproprié : plus visible des autres.
  perform set_config('request.jwt.claim.sub', '72000000-0000-4000-8000-00000000000e', true);
  perform public.admin_remove_mentoring_slot(v_slot5, 'Contenu inapproprié');

  perform set_config('request.jwt.claim.sub', v_b, true);
  select count(*) into v_count from public.mentoring_slots where id = v_slot5;
  if v_count <> 0 then raise exception 'removed slot still visible to others'; end if;
  select count(*) into v_count from public.get_my_mentoring_slots() s where s.slot_id = v_slot5;
  if v_count <> 0 then raise exception 'removed slot still listed for the mentee'; end if;
  v_rejected := false;
  begin
    perform public.confirm_mentoring_session(v_slot5);
  exception when others then v_rejected := sqlerrm = 'mentoring_booking_not_found';
  end;
  if not v_rejected then raise exception 'removed slot confirmed'; end if;
end
$caps$;

reset role;

do $totals$
declare
  v_total integer;
  v_house integer;
  v_count integer;
begin
  -- A : 2 rencontres récompensées (60 XP), la 3e plafonnée.
  select total_xp, house_points into v_total, v_house from public.gamification_data
  where user_id = '72000000-0000-4000-8000-00000000000a';
  if v_total <> 60 or v_house <> 60 then raise exception 'mentor A totals: % / %', v_total, v_house; end if;

  -- B : 2 rencontres récompensées (60 XP), rien pour la confirmation unique.
  select total_xp, house_points into v_total, v_house from public.gamification_data
  where user_id = '72000000-0000-4000-8000-00000000000b';
  if v_total <> 60 or v_house <> 60 then raise exception 'mentee B totals: % / %', v_total, v_house; end if;

  -- C (créneau annulé, puis confirmation unique de l'autre) et D (non-joueur) : aucun XP.
  select count(*) into v_count from public.xp_history
  where user_id in ('72000000-0000-4000-8000-00000000000c', '72000000-0000-4000-8000-00000000000d');
  if v_count <> 0 then raise exception 'XP awarded to C or D: % rows', v_count; end if;

  select count(*) into v_count from public.xp_history
  where action = 'MENTORING_SESSION' and user_id::text like '72000000-0000-4000-8000-%';
  if v_count <> 4 then raise exception 'expected 4 mentoring awards, got %', v_count; end if;

  -- Le mentor du créneau retiré est prévenu.
  select count(*) into v_count from public.push_outbox
  where user_id = '72000000-0000-4000-8000-00000000000c' and title = 'Mentorat : créneau retiré';
  if v_count <> 1 then raise exception 'removed slot mentor not notified'; end if;
end
$totals$;

rollback;

select 'gamification mentoring isolation: passed' as result;
