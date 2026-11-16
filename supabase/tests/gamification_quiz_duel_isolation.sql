\set ON_ERROR_STOP on
-- Duel de quiz : réservé aux joueurs de la gamification, 5 questions tirées par le serveur
-- parmi les quiz publiés, bonnes réponses jamais renvoyées avant que les deux joueurs aient
-- terminé, réponse définitive, chronomètre serveur (hors délai = faux, 20 s), lecture limitée
-- aux deux joueurs (RLS), points décidés par le serveur (15 / 5 / 8 XP, comptés pour la
-- maison, plafond de 3 duels récompensés par jour), refus, forfait et expiration sans points.
-- Tout est annulé à la fin.

begin;

-- ---------------------------------------------------------------------------------------------
-- Données de test
-- ---------------------------------------------------------------------------------------------

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
)
select
  u.id::uuid, '00000000-0000-0000-0000-000000000000', u.email, 'test-only', now(),
  now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'
from (values
  ('76000000-0000-4000-8000-000000000001', 'duel.teacher@example.invalid'),
  ('76000000-0000-4000-8000-000000000011', 'duel.alice@example.invalid'),
  ('76000000-0000-4000-8000-000000000012', 'duel.bruno@example.invalid'),
  ('76000000-0000-4000-8000-000000000013', 'duel.chloe@example.invalid'),
  ('76000000-0000-4000-8000-000000000014', 'duel.dylan@example.invalid'),
  ('76000000-0000-4000-8000-000000000015', 'duel.emma@example.invalid')
) as u(id, email);

-- Classe fictive ZZ99 : les quiz de test ne visent qu'elle, le tirage reste donc limité aux
-- comptes de test même sur une base réelle.
insert into public.user_profiles (user_id, email, display_name, role, classe, is_active)
values
  ('76000000-0000-4000-8000-000000000001', 'duel.teacher@example.invalid', 'Duel Enseignant', 'EnseignantPhysio', null, true),
  ('76000000-0000-4000-8000-000000000011', 'duel.alice@example.invalid', 'Duel Alice', 'student', 'ZZ99', true),
  ('76000000-0000-4000-8000-000000000012', 'duel.bruno@example.invalid', 'Duel Bruno', 'student', 'ZZ99', true),
  ('76000000-0000-4000-8000-000000000013', 'duel.chloe@example.invalid', 'Duel Chloé', 'student', 'ZZ99', true),
  ('76000000-0000-4000-8000-000000000014', 'duel.dylan@example.invalid', 'Duel Dylan', 'student', 'ZZ99', true),
  ('76000000-0000-4000-8000-000000000015', 'duel.emma@example.invalid', 'Duel Emma', 'student', 'ZZ99', true)
on conflict (user_id) do update
set display_name = excluded.display_name, role = excluded.role, classe = excluded.classe, is_active = true;

-- Récompenses actives ; joueurs : Alice, Bruno, Chloé, Emma (Dylan n'est pas joueur).
update gamification_private.rollout_config
set rewards_enabled = true, audience_mode = 'allowlist'
where singleton;

insert into gamification_private.rollout_audience (user_id, added_by)
select u.id::uuid, '76000000-0000-4000-8000-000000000001'::uuid
from (values
  ('76000000-0000-4000-8000-000000000011'),
  ('76000000-0000-4000-8000-000000000012'),
  ('76000000-0000-4000-8000-000000000013'),
  ('76000000-0000-4000-8000-000000000015')
) as u(id)
on conflict (user_id) do nothing;

insert into public.houses (id, name, color)
values
  ('76000000-0000-4000-8000-0000000000f1', 'Maison Duel Une', '#123456'),
  ('76000000-0000-4000-8000-0000000000f2', 'Maison Duel Deux', '#654321');

-- Alice et Chloé : maison 1 ; Bruno et Emma : maison 2.
insert into public.gamification_data (user_id, email, total_xp, current_level, house_id, house_points)
values
  ('76000000-0000-4000-8000-000000000011', 'duel.alice@example.invalid', 0, 1, '76000000-0000-4000-8000-0000000000f1', 0),
  ('76000000-0000-4000-8000-000000000012', 'duel.bruno@example.invalid', 0, 1, '76000000-0000-4000-8000-0000000000f2', 0),
  ('76000000-0000-4000-8000-000000000013', 'duel.chloe@example.invalid', 0, 1, '76000000-0000-4000-8000-0000000000f1', 0),
  ('76000000-0000-4000-8000-000000000015', 'duel.emma@example.invalid', 0, 1, '76000000-0000-4000-8000-0000000000f2', 0)
on conflict (user_id) do update
set total_xp = 0, current_level = 1, house_id = excluded.house_id, house_points = 0;

-- Quiz publiés : « DuelTest » (7 questions) et « DuelRare » (2 questions) ; un brouillon
-- « DuelTest » dont les questions ne doivent jamais sortir.
insert into public.quizzes (id, author_id, title, theme, target_classes, status)
values
  ('76000000-0000-4000-8000-0000000000c1', '76000000-0000-4000-8000-000000000001', 'Quiz duel publié', 'DuelTest', '{ZZ99}', 'draft'),
  ('76000000-0000-4000-8000-0000000000c2', '76000000-0000-4000-8000-000000000001', 'Quiz duel rare', 'DuelRare', '{ZZ99}', 'draft'),
  ('76000000-0000-4000-8000-0000000000c3', '76000000-0000-4000-8000-000000000001', 'Quiz duel brouillon', 'DuelTest', '{ZZ99}', 'draft');

insert into public.quiz_questions (id, quiz_id, position, kind, prompt, explanation, options)
select
  ('76000000-0000-4000-8000-0000000001' || lpad(n::text, 2, '0'))::uuid,
  '76000000-0000-4000-8000-0000000000c1',
  n,
  case when n = 7 then 'multiple' else 'single' end,
  'Question duel ' || n,
  'Explication duel ' || n,
  case when n = 7
    then '[{"id":"a","label":"Juste","correct":true},{"id":"b","label":"Juste aussi","correct":true},{"id":"c","label":"Faux","correct":false}]'::jsonb
    else '[{"id":"a","label":"Faux","correct":false},{"id":"b","label":"Juste","correct":true},{"id":"c","label":"Faux","correct":false}]'::jsonb
  end
from generate_series(1, 7) as g(n);

insert into public.quiz_questions (id, quiz_id, position, kind, prompt, options)
values
  ('76000000-0000-4000-8000-000000000201', '76000000-0000-4000-8000-0000000000c2', 1, 'single', 'Rare un',
    '[{"id":"a","label":"Juste","correct":true},{"id":"b","label":"Faux","correct":false}]'),
  ('76000000-0000-4000-8000-000000000202', '76000000-0000-4000-8000-0000000000c2', 2, 'single', 'Rare deux',
    '[{"id":"a","label":"Juste","correct":true},{"id":"b","label":"Faux","correct":false}]'),
  ('76000000-0000-4000-8000-000000000301', '76000000-0000-4000-8000-0000000000c3', 1, 'single', 'Brouillon un',
    '[{"id":"a","label":"Juste","correct":true},{"id":"b","label":"Faux","correct":false}]');

update public.quizzes set status = 'published'
where id in ('76000000-0000-4000-8000-0000000000c1', '76000000-0000-4000-8000-0000000000c2');

-- Joue toutes les questions restantes d'un joueur (appelle les vraies fonctions avec son
-- identité). p_correct : nombre de premières questions répondues juste, les autres fausses.
create function pg_temp.play_duel(p_duel uuid, p_user uuid, p_correct integer)
returns jsonb
language plpgsql
as $$
declare
  v_next jsonb;
  v_answer jsonb;
  v_pos integer;
  v_options jsonb;
  v_selected text[];
begin
  perform set_config('request.jwt.claim.sub', p_user::text, true);
  loop
    v_next := public.next_quiz_duel_question(p_duel);
    exit when (v_next ->> 'done')::boolean;
    v_pos := (v_next ->> 'position')::integer;
    select qq.options into v_options
    from public.quiz_duels d join public.quiz_questions qq on qq.id = d.question_ids[v_pos]
    where d.id = p_duel;
    if v_pos <= p_correct then
      select array_agg(o ->> 'id') into v_selected
      from jsonb_array_elements(v_options) o where o -> 'correct' = 'true'::jsonb;
    else
      select array[min(o ->> 'id')] into v_selected
      from jsonb_array_elements(v_options) o where o -> 'correct' = 'false'::jsonb;
    end if;
    v_answer := public.answer_quiz_duel_question(p_duel, v_pos, v_selected);
  end loop;
  return v_next;
end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Droits
-- ---------------------------------------------------------------------------------------------

do $grants$
declare
  v_table text;
  v_fn text;
begin
  foreach v_table in array array['quiz_duels', 'quiz_duel_responses', 'quiz_duel_steps', 'quiz_duel_answers', 'quiz_duel_outcomes'] loop
    if not (select relrowsecurity from pg_class where oid = ('public.' || v_table)::regclass) then
      raise exception 'RLS must be enabled on %', v_table;
    end if;
    if has_table_privilege('anon', 'public.' || v_table, 'select')
       or has_table_privilege('anon', 'public.' || v_table, 'insert') then
      raise exception 'anon must not access %', v_table;
    end if;
    if has_table_privilege('authenticated', 'public.' || v_table, 'insert')
       or has_table_privilege('authenticated', 'public.' || v_table, 'update')
       or has_table_privilege('authenticated', 'public.' || v_table, 'delete') then
      raise exception 'authenticated must not write % directly', v_table;
    end if;
  end loop;

  -- Réponses et chronomètres : jamais lisibles directement (la correction en dépend).
  if has_table_privilege('authenticated', 'public.quiz_duel_answers', 'select')
     or has_table_privilege('authenticated', 'public.quiz_duel_steps', 'select') then
    raise exception 'duel answers and steps must not be readable from the browser';
  end if;

  foreach v_fn in array array[
    'public.get_my_quiz_duels()', 'public.search_quiz_duel_opponents(text)',
    'public.create_quiz_duel(uuid, text)', 'public.respond_quiz_duel(uuid, boolean)',
    'public.next_quiz_duel_question(uuid)', 'public.answer_quiz_duel_question(uuid, integer, text[])',
    'public.get_quiz_duel(uuid)'
  ] loop
    if has_function_privilege('anon', v_fn, 'execute') then
      raise exception 'anon must not call %', v_fn;
    end if;
    if not has_function_privilege('authenticated', v_fn, 'execute') then
      raise exception 'authenticated must call %', v_fn;
    end if;
  end loop;

  foreach v_fn in array array[
    'gamification_private.quiz_duel_settle(uuid)',
    'gamification_private.quiz_duel_reward(uuid, uuid, text, integer, text)',
    'gamification_private.quiz_duel_question_pool(uuid[], text)',
    'gamification_private.quiz_duel_settle_expired(integer)'
  ] loop
    if has_function_privilege('authenticated', v_fn, 'execute') then
      raise exception 'internal function % must stay private', v_fn;
    end if;
  end loop;
end
$grants$;

-- ---------------------------------------------------------------------------------------------
-- Accès réservé aux joueurs ; thèmes ; questions insuffisantes
-- ---------------------------------------------------------------------------------------------

select set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000014', true);
set local role authenticated;
do $not_player$
begin
  begin
    perform public.get_my_quiz_duels();
    raise exception 'non-player opened the duels';
  exception
    when others then
      if sqlerrm <> 'duel_not_player' then raise; end if;
  end;
end
$not_player$;
reset role;

select set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000011', true);
set local role authenticated;
do $alice_start$
declare
  v_overview jsonb := public.get_my_quiz_duels();
  v_duel jsonb;
  v_state text;
  v_detail text;
begin
  if not v_overview -> 'themes' @> '[{"theme":"DuelTest","question_count":7}]'::jsonb
     or not v_overview -> 'themes' @> '[{"theme":"DuelRare","question_count":2}]'::jsonb then
    raise exception 'themes must count published questions only: %', v_overview -> 'themes';
  end if;

  -- Moins de 5 questions : refus explicite avec le nombre disponible.
  begin
    perform public.create_quiz_duel('76000000-0000-4000-8000-000000000012', 'duelrare');
    raise exception 'duel created with 2 questions';
  exception
    when others then
      get stacked diagnostics v_state = returned_sqlstate, v_detail = pg_exception_detail;
      if sqlerrm <> 'duel_not_enough_questions' or v_detail <> '2' then raise; end if;
  end;

  begin
    perform public.create_quiz_duel('76000000-0000-4000-8000-000000000011', 'DuelTest');
    raise exception 'self duel created';
  exception
    when others then
      if sqlerrm <> 'duel_self' then raise; end if;
  end;

  begin
    perform public.create_quiz_duel('76000000-0000-4000-8000-000000000014', 'DuelTest');
    raise exception 'duel against a non-player created';
  exception
    when others then
      if sqlerrm <> 'duel_opponent_unavailable' then raise; end if;
  end;

  -- Recherche : joueurs uniquement, jamais soi-même.
  if (select count(*) from public.search_quiz_duel_opponents('duel ')) <> 3
     or exists (select 1 from public.search_quiz_duel_opponents('duel') where user_id in (
       '76000000-0000-4000-8000-000000000011', '76000000-0000-4000-8000-000000000014')) then
    raise exception 'opponent search must list the other players only';
  end if;

  -- Duel direct contre Bruno sur le thème DuelTest (casse indifférente).
  v_duel := public.create_quiz_duel('76000000-0000-4000-8000-000000000012', 'dueltest');
  if v_duel ->> 'state' <> 'to_play' or v_duel ->> 'role' <> 'challenger' or v_duel ->> 'theme' <> 'DuelTest'
     or v_duel -> 'opponent' ->> 'name' <> 'Duel Bruno' then
    raise exception 'unexpected new duel: %', v_duel;
  end if;
  perform set_config('test.duel_ab', v_duel ->> 'id', true);

  begin
    perform public.create_quiz_duel('76000000-0000-4000-8000-000000000012', null);
    raise exception 'second open duel against the same player created';
  exception
    when others then
      if sqlerrm <> 'duel_already_open' then raise; end if;
  end;
end
$alice_start$;
reset role;

do $drawn_questions$
declare
  v_duel uuid := current_setting('test.duel_ab')::uuid;
  v_ids uuid[];
begin
  select question_ids into v_ids from public.quiz_duels where id = v_duel;
  if cardinality(v_ids) <> 5
     or (select count(distinct x) from unnest(v_ids) x) <> 5
     or exists (
       select 1 from unnest(v_ids) x
       join public.quiz_questions qq on qq.id = x
       where qq.quiz_id <> '76000000-0000-4000-8000-0000000000c1'
     ) then
    raise exception 'duel must draw 5 distinct questions from the published quiz only: %', v_ids;
  end if;

  if not exists (
    select 1 from public.push_outbox
    where user_id = '76000000-0000-4000-8000-000000000012'
      and url = '/duels?duel=' || v_duel::text
  ) then
    raise exception 'opponent must be notified through push_outbox';
  end if;
end
$drawn_questions$;

-- ---------------------------------------------------------------------------------------------
-- RLS : seuls les deux joueurs voient le duel ; personne ne lit les réponses directement
-- ---------------------------------------------------------------------------------------------

select set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000013', true);
set local role authenticated;
do $chloe_blind$
declare
  v_duel uuid := current_setting('test.duel_ab')::uuid;
begin
  if exists (select 1 from public.quiz_duels where id = v_duel) then
    raise exception 'third player reads the duel';
  end if;
  begin
    perform public.get_quiz_duel(v_duel);
    raise exception 'third player opened the duel';
  exception
    when others then
      if sqlerrm <> 'duel_not_found' then raise; end if;
  end;
  begin
    perform public.next_quiz_duel_question(v_duel);
    raise exception 'third player played the duel';
  exception
    when others then
      if sqlerrm <> 'duel_not_found' then raise; end if;
  end;
end
$chloe_blind$;
reset role;

select set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000012', true);
set local role authenticated;
do $bruno_reads$
declare
  v_duel uuid := current_setting('test.duel_ab')::uuid;
  v_summary jsonb;
begin
  if not exists (select 1 from public.quiz_duels where id = v_duel) then
    raise exception 'opponent must read the duel';
  end if;
  begin
    perform 1 from public.quiz_duel_answers limit 1;
    raise exception 'opponent read duel answers directly';
  exception
    when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.quiz_duel_steps limit 1;
    raise exception 'opponent read duel steps directly';
  exception
    when insufficient_privilege then null;
  end;
  begin
    insert into public.quiz_duel_outcomes (duel_id, reason, winner_id)
    values (v_duel, 'forfeit', '76000000-0000-4000-8000-000000000012');
    raise exception 'opponent wrote an outcome';
  exception
    when insufficient_privilege then null;
  end;

  v_summary := public.get_my_quiz_duels() -> 'duels' -> 0;
  if (v_summary ->> 'needs_response')::boolean is not true or v_summary ->> 'role' <> 'opponent' then
    raise exception 'opponent must be asked to accept or decline: %', v_summary;
  end if;
end
$bruno_reads$;
reset role;

-- ---------------------------------------------------------------------------------------------
-- Alice joue : aucune correction avant la fin du duel, réponse définitive
-- ---------------------------------------------------------------------------------------------

select set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000011', true);
set local role authenticated;
do $alice_plays$
declare
  v_duel uuid := current_setting('test.duel_ab')::uuid;
  v_next jsonb;
  v_again jsonb;
  v_answer jsonb;
  v_detail jsonb;
begin
  v_next := public.next_quiz_duel_question(v_duel);
  if (v_next ->> 'position')::integer <> 1 or (v_next ->> 'time_limit_ms')::integer <> 20000
     or v_next::text like '%correct%' or v_next::text like '%Explication%' then
    raise exception 'question must come without answers nor explanation: %', v_next;
  end if;

  -- Redemander la question ne relance pas le chronomètre et ne fait pas avancer.
  v_again := public.next_quiz_duel_question(v_duel);
  if (v_again ->> 'position')::integer <> 1
     or (v_again ->> 'remaining_ms')::integer > (v_next ->> 'remaining_ms')::integer then
    raise exception 'asking again must return the same question and timer';
  end if;

  begin
    perform public.answer_quiz_duel_question(v_duel, 2, array['a']);
    raise exception 'answered a question never shown';
  exception
    when others then
      if sqlerrm <> 'duel_question_not_shown' then raise; end if;
  end;

  begin
    perform public.answer_quiz_duel_question(v_duel, 1, array['zz']);
    raise exception 'unknown option accepted';
  exception
    when others then
      if sqlerrm <> 'duel_unknown_answer' then raise; end if;
  end;

  v_answer := public.answer_quiz_duel_question(v_duel, 1, array['a']);
  if v_answer::text like '%correct%' or (v_answer ->> 'answered_count')::integer <> 1 then
    raise exception 'answer must be recorded without correction: %', v_answer;
  end if;

  v_answer := public.answer_quiz_duel_question(v_duel, 1, array['b']);
  if (v_answer ->> 'already_answered')::boolean is not true then
    raise exception 'an answer must be final';
  end if;
end
$alice_plays$;
reset role;

do $alice_finishes$
declare
  v_duel uuid := current_setting('test.duel_ab')::uuid;
  v_correct integer;
begin
  -- « a » est faux pour toutes les questions de test (choix unique : « b » ; choix multiple :
  -- « a » et « b »). Alice termine en répondant faux partout : 0 bonne réponse.
  perform pg_temp.play_duel(v_duel, '76000000-0000-4000-8000-000000000011', 0);

  select count(*) filter (where is_correct) into v_correct
  from public.quiz_duel_answers
  where duel_id = v_duel and user_id = '76000000-0000-4000-8000-000000000011';
  if v_correct <> 0 or (select count(*) from public.quiz_duel_answers
                       where duel_id = v_duel and user_id = '76000000-0000-4000-8000-000000000011') <> 5 then
    raise exception 'alice must have 5 answers, all wrong (got % correct)', v_correct;
  end if;
end
$alice_finishes$;

select set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000011', true);
set local role authenticated;
do $alice_waits$
declare
  v_duel uuid := current_setting('test.duel_ab')::uuid;
  v_detail jsonb := public.get_quiz_duel(v_duel);
begin
  if v_detail ->> 'state' <> 'waiting' or v_detail -> 'correction' <> 'null'::jsonb
     or v_detail -> 'outcome' <> 'null'::jsonb then
    raise exception 'no correction nor outcome before the opponent has played: %', v_detail;
  end if;
  if (public.next_quiz_duel_question(v_duel) ->> 'done')::boolean is not true then
    raise exception 'a finished player cannot play again';
  end if;
end
$alice_waits$;
reset role;

select set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000012', true);
set local role authenticated;
do $bruno_blind$
declare
  v_duel uuid := current_setting('test.duel_ab')::uuid;
  v_detail jsonb := public.get_quiz_duel(v_duel);
begin
  if (v_detail ->> 'opponent_finished')::boolean is not true
     or v_detail -> 'correction' <> 'null'::jsonb
     or v_detail -> 'outcome' <> 'null'::jsonb then
    raise exception 'opponent must not see the other answers before playing: %', v_detail;
  end if;
  -- Bruno commence : il ne peut plus refuser ensuite.
  perform public.next_quiz_duel_question(v_duel);
  begin
    perform public.respond_quiz_duel(v_duel, false);
    raise exception 'declined after starting';
  exception
    when others then
      if sqlerrm <> 'duel_already_started' then raise; end if;
  end;
end
$bruno_blind$;
reset role;

-- ---------------------------------------------------------------------------------------------
-- Bruno joue avec une question hors délai ; résultat et points
-- ---------------------------------------------------------------------------------------------

do $bruno_timeout$
declare
  v_duel uuid := current_setting('test.duel_ab')::uuid;
  v_options jsonb;
  v_selected text[];
  v_answer jsonb;
begin
  -- La question 1 a été affichée il y a 30 secondes : la réponse arrive trop tard.
  update public.quiz_duel_steps set shown_at = clock_timestamp() - interval '30 seconds'
  where duel_id = v_duel and user_id = '76000000-0000-4000-8000-000000000012' and position = 1;

  select qq.options into v_options
  from public.quiz_duels d join public.quiz_questions qq on qq.id = d.question_ids[1]
  where d.id = v_duel;
  select array_agg(o ->> 'id') into v_selected
  from jsonb_array_elements(v_options) o where o -> 'correct' = 'true'::jsonb;

  perform set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000012', true);
  v_answer := public.answer_quiz_duel_question(v_duel, 1, v_selected);
  if (v_answer ->> 'timed_out')::boolean is not true then
    raise exception 'late answer must be timed out: %', v_answer;
  end if;
  if (select is_correct or elapsed_ms <> 20000 from public.quiz_duel_answers
      where duel_id = v_duel and user_id = '76000000-0000-4000-8000-000000000012' and position = 1) then
    raise exception 'late answer must count wrong and 20 s';
  end if;

  -- Questions 2 à 5 justes : Bruno 4 bonnes réponses contre 0 pour Alice.
  perform pg_temp.play_duel(v_duel, '76000000-0000-4000-8000-000000000012', 5);
end
$bruno_timeout$;

do $result_ab$
declare
  v_duel uuid := current_setting('test.duel_ab')::uuid;
  v_outcome public.quiz_duel_outcomes%rowtype;
begin
  select * into v_outcome from public.quiz_duel_outcomes where duel_id = v_duel;
  if not found or v_outcome.reason <> 'completed'
     or v_outcome.winner_id <> '76000000-0000-4000-8000-000000000012'
     or v_outcome.challenger_correct <> 0 or v_outcome.opponent_correct <> 4
     or v_outcome.challenger_xp <> 5 or v_outcome.opponent_xp <> 15 then
    raise exception 'unexpected outcome: %', row_to_json(v_outcome);
  end if;

  -- Total et points de maison = somme de l'historique (un badge à seuil peut ajouter un bonus).
  if exists (
    select 1 from public.gamification_data gd
    where gd.user_id in ('76000000-0000-4000-8000-000000000011', '76000000-0000-4000-8000-000000000012')
      and (gd.total_xp <> (select sum(h.amount) from public.xp_history h where h.user_id = gd.user_id)
        or gd.house_points <> gd.total_xp)
  ) then
    raise exception 'duel XP must be added to the player total and to the house points';
  end if;

  if not exists (
       select 1 from public.xp_history
       where user_id = '76000000-0000-4000-8000-000000000012' and action = 'QUIZ_DUEL_WIN'
         and amount = 15 and event_key = 'quiz-duel:' || v_duel::text
     )
     or not exists (
       select 1 from public.xp_history
       where user_id = '76000000-0000-4000-8000-000000000011' and action = 'QUIZ_DUEL_LOSS'
         and amount = 5 and event_key = 'quiz-duel:' || v_duel::text
     ) then
    raise exception 'xp_history must record the duel rewards';
  end if;

  -- Alice, qui avait fini avant, est prévenue du résultat.
  if not exists (
    select 1 from public.push_outbox
    where user_id = '76000000-0000-4000-8000-000000000011' and title = 'Duel de quiz : résultat'
  ) then
    raise exception 'the first finisher must be notified of the result';
  end if;
end
$result_ab$;

select set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000011', true);
set local role authenticated;
do $alice_correction$
declare
  v_duel uuid := current_setting('test.duel_ab')::uuid;
  v_detail jsonb := public.get_quiz_duel(v_duel);
  v_item jsonb;
begin
  if v_detail -> 'outcome' ->> 'result' <> 'loss' or (v_detail -> 'outcome' ->> 'my_xp')::integer <> 5
     or jsonb_array_length(v_detail -> 'correction') <> 5 then
    raise exception 'loser must see the result and the correction: %', v_detail;
  end if;
  v_item := v_detail -> 'correction' -> 0;
  if v_item ->> 'explanation' not like 'Explication duel %'
     or not (v_item -> 'options') @> '[{"correct":true}]'::jsonb
     or v_item -> 'opponent' ->> 'timed_out' <> 'true'
     or v_item -> 'mine' ->> 'is_correct' <> 'false' then
    raise exception 'correction must show answers, explanation and both players: %', v_item;
  end if;

  -- Jouer encore ne change rien ; les points ne sont pas attribués deux fois.
  perform public.get_quiz_duel(v_duel);
  if (public.next_quiz_duel_question(v_duel) ->> 'done')::boolean is not true then
    raise exception 'a closed duel cannot be replayed';
  end if;
end
$alice_correction$;
reset role;

do $no_double_award$
begin
  if (select count(*) from public.xp_history where event_key = 'quiz-duel:' || current_setting('test.duel_ab')) <> 2 then
    raise exception 'duel rewards must be paid once';
  end if;
end
$no_double_award$;

-- ---------------------------------------------------------------------------------------------
-- Refus, forfait, expiration
-- ---------------------------------------------------------------------------------------------

select set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000011', true);
set local role authenticated;
select set_config('test.duel_ac', public.create_quiz_duel('76000000-0000-4000-8000-000000000013', null) ->> 'id', true);
select set_config('test.duel_ae', public.create_quiz_duel('76000000-0000-4000-8000-000000000015', 'DuelTest') ->> 'id', true);
reset role;

select set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000012', true);
set local role authenticated;
select set_config('test.duel_be', public.create_quiz_duel('76000000-0000-4000-8000-000000000015', null) ->> 'id', true);
reset role;

-- Chloé refuse.
select set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000013', true);
set local role authenticated;
do $chloe_declines$
declare
  v_duel uuid := current_setting('test.duel_ac')::uuid;
  v_summary jsonb := public.respond_quiz_duel(v_duel, false);
begin
  if v_summary -> 'outcome' ->> 'result' <> 'declined' then
    raise exception 'declined duel must be closed: %', v_summary;
  end if;
  begin
    perform public.next_quiz_duel_question(v_duel);
    raise exception 'declined duel played';
  exception
    when others then
      if sqlerrm <> 'duel_closed' then raise; end if;
  end;
end
$chloe_declines$;
reset role;

do $declined_checks$
begin
  if not exists (
    select 1 from public.push_outbox
    where user_id = '76000000-0000-4000-8000-000000000011' and title = 'Duel de quiz refusé'
  ) then
    raise exception 'challenger must be told about the refusal';
  end if;

  -- Alice joue tout le duel contre Emma ; Emma ne joue pas. Bruno et Emma ne jouent pas.
  perform pg_temp.play_duel(current_setting('test.duel_ae')::uuid, '76000000-0000-4000-8000-000000000011', 5);

  -- 49 heures plus tard.
  update public.quiz_duels
  set created_at = now() - interval '49 hours', expires_at = now() - interval '1 hour'
  where id in (current_setting('test.duel_ae')::uuid, current_setting('test.duel_be')::uuid);
end
$declined_checks$;

select set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000015', true);
set local role authenticated;
do $emma_late$
declare
  v_overview jsonb := public.get_my_quiz_duels();
begin
  begin
    perform public.next_quiz_duel_question(current_setting('test.duel_be')::uuid);
    raise exception 'expired duel played';
  exception
    when others then
      if sqlerrm not in ('duel_closed', 'duel_expired') then raise; end if;
  end;
  if (v_overview -> 'stats' ->> 'losses')::integer <> 1 then
    raise exception 'forfeit counts as a loss for the absent player: %', v_overview -> 'stats';
  end if;
end
$emma_late$;
reset role;

do $forfeit_checks$
declare
  v_ae public.quiz_duel_outcomes%rowtype;
  v_be public.quiz_duel_outcomes%rowtype;
begin
  select * into v_ae from public.quiz_duel_outcomes where duel_id = current_setting('test.duel_ae')::uuid;
  select * into v_be from public.quiz_duel_outcomes where duel_id = current_setting('test.duel_be')::uuid;
  if v_ae.reason <> 'forfeit' or v_ae.winner_id <> '76000000-0000-4000-8000-000000000011'
     or v_ae.challenger_xp <> 0 or v_ae.opponent_xp <> 0 then
    raise exception 'forfeit must give the win without XP: %', row_to_json(v_ae);
  end if;
  if v_be.reason <> 'expired' or v_be.winner_id is not null then
    raise exception 'unplayed duel must expire: %', row_to_json(v_be);
  end if;
  if exists (select 1 from public.xp_history
             where event_key in ('quiz-duel:' || current_setting('test.duel_ae'), 'quiz-duel:' || current_setting('test.duel_be'))) then
    raise exception 'no XP for forfeit or expired duels';
  end if;
end
$forfeit_checks$;

-- ---------------------------------------------------------------------------------------------
-- Égalité, plafond journalier, adversaire au hasard, bilan
-- ---------------------------------------------------------------------------------------------

do $draw_and_cap$
declare
  v_duel uuid;
  v_outcome public.quiz_duel_outcomes%rowtype;
  v_i integer;
begin
  -- Égalité parfaite : même score, même temps (tout hors délai).
  perform set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000013', true);
  v_duel := (public.create_quiz_duel('76000000-0000-4000-8000-000000000015', null) ->> 'id')::uuid;
  for v_i in 1..5 loop
    perform set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000013', true);
    perform public.next_quiz_duel_question(v_duel);
    perform set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000015', true);
    perform public.next_quiz_duel_question(v_duel);
    update public.quiz_duel_steps set shown_at = clock_timestamp() - interval '1 minute'
    where duel_id = v_duel and position = v_i;
  end loop;
  perform set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000013', true);
  perform public.next_quiz_duel_question(v_duel);
  perform set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000015', true);
  perform public.next_quiz_duel_question(v_duel);

  select * into v_outcome from public.quiz_duel_outcomes where duel_id = v_duel;
  if v_outcome.reason <> 'completed' or v_outcome.winner_id is not null
     or v_outcome.challenger_xp <> 8 or v_outcome.opponent_xp <> 8 then
    raise exception 'perfect tie must be a draw with 8 XP each: %', row_to_json(v_outcome);
  end if;

  -- Chloé a 1 duel récompensé aujourd'hui ; deux de plus contre Bruno puis un quatrième :
  -- le quatrième ne rapporte plus rien à Chloé (Bruno, lui, a 1+3 duels => plafonné aussi).
  for v_i in 1..3 loop
    perform set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000013', true);
    v_duel := (public.create_quiz_duel('76000000-0000-4000-8000-000000000012', null) ->> 'id')::uuid;
    perform pg_temp.play_duel(v_duel, '76000000-0000-4000-8000-000000000013', 5);
    perform pg_temp.play_duel(v_duel, '76000000-0000-4000-8000-000000000012', 0);
    select * into v_outcome from public.quiz_duel_outcomes where duel_id = v_duel;
    if v_outcome.winner_id <> '76000000-0000-4000-8000-000000000013' then
      raise exception 'better score must win';
    end if;
    if v_i < 3 and v_outcome.challenger_xp <> 15 then
      raise exception 'duel % must be rewarded for Chloé', v_i;
    end if;
    if v_i = 3 and (v_outcome.challenger_xp <> 0 or v_outcome.opponent_xp <> 0) then
      raise exception 'fourth duel of the day must not be rewarded: %', row_to_json(v_outcome);
    end if;
  end loop;

  -- Bruno : duel 1 (gagné) + 2 duels perdus récompensés = 3 ; le 3e contre Chloé est plafonné.
  if (select count(*) from public.xp_history
      where user_id = '76000000-0000-4000-8000-000000000012' and action like 'QUIZ_DUEL_%') <> 3 then
    raise exception 'Bruno must have exactly 3 rewarded duels today';
  end if;
end
$draw_and_cap$;

select set_config('request.jwt.claim.sub', '76000000-0000-4000-8000-000000000011', true);
set local role authenticated;
do $random_and_stats$
declare
  v_duel jsonb := public.create_quiz_duel(null, 'DuelTest');
  v_stats jsonb;
begin
  -- Au hasard : un joueur d'une autre maison (Bruno ou Emma), jamais Chloé (même maison).
  if v_duel ->> 'matchmaking' <> 'random'
     or v_duel -> 'opponent' ->> 'id' not in ('76000000-0000-4000-8000-000000000012', '76000000-0000-4000-8000-000000000015') then
    raise exception 'random opponent must come from another house: %', v_duel;
  end if;

  v_stats := public.get_my_quiz_duels() -> 'stats';
  -- Alice : défaite contre Bruno, puis victoire par forfait contre Emma.
  if (v_stats ->> 'wins')::integer <> 1 or (v_stats ->> 'losses')::integer <> 1
     or (v_stats ->> 'forfeit_wins')::integer <> 1 or (v_stats ->> 'streak')::integer <> 1
     or (v_stats ->> 'xp_total')::integer <> 5 then
    raise exception 'unexpected stats: %', v_stats;
  end if;
end
$random_and_stats$;
reset role;

rollback;

select 'gamification quiz duel isolation: passed' as result;
