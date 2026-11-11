-- Plateforme de quiz (gamification 2026-2027).
--
-- Qui fait quoi :
--   * enseignants et admins créent des quiz (titre, thème, classes visées, dates facultatives) et
--     leurs questions (choix unique ou multiple, 2 à 6 réponses, explication, image facultative) ;
--     un enseignant ne gère que ses propres quiz, un admin (app_is_privileged) les gère tous ;
--   * les étudiants voient les quiz publiés pour leur classe et les passent question par question.
--
-- Règles de sécurité :
--   * les bonnes réponses ne sortent jamais de la base avant que l'étudiant ait répondu : la table
--     des questions n'est lisible que par les personnes qui gèrent le quiz ; les étudiants passent
--     uniquement par les fonctions ci-dessous (correction côté serveur) ;
--   * une réponse enregistrée ne peut plus être changée ; le score et la durée sont calculés par le
--     serveur ; tentatives, réponses et résultats ne sont écrits que par ces fonctions ;
--   * seule la PREMIÈRE tentative compte pour le classement et pour les points ; on ne peut pas
--     ouvrir une tentative d'entraînement tant que la précédente n'est pas terminée ;
--   * points : 20 XP au premier quiz terminé, 40 XP si tout est juste (règles QUIZ_COMPLETE et
--     QUIZ_PERFECT), une seule fois par quiz, uniquement pour les joueurs de la gamification
--     (gamification_private.is_rollout_member) ; l'XP passe par gamification_award_xp_internal et
--     compte donc aussi pour la maison ;
--   * un quiz publié est figé : il faut le repasser en brouillon pour modifier ses questions.
--
-- Le futur « duel de quiz » pourra piocher dans public.quiz_questions (par thème du quiz) et
-- corriger avec la même fonction interne gamification_private.quiz_grade_selection.
--
-- Migration additive et rejouable : aucune suppression, aucune donnée existante modifiée.

-- ---------------------------------------------------------------------------------------------
-- Rôles
-- ---------------------------------------------------------------------------------------------

-- Peut créer des quiz : admins (app_is_privileged) et enseignants.
create or replace function public.app_is_quiz_author()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select public.app_is_privileged())
    or exists (
      select 1
      from public.user_profiles up
      where up.user_id = (select auth.uid())
        and coalesce(up.is_active, true)
        and (
          lower(coalesce(up.role, '')) in ('enseignant', 'enseignantphysio', 'enseignantsoins')
          or coalesce(up.permissions, '[]'::jsonb)
             ?| array['Enseignant', 'EnseignantPhysio', 'EnseignantSoins']
        )
    );
$$;

-- Peut gérer ce quiz : un admin, ou l'enseignant qui en est l'auteur.
create or replace function public.app_can_manage_quiz(p_author_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select public.app_is_privileged())
    or (
      p_author_id is not null
      and p_author_id = (select auth.uid())
      and (select public.app_is_quiz_author())
    );
$$;

revoke all on function public.app_is_quiz_author() from public, anon;
revoke all on function public.app_can_manage_quiz(uuid) from public, anon;
grant execute on function public.app_is_quiz_author() to authenticated, service_role;
grant execute on function public.app_can_manage_quiz(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------------------------

create table if not exists public.quizzes (
  id uuid not null default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  theme text not null default '',
  -- Classes visées (ex. {BA24,BA25}) ; tableau vide = toutes les classes.
  target_classes text[] not null default '{}'::text[],
  opens_at timestamptz,
  closes_at timestamptz,
  status text not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quizzes_pkey primary key (id),
  constraint quizzes_title_length check (char_length(btrim(title)) between 3 and 120),
  constraint quizzes_description_length check (char_length(description) <= 1000),
  constraint quizzes_theme_length check (char_length(theme) <= 40),
  constraint quizzes_status_check check (status in ('draft', 'published')),
  constraint quizzes_window_check check (opens_at is null or closes_at is null or closes_at > opens_at),
  constraint quizzes_target_classes_check check (
    cardinality(target_classes) <= 12
    and array_to_string(target_classes, ',') ~ '^([A-Z0-9]{2,10}(,[A-Z0-9]{2,10})*)?$'
  )
);

comment on table public.quizzes is
  'Quiz créés par les enseignants et admins ; les étudiants y accèdent par les fonctions *_quiz_*.';

create index if not exists idx_quizzes_status on public.quizzes (status, published_at desc);
create index if not exists idx_quizzes_author on public.quizzes (author_id);

-- Une réponse possible : {"id": "a", "label": "…", "correct": true|false}.
create or replace function public.quiz_options_are_valid(p_kind text, p_options jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select case
    when p_options is null or jsonb_typeof(p_options) <> 'array' then false
    when jsonb_array_length(p_options) not between 2 and 6 then false
    else coalesce((
      select
        bool_and(
          jsonb_typeof(o) = 'object'
          and jsonb_typeof(o -> 'id') = 'string'
          and (o ->> 'id') ~ '^[a-z0-9]{1,12}$'
          and jsonb_typeof(o -> 'label') = 'string'
          and char_length(btrim(o ->> 'label')) between 1 and 300
          and jsonb_typeof(o -> 'correct') = 'boolean'
        )
        and count(distinct o ->> 'id') = count(*)
        and count(*) filter (where o -> 'correct' = 'true'::jsonb) >= 1
        and (
          p_kind = 'multiple'
          or count(*) filter (where o -> 'correct' = 'true'::jsonb) = 1
        )
      from jsonb_array_elements(p_options) as t(o)
    ), false)
  end;
$$;

revoke all on function public.quiz_options_are_valid(text, jsonb) from public, anon;
grant execute on function public.quiz_options_are_valid(text, jsonb) to authenticated, service_role;

create table if not exists public.quiz_questions (
  id uuid not null default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  position integer not null default 0,
  kind text not null default 'single',
  prompt text not null,
  explanation text not null default '',
  -- Chemin dans le bucket privé « quiz-images » (facultatif).
  image_path text,
  options jsonb not null,
  created_at timestamptz not null default now(),
  constraint quiz_questions_pkey primary key (id),
  constraint quiz_questions_kind_check check (kind in ('single', 'multiple')),
  constraint quiz_questions_position_check check (position between 0 and 999),
  constraint quiz_questions_prompt_length check (char_length(btrim(prompt)) between 3 and 1000),
  constraint quiz_questions_explanation_length check (char_length(explanation) <= 2000),
  constraint quiz_questions_image_path_check check (
    image_path is null or (char_length(image_path) <= 300 and image_path !~ '\.\.')
  ),
  constraint quiz_questions_options_check check (public.quiz_options_are_valid(kind, options))
);

comment on table public.quiz_questions is
  'Questions des quiz, avec les bonnes réponses : lisibles uniquement par qui gère le quiz.';

create index if not exists idx_quiz_questions_quiz on public.quiz_questions (quiz_id, position, id);

create table if not exists public.quiz_attempts (
  id uuid not null default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_number integer not null,
  started_at timestamptz not null default now(),
  constraint quiz_attempts_pkey primary key (id),
  constraint quiz_attempts_number_check check (attempt_number >= 1),
  constraint quiz_attempts_unique_number unique (quiz_id, user_id, attempt_number)
);

comment on table public.quiz_attempts is
  'Tentatives de quiz, ouvertes par start_quiz_attempt (heure de départ posée par le serveur).';

create index if not exists idx_quiz_attempts_user on public.quiz_attempts (user_id, quiz_id);

create table if not exists public.quiz_attempt_answers (
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  selected text[] not null,
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  constraint quiz_attempt_answers_pkey primary key (attempt_id, question_id)
);

comment on table public.quiz_attempt_answers is
  'Réponses données, corrigées par le serveur ; une réponse enregistrée est définitive.';

create index if not exists idx_quiz_attempt_answers_question
  on public.quiz_attempt_answers (question_id);

create table if not exists public.quiz_attempt_results (
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_first boolean not null,
  -- Compte pour le classement et les statistiques : première tentative d'une personne
  -- qui ne gère pas le quiz.
  is_ranked boolean not null,
  score integer not null,
  total integer not null,
  duration_ms bigint not null,
  xp_awarded integer not null default 0,
  finished_at timestamptz not null default now(),
  constraint quiz_attempt_results_pkey primary key (attempt_id),
  constraint quiz_attempt_results_score_check check (score between 0 and total and total >= 1),
  constraint quiz_attempt_results_duration_check check (duration_ms >= 0),
  constraint quiz_attempt_results_xp_check check (xp_awarded >= 0),
  constraint quiz_attempt_results_ranked_check check (is_first or not is_ranked)
);

comment on table public.quiz_attempt_results is
  'Résultat d''une tentative terminée (score et durée calculés par le serveur), jamais modifié.';

create index if not exists idx_quiz_attempt_results_ranking
  on public.quiz_attempt_results (quiz_id, score desc, duration_ms)
  where is_ranked;
create index if not exists idx_quiz_attempt_results_user
  on public.quiz_attempt_results (user_id, quiz_id);
-- Une seule tentative classée par personne et par quiz.
create unique index if not exists quiz_attempt_results_one_first
  on public.quiz_attempt_results (quiz_id, user_id)
  where is_first;

-- ---------------------------------------------------------------------------------------------
-- Déclencheurs : auteur, dates et publication contrôlés par le serveur
-- ---------------------------------------------------------------------------------------------

create or replace function public.quizzes_enforce_server_fields()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if tg_op = 'INSERT' then
    -- Depuis l'application, l'auteur est toujours la personne connectée et le quiz naît brouillon.
    if v_user_id is not null then
      new.author_id := v_user_id;
      new.status := 'draft';
      new.published_at := null;
    end if;
    new.created_at := now();
    new.updated_at := now();
  else
    new.author_id := old.author_id;
    new.created_at := old.created_at;
    new.updated_at := now();
    new.published_at := old.published_at;
  end if;

  if new.status = 'published' and (tg_op = 'INSERT' or old.status <> 'published') then
    if not exists (select 1 from public.quiz_questions qq where qq.quiz_id = new.id) then
      raise exception 'Un quiz doit contenir au moins une question pour être publié'
        using errcode = 'P0001';
    end if;
    new.published_at := now();
  end if;

  return new;
end;
$$;

revoke all on function public.quizzes_enforce_server_fields() from public, anon, authenticated;

create or replace trigger quizzes_enforce_server_fields
  before insert or update on public.quizzes
  for each row
  execute function public.quizzes_enforce_server_fields();

-- ---------------------------------------------------------------------------------------------
-- Droits et RLS
-- ---------------------------------------------------------------------------------------------

alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_attempt_answers enable row level security;
alter table public.quiz_attempt_results enable row level security;

revoke all on table public.quizzes from public, anon, authenticated;
revoke all on table public.quiz_questions from public, anon, authenticated;
revoke all on table public.quiz_attempts from public, anon, authenticated;
revoke all on table public.quiz_attempt_answers from public, anon, authenticated;
revoke all on table public.quiz_attempt_results from public, anon, authenticated;

-- Quiz : ni l'auteur ni les dates de publication ne viennent du navigateur.
grant select, delete on table public.quizzes to authenticated;
grant insert (title, description, theme, target_classes, opens_at, closes_at)
  on table public.quizzes to authenticated;
grant update (title, description, theme, target_classes, opens_at, closes_at, status)
  on table public.quizzes to authenticated;

grant select, delete on table public.quiz_questions to authenticated;
grant insert (id, quiz_id, position, kind, prompt, explanation, image_path, options)
  on table public.quiz_questions to authenticated;
grant update (position, kind, prompt, explanation, image_path, options)
  on table public.quiz_questions to authenticated;

-- Tentatives, réponses, résultats : lecture seule ; l'écriture passe par les fonctions.
grant select on table public.quiz_attempts to authenticated;
grant select on table public.quiz_attempt_answers to authenticated;
grant select on table public.quiz_attempt_results to authenticated;

do $policies$
begin
  -- Quiz : visibles en direct uniquement par qui les gère (les étudiants passent par get_my_quizzes).
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'quizzes' and policyname = 'quizzes_select_managers') then
    create policy quizzes_select_managers
      on public.quizzes for select to authenticated
      using ((select public.app_is_privileged())
        or (author_id = (select auth.uid()) and (select public.app_is_quiz_author())));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'quizzes' and policyname = 'quizzes_insert_authors') then
    create policy quizzes_insert_authors
      on public.quizzes for insert to authenticated
      with check ((select public.app_is_quiz_author()));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'quizzes' and policyname = 'quizzes_update_managers') then
    create policy quizzes_update_managers
      on public.quizzes for update to authenticated
      using ((select public.app_is_privileged())
        or (author_id = (select auth.uid()) and (select public.app_is_quiz_author())))
      with check ((select public.app_is_privileged())
        or (author_id = (select auth.uid()) and (select public.app_is_quiz_author())));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'quizzes' and policyname = 'quizzes_delete_managers') then
    create policy quizzes_delete_managers
      on public.quizzes for delete to authenticated
      using ((select public.app_is_privileged())
        or (author_id = (select auth.uid()) and (select public.app_is_quiz_author())));
  end if;

  -- Questions (avec les bonnes réponses) : uniquement qui gère le quiz ; écriture en brouillon.
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'quiz_questions' and policyname = 'quiz_questions_select_managers') then
    create policy quiz_questions_select_managers
      on public.quiz_questions for select to authenticated
      using (exists (
        select 1 from public.quizzes q
        where q.id = quiz_questions.quiz_id
          and ((select public.app_is_privileged())
            or (q.author_id = (select auth.uid()) and (select public.app_is_quiz_author())))
      ));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'quiz_questions' and policyname = 'quiz_questions_insert_draft_managers') then
    create policy quiz_questions_insert_draft_managers
      on public.quiz_questions for insert to authenticated
      with check (exists (
        select 1 from public.quizzes q
        where q.id = quiz_questions.quiz_id
          and q.status = 'draft'
          and ((select public.app_is_privileged())
            or (q.author_id = (select auth.uid()) and (select public.app_is_quiz_author())))
      ));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'quiz_questions' and policyname = 'quiz_questions_update_draft_managers') then
    create policy quiz_questions_update_draft_managers
      on public.quiz_questions for update to authenticated
      using (exists (
        select 1 from public.quizzes q
        where q.id = quiz_questions.quiz_id
          and q.status = 'draft'
          and ((select public.app_is_privileged())
            or (q.author_id = (select auth.uid()) and (select public.app_is_quiz_author())))
      ))
      with check (exists (
        select 1 from public.quizzes q
        where q.id = quiz_questions.quiz_id
          and q.status = 'draft'
          and ((select public.app_is_privileged())
            or (q.author_id = (select auth.uid()) and (select public.app_is_quiz_author())))
      ));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'quiz_questions' and policyname = 'quiz_questions_delete_draft_managers') then
    create policy quiz_questions_delete_draft_managers
      on public.quiz_questions for delete to authenticated
      using (exists (
        select 1 from public.quizzes q
        where q.id = quiz_questions.quiz_id
          and q.status = 'draft'
          and ((select public.app_is_privileged())
            or (q.author_id = (select auth.uid()) and (select public.app_is_quiz_author())))
      ));
  end if;

  -- Tentatives, réponses, résultats : les siens, ou ceux des quiz que l'on gère.
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'quiz_attempts' and policyname = 'quiz_attempts_select_own_or_manager') then
    create policy quiz_attempts_select_own_or_manager
      on public.quiz_attempts for select to authenticated
      using (
        user_id = (select auth.uid())
        or exists (
          select 1 from public.quizzes q
          where q.id = quiz_attempts.quiz_id
            and ((select public.app_is_privileged())
              or (q.author_id = (select auth.uid()) and (select public.app_is_quiz_author())))
        )
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'quiz_attempt_answers' and policyname = 'quiz_attempt_answers_select_own_or_manager') then
    create policy quiz_attempt_answers_select_own_or_manager
      on public.quiz_attempt_answers for select to authenticated
      using (exists (
        select 1
        from public.quiz_attempts a
        join public.quizzes q on q.id = a.quiz_id
        where a.id = quiz_attempt_answers.attempt_id
          and (
            a.user_id = (select auth.uid())
            or (select public.app_is_privileged())
            or (q.author_id = (select auth.uid()) and (select public.app_is_quiz_author()))
          )
      ));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'quiz_attempt_results' and policyname = 'quiz_attempt_results_select_own_or_manager') then
    create policy quiz_attempt_results_select_own_or_manager
      on public.quiz_attempt_results for select to authenticated
      using (
        user_id = (select auth.uid())
        or exists (
          select 1 from public.quizzes q
          where q.id = quiz_attempt_results.quiz_id
            and ((select public.app_is_privileged())
              or (q.author_id = (select auth.uid()) and (select public.app_is_quiz_author())))
        )
      );
  end if;
end
$policies$;

-- ---------------------------------------------------------------------------------------------
-- Règles de points (moteur de règles de la gamification)
-- ---------------------------------------------------------------------------------------------
-- Ces deux actions ne sont pas acceptées par record_my_gamification_action (appel navigateur) :
-- seul finish_quiz_attempt les attribue, après correction par le serveur.

insert into gamification_private.action_rules (
  action_code, rule_version, xp_amount, challenge_action, window_kind, max_awards_per_window, is_active
)
values
  ('QUIZ_COMPLETE', 'gamification-quiz-v1', 20, 'complete_quiz', 'event', null, true),
  ('QUIZ_PERFECT', 'gamification-quiz-v1', 40, 'perfect_quiz', 'event', null, true)
on conflict (action_code) do nothing;

-- ---------------------------------------------------------------------------------------------
-- Fonctions internes
-- ---------------------------------------------------------------------------------------------

-- Nom affiché d'une personne (classement).
create or replace function gamification_private.quiz_display_name(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select coalesce(
        nullif(btrim(up.display_name), ''),
        nullif(btrim(concat_ws(' ', up.forname, up.family_name)), '')
      )
      from public.user_profiles up
      where up.user_id = p_user_id
    ),
    'Utilisateur'
  )::text;
$$;

-- La personne connectée peut-elle voir ce quiz côté « joueur » ?
-- Publié et destiné à sa classe (ou à toutes), ou bien elle gère le quiz.
create or replace function gamification_private.quiz_is_visible(
  p_author_id uuid,
  p_status text,
  p_target_classes text[]
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select public.app_can_manage_quiz(p_author_id))
    or (
      p_status = 'published'
      and (
        cardinality(p_target_classes) = 0
        or exists (
          select 1
          from public.user_profiles up
          where up.user_id = (select auth.uid())
            and coalesce(up.is_active, true)
            and upper(btrim(coalesce(up.classe, ''))) = any (p_target_classes)
        )
      )
    );
$$;

-- Corrige une sélection : juste si elle correspond exactement aux bonnes réponses.
-- Réutilisable par le futur duel de quiz.
create or replace function gamification_private.quiz_grade_selection(
  p_options jsonb,
  p_selected text[]
)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    (
      select array_agg(o ->> 'id' order by o ->> 'id')
      from jsonb_array_elements(p_options) as t(o)
      where o -> 'correct' = 'true'::jsonb
    ) = (
      select array_agg(distinct s order by s)
      from unnest(p_selected) as u(s)
    ),
    false
  );
$$;

-- Questions d'un quiz SANS les bonnes réponses ni l'explication.
create or replace function gamification_private.quiz_public_questions(p_quiz_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', qq.id,
      'position', qq.position,
      'kind', qq.kind,
      'prompt', qq.prompt,
      'image_path', qq.image_path,
      'options', (
        select jsonb_agg(
          jsonb_build_object('id', o ->> 'id', 'label', o ->> 'label') order by ord
        )
        from jsonb_array_elements(qq.options) with ordinality as t(o, ord)
      )
    ) order by qq.position, qq.id
  ), '[]'::jsonb)
  from public.quiz_questions qq
  where qq.quiz_id = p_quiz_id;
$$;

-- Correction d'une réponse déjà enregistrée (bonnes réponses + explication).
create or replace function gamification_private.quiz_answer_feedback(
  p_attempt_id uuid,
  p_question_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'question_id', qq.id,
    'selected', to_jsonb(aa.selected),
    'is_correct', aa.is_correct,
    'correct_option_ids', (
      select coalesce(jsonb_agg(o ->> 'id' order by ord), '[]'::jsonb)
      from jsonb_array_elements(qq.options) with ordinality as t(o, ord)
      where o -> 'correct' = 'true'::jsonb
    ),
    'explanation', qq.explanation
  )
  from public.quiz_attempt_answers aa
  join public.quiz_questions qq on qq.id = aa.question_id
  where aa.attempt_id = p_attempt_id
    and aa.question_id = p_question_id;
$$;

revoke all on function gamification_private.quiz_display_name(uuid) from public, anon, authenticated;
revoke all on function gamification_private.quiz_is_visible(uuid, text, text[]) from public, anon, authenticated;
revoke all on function gamification_private.quiz_grade_selection(jsonb, text[]) from public, anon, authenticated;
revoke all on function gamification_private.quiz_public_questions(uuid) from public, anon, authenticated;
revoke all on function gamification_private.quiz_answer_feedback(uuid, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Fonctions appelées par l'application
-- ---------------------------------------------------------------------------------------------

-- Liste des quiz de la personne connectée, avec son état (à faire, en cours, terminé, score).
create or replace function public.get_my_quizzes()
returns table (
  id uuid,
  title text,
  description text,
  theme text,
  target_classes text[],
  opens_at timestamptz,
  closes_at timestamptz,
  is_open boolean,
  question_count integer,
  author_name text,
  in_progress boolean,
  attempts_finished integer,
  first_score integer,
  first_total integer,
  first_duration_ms bigint,
  first_finished_at timestamptz,
  first_xp_awarded integer,
  best_score integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    q.id,
    q.title,
    q.description,
    q.theme,
    q.target_classes,
    q.opens_at,
    q.closes_at,
    (q.opens_at is null or q.opens_at <= now()) and (q.closes_at is null or q.closes_at > now()),
    (select count(*) from public.quiz_questions qq where qq.quiz_id = q.id)::integer,
    gamification_private.quiz_display_name(q.author_id),
    exists (
      select 1 from public.quiz_attempts a
      where a.quiz_id = q.id
        and a.user_id = (select auth.uid())
        and not exists (select 1 from public.quiz_attempt_results r where r.attempt_id = a.id)
    ),
    (
      select count(*) from public.quiz_attempt_results r
      where r.quiz_id = q.id and r.user_id = (select auth.uid())
    )::integer,
    fr.score,
    fr.total,
    fr.duration_ms,
    fr.finished_at,
    fr.xp_awarded,
    (
      select max(r.score) from public.quiz_attempt_results r
      where r.quiz_id = q.id and r.user_id = (select auth.uid())
    )
  from public.quizzes q
  left join public.quiz_attempt_results fr
    on fr.quiz_id = q.id and fr.user_id = (select auth.uid()) and fr.is_first
  where (select auth.uid()) is not null
    and q.status = 'published'
    and (q.opens_at is null or q.opens_at <= now() or (select public.app_can_manage_quiz(q.author_id)))
    and gamification_private.quiz_is_visible(q.author_id, q.status, q.target_classes)
  order by q.published_at desc nulls last, q.created_at desc;
$$;

-- Ouvre une tentative (ou reprend celle qui n'est pas terminée) et renvoie les questions
-- sans les bonnes réponses. Les réponses déjà données reviennent avec leur correction.
create or replace function public.start_quiz_attempt(p_quiz_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_quiz public.quizzes%rowtype;
  v_can_manage boolean;
  v_attempt public.quiz_attempts%rowtype;
  v_resumed boolean := false;
  v_answers jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_quiz from public.quizzes q where q.id = p_quiz_id;
  if not found
     or not gamification_private.quiz_is_visible(v_quiz.author_id, v_quiz.status, v_quiz.target_classes) then
    raise exception 'Quiz introuvable' using errcode = 'P0002';
  end if;

  v_can_manage := public.app_can_manage_quiz(v_quiz.author_id);

  if not exists (select 1 from public.quiz_questions qq where qq.quiz_id = v_quiz.id) then
    raise exception 'Ce quiz ne contient encore aucune question' using errcode = 'P0001';
  end if;

  -- Une seule tentative ouverte à la fois par personne et par quiz.
  perform pg_advisory_xact_lock(hashtext(v_user_id::text), hashtext('quiz:' || v_quiz.id::text));

  select a.* into v_attempt
  from public.quiz_attempts a
  where a.quiz_id = v_quiz.id
    and a.user_id = v_user_id
    and not exists (select 1 from public.quiz_attempt_results r where r.attempt_id = a.id)
  order by a.attempt_number
  limit 1;

  if found then
    v_resumed := true;
  else
    if not v_can_manage and not (
      (v_quiz.opens_at is null or v_quiz.opens_at <= now())
      and (v_quiz.closes_at is null or v_quiz.closes_at > now())
    ) then
      raise exception 'Ce quiz n''est pas ouvert actuellement' using errcode = 'P0001';
    end if;

    insert into public.quiz_attempts (quiz_id, user_id, attempt_number, started_at)
    values (
      v_quiz.id,
      v_user_id,
      coalesce((
        select max(a.attempt_number) from public.quiz_attempts a
        where a.quiz_id = v_quiz.id and a.user_id = v_user_id
      ), 0) + 1,
      clock_timestamp()
    )
    returning * into v_attempt;
  end if;

  select coalesce(jsonb_agg(
    gamification_private.quiz_answer_feedback(aa.attempt_id, aa.question_id) order by aa.answered_at
  ), '[]'::jsonb)
  into v_answers
  from public.quiz_attempt_answers aa
  where aa.attempt_id = v_attempt.id;

  return jsonb_build_object(
    'attempt_id', v_attempt.id,
    'attempt_number', v_attempt.attempt_number,
    'is_first', v_attempt.attempt_number = 1,
    'counts_for_ranking', v_attempt.attempt_number = 1 and not v_can_manage,
    'resumed', v_resumed,
    'started_at', v_attempt.started_at,
    'quiz', jsonb_build_object(
      'id', v_quiz.id,
      'title', v_quiz.title,
      'description', v_quiz.description,
      'theme', v_quiz.theme
    ),
    'questions', gamification_private.quiz_public_questions(v_quiz.id),
    'answers', v_answers
  );
end;
$$;

-- Enregistre une réponse (définitive) et renvoie sa correction et l'explication.
create or replace function public.answer_quiz_question(
  p_attempt_id uuid,
  p_question_id uuid,
  p_selected text[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_attempt public.quiz_attempts%rowtype;
  v_quiz public.quizzes%rowtype;
  v_question public.quiz_questions%rowtype;
  v_selected text[];
  v_valid_ids text[];
  v_feedback jsonb;
  v_already boolean;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select a.* into v_attempt
  from public.quiz_attempts a
  where a.id = p_attempt_id and a.user_id = v_user_id;
  if not found then
    raise exception 'Tentative introuvable' using errcode = 'P0002';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user_id::text), hashtext('quiz:' || v_attempt.quiz_id::text));

  if exists (select 1 from public.quiz_attempt_results r where r.attempt_id = v_attempt.id) then
    raise exception 'Cette tentative est déjà terminée' using errcode = 'P0001';
  end if;

  select q.* into v_quiz from public.quizzes q where q.id = v_attempt.quiz_id;
  if not gamification_private.quiz_is_visible(v_quiz.author_id, v_quiz.status, v_quiz.target_classes) then
    raise exception 'Ce quiz n''est plus disponible' using errcode = 'P0001';
  end if;

  select qq.* into v_question
  from public.quiz_questions qq
  where qq.id = p_question_id and qq.quiz_id = v_attempt.quiz_id;
  if not found then
    raise exception 'Question introuvable' using errcode = 'P0002';
  end if;

  v_already := exists (
    select 1 from public.quiz_attempt_answers aa
    where aa.attempt_id = v_attempt.id and aa.question_id = v_question.id
  );

  if not v_already then
    select array_agg(o ->> 'id')
    into v_valid_ids
    from jsonb_array_elements(v_question.options) as t(o);

    select coalesce(array_agg(distinct s order by s), '{}'::text[])
    into v_selected
    from unnest(coalesce(p_selected, '{}'::text[])) as u(s)
    where s is not null;

    if cardinality(v_selected) = 0 then
      raise exception 'Aucune réponse sélectionnée' using errcode = 'P0001';
    end if;
    if not (v_selected <@ v_valid_ids) then
      raise exception 'Réponse inconnue pour cette question' using errcode = 'P0001';
    end if;
    if v_question.kind = 'single' and cardinality(v_selected) <> 1 then
      raise exception 'Une seule réponse est attendue' using errcode = 'P0001';
    end if;

    insert into public.quiz_attempt_answers (attempt_id, question_id, selected, is_correct, answered_at)
    values (
      v_attempt.id,
      v_question.id,
      v_selected,
      gamification_private.quiz_grade_selection(v_question.options, v_selected),
      clock_timestamp()
    )
    on conflict (attempt_id, question_id) do nothing;
  end if;

  -- Toujours la réponse enregistrée : un second envoi ne change rien.
  v_feedback := gamification_private.quiz_answer_feedback(v_attempt.id, v_question.id);

  return v_feedback || jsonb_build_object(
    'already_answered', v_already,
    'answered_count', (
      select count(*) from public.quiz_attempt_answers aa where aa.attempt_id = v_attempt.id
    ),
    'question_count', (
      select count(*) from public.quiz_questions qq where qq.quiz_id = v_attempt.quiz_id
    )
  );
end;
$$;

-- Termine une tentative : score et durée calculés ici, points attribués ici (première tentative).
create or replace function public.finish_quiz_attempt(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_attempt public.quiz_attempts%rowtype;
  v_quiz public.quizzes%rowtype;
  v_result public.quiz_attempt_results%rowtype;
  v_already boolean := false;
  v_total integer;
  v_answered integer;
  v_score integer;
  v_finished_at timestamptz := clock_timestamp();
  v_is_first boolean;
  v_is_ranked boolean;
  v_action text;
  v_xp_amount integer;
  v_award jsonb := '{}'::jsonb;
  v_xp_awarded integer := 0;
  v_rank integer;
  v_participants integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select a.* into v_attempt
  from public.quiz_attempts a
  where a.id = p_attempt_id and a.user_id = v_user_id;
  if not found then
    raise exception 'Tentative introuvable' using errcode = 'P0002';
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user_id::text), hashtext('quiz:' || v_attempt.quiz_id::text));

  select q.* into v_quiz from public.quizzes q where q.id = v_attempt.quiz_id;

  select r.* into v_result from public.quiz_attempt_results r where r.attempt_id = v_attempt.id;
  if found then
    v_already := true;
  else
    select count(*) into v_total
    from public.quiz_questions qq
    where qq.quiz_id = v_attempt.quiz_id;

    select count(*), count(*) filter (where aa.is_correct)
    into v_answered, v_score
    from public.quiz_attempt_answers aa
    where aa.attempt_id = v_attempt.id;

    if v_total = 0 or v_answered < v_total then
      raise exception 'Toutes les questions doivent avoir une réponse avant de terminer'
        using errcode = 'P0001';
    end if;

    v_is_first := v_attempt.attempt_number = 1;
    v_is_ranked := v_is_first and not public.app_can_manage_quiz(v_quiz.author_id);

    -- Points : première tentative classée, récompenses actives, joueur de la gamification.
    if v_is_ranked
       and coalesce((
         select rc.rewards_enabled from gamification_private.rollout_config rc where rc.singleton
       ), false)
       and gamification_private.is_rollout_member(v_user_id) then
      v_action := case when v_score = v_total then 'QUIZ_PERFECT' else 'QUIZ_COMPLETE' end;

      select ar.xp_amount into v_xp_amount
      from gamification_private.action_rules ar
      where ar.action_code = v_action
        and ar.is_active
        and ar.effective_from <= now();

      if v_xp_amount is not null then
        -- Une seule récompense par quiz et par personne (clé d'événement unique).
        v_award := public.gamification_award_xp_internal(
          v_user_id,
          v_action,
          v_xp_amount,
          'quiz:' || v_quiz.id::text,
          'quiz',
          v_quiz.id,
          case when v_action = 'QUIZ_PERFECT'
            then 'Quiz réussi sans faute : ' || v_quiz.title
            else 'Quiz terminé : ' || v_quiz.title
          end
        );
        v_xp_awarded := coalesce((v_award ->> 'xp_gained')::integer, 0);
      end if;
    end if;

    insert into public.quiz_attempt_results (
      attempt_id, quiz_id, user_id, is_first, is_ranked, score, total, duration_ms, xp_awarded, finished_at
    )
    values (
      v_attempt.id,
      v_attempt.quiz_id,
      v_user_id,
      v_is_first,
      v_is_ranked,
      v_score,
      v_total,
      greatest(0, floor(extract(epoch from (v_finished_at - v_attempt.started_at)) * 1000))::bigint,
      v_xp_awarded,
      v_finished_at
    )
    returning * into v_result;
  end if;

  if v_result.is_ranked then
    select count(*) + 1 into v_rank
    from public.quiz_attempt_results r
    where r.quiz_id = v_result.quiz_id
      and r.is_ranked
      and (r.score > v_result.score
        or (r.score = v_result.score and r.duration_ms < v_result.duration_ms));
  end if;

  select count(*) into v_participants
  from public.quiz_attempt_results r
  where r.quiz_id = v_result.quiz_id and r.is_ranked;

  return jsonb_build_object(
    'attempt_id', v_result.attempt_id,
    'quiz_id', v_result.quiz_id,
    'already_finished', v_already,
    'is_first', v_result.is_first,
    'counts_for_ranking', v_result.is_ranked,
    'score', v_result.score,
    'total', v_result.total,
    'perfect', v_result.score = v_result.total,
    'duration_ms', v_result.duration_ms,
    'finished_at', v_result.finished_at,
    'xp_awarded', v_result.xp_awarded,
    'level_up', coalesce((v_award ->> 'level_up')::boolean, false),
    'current_level', v_award -> 'current_level',
    'rank', v_rank,
    'participants', v_participants
  );
end;
$$;

-- Classement d'un quiz : premières tentatives, meilleur score puis temps le plus court.
create or replace function public.get_quiz_leaderboard(p_quiz_id uuid, p_limit integer default 50)
returns table (
  rank integer,
  user_id uuid,
  display_name text,
  house_name text,
  house_color text,
  score integer,
  total integer,
  duration_ms bigint,
  is_me boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 200);
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.quizzes q
    where q.id = p_quiz_id
      and gamification_private.quiz_is_visible(q.author_id, q.status, q.target_classes)
  ) then
    raise exception 'Quiz introuvable' using errcode = 'P0002';
  end if;

  return query
  with ranked as (
    select
      rank() over (order by r.score desc, r.duration_ms asc)::integer as position,
      r.user_id as ranked_user_id,
      r.score as ranked_score,
      r.total as ranked_total,
      r.duration_ms as ranked_duration
    from public.quiz_attempt_results r
    where r.quiz_id = p_quiz_id and r.is_ranked
  )
  select
    ranked.position,
    ranked.ranked_user_id,
    gamification_private.quiz_display_name(ranked.ranked_user_id),
    h.name::text,
    h.color::text,
    ranked.ranked_score,
    ranked.ranked_total,
    ranked.ranked_duration,
    ranked.ranked_user_id = v_user_id
  from ranked
  left join public.gamification_data gd on gd.user_id = ranked.ranked_user_id
  left join public.houses h on h.id = gd.house_id
  where ranked.position <= v_limit or ranked.ranked_user_id = v_user_id
  order by ranked.position, ranked.ranked_duration, ranked.ranked_user_id;
end;
$$;

-- Résultats d'un quiz pour qui le gère : participants, score moyen, questions les plus ratées.
create or replace function public.get_quiz_results_summary(p_quiz_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_quiz public.quizzes%rowtype;
  v_stats jsonb;
  v_questions jsonb;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;

  select * into v_quiz from public.quizzes q where q.id = p_quiz_id;
  if not found or not public.app_can_manage_quiz(v_quiz.author_id) then
    raise exception 'Insufficient privileges';
  end if;

  select jsonb_build_object(
    'participants', count(*),
    'average_score', round(avg(r.score)::numeric, 2),
    'average_percent', round(avg(r.score::numeric * 100 / r.total), 1),
    'average_duration_ms', round(avg(r.duration_ms))::bigint,
    'perfect_count', count(*) filter (where r.score = r.total),
    'in_progress', (
      select count(*) from public.quiz_attempts a
      where a.quiz_id = p_quiz_id
        and a.attempt_number = 1
        and not exists (select 1 from public.quiz_attempt_results rr where rr.attempt_id = a.id)
    )
  )
  into v_stats
  from public.quiz_attempt_results r
  where r.quiz_id = p_quiz_id and r.is_ranked;

  -- Questions triées de la plus ratée à la mieux réussie (premières tentatives classées).
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'question_id', s.question_id,
      'position', s.position,
      'prompt', s.prompt,
      'answers', s.answers,
      'wrong', s.wrong,
      'wrong_percent', case when s.answers > 0 then round(s.wrong::numeric * 100 / s.answers, 1) end
    )
    order by (case when s.answers > 0 then s.wrong::numeric / s.answers else -1 end) desc, s.position, s.question_id
  ), '[]'::jsonb)
  into v_questions
  from (
    select
      qq.id as question_id,
      qq.position,
      qq.prompt,
      count(aa.attempt_id) as answers,
      count(aa.attempt_id) filter (where not aa.is_correct) as wrong
    from public.quiz_questions qq
    left join (
      public.quiz_attempt_answers aa
      join public.quiz_attempt_results r on r.attempt_id = aa.attempt_id and r.is_ranked
    ) on aa.question_id = qq.id
    where qq.quiz_id = p_quiz_id
    group by qq.id, qq.position, qq.prompt
  ) s;

  return jsonb_build_object(
    'quiz_id', v_quiz.id,
    'title', v_quiz.title,
    'status', v_quiz.status,
    'stats', v_stats,
    'questions', v_questions
  );
end;
$$;

-- Duplique un quiz que l'on gère : nouveau brouillon, mêmes questions, à son propre nom.
create or replace function public.duplicate_quiz(p_quiz_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_quiz public.quizzes%rowtype;
  v_new_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_quiz from public.quizzes q where q.id = p_quiz_id;
  if not found or not public.app_can_manage_quiz(v_quiz.author_id) then
    raise exception 'Insufficient privileges';
  end if;

  -- Le déclencheur pose l'auteur (personne connectée) et l'état brouillon.
  insert into public.quizzes (title, description, theme, target_classes, opens_at, closes_at)
  values (
    left(v_quiz.title, 112) || ' (copie)',
    v_quiz.description,
    v_quiz.theme,
    v_quiz.target_classes,
    null,
    null
  )
  returning id into v_new_id;

  insert into public.quiz_questions (quiz_id, position, kind, prompt, explanation, image_path, options)
  select v_new_id, qq.position, qq.kind, qq.prompt, qq.explanation, qq.image_path, qq.options
  from public.quiz_questions qq
  where qq.quiz_id = v_quiz.id;

  return v_new_id;
end;
$$;

revoke all on function public.get_my_quizzes() from public, anon;
revoke all on function public.start_quiz_attempt(uuid) from public, anon;
revoke all on function public.answer_quiz_question(uuid, uuid, text[]) from public, anon;
revoke all on function public.finish_quiz_attempt(uuid) from public, anon;
revoke all on function public.get_quiz_leaderboard(uuid, integer) from public, anon;
revoke all on function public.get_quiz_results_summary(uuid) from public, anon;
revoke all on function public.duplicate_quiz(uuid) from public, anon;
grant execute on function public.get_my_quizzes() to authenticated;
grant execute on function public.start_quiz_attempt(uuid) to authenticated;
grant execute on function public.answer_quiz_question(uuid, uuid, text[]) to authenticated;
grant execute on function public.finish_quiz_attempt(uuid) to authenticated;
grant execute on function public.get_quiz_leaderboard(uuid, integer) to authenticated;
grant execute on function public.get_quiz_results_summary(uuid) to authenticated;
grant execute on function public.duplicate_quiz(uuid) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Images des questions : bucket privé « quiz-images »
-- ---------------------------------------------------------------------------------------------
-- Lecture par toute personne connectée (URL signées) ; dépôt et retrait par les auteurs de quiz,
-- dans leur propre dossier (dossier = identifiant de l'auteur).

do $bucket$
begin
  if not exists (select 1 from storage.buckets where id = 'quiz-images') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'quiz-images',
      'quiz-images',
      false,
      5242880,
      array['image/jpeg', 'image/png', 'image/webp']
    );
  end if;
end
$bucket$;

do $storage_policies$
begin
  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'quiz_images_select_authenticated') then
    create policy quiz_images_select_authenticated
      on storage.objects for select to authenticated
      using (bucket_id = 'quiz-images');
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'quiz_images_insert_author_folder') then
    create policy quiz_images_insert_author_folder
      on storage.objects for insert to authenticated
      with check (
        bucket_id = 'quiz-images'
        and (storage.foldername(name))[1] = (select auth.uid())::text
        and (select public.app_is_quiz_author())
      );
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'quiz_images_delete_author_folder') then
    create policy quiz_images_delete_author_folder
      on storage.objects for delete to authenticated
      using (
        bucket_id = 'quiz-images'
        and (storage.foldername(name))[1] = (select auth.uid())::text
        and (select public.app_is_quiz_author())
      );
  end if;
end
$storage_policies$;

notify pgrst, 'reload schema';
