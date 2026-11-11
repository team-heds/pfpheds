\set ON_ERROR_STOP on
-- Plateforme de quiz : création réservée aux enseignants et admins (un enseignant ne gère que
-- ses quiz), bonnes réponses jamais lisibles par un étudiant avant d'avoir répondu, réponse
-- définitive, score/durée/points calculés par le serveur, première tentative seule classée et
-- récompensée (20 XP, 40 XP sans faute, joueurs de la gamification uniquement), XP compté pour
-- la maison, classement et statistiques. Tout est annulé à la fin.

begin;

insert into auth.users (
  id, instance_id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
  is_super_admin, role, aud
)
select
  u.id::uuid, '00000000-0000-0000-0000-000000000000', u.email, 'test-only', now(),
  now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, 'authenticated', 'authenticated'
from (values
  ('74000000-0000-4000-8000-000000000001', 'quiz.teacher1@example.invalid'),
  ('74000000-0000-4000-8000-000000000002', 'quiz.teacher2@example.invalid'),
  ('74000000-0000-4000-8000-000000000003', 'quiz.admin@example.invalid'),
  ('74000000-0000-4000-8000-000000000011', 'quiz.student1@example.invalid'),
  ('74000000-0000-4000-8000-000000000012', 'quiz.student2@example.invalid'),
  ('74000000-0000-4000-8000-000000000013', 'quiz.student3@example.invalid'),
  ('74000000-0000-4000-8000-000000000014', 'quiz.student4@example.invalid')
) as u(id, email);

insert into public.user_profiles (user_id, email, display_name, role, classe, is_active)
values
  ('74000000-0000-4000-8000-000000000001', 'quiz.teacher1@example.invalid', 'Quiz Enseignant Un', 'EnseignantPhysio', null, true),
  ('74000000-0000-4000-8000-000000000002', 'quiz.teacher2@example.invalid', 'Quiz Enseignant Deux', 'EnseignantPhysio', null, true),
  ('74000000-0000-4000-8000-000000000003', 'quiz.admin@example.invalid', 'Quiz Admin', 'admin', null, true),
  ('74000000-0000-4000-8000-000000000011', 'quiz.student1@example.invalid', 'Quiz Etudiant Un', 'student', 'BA24', true),
  ('74000000-0000-4000-8000-000000000012', 'quiz.student2@example.invalid', 'Quiz Etudiant Deux', 'student', 'BA24', true),
  ('74000000-0000-4000-8000-000000000013', 'quiz.student3@example.invalid', 'Quiz Etudiant Trois', 'student', 'BA25', true),
  ('74000000-0000-4000-8000-000000000014', 'quiz.student4@example.invalid', 'Quiz Etudiant Quatre', 'student', 'BA24', true)
on conflict (user_id) do update
set display_name = excluded.display_name, role = excluded.role, classe = excluded.classe, is_active = true;

-- Récompenses actives ; joueurs : étudiants 1 et 2 seulement (l'étudiant 4 joue sans points).
update gamification_private.rollout_config
set rewards_enabled = true, audience_mode = 'allowlist'
where singleton;

insert into gamification_private.rollout_audience (user_id, added_by)
values
  ('74000000-0000-4000-8000-000000000011', '74000000-0000-4000-8000-000000000003'),
  ('74000000-0000-4000-8000-000000000012', '74000000-0000-4000-8000-000000000003')
on conflict (user_id) do nothing;

insert into public.houses (id, name, color)
values ('74000000-0000-4000-8000-0000000000f1', 'Maison Test Quiz', '#123456');

insert into public.gamification_data (user_id, email, total_xp, current_level, house_id, house_points)
values ('74000000-0000-4000-8000-000000000011', 'quiz.student1@example.invalid', 0, 1, '74000000-0000-4000-8000-0000000000f1', 0)
on conflict (user_id) do update
set total_xp = 0, current_level = 1, house_id = excluded.house_id, house_points = 0;

do $grants$
declare
  v_table text;
begin
  foreach v_table in array array['quizzes', 'quiz_questions', 'quiz_attempts', 'quiz_attempt_answers', 'quiz_attempt_results'] loop
    if has_table_privilege('anon', 'public.' || v_table, 'select')
       or has_table_privilege('anon', 'public.' || v_table, 'insert')
       or has_table_privilege('anon', 'public.' || v_table, 'update')
       or has_table_privilege('anon', 'public.' || v_table, 'delete') then
      raise exception 'anon must not access %', v_table;
    end if;
    if not (select relrowsecurity from pg_class where oid = ('public.' || v_table)::regclass) then
      raise exception 'RLS must be enabled on %', v_table;
    end if;
  end loop;

  foreach v_table in array array['quiz_attempts', 'quiz_attempt_answers', 'quiz_attempt_results'] loop
    if has_table_privilege('authenticated', 'public.' || v_table, 'insert')
       or has_table_privilege('authenticated', 'public.' || v_table, 'update')
       or has_table_privilege('authenticated', 'public.' || v_table, 'delete') then
      raise exception 'authenticated must not write % directly', v_table;
    end if;
  end loop;

  if has_column_privilege('authenticated', 'public.quizzes', 'author_id', 'insert')
     or has_column_privilege('authenticated', 'public.quizzes', 'author_id', 'update')
     or has_column_privilege('authenticated', 'public.quizzes', 'status', 'insert')
     or has_column_privilege('authenticated', 'public.quizzes', 'published_at', 'update') then
    raise exception 'authenticated must not choose author or publication fields';
  end if;

  if has_function_privilege('anon', 'public.get_my_quizzes()', 'execute')
     or has_function_privilege('anon', 'public.start_quiz_attempt(uuid)', 'execute')
     or has_function_privilege('anon', 'public.answer_quiz_question(uuid, uuid, text[])', 'execute')
     or has_function_privilege('anon', 'public.finish_quiz_attempt(uuid)', 'execute')
     or has_function_privilege('anon', 'public.get_quiz_leaderboard(uuid, integer)', 'execute')
     or has_function_privilege('anon', 'public.get_quiz_results_summary(uuid)', 'execute')
     or has_function_privilege('anon', 'public.duplicate_quiz(uuid)', 'execute') then
    raise exception 'anon must not call quiz functions';
  end if;

  if has_function_privilege('authenticated', 'gamification_private.quiz_answer_feedback(uuid, uuid)', 'execute')
     or has_function_privilege('authenticated', 'gamification_private.quiz_public_questions(uuid)', 'execute') then
    raise exception 'internal quiz functions must stay private';
  end if;

  if (select public from storage.buckets where id = 'quiz-images') is distinct from false then
    raise exception 'quiz-images bucket must be private';
  end if;

  if (select xp_amount from gamification_private.action_rules where action_code = 'QUIZ_COMPLETE') <> 20
     or (select xp_amount from gamification_private.action_rules where action_code = 'QUIZ_PERFECT') <> 40 then
    raise exception 'quiz XP rules must be 20 and 40';
  end if;
end
$grants$;

-- Un étudiant ne peut pas créer de quiz.
select set_config('request.jwt.claim.sub', '74000000-0000-4000-8000-000000000011', true);
set local role authenticated;
do $student_create$
begin
  begin
    insert into public.quizzes (title, theme) values ('Quiz pirate', 'épaule');
    raise exception 'student created a quiz';
  exception
    when insufficient_privilege then null;
  end;
end
$student_create$;
reset role;

-- Enseignant 1 : crée un quiz (brouillon, à son nom), ne peut pas le publier vide.
select set_config('request.jwt.claim.sub', '74000000-0000-4000-8000-000000000001', true);
set local role authenticated;

with created as (
  insert into public.quizzes (title, description, theme, target_classes)
  values ('Quiz test épaule', 'Quiz de test', 'épaule', '{BA24}')
  returning id, author_id, status
)
select set_config('test.quiz_id', id::text, true),
       set_config('test.quiz_author', author_id::text, true),
       set_config('test.quiz_status', status, true)
from created;

do $teacher_create$
declare
  v_quiz uuid := current_setting('test.quiz_id')::uuid;
  v_count integer;
begin
  if current_setting('test.quiz_author') <> '74000000-0000-4000-8000-000000000001'
     or current_setting('test.quiz_status') <> 'draft' then
    raise exception 'quiz must be created as a draft owned by the connected teacher';
  end if;

  begin
    update public.quizzes set status = 'published' where id = v_quiz;
    raise exception 'empty quiz was published';
  exception
    when raise_exception then
      if sqlerrm = 'empty quiz was published' then raise; end if;
  end;

  -- Réponses invalides refusées : une seule réponse, deux bonnes réponses en choix unique.
  begin
    insert into public.quiz_questions (quiz_id, position, kind, prompt, options)
    values (v_quiz, 0, 'single', 'Question invalide', '[{"id":"a","label":"Seule","correct":true}]');
    raise exception 'one-option question accepted';
  exception
    when check_violation then null;
  end;
  begin
    insert into public.quiz_questions (quiz_id, position, kind, prompt, options)
    values (v_quiz, 0, 'single', 'Question invalide',
      '[{"id":"a","label":"A","correct":true},{"id":"b","label":"B","correct":true}]');
    raise exception 'single-choice question with two correct answers accepted';
  exception
    when check_violation then null;
  end;

  insert into public.quiz_questions (id, quiz_id, position, kind, prompt, explanation, options)
  values
    ('74000000-0000-4000-8000-0000000000a1', v_quiz, 0, 'single', 'Question un', 'Explication un',
      '[{"id":"a","label":"Juste","correct":true},{"id":"b","label":"Faux","correct":false}]'),
    ('74000000-0000-4000-8000-0000000000a2', v_quiz, 1, 'multiple', 'Question deux', 'Explication deux',
      '[{"id":"a","label":"Juste","correct":true},{"id":"b","label":"Juste aussi","correct":true},{"id":"c","label":"Faux","correct":false}]'),
    ('74000000-0000-4000-8000-0000000000a3', v_quiz, 2, 'single', 'Question trois', 'Explication trois',
      '[{"id":"a","label":"Faux","correct":false},{"id":"b","label":"Juste","correct":true}]');

  select count(*) into v_count from public.quiz_questions where quiz_id = v_quiz;
  if v_count <> 3 then
    raise exception 'teacher must read the 3 questions of their quiz, got %', v_count;
  end if;
end
$teacher_create$;
reset role;

-- Enseignant 2 : ne voit ni ne modifie le quiz de l'enseignant 1.
select set_config('request.jwt.claim.sub', '74000000-0000-4000-8000-000000000002', true);
set local role authenticated;
do $other_teacher$
declare
  v_quiz uuid := current_setting('test.quiz_id')::uuid;
  v_count integer;
begin
  if exists (select 1 from public.quizzes where id = v_quiz)
     or exists (select 1 from public.quiz_questions where quiz_id = v_quiz) then
    raise exception 'teacher 2 reads the quiz of teacher 1';
  end if;

  update public.quizzes set title = 'Détourné' where id = v_quiz;
  get diagnostics v_count = row_count;
  if v_count <> 0 then raise exception 'teacher 2 updated the quiz of teacher 1'; end if;

  delete from public.quizzes where id = v_quiz;
  get diagnostics v_count = row_count;
  if v_count <> 0 then raise exception 'teacher 2 deleted the quiz of teacher 1'; end if;

  begin
    insert into public.quiz_questions (quiz_id, position, kind, prompt, options)
    values (v_quiz, 9, 'single', 'Question intruse',
      '[{"id":"a","label":"A","correct":true},{"id":"b","label":"B","correct":false}]');
    raise exception 'teacher 2 added a question to the quiz of teacher 1';
  exception
    when insufficient_privilege then null;
  end;

  begin
    perform public.duplicate_quiz(v_quiz);
    raise exception 'teacher 2 duplicated the quiz of teacher 1';
  exception
    when raise_exception then
      if sqlerrm <> 'Insufficient privileges' then raise; end if;
  end;
end
$other_teacher$;
reset role;

-- Admin : peut modifier le quiz d'un enseignant, sans en devenir l'auteur.
select set_config('request.jwt.claim.sub', '74000000-0000-4000-8000-000000000003', true);
set local role authenticated;
do $admin_edit$
declare
  v_quiz uuid := current_setting('test.quiz_id')::uuid;
  v_count integer;
begin
  update public.quizzes set description = 'Relu par un admin' where id = v_quiz;
  get diagnostics v_count = row_count;
  if v_count <> 1 then raise exception 'admin must update any quiz'; end if;
  if (select author_id from public.quizzes where id = v_quiz) <> '74000000-0000-4000-8000-000000000001' then
    raise exception 'author must not change';
  end if;
end
$admin_edit$;
reset role;

-- Avant publication : invisible pour les étudiants.
select set_config('request.jwt.claim.sub', '74000000-0000-4000-8000-000000000011', true);
set local role authenticated;
do $draft_hidden$
declare
  v_quiz uuid := current_setting('test.quiz_id')::uuid;
begin
  if exists (select 1 from public.get_my_quizzes() q where q.id = v_quiz) then
    raise exception 'draft quiz listed for a student';
  end if;
  begin
    perform public.start_quiz_attempt(v_quiz);
    raise exception 'student started a draft quiz';
  exception
    when no_data_found then null;
  end;
end
$draft_hidden$;
reset role;

-- Enseignant 1 : publie ; un quiz publié est figé.
select set_config('request.jwt.claim.sub', '74000000-0000-4000-8000-000000000001', true);
set local role authenticated;
do $publish$
declare
  v_quiz uuid := current_setting('test.quiz_id')::uuid;
  v_count integer;
begin
  update public.quizzes set status = 'published' where id = v_quiz;
  if (select published_at from public.quizzes where id = v_quiz) is null then
    raise exception 'published_at must be set by the server';
  end if;

  update public.quiz_questions set prompt = 'Question modifiée' where quiz_id = v_quiz;
  get diagnostics v_count = row_count;
  if v_count <> 0 then raise exception 'questions of a published quiz were modified'; end if;

  delete from public.quiz_questions where quiz_id = v_quiz;
  get diagnostics v_count = row_count;
  if v_count <> 0 then raise exception 'questions of a published quiz were deleted'; end if;
end
$publish$;
reset role;

-- Étudiant 3 (BA25) : le quiz vise BA24, il ne le voit pas.
select set_config('request.jwt.claim.sub', '74000000-0000-4000-8000-000000000013', true);
set local role authenticated;
do $other_class$
declare
  v_quiz uuid := current_setting('test.quiz_id')::uuid;
begin
  if exists (select 1 from public.get_my_quizzes() q where q.id = v_quiz) then
    raise exception 'quiz listed for another class';
  end if;
  begin
    perform public.start_quiz_attempt(v_quiz);
    raise exception 'student of another class started the quiz';
  exception
    when no_data_found then null;
  end;
  begin
    perform * from public.get_quiz_leaderboard(v_quiz);
    raise exception 'student of another class read the leaderboard';
  exception
    when no_data_found then null;
  end;
end
$other_class$;
reset role;

-- Étudiant 1 (joueur, BA24) : passe le quiz sans faute.
select set_config('request.jwt.claim.sub', '74000000-0000-4000-8000-000000000011', true);
set local role authenticated;
do $student_one$
declare
  v_quiz uuid := current_setting('test.quiz_id')::uuid;
  v_start jsonb;
  v_attempt uuid;
  v_answer jsonb;
  v_result jsonb;
  v_listed record;
begin
  -- Aucune lecture directe des questions (donc des bonnes réponses), ni du quiz.
  if exists (select 1 from public.quiz_questions) or exists (select 1 from public.quizzes) then
    raise exception 'student reads quiz tables directly';
  end if;

  select * into v_listed from public.get_my_quizzes() q where q.id = v_quiz;
  if not found or v_listed.question_count <> 3 or not v_listed.is_open
     or v_listed.first_score is not null or v_listed.in_progress then
    raise exception 'quiz must be listed as "to do" for the student';
  end if;

  v_start := public.start_quiz_attempt(v_quiz);
  v_attempt := (v_start ->> 'attempt_id')::uuid;
  perform set_config('test.attempt_s1', v_attempt::text, true);

  if not (v_start ->> 'is_first')::boolean or not (v_start ->> 'counts_for_ranking')::boolean
     or jsonb_array_length(v_start -> 'questions') <> 3
     or jsonb_array_length(v_start -> 'answers') <> 0 then
    raise exception 'unexpected first attempt payload: %', v_start;
  end if;
  -- Les questions envoyées ne contiennent ni bonnes réponses ni explication.
  if (v_start -> 'questions')::text like '%"correct"%'
     or (v_start -> 'questions')::text like '%xplication%' then
    raise exception 'questions leak answers: %', v_start -> 'questions';
  end if;

  -- Reprise : pas de seconde tentative tant que la première n'est pas terminée.
  if (public.start_quiz_attempt(v_quiz) ->> 'attempt_id')::uuid <> v_attempt then
    raise exception 'a second attempt was opened before the first one finished';
  end if;

  -- Réponses invalides.
  begin
    perform public.answer_quiz_question(v_attempt, '74000000-0000-4000-8000-0000000000a1', array['z']);
    raise exception 'unknown option accepted';
  exception
    when raise_exception then
      if sqlerrm = 'unknown option accepted' then raise; end if;
  end;
  begin
    perform public.answer_quiz_question(v_attempt, '74000000-0000-4000-8000-0000000000a1', array['a', 'b']);
    raise exception 'two answers accepted for a single-choice question';
  exception
    when raise_exception then
      if sqlerrm = 'two answers accepted for a single-choice question' then raise; end if;
  end;

  v_answer := public.answer_quiz_question(v_attempt, '74000000-0000-4000-8000-0000000000a1', array['a']);
  if not (v_answer ->> 'is_correct')::boolean
     or v_answer -> 'correct_option_ids' <> '["a"]'::jsonb
     or v_answer ->> 'explanation' <> 'Explication un' then
    raise exception 'unexpected correction: %', v_answer;
  end if;

  -- Une réponse enregistrée est définitive.
  v_answer := public.answer_quiz_question(v_attempt, '74000000-0000-4000-8000-0000000000a1', array['b']);
  if not (v_answer ->> 'already_answered')::boolean or not (v_answer ->> 'is_correct')::boolean
     or v_answer -> 'selected' <> '["a"]'::jsonb then
    raise exception 'a recorded answer was changed: %', v_answer;
  end if;

  -- Impossible de terminer avant d'avoir répondu à tout.
  begin
    perform public.finish_quiz_attempt(v_attempt);
    raise exception 'unfinished attempt was closed';
  exception
    when raise_exception then
      if sqlerrm = 'unfinished attempt was closed' then raise; end if;
  end;

  v_answer := public.answer_quiz_question(v_attempt, '74000000-0000-4000-8000-0000000000a2', array['b', 'a']);
  if not (v_answer ->> 'is_correct')::boolean then
    raise exception 'multiple-choice answer must be correct: %', v_answer;
  end if;
  perform public.answer_quiz_question(v_attempt, '74000000-0000-4000-8000-0000000000a3', array['b']);

  v_result := public.finish_quiz_attempt(v_attempt);
  if (v_result ->> 'score')::integer <> 3 or (v_result ->> 'total')::integer <> 3
     or not (v_result ->> 'perfect')::boolean
     or (v_result ->> 'xp_awarded')::integer <> 40
     or (v_result ->> 'rank')::integer <> 1
     or (v_result ->> 'duration_ms')::bigint < 0 then
    raise exception 'unexpected perfect result: %', v_result;
  end if;

  -- Terminer deux fois ne redonne rien.
  v_result := public.finish_quiz_attempt(v_attempt);
  if not (v_result ->> 'already_finished')::boolean then
    raise exception 'second finish must be a no-op: %', v_result;
  end if;

  begin
    perform public.answer_quiz_question(v_attempt, '74000000-0000-4000-8000-0000000000a3', array['a']);
    raise exception 'answer accepted after the end';
  exception
    when raise_exception then
      if sqlerrm = 'answer accepted after the end' then raise; end if;
  end;

  -- Écriture directe impossible.
  begin
    insert into public.quiz_attempt_results (attempt_id, quiz_id, user_id, is_first, is_ranked, score, total, duration_ms)
    values (v_attempt, v_quiz, '74000000-0000-4000-8000-000000000011', false, false, 3, 3, 1);
    raise exception 'student wrote a result directly';
  exception
    when insufficient_privilege then null;
  end;

  -- Le moteur d'actions appelé depuis le navigateur ne donne aucun point de quiz.
  if coalesce((public.record_my_gamification_action('QUIZ_PERFECT', v_quiz) ->> 'awarded')::boolean, false)
     or coalesce((public.record_my_gamification_action('QUIZ_COMPLETE', gen_random_uuid()) ->> 'awarded')::boolean, false) then
    raise exception 'quiz XP awarded by a browser call';
  end if;

  -- Entraînement : seconde tentative, tout faux, aucun point, classement inchangé.
  v_start := public.start_quiz_attempt(v_quiz);
  v_attempt := (v_start ->> 'attempt_id')::uuid;
  if (v_start ->> 'attempt_number')::integer <> 2 or (v_start ->> 'is_first')::boolean then
    raise exception 'second attempt must be a practice attempt: %', v_start;
  end if;
  perform public.answer_quiz_question(v_attempt, '74000000-0000-4000-8000-0000000000a1', array['b']);
  perform public.answer_quiz_question(v_attempt, '74000000-0000-4000-8000-0000000000a2', array['a']);
  perform public.answer_quiz_question(v_attempt, '74000000-0000-4000-8000-0000000000a3', array['a']);
  v_result := public.finish_quiz_attempt(v_attempt);
  if (v_result ->> 'score')::integer <> 0 or (v_result ->> 'xp_awarded')::integer <> 0
     or (v_result ->> 'counts_for_ranking')::boolean or v_result ->> 'rank' is not null then
    raise exception 'practice attempt must not count: %', v_result;
  end if;

  select * into v_listed from public.get_my_quizzes() q where q.id = v_quiz;
  if v_listed.first_score <> 3 or v_listed.first_total <> 3 or v_listed.attempts_finished <> 2
     or v_listed.first_xp_awarded <> 40 or v_listed.in_progress then
    raise exception 'list must show the first attempt score: %', v_listed;
  end if;
end
$student_one$;
reset role;

-- Points : 40 XP une seule fois, comptés pour le joueur et pour sa maison.
do $xp_one$
declare
  v_quiz uuid := current_setting('test.quiz_id')::uuid;
begin
  if (select count(*) from public.xp_history
      where user_id = '74000000-0000-4000-8000-000000000011' and source_id = v_quiz) <> 1
     or (select amount from public.xp_history
         where user_id = '74000000-0000-4000-8000-000000000011' and action = 'QUIZ_PERFECT' and source_id = v_quiz) <> 40 then
    raise exception 'exactly one 40 XP quiz reward expected for student 1';
  end if;
  if (select total_xp from public.gamification_data where user_id = '74000000-0000-4000-8000-000000000011') <> 40
     or (select house_points from public.gamification_data where user_id = '74000000-0000-4000-8000-000000000011') <> 40 then
    raise exception 'quiz XP must count for the player and the house';
  end if;
end
$xp_one$;

-- Étudiant 2 (joueur) : une erreur, 20 XP ; ne peut pas répondre dans la tentative d'un autre.
select set_config('request.jwt.claim.sub', '74000000-0000-4000-8000-000000000012', true);
set local role authenticated;
do $student_two$
declare
  v_quiz uuid := current_setting('test.quiz_id')::uuid;
  v_attempt uuid;
  v_answer jsonb;
  v_result jsonb;
begin
  begin
    perform public.answer_quiz_question(current_setting('test.attempt_s1')::uuid,
      '74000000-0000-4000-8000-0000000000a1', array['a']);
    raise exception 'student answered in the attempt of someone else';
  exception
    when no_data_found then null;
  end;
  if exists (select 1 from public.quiz_attempt_results where user_id <> '74000000-0000-4000-8000-000000000012')
     or exists (select 1 from public.quiz_attempt_answers) then
    raise exception 'student reads results or answers of other students';
  end if;

  v_attempt := (public.start_quiz_attempt(v_quiz) ->> 'attempt_id')::uuid;
  perform public.answer_quiz_question(v_attempt, '74000000-0000-4000-8000-0000000000a1', array['a']);
  -- Choix multiple incomplet : faux.
  v_answer := public.answer_quiz_question(v_attempt, '74000000-0000-4000-8000-0000000000a2', array['a']);
  if (v_answer ->> 'is_correct')::boolean or v_answer -> 'correct_option_ids' <> '["a", "b"]'::jsonb then
    raise exception 'partial multiple-choice answer must be wrong: %', v_answer;
  end if;
  perform public.answer_quiz_question(v_attempt, '74000000-0000-4000-8000-0000000000a3', array['b']);
  v_result := public.finish_quiz_attempt(v_attempt);
  if (v_result ->> 'score')::integer <> 2 or (v_result ->> 'xp_awarded')::integer <> 20
     or (v_result ->> 'perfect')::boolean or (v_result ->> 'rank')::integer <> 2 then
    raise exception 'unexpected result for student 2: %', v_result;
  end if;
end
$student_two$;
reset role;

-- Étudiant 4 (hors gamification) : joue et est classé, sans points.
select set_config('request.jwt.claim.sub', '74000000-0000-4000-8000-000000000014', true);
set local role authenticated;
do $student_four$
declare
  v_quiz uuid := current_setting('test.quiz_id')::uuid;
  v_attempt uuid;
  v_result jsonb;
  v_rows integer;
  v_top record;
begin
  v_attempt := (public.start_quiz_attempt(v_quiz) ->> 'attempt_id')::uuid;
  perform public.answer_quiz_question(v_attempt, '74000000-0000-4000-8000-0000000000a1', array['a']);
  perform public.answer_quiz_question(v_attempt, '74000000-0000-4000-8000-0000000000a2', array['a', 'b']);
  perform public.answer_quiz_question(v_attempt, '74000000-0000-4000-8000-0000000000a3', array['b']);
  v_result := public.finish_quiz_attempt(v_attempt);
  if (v_result ->> 'score')::integer <> 3 or (v_result ->> 'xp_awarded')::integer <> 0
     or not (v_result ->> 'counts_for_ranking')::boolean then
    raise exception 'non-player must play without points: %', v_result;
  end if;

  -- Classement : 3 premières tentatives, score puis temps, nom et maison.
  select count(*) into v_rows from public.get_quiz_leaderboard(v_quiz);
  if v_rows <> 3 then raise exception 'leaderboard must list 3 first attempts, got %', v_rows; end if;

  if (select l.rank from public.get_quiz_leaderboard(v_quiz) l
      where l.user_id = '74000000-0000-4000-8000-000000000012') <> 3 then
    raise exception 'student 2 (2/3) must be ranked third';
  end if;
  if exists (
    select 1
    from public.get_quiz_leaderboard(v_quiz) a
    join public.get_quiz_leaderboard(v_quiz) b on a.rank < b.rank
    where a.score < b.score or (a.score = b.score and a.duration_ms > b.duration_ms)
  ) then
    raise exception 'leaderboard must be ordered by score then time';
  end if;

  select * into v_top from public.get_quiz_leaderboard(v_quiz) l
  where l.user_id = '74000000-0000-4000-8000-000000000011';
  if v_top.display_name <> 'Quiz Etudiant Un' or v_top.house_name <> 'Maison Test Quiz'
     or v_top.score <> 3 or v_top.is_me then
    raise exception 'unexpected leaderboard row: %', v_top;
  end if;
  if not (select l.is_me from public.get_quiz_leaderboard(v_quiz) l
          where l.user_id = '74000000-0000-4000-8000-000000000014') then
    raise exception 'own leaderboard row must be flagged';
  end if;

  begin
    perform public.get_quiz_results_summary(v_quiz);
    raise exception 'student read the teacher results';
  exception
    when raise_exception then
      if sqlerrm <> 'Insufficient privileges' then raise; end if;
  end;
end
$student_four$;
reset role;

do $xp_others$
begin
  if (select coalesce(sum(amount), 0) from public.xp_history
      where user_id = '74000000-0000-4000-8000-000000000012' and action = 'QUIZ_COMPLETE') <> 20 then
    raise exception 'student 2 must receive 20 XP';
  end if;
  if exists (select 1 from public.xp_history where user_id = '74000000-0000-4000-8000-000000000014') then
    raise exception 'non-player received XP';
  end if;
end
$xp_others$;

-- Enseignant 1 : résultats de son quiz, essai personnel non classé, duplication.
select set_config('request.jwt.claim.sub', '74000000-0000-4000-8000-000000000001', true);
set local role authenticated;
do $teacher_results$
declare
  v_quiz uuid := current_setting('test.quiz_id')::uuid;
  v_summary jsonb;
  v_attempt uuid;
  v_result jsonb;
  v_copy uuid;
begin
  v_summary := public.get_quiz_results_summary(v_quiz);
  if (v_summary #>> '{stats,participants}')::integer <> 3
     or (v_summary #>> '{stats,average_score}')::numeric <> 2.67
     or (v_summary #>> '{stats,perfect_count}')::integer <> 2
     or v_summary #>> '{questions,0,question_id}' <> '74000000-0000-4000-8000-0000000000a2'
     or (v_summary #>> '{questions,0,wrong}')::integer <> 1
     or (v_summary #>> '{questions,0,answers}')::integer <> 3 then
    raise exception 'unexpected results summary: %', v_summary;
  end if;

  -- L'enseignant essaie son quiz : ni classement ni points.
  v_attempt := (public.start_quiz_attempt(v_quiz) ->> 'attempt_id')::uuid;
  perform public.answer_quiz_question(v_attempt, '74000000-0000-4000-8000-0000000000a1', array['a']);
  perform public.answer_quiz_question(v_attempt, '74000000-0000-4000-8000-0000000000a2', array['a', 'b']);
  perform public.answer_quiz_question(v_attempt, '74000000-0000-4000-8000-0000000000a3', array['b']);
  v_result := public.finish_quiz_attempt(v_attempt);
  if (v_result ->> 'counts_for_ranking')::boolean or (v_result ->> 'xp_awarded')::integer <> 0 then
    raise exception 'author attempt must not be ranked: %', v_result;
  end if;
  if (public.get_quiz_results_summary(v_quiz) #>> '{stats,participants}')::integer <> 3 then
    raise exception 'author attempt must not count as a participant';
  end if;

  v_copy := public.duplicate_quiz(v_quiz);
  if (select status from public.quizzes where id = v_copy) <> 'draft'
     or (select author_id from public.quizzes where id = v_copy) <> '74000000-0000-4000-8000-000000000001'
     or (select count(*) from public.quiz_questions where quiz_id = v_copy) <> 3 then
    raise exception 'duplicate must be a draft with the same questions';
  end if;
end
$teacher_results$;
reset role;

-- Quiz fermé : plus de nouvelle tentative.
update public.quizzes
set opens_at = now() - interval '2 days', closes_at = now() - interval '1 day'
where id = current_setting('test.quiz_id')::uuid;

select set_config('request.jwt.claim.sub', '74000000-0000-4000-8000-000000000011', true);
set local role authenticated;
do $closed$
declare
  v_quiz uuid := current_setting('test.quiz_id')::uuid;
begin
  if (select q.is_open from public.get_my_quizzes() q where q.id = v_quiz) then
    raise exception 'closed quiz listed as open';
  end if;
  begin
    perform public.start_quiz_attempt(v_quiz);
    raise exception 'attempt started on a closed quiz';
  exception
    when raise_exception then
      if sqlerrm = 'attempt started on a closed quiz' then raise; end if;
  end;
end
$closed$;
reset role;

-- Admin : supprime le quiz d'un enseignant ; tentatives et résultats suivent, l'XP reste acquis.
select set_config('request.jwt.claim.sub', '74000000-0000-4000-8000-000000000003', true);
set local role authenticated;
do $admin_delete$
declare
  v_quiz uuid := current_setting('test.quiz_id')::uuid;
  v_count integer;
begin
  if (public.get_quiz_results_summary(v_quiz) #>> '{stats,participants}')::integer <> 3 then
    raise exception 'admin must read the results of any quiz';
  end if;
  delete from public.quizzes where id = v_quiz;
  get diagnostics v_count = row_count;
  if v_count <> 1 then raise exception 'admin must delete any quiz'; end if;
end
$admin_delete$;
reset role;

do $cascade$
declare
  v_quiz uuid := current_setting('test.quiz_id')::uuid;
begin
  if exists (select 1 from public.quiz_questions where quiz_id = v_quiz)
     or exists (select 1 from public.quiz_attempts where quiz_id = v_quiz)
     or exists (select 1 from public.quiz_attempt_results where quiz_id = v_quiz) then
    raise exception 'quiz deletion must cascade';
  end if;
  if (select total_xp from public.gamification_data where user_id = '74000000-0000-4000-8000-000000000011') <> 40 then
    raise exception 'earned XP must remain after quiz deletion';
  end if;
end
$cascade$;

rollback;

select 'gamification quizzes isolation: passed' as result;
