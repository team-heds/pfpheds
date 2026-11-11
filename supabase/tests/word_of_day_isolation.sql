\set ON_ERROR_STOP on
-- Mot du jour physio : le mot reste secret tant que la partie continue, les essais et les
-- XP sont décidés par le serveur, une seule partie par jour, réservé aux joueurs.
-- Tout est annulé à la fin.

begin;

insert into auth.users (
  id, instance_id, email, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
)
values
  ('73000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'mot.un@example.invalid', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('73000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'mot.deux@example.invalid', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'),
  ('73000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'mot.hors.jeu@example.invalid', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated');

insert into public.user_profiles (user_id, email, display_name, is_active)
values
  ('73000000-0000-4000-8000-000000000001', 'mot.un@example.invalid', 'Joueur Un', true),
  ('73000000-0000-4000-8000-000000000002', 'mot.deux@example.invalid', 'Joueur Deux', true),
  ('73000000-0000-4000-8000-000000000003', 'mot.hors.jeu@example.invalid', 'Hors Jeu', true)
on conflict (user_id) do update set display_name = excluded.display_name;

-- Récompenses actives, public restreint à une liste : seuls Un et Deux sont joueurs.
update gamification_private.rollout_config
set rewards_enabled = true, audience_mode = 'allowlist'
where singleton;

insert into gamification_private.rollout_audience (user_id, added_by)
values
  ('73000000-0000-4000-8000-000000000001', '73000000-0000-4000-8000-000000000001'),
  ('73000000-0000-4000-8000-000000000002', '73000000-0000-4000-8000-000000000001')
on conflict (user_id) do nothing;

-- Le mot du jour est fixé à FEMUR pour le test ; trois jours passés sont planifiés.
insert into gamification_private.word_of_day_schedule (play_date, word_id)
select gamification_private.word_of_day_today(), w.id
from gamification_private.word_of_day_words w
where w.word = 'FEMUR'
on conflict (play_date) do update set word_id = excluded.word_id;

insert into gamification_private.word_of_day_schedule (play_date, word_id)
select gamification_private.word_of_day_today() - d.offset_days, w.id
from (values (1, 'TIBIA'), (2, 'TALON'), (4, 'ATLAS')) as d(offset_days, word)
join gamification_private.word_of_day_words w on w.word = d.word
on conflict (play_date) do nothing;

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
     or has_function_privilege('authenticated', 'gamification_private.word_of_day_feedback(text, text)', 'execute') then
    raise exception 'authenticated must not call private word of day helpers';
  end if;
end
$grants$;

-- Joueur Un : deux jours gagnés auparavant, une partie abandonnée il y a quatre jours.
insert into gamification_private.word_of_day_guesses (user_id, play_date, attempt_no, guess, feedback, is_correct)
values
  ('73000000-0000-4000-8000-000000000001', gamification_private.word_of_day_today() - 1, 1, 'TIBIA', 'CCCCC', true),
  ('73000000-0000-4000-8000-000000000001', gamification_private.word_of_day_today() - 2, 1, 'TALON', 'CCCCC', true),
  ('73000000-0000-4000-8000-000000000001', gamification_private.word_of_day_today() - 4, 1, 'TALON', 'PPPAA', false);

select set_config('request.jwt.claim.sub', '73000000-0000-4000-8000-000000000001', true);
set local role authenticated;

do $player_one$
declare
  v_state jsonb;
  v_rejected boolean := false;
begin
  v_state := public.get_my_word_of_day();
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

  -- Trouvé au deuxième essai (saisie accentuée acceptée) : 10 + 5 XP.
  v_state := public.submit_my_word_of_day_guess('Fémur');
  if v_state ->> 'status' <> 'won'
     or (v_state ->> 'xp_awarded')::integer <> 15
     or v_state #>> '{solution,word}' <> 'Fémur'
     or coalesce(v_state #>> '{solution,definition}', '') = ''
     or (v_state #>> '{stats,played}')::integer <> 4
     or (v_state #>> '{stats,win_rate}')::integer <> 75
     or (v_state #>> '{stats,current_streak}')::integer <> 3
     or (v_state #>> '{stats,best_streak}')::integer <> 3 then
    raise exception 'unexpected state after winning: %', v_state;
  end if;

  -- Une seule partie par jour.
  v_rejected := false;
  begin
    perform public.submit_my_word_of_day_guess('TIBIA');
  exception when others then
    v_rejected := true;
  end;
  if not v_rejected then raise exception 'a second game was accepted the same day'; end if;
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
  where user_id = '73000000-0000-4000-8000-000000000001' and action = 'WORD_OF_DAY';
  if v_rows <> 1 or v_amount <> 15 then
    raise exception 'expected one 15 XP award, found % rows / % XP', v_rows, v_amount;
  end if;

  select total_xp, house_points into v_total, v_house
  from public.gamification_data
  where user_id = '73000000-0000-4000-8000-000000000001';
  if v_total <> 15 or v_house <> 15 then
    raise exception 'XP must count for the player and the house: % / %', v_total, v_house;
  end if;
end
$ledger_one$;

-- Joueur Deux : trouvé au quatrième essai, 10 XP sans bonus.
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
  if v_state ->> 'status' <> 'won' or (v_state ->> 'xp_awarded')::integer <> 10 then
    raise exception 'expected 10 XP at the fourth attempt: %', v_state;
  end if;
  if (v_state #>> '{stats,current_streak}')::integer <> 1 then
    raise exception 'unexpected streak for player two: %', v_state -> 'stats';
  end if;
end
$player_two$;

reset role;

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
end
$ledger_end$;

rollback;
