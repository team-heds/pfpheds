-- Secure the daily wheel behind auth.uid(), Europe/Zurich business days and
-- the idempotent XP engine introduced in 20260831144042.

do $$
begin
  if to_regprocedure(
    'public.gamification_award_xp_internal(uuid,text,integer,text,text,uuid,text)'
  ) is null then
    raise exception 'Phase 1 gamification engine is required';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'xp_history'
      and column_name = 'event_key'
  ) then
    raise exception 'xp_history.event_key is required';
  end if;
end
$$;

create schema if not exists gamification_private;
revoke all on schema gamification_private from public, anon, authenticated;

create table if not exists gamification_private.daily_wheel_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  difficulty text not null check (difficulty in ('easy', 'hard')),
  prompt text not null,
  options jsonb not null check (jsonb_typeof(options) = 'object'),
  correct_option_id text not null,
  xp_reward integer not null check (xp_reward between 1 and 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint daily_wheel_correct_option_exists check (options ? correct_option_id)
);

create table if not exists gamification_private.daily_wheel_quiz_attempts (
  spin_id uuid primary key references public.daily_wheel_spins(id) on delete cascade,
  question_id uuid not null references gamification_private.daily_wheel_quiz_questions(id),
  correct_option_id text not null,
  xp_reward integer not null check (xp_reward between 1 and 100),
  created_at timestamptz not null default now()
);

create table if not exists gamification_private.feature_flags (
  feature_key text primary key,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into gamification_private.feature_flags (feature_key, enabled)
values ('daily_wheel', false)
on conflict (feature_key) do nothing;

alter table gamification_private.daily_wheel_quiz_questions enable row level security;
alter table gamification_private.daily_wheel_quiz_attempts enable row level security;
revoke all on all tables in schema gamification_private from public, anon, authenticated;

insert into gamification_private.daily_wheel_quiz_questions (
  id, difficulty, prompt, options, correct_option_id, xp_reward
)
values
  (
    'd1000000-0000-0000-0000-000000000001',
    'easy',
    'Quel est le chef-lieu du canton du Valais ?',
    '{"sion":"Sion","lausanne":"Lausanne"}',
    'sion',
    10
  ),
  (
    'd1000000-0000-0000-0000-000000000002',
    'hard',
    'Quel est le code officiel du canton du Valais ?',
    '{"vs":"VS","vd":"VD","fr":"FR"}',
    'vs',
    20
  )
on conflict (id) do nothing;

alter table public.daily_wheel_spins
  alter column spin_date
  set default ((statement_timestamp() at time zone 'Europe/Zurich')::date);

alter table public.daily_wheel_spins
  add column if not exists quiz_status text,
  add column if not exists quiz_answer_id text,
  add column if not exists answered_at timestamptz,
  add column if not exists xp_awarded integer not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.daily_wheel_spins'::regclass
      and conname = 'daily_wheel_quiz_status_check'
  ) then
    alter table public.daily_wheel_spins
      add constraint daily_wheel_quiz_status_check
      check (quiz_status is null or quiz_status in ('pending', 'correct', 'incorrect'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.daily_wheel_spins'::regclass
      and conname = 'daily_wheel_xp_awarded_check'
  ) then
    alter table public.daily_wheel_spins
      add constraint daily_wheel_xp_awarded_check check (xp_awarded >= 0);
  end if;
end
$$;

-- Never delete historical duplicates automatically. The migration stops so
-- an operator can review them before enforcing one spin per local day.
do $$
begin
  if exists (
    select 1 from public.daily_wheel_spins
    group by user_id, spin_date
    having count(*) > 1
  ) then
    raise exception 'Duplicate daily wheel rows must be reviewed before adding uniqueness';
  end if;
end
$$;

create unique index if not exists daily_wheel_spins_user_local_day_uidx
  on public.daily_wheel_spins(user_id, spin_date);

create or replace function public.get_daily_wheel_status()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_local_day date := (statement_timestamp() at time zone 'Europe/Zurich')::date;
  v_spin public.daily_wheel_spins%rowtype;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not coalesce((
    select enabled
    from gamification_private.feature_flags
    where feature_key = 'daily_wheel'
  ), false) then raise exception 'FEATURE_DISABLED'; end if;

  select * into v_spin
  from public.daily_wheel_spins
  where user_id = v_user_id and spin_date = v_local_day;

  if not found then
    return jsonb_build_object('can_spin', true, 'local_day', v_local_day, 'last_result', null);
  end if;

  return jsonb_build_object(
    'can_spin', false,
    'local_day', v_local_day,
    'last_spin_id', v_spin.id,
    'quiz_status', v_spin.quiz_status,
    'last_result_type', v_spin.result_type,
    'last_result', v_spin.prize_details
  );
end;
$$;

create or replace function public.spin_daily_wheel()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, gamification_private
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_local_day date := (statement_timestamp() at time zone 'Europe/Zurich')::date;
  v_random integer := floor(random() * 100 + 1);
  v_spin_id uuid;
  v_result_type text;
  v_difficulty text;
  v_prize jsonb;
  v_instant_xp integer := 0;
  v_quiz_status text;
  v_question gamification_private.daily_wheel_quiz_questions%rowtype;
  v_award jsonb := jsonb_build_object('awarded', false, 'xp_gained', 0);
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not coalesce((
    select enabled
    from gamification_private.feature_flags
    where feature_key = 'daily_wheel'
  ), false) then raise exception 'FEATURE_DISABLED'; end if;

  if v_random <= 45 then
    v_result_type := 'QUIZ_EASY';
    v_difficulty := 'easy';
    v_quiz_status := 'pending';
  elsif v_random <= 70 then
    v_result_type := 'XP_BONUS';
    v_instant_xp := 5;
    v_prize := jsonb_build_object('xp', 5, 'label', 'Bonus +5 XP');
  else
    v_result_type := 'QUIZ_HARD';
    v_difficulty := 'hard';
    v_quiz_status := 'pending';
  end if;

  if v_difficulty is not null then
    select * into v_question
    from gamification_private.daily_wheel_quiz_questions
    where difficulty = v_difficulty and is_active = true
    order by random()
    limit 1;

    if not found then raise exception 'QUIZ_CONFIGURATION_MISSING'; end if;

    v_prize := jsonb_build_object(
      'xp', v_question.xp_reward,
      'difficulty', v_question.difficulty,
      'label', case when v_question.difficulty = 'easy' then 'Quiz Facile' else 'Quiz Difficile' end,
      'question', jsonb_build_object(
        'id', v_question.id,
        'prompt', v_question.prompt,
        'options', v_question.options
      )
    );
  end if;

  insert into public.daily_wheel_spins (
    user_id, spin_date, result_type, prize_details, quiz_status
  )
  values (v_user_id, v_local_day, v_result_type, v_prize, v_quiz_status)
  on conflict (user_id, spin_date) do nothing
  returning id into v_spin_id;

  if v_spin_id is null then raise exception 'ALREADY_SPUN_TODAY'; end if;

  if v_question.id is not null then
    insert into gamification_private.daily_wheel_quiz_attempts (
      spin_id, question_id, correct_option_id, xp_reward
    )
    values (v_spin_id, v_question.id, v_question.correct_option_id, v_question.xp_reward);
  end if;

  if v_instant_xp > 0 then
    v_award := public.gamification_award_xp_internal(
      v_user_id,
      'DAILY_WHEEL_BONUS',
      v_instant_xp,
      'daily-wheel-spin:' || v_spin_id::text,
      'daily_wheel',
      v_spin_id,
      'Bonus de la roue quotidienne'
    );
    update public.daily_wheel_spins
    set xp_awarded = coalesce((v_award ->> 'xp_gained')::integer, 0)
    where id = v_spin_id;
  end if;

  return jsonb_build_object(
    'status', 'SUCCESS',
    'spin_id', v_spin_id,
    'local_day', v_local_day,
    'result_type', v_result_type,
    'prize_details', v_prize,
    'quiz_status', v_quiz_status,
    'xp_added', coalesce((v_award ->> 'xp_gained')::integer, 0)
  );
end;
$$;

create or replace function public.submit_daily_wheel_quiz(
  p_spin_id uuid,
  p_answer_id text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, gamification_private
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_spin public.daily_wheel_spins%rowtype;
  v_attempt gamification_private.daily_wheel_quiz_attempts%rowtype;
  v_options jsonb;
  v_correct boolean;
  v_award jsonb := jsonb_build_object('awarded', false, 'xp_gained', 0);
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not coalesce((
    select enabled
    from gamification_private.feature_flags
    where feature_key = 'daily_wheel'
  ), false) then raise exception 'FEATURE_DISABLED'; end if;
  if nullif(btrim(p_answer_id), '') is null then raise exception 'ANSWER_REQUIRED'; end if;

  select * into v_spin
  from public.daily_wheel_spins
  where id = p_spin_id and user_id = v_user_id
  for update;

  if not found then raise exception 'SPIN_NOT_FOUND'; end if;
  if v_spin.result_type not in ('QUIZ_EASY', 'QUIZ_HARD') then
    raise exception 'SPIN_IS_NOT_A_QUIZ';
  end if;

  if v_spin.quiz_status in ('correct', 'incorrect') then
    return jsonb_build_object(
      'duplicate', true,
      'correct', v_spin.quiz_status = 'correct',
      'xp_added', 0,
      'quiz_status', v_spin.quiz_status
    );
  end if;

  select * into v_attempt
  from gamification_private.daily_wheel_quiz_attempts
  where spin_id = v_spin.id;
  if not found then raise exception 'QUIZ_ATTEMPT_NOT_FOUND'; end if;

  select options into v_options
  from gamification_private.daily_wheel_quiz_questions
  where id = v_attempt.question_id;

  if not (v_options ? p_answer_id) then raise exception 'INVALID_ANSWER'; end if;
  v_correct := p_answer_id = v_attempt.correct_option_id;

  update public.daily_wheel_spins
  set quiz_status = case when v_correct then 'correct' else 'incorrect' end,
      quiz_answer_id = p_answer_id,
      answered_at = now()
  where id = v_spin.id;

  if v_correct then
    v_award := public.gamification_award_xp_internal(
      v_user_id,
      'DAILY_WHEEL_QUIZ',
      v_attempt.xp_reward,
      'daily-wheel-quiz:' || v_spin.id::text,
      'daily_wheel',
      v_spin.id,
      'Quiz de la roue quotidienne réussi'
    );
    update public.daily_wheel_spins
    set xp_awarded = coalesce((v_award ->> 'xp_gained')::integer, 0)
    where id = v_spin.id;
  end if;

  return jsonb_build_object(
    'duplicate', false,
    'correct', v_correct,
    'quiz_status', case when v_correct then 'correct' else 'incorrect' end,
    'xp_added', coalesce((v_award ->> 'xp_gained')::integer, 0),
    'total_xp', v_award -> 'total_xp'
  );
end;
$$;

revoke all on function public.get_daily_wheel_status() from public, anon, authenticated;
revoke all on function public.spin_daily_wheel() from public, anon, authenticated;
revoke all on function public.submit_daily_wheel_quiz(uuid, text) from public, anon, authenticated;
grant execute on function public.get_daily_wheel_status() to authenticated, service_role;
grant execute on function public.spin_daily_wheel() to authenticated, service_role;
grant execute on function public.submit_daily_wheel_quiz(uuid, text) to authenticated, service_role;

drop policy if exists p0_identity_write on public.daily_wheel_spins;
revoke all on public.daily_wheel_spins from anon, authenticated;
grant select on public.daily_wheel_spins to authenticated;
