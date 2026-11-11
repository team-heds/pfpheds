\set ON_ERROR_STOP on
-- Mot de la semaine physio (ancien « Mot du jour ») : le mot reste secret tant que la
-- partie continue, les essais et les XP sont décidés par le serveur, une seule partie et
-- un seul gain par semaine (lundi à dimanche, heure de Zurich), réservé aux joueurs ; les
-- parties quotidiennes déjà jouées sont reprises sans second gain.
-- À lancer après 20261112100000_gamification_word_of_week.sql. Tout est annulé à la fin.

begin;

insert into auth.users (
  id, instance_id, email, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
)
values
  ('73000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'mot.un@example.invalid', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('73000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'mot.deux@example.invalid', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('73000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'mot.hors.jeu@example.invalid', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('73000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'mot.deja.paye@example.invalid', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('73000000-0000-4000-8000-000000000005', '00000000-0000-0000-0000-000000000000', 'mot.repris@example.invalid', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated');

insert into public.user_profiles (user_id, email, display_name, is_active)
values
  ('73000000-0000-4000-8000-000000000001', 'mot.un@example.invalid', 'Joueur Un', true),
  ('73000000-0000-4000-8000-000000000002', 'mot.deux@example.invalid', 'Joueur Deux', true),
  ('73000000-0000-4000-8000-000000000003', 'mot.hors.jeu@example.invalid', 'Hors Jeu', true),
  ('73000000-0000-4000-8000-000000000004', 'mot.deja.paye@example.invalid', 'Déjà Payé', true),
  ('73000000-0000-4000-8000-000000000005', 'mot.repris@example.invalid', 'Partie Reprise', true)
on conflict (user_id) do update set display_name = excluded.display_name;

-- Récompenses actives, public restreint à une liste : Hors Jeu n'est pas joueur.
update gamification_private.rollout_config
set rewards_enabled = true, audience_mode = 'allowlist'
where singleton;

insert into gamification_private.rollout_audience (user_id, added_by)
values
  ('73000000-0000-4000-8000-000000000001', '73000000-0000-4000-8000-000000000001'),
  ('73000000-0000-4000-8000-000000000002', '73000000-0000-4000-8000-000000000001'),
  ('73000000-0000-4000-8000-000000000004', '73000000-0000-4000-8000-000000000001'),
  ('73000000-0000-4000-8000-000000000005', '73000000-0000-4000-8000-000000000001')
on conflict (user_id) do nothing;

-- Changement de semaine : le lundi à 00:00, heure de Zurich (et non à minuit UTC).
do $week$
declare
  v_week date := gamification_private.word_of_day_week_start();
begin
  if gamification_private.word_of_day_week_start('2026-11-11 12:00:00+01') <> date '2026-11-09'
     or gamification_private.word_of_day_week_start('2026-11-09 00:00:00+01') <> date '2026-11-09'
     or gamification_private.word_of_day_week_start('2026-11-15 23:59:59+01') <> date '2026-11-09'
     or gamification_private.word_of_day_week_start('2026-11-16 00:00:00+01') <> date '2026-11-16'
     -- Dimanche 23:30 UTC : déjà lundi à Zurich.
     or gamification_private.word_of_day_week_start('2026-11-15 23:30:00+00') <> date '2026-11-16'
     -- Heure d'été : lundi 00:00 à Zurich = dimanche 22:00 UTC.
     or gamification_private.word_of_day_week_start('2026-07-05 21:59:59+00') <> date '2026-06-29'
     or gamification_private.word_of_day_week_start('2026-07-05 22:00:00+00') <> date '2026-07-06' then
    raise exception 'unexpected week boundaries';
  end if;
  if extract(isodow from v_week) <> 1
     or gamification_private.word_of_day_today() not between v_week and v_week + 6 then
    raise exception 'current week must start on a Monday and contain today: %', v_week;
  end if;
  if gamification_private.word_of_day_event_keys(date '2026-11-09') <> array[
    'word-of-week:2026-11-09',
    'word-of-day:2026-11-09', 'word-of-day:2026-11-10', 'word-of-day:2026-11-11', 'word-of-day:2026-11-12',
    'word-of-day:2026-11-13', 'word-of-day:2026-11-14', 'word-of-day:2026-11-15'
  ] then
    raise exception 'unexpected weekly event keys';
  end if;
end
$week$;

-- Le mot de la semaine est fixé à FEMUR pour le test ; trois semaines passées sont
-- planifiées. Un ancien « mot du jour » (FEMUR aussi) existe le mercredi de cette semaine,
-- comme le mot tiré le 11 novembre 2026.
insert into gamification_private.word_of_day_schedule (play_date, word_id)
select gamification_private.word_of_day_week_start() + d.offset_days, w.id
from (values (0), (2)) as d(offset_days)
cross join gamification_private.word_of_day_words w
where w.word = 'FEMUR'
on conflict (play_date) do update set word_id = excluded.word_id;

insert into gamification_private.word_of_day_schedule (play_date, word_id)
select gamification_private.word_of_day_week_start() - d.offset_days, w.id
from (values (7, 'TIBIA'), (14, 'TALON'), (28, 'ATLAS')) as d(offset_days, word)
join gamification_private.word_of_day_words w on w.word = d.word
on conflict (play_date) do nothing;

-- Une ancienne semaine jouée au jour le jour : FEMUR le mercredi 8 janvier 2025, TIBIA le
-- jeudi 9. Partie Reprise a joué les deux jours, Déjà Payé seulement le jeudi.
insert into gamification_private.word_of_day_schedule (play_date, word_id)
select d.play_date, w.id
from (values (date '2025-01-08', 'FEMUR'), (date '2025-01-09', 'TIBIA')) as d(play_date, word)
join gamification_private.word_of_day_words w on w.word = d.word;

insert into gamification_private.word_of_day_guesses (user_id, play_date, attempt_no, guess, feedback, is_correct)
values
  ('73000000-0000-4000-8000-000000000005', date '2025-01-08', 1, 'MUFLE', 'PPPAP', false),
  ('73000000-0000-4000-8000-000000000005', date '2025-01-08', 2, 'FEMUR', 'CCCCC', true),
  ('73000000-0000-4000-8000-000000000005', date '2025-01-09', 1, 'TIBIA', 'CCCCC', true),
  ('73000000-0000-4000-8000-000000000004', date '2025-01-09', 1, 'TIBIA', 'CCCCC', true);

-- Cette semaine, avant le passage à la semaine : Partie Reprise a trouvé le mot du jour
-- du mercredi au 2e essai et a reçu 15 XP ; Déjà Payé a reçu 10 XP pour un mot du jour du
-- jeudi (autre mot, partie non reprise).
insert into gamification_private.word_of_day_guesses (user_id, play_date, attempt_no, guess, feedback, is_correct)
select '73000000-0000-4000-8000-000000000005', gamification_private.word_of_day_week_start() + 2, a.attempt_no, a.guess, a.feedback, a.is_correct
from (values (1, 'MUFLE', 'PPPAP', false), (2, 'FEMUR', 'CCCCC', true)) as a(attempt_no, guess, feedback, is_correct);

select public.gamification_award_xp_internal(
  '73000000-0000-4000-8000-000000000005', 'WORD_OF_DAY', 15,
  'word-of-day:' || (gamification_private.word_of_day_week_start() + 2)::text,
  'word_of_day', null, 'Mot du jour trouvé en 3 essais ou moins');
select public.gamification_award_xp_internal(
  '73000000-0000-4000-8000-000000000004', 'WORD_OF_DAY', 10,
  'word-of-day:' || (gamification_private.word_of_day_week_start() + 3)::text,
  'word_of_day', null, 'Mot du jour trouvé');

-- Reprise des parties quotidiennes (ce que fait la migration à son application).
do $adopt$
declare
  v_week date := gamification_private.word_of_day_week_start();
  v_count integer;
begin
  perform gamification_private.word_of_day_adopt_daily_rows();

  -- Ancienne semaine : le premier mot tiré (FEMUR, mercredi) devient le mot de la semaine
  -- du lundi 6 janvier 2025 ; ses essais suivent, ceux du jeudi restent où ils étaient.
  if not exists (
    select 1 from gamification_private.word_of_day_schedule s
    join gamification_private.word_of_day_words w on w.id = s.word_id
    where s.play_date = date '2025-01-06' and w.word = 'FEMUR'
  ) then
    raise exception 'the first daily word must become the word of its week';
  end if;
  select count(*) into v_count from gamification_private.word_of_day_guesses
  where user_id = '73000000-0000-4000-8000-000000000005' and play_date = date '2025-01-06';
  if v_count <> 2 then raise exception 'daily guesses were not kept for the week: %', v_count; end if;
  select count(*) into v_count from gamification_private.word_of_day_guesses
  where play_date = date '2025-01-08';
  if v_count <> 0 then raise exception 'guesses left on the adopted day: %', v_count; end if;
  select count(*) into v_count from gamification_private.word_of_day_guesses
  where play_date = date '2025-01-09';
  if v_count <> 2 then raise exception 'later daily guesses must stay untouched: %', v_count; end if;
  select count(*) into v_count from gamification_private.word_of_day_schedule
  where play_date in (date '2025-01-08', date '2025-01-09');
  if v_count <> 2 then raise exception 'daily schedule rows must be kept: %', v_count; end if;

  -- Semaine en cours : les essais du mercredi sont rattachés à la semaine.
  select count(*) into v_count from gamification_private.word_of_day_guesses
  where user_id = '73000000-0000-4000-8000-000000000005' and play_date = v_week;
  if v_count <> 2 then raise exception 'this week''s daily guesses were not kept: %', v_count; end if;

  -- Relancer la reprise ne change plus rien.
  if gamification_private.word_of_day_adopt_daily_rows() <> 0 then
    raise exception 'adopting daily rows twice must be a no-op';
  end if;
end
$adopt$;

do $catalog$
declare
  v_count integer;
begin
  select count(*) into v_count from gamification_private.word_of_day_words where is_active;
  if v_count < 200 then
    raise exception 'word list must hold at least 200 active words, found %', v_count;
  end if;

  -- Indices : lettres répétées signalées une seule fois, bien placées prioritaires.
  if gamification_private.word_of_day_feedback('FEMUR', 'MUFLE') <> 'PPPAP' then
    raise exception 'unexpected feedback for MUFLE';
  end if;
  if gamification_private.word_of_day_feedback('TALON', 'TOTAL') <> 'CPAPP' then
    raise exception 'unexpected feedback for TOTAL';
  end if;
  if gamification_private.word_of_day_feedback('TENDON', 'TENDON') <> 'CCCCCC' then
    raise exception 'unexpected feedback for exact word';
  end if;
end
$catalog$;

do $grants$
declare
  v_table text;
begin
  foreach v_table in array array[
    'gamification_private.word_of_day_words',
    'gamification_private.word_of_day_schedule',
    'gamification_private.word_of_day_guesses'
  ] loop
    if has_table_privilege('authenticated', v_table, 'select')
       or has_table_privilege('authenticated', v_table, 'insert')
       or has_table_privilege('authenticated', v_table, 'update')
       or has_table_privilege('authenticated', v_table, 'delete')
       or has_table_privilege('anon', v_table, 'select') then
      raise exception 'browser roles must not access %', v_table;
    end if;
    if not (select c.relrowsecurity from pg_class c where c.oid = v_table::regclass) then
      raise exception 'RLS must be enabled on %', v_table;
    end if;
  end loop;

  if has_function_privilege('anon', 'public.get_my_word_of_day()', 'execute')
     or has_function_privilege('anon', 'public.submit_my_word_of_day_guess(text)', 'execute') then
    raise exception 'anon must not play the word of the day';
  end if;
  if has_function_privilege('authenticated', 'gamification_private.word_of_day_state(uuid)', 'execute')
     or has_function_privilege('authenticated', 'gamification_private.word_of_day_ensure(date)', 'execute')
     or has_function_privilege('authenticated', 'gamification_private.word_of_day_adopt_daily_rows()', 'execute')
     or has_function_privilege('authenticated', 'gamification_private.word_of_day_week_start(timestamptz)', 'execute')
     or has_function_privilege('authenticated', 'gamification_private.word_of_day_event_keys(date)', 'execute')
     or has_function_privilege('authenticated', 'gamification_private.word_of_day_feedback(text, text)', 'execute') then
    raise exception 'authenticated must not call private word of day helpers';
  end if;
end
$grants$;

-- Défi hebdomadaire « Mot de la semaine » (à lancer après
-- 20261112110000_gamification_challenge_action_link.sql) : lien d'action interne, aucune
-- récompense propre. Partie Reprise a déjà trouvé le mot : son défi se coche à la reprise.
do $challenge$
declare
  v_week date := gamification_private.word_of_day_week_start();
  v_rejected boolean := false;
begin
  insert into public.challenges (id, name, description, action_type, target_value, xp_reward, start_date, end_date, is_active, status, action_url)
  values ('73000000-0000-4000-8000-0000000000c1', 'Test mot de la semaine', 'Test', 'word_of_week', 1, 0, v_week, v_week + 6, true, 'active', '/mot-de-la-semaine');

  if not coalesce((gamification_private.validate_lifecycle_entity('challenge', '73000000-0000-4000-8000-0000000000c1') ->> 'valid')::boolean, false) then
    raise exception 'the weekly word challenge must be a valid challenge';
  end if;

  -- Le lien d'un défi ne peut être qu'une adresse interne.
  begin
    update public.challenges set action_url = 'https://exemple.invalid/jeu'
    where id = '73000000-0000-4000-8000-0000000000c1';
  exception when check_violation then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'an external action link was accepted'; end if;

  if gamification_private.word_of_day_mark_challenge('73000000-0000-4000-8000-000000000005', v_week) <> 1 then
    raise exception 'the challenge was not ticked for a player who already found the word';
  end if;
  if has_function_privilege('authenticated', 'gamification_private.word_of_day_mark_challenge(uuid, date)', 'execute') then
    raise exception 'authenticated must not tick the challenge directly';
  end if;
end
$challenge$;

-- Joueur Un : deux semaines gagnées auparavant, une partie abandonnée il y a quatre semaines.
insert into gamification_private.word_of_day_guesses (user_id, play_date, attempt_no, guess, feedback, is_correct)
values
  ('73000000-0000-4000-8000-000000000001', gamification_private.word_of_day_week_start() - 7, 1, 'TIBIA', 'CCCCC', true),
  ('73000000-0000-4000-8000-000000000001', gamification_private.word_of_day_week_start() - 14, 1, 'TALON', 'CCCCC', true),
  ('73000000-0000-4000-8000-000000000001', gamification_private.word_of_day_week_start() - 28, 1, 'TALON', 'PPPAA', false);

select set_config('request.jwt.claim.sub', '73000000-0000-4000-8000-000000000001', true);
set local role authenticated;

do $player_one$
declare
  v_state jsonb;
  v_rejected boolean := false;
begin
  v_state := public.get_my_word_of_day();
  -- Semaine du lundi au dimanche, mot suivant le lundi à 00:00 (heure de Zurich).
  if v_state ->> 'period' <> 'week'
     or extract(isodow from (v_state ->> 'week_start')::date) <> 1
     or (v_state ->> 'play_date')::date <> (v_state ->> 'week_start')::date
     or (v_state ->> 'week_end')::date <> (v_state ->> 'week_start')::date + 6
     or (v_state ->> 'next_word_at')::timestamptz
        <> (((v_state ->> 'week_start')::date + 7)::timestamp at time zone 'Europe/Zurich') then
    raise exception 'unexpected week in state: %', v_state;
  end if;
  if not (v_state ->> 'eligible')::boolean
     or (v_state ->> 'word_length')::integer <> 5
     or (v_state ->> 'max_attempts')::integer <> 6
     or v_state ->> 'status' <> 'in_progress'
     or jsonb_array_length(v_state -> 'attempts') <> 0
     or v_state -> 'solution' <> 'null'::jsonb then
    raise exception 'unexpected initial state: %', v_state;
  end if;
  if upper(v_state::text) like '%FEMUR%' or v_state::text like '%Fémur%' then
    raise exception 'the word leaked before the end of the game';
  end if;
  if (v_state #>> '{stats,played}')::integer <> 3
     or (v_state #>> '{stats,win_rate}')::integer <> 67
     or (v_state #>> '{stats,current_streak}')::integer <> 2 then
    raise exception 'unexpected stats before playing: %', v_state -> 'stats';
  end if;

  -- Aucune lecture directe de la liste, du mot du jour ni des essais.
  begin
    perform 1 from gamification_private.word_of_day_words limit 1;
  exception when insufficient_privilege then
    v_rejected := true;
  end;
  if not v_rejected then
    raise exception 'authenticated read the word list';
  end if;

  -- Essai refusé : mauvaise longueur, puis caractères interdits.
  v_rejected := false;
  begin
    perform public.submit_my_word_of_day_guess('OS');
  exception when others then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'short guess accepted'; end if;

  v_rejected := false;
  begin
    perform public.submit_my_word_of_day_guess('FEM1R');
  exception when others then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'non-letter guess accepted'; end if;

  -- Premier essai : seuls les indices reviennent, le mot reste secret.
  v_state := public.submit_my_word_of_day_guess('mufle');
  if v_state #>> '{attempts,0,guess}' <> 'MUFLE'
     or v_state #>> '{attempts,0,feedback}' <> 'PPPAP'
     or v_state ->> 'status' <> 'in_progress'
     or v_state -> 'solution' <> 'null'::jsonb
     or (v_state ->> 'xp_awarded')::integer <> 0 then
    raise exception 'unexpected state after first guess: %', v_state;
  end if;
  if upper(v_state::text) like '%FEMUR%' or v_state::text like '%Fémur%' then
    raise exception 'the word leaked after a wrong guess';
  end if;

  -- La partie reprend où elle en était.
  v_state := public.get_my_word_of_day();
  if jsonb_array_length(v_state -> 'attempts') <> 1 then
    raise exception 'progress was not saved';
  end if;

  -- Trouvé au deuxième essai (saisie accentuée acceptée) : 30 + 15 XP.
  v_state := public.submit_my_word_of_day_guess('Fémur');
  if v_state ->> 'status' <> 'won'
     or (v_state ->> 'xp_awarded')::integer <> 45
     or v_state #>> '{solution,word}' <> 'Fémur'
     or coalesce(v_state #>> '{solution,definition}', '') = ''
     or (v_state #>> '{stats,played}')::integer <> 4
     or (v_state #>> '{stats,win_rate}')::integer <> 75
     or (v_state #>> '{stats,current_streak}')::integer <> 3
     or (v_state #>> '{stats,best_streak}')::integer <> 3 then
    raise exception 'unexpected state after winning: %', v_state;
  end if;

  -- Une seule partie par semaine.
  v_rejected := false;
  begin
    perform public.submit_my_word_of_day_guess('TIBIA');
  exception when others then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'a second game was accepted the same week'; end if;
end
$player_one$;

reset role;

do $ledger_one$
declare
  v_rows integer;
  v_amount integer;
  v_total integer;
  v_house integer;
begin
  select count(*), coalesce(sum(amount), 0) into v_rows, v_amount
  from public.xp_history
  where user_id = '73000000-0000-4000-8000-000000000001'
    and action = 'WORD_OF_WEEK'
    and event_key = 'word-of-week:' || gamification_private.word_of_day_week_start()::text;
  if v_rows <> 1 or v_amount <> 45 then
    raise exception 'expected one 45 XP weekly award, found % rows / % XP', v_rows, v_amount;
  end if;
  select count(*) into v_rows from public.xp_history
  where user_id = '73000000-0000-4000-8000-000000000001';
  if v_rows <> 1 then raise exception 'expected a single award this week, found %', v_rows; end if;

  select total_xp, house_points into v_total, v_house
  from public.gamification_data
  where user_id = '73000000-0000-4000-8000-000000000001';
  if v_total <> 45 or v_house <> 45 then
    raise exception 'XP must count for the player and the house: % / %', v_total, v_house;
  end if;
end
$ledger_one$;

-- Joueur Deux : trouvé au quatrième essai, 30 XP sans bonus.
select set_config('request.jwt.claim.sub', '73000000-0000-4000-8000-000000000002', true);
set local role authenticated;

do $player_two$
declare
  v_state jsonb;
begin
  perform public.submit_my_word_of_day_guess('TIBIA');
  perform public.submit_my_word_of_day_guess('TALON');
  v_state := public.submit_my_word_of_day_guess('ATLAS');
  if v_state ->> 'status' <> 'in_progress' or v_state -> 'solution' <> 'null'::jsonb then
    raise exception 'unexpected state after three wrong guesses: %', v_state;
  end if;
  v_state := public.submit_my_word_of_day_guess('FEMUR');
  if v_state ->> 'status' <> 'won' or (v_state ->> 'xp_awarded')::integer <> 30 then
    raise exception 'expected 30 XP at the fourth attempt: %', v_state;
  end if;
  if (v_state #>> '{stats,current_streak}')::integer <> 1 then
    raise exception 'unexpected streak for player two: %', v_state -> 'stats';
  end if;
end
$player_two$;

reset role;

-- Partie Reprise : mot du jour déjà trouvé mercredi. La partie de la semaine est terminée,
-- avec ses essais et ses 15 XP d'origine : ni nouvelle partie, ni second gain.
select set_config('request.jwt.claim.sub', '73000000-0000-4000-8000-000000000005', true);
set local role authenticated;

do $adopted_player$
declare
  v_state jsonb;
  v_rejected boolean := false;
begin
  v_state := public.get_my_word_of_day();
  if v_state ->> 'status' <> 'won'
     or jsonb_array_length(v_state -> 'attempts') <> 2
     or v_state #>> '{attempts,1,guess}' <> 'FEMUR'
     or (v_state ->> 'xp_awarded')::integer <> 15
     or v_state #>> '{solution,word}' <> 'Fémur' then
    raise exception 'the daily game was not kept as this week''s game: %', v_state;
  end if;
  -- Statistiques en semaines : cette semaine et celle de janvier 2025 (le jeudi isolé de
  -- janvier 2025 n'est pas une partie hebdomadaire).
  if (v_state #>> '{stats,played}')::integer <> 2
     or (v_state #>> '{stats,won}')::integer <> 2
     or (v_state #>> '{stats,current_streak}')::integer <> 1
     or (v_state #>> '{stats,best_streak}')::integer <> 1 then
    raise exception 'unexpected weekly stats after adoption: %', v_state -> 'stats';
  end if;
  begin
    perform public.submit_my_word_of_day_guess('FEMUR');
  exception when others then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'a player who already won this week played again'; end if;
end
$adopted_player$;

reset role;

-- Déjà Payé : a reçu des XP pour un mot du jour de cette semaine sans partie reprise.
-- Il peut jouer le mot de la semaine, mais n'est pas payé une seconde fois.
select set_config('request.jwt.claim.sub', '73000000-0000-4000-8000-000000000004', true);
set local role authenticated;

do $already_paid$
declare
  v_state jsonb;
begin
  v_state := public.get_my_word_of_day();
  if v_state ->> 'status' <> 'in_progress' or jsonb_array_length(v_state -> 'attempts') <> 0 then
    raise exception 'unexpected state before playing: %', v_state;
  end if;
  v_state := public.submit_my_word_of_day_guess('FEMUR');
  if v_state ->> 'status' <> 'won' or (v_state ->> 'xp_awarded')::integer <> 10 then
    raise exception 'a player already paid this week must keep only the first award: %', v_state;
  end if;
end
$already_paid$;

reset role;

-- Défi : coché pour qui a trouvé le mot (Un, Deux, Déjà Payé, Partie Reprise), jamais
-- pour les autres, et sans aucun XP de défi.
do $challenge_progress$
declare
  v_done integer;
  v_rows integer;
begin
  select count(*) filter (where completed and current_value = 1), count(*) into v_done, v_rows
  from public.user_challenge_progress
  where challenge_id = '73000000-0000-4000-8000-0000000000c1';
  if v_done <> 4 or v_rows <> 4 then
    raise exception 'expected 4 ticked challenges, found % of % rows', v_done, v_rows;
  end if;
  if exists (
    select 1 from public.xp_history
    where user_id::text like '73000000-0000-4000-8000-00000000000%'
      and (action = 'CHALLENGE_COMPLETE' or event_key like 'challenge:%')
  ) then
    raise exception 'the weekly word challenge must not pay XP';
  end if;
end
$challenge_progress$;

do $ledger_no_double_pay$
declare
  v_rows integer;
  v_amount integer;
  v_total integer;
begin
  select count(*), coalesce(sum(amount), 0) into v_rows, v_amount
  from public.xp_history where user_id = '73000000-0000-4000-8000-000000000005';
  if v_rows <> 1 or v_amount <> 15 then
    raise exception 'adopted game paid twice: % rows / % XP', v_rows, v_amount;
  end if;
  select count(*), coalesce(sum(amount), 0) into v_rows, v_amount
  from public.xp_history where user_id = '73000000-0000-4000-8000-000000000004';
  if v_rows <> 1 or v_amount <> 10 then
    raise exception 'already paid player paid twice: % rows / % XP', v_rows, v_amount;
  end if;
  select total_xp into v_total from public.gamification_data
  where user_id = '73000000-0000-4000-8000-000000000004';
  if v_total <> 10 then raise exception 'unexpected total for already paid player: %', v_total; end if;
end
$ledger_no_double_pay$;

-- Compte hors public de la gamification : pas de partie, pas d'essai.
select set_config('request.jwt.claim.sub', '73000000-0000-4000-8000-000000000003', true);
set local role authenticated;

do $outsider$
declare
  v_state jsonb;
  v_rejected boolean := false;
begin
  v_state := public.get_my_word_of_day();
  if (v_state ->> 'eligible')::boolean or v_state ? 'word_length' then
    raise exception 'non-player received a game: %', v_state;
  end if;
  begin
    perform public.submit_my_word_of_day_guess('FEMUR');
  exception when others then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'non-player guess accepted'; end if;
end
$outsider$;

reset role;

-- Six essais manqués : partie perdue, solution révélée, aucun XP.
insert into gamification_private.rollout_audience (user_id, added_by)
values ('73000000-0000-4000-8000-000000000003', '73000000-0000-4000-8000-000000000001');

select set_config('request.jwt.claim.sub', '73000000-0000-4000-8000-000000000003', true);
set local role authenticated;

do $loser$
declare
  v_state jsonb;
begin
  for i in 1..6 loop
    v_state := public.submit_my_word_of_day_guess('TIBIA');
  end loop;
  if v_state ->> 'status' <> 'lost'
     or (v_state ->> 'xp_awarded')::integer <> 0
     or v_state #>> '{solution,word}' <> 'Fémur'
     or (v_state #>> '{stats,current_streak}')::integer <> 0
     or (v_state #>> '{stats,played}')::integer <> 1 then
    raise exception 'unexpected state after six wrong guesses: %', v_state;
  end if;
end
$loser$;

reset role;

do $ledger_end$
begin
  if exists (
    select 1 from public.xp_history
    where user_id = '73000000-0000-4000-8000-000000000003'
  ) then
    raise exception 'a lost game must not award XP';
  end if;
  if exists (
    select 1 from public.user_challenge_progress
    where user_id = '73000000-0000-4000-8000-000000000003'
  ) then
    raise exception 'a lost game must not tick the challenge';
  end if;
end
$ledger_end$;

rollback;
