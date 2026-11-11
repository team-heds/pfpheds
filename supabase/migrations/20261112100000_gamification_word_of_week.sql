-- Mot de la semaine physio : le « Mot du jour » devient hebdomadaire.
--
-- S'applique par-dessus 20261111110000_gamification_word_of_day.sql (déjà en production).
-- Les tables, les fonctions et les deux appels du navigateur gardent leur nom
-- (word_of_day_*, get_my_word_of_day, submit_my_word_of_day_guess) : l'interface déjà en
-- ligne continue de fonctionner entre l'application de cette migration et le déploiement.
--
-- Ce qui change :
--   - un mot par semaine, du lundi 00:00 au dimanche 23:59 (fuseau Europe/Zurich), le même
--     pour tous ; la colonne play_date contient désormais le LUNDI de la semaine ;
--   - une seule partie par joueur et par semaine, 6 essais, progression conservée toute la
--     semaine ;
--   - XP décidés ici : 30 XP si le mot est trouvé, +15 XP s'il l'est en 3 essais ou moins,
--     une seule fois par semaine (clé d'événement « word-of-week:<lundi> ») ;
--   - statistiques personnelles comptées en semaines ;
--   - reprise des parties quotidiennes déjà jouées : le premier mot tiré dans une semaine
--     devient le mot de cette semaine et ses essais sont conservés. Un joueur déjà payé
--     pour un mot du jour de la semaine en cours n'est pas payé une seconde fois.
--
-- Rien n'est supprimé : les anciennes lignes quotidiennes restent en place et sont
-- simplement ignorées (seules les lignes datées d'un lundi comptent).

-- Lundi de la semaine (heure de Zurich) qui contient l'instant donné.
create or replace function gamification_private.word_of_day_week_start(p_at timestamptz default now())
returns date
language sql
stable
set search_path = ''
as $$
  select date_trunc('week', p_at at time zone 'Europe/Zurich')::date;
$$;

-- Clés d'événement des XP d'une semaine : la clé hebdomadaire, puis les sept anciennes
-- clés quotidiennes de la même semaine (parties jouées avant le passage à la semaine).
create or replace function gamification_private.word_of_day_event_keys(p_week date)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select array['word-of-week:' || p_week::text]
      || array(select 'word-of-day:' || (p_week + d)::text from generate_series(0, 6) as d);
$$;

-- Reprise des parties quotidiennes. Pour chaque semaine qui contient des mots tirés au
-- jour le jour : le premier mot tiré devient le mot de la semaine (ligne datée du lundi)
-- et les essais faits sur ce mot sont rattachés à la semaine. Les mots tirés les jours
-- suivants de la même semaine restent en place comme historique, sans effet sur le jeu.
-- Peut être relancée sans risque : elle ne refait rien de ce qui est déjà repris.
create or replace function gamification_private.word_of_day_adopt_daily_rows()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_moved integer;
begin
  perform pg_advisory_xact_lock(hashtext('gamification:word-of-day:schedule'));

  insert into gamification_private.word_of_day_schedule (play_date, word_id)
  select distinct on (date_trunc('week', s.play_date)::date)
         date_trunc('week', s.play_date)::date, s.word_id
  from gamification_private.word_of_day_schedule s
  order by date_trunc('week', s.play_date)::date, s.play_date
  on conflict (play_date) do nothing;

  -- Essais du premier jour tiré dans la semaine, seulement s'il porte bien le mot retenu
  -- pour la semaine et si le joueur n'a pas déjà une partie hebdomadaire.
  with first_day as (
    select date_trunc('week', s.play_date)::date as week_start, min(s.play_date) as play_date
    from gamification_private.word_of_day_schedule s
    where s.play_date <> date_trunc('week', s.play_date)::date
    group by 1
  )
  update gamification_private.word_of_day_guesses g
  set play_date = f.week_start
  from first_day f
  join gamification_private.word_of_day_schedule daily on daily.play_date = f.play_date
  join gamification_private.word_of_day_schedule weekly on weekly.play_date = f.week_start
  where g.play_date = f.play_date
    and daily.word_id = weekly.word_id
    and not exists (
      select 1 from gamification_private.word_of_day_guesses kept
      where kept.user_id = g.user_id and kept.play_date = f.week_start
    );

  get diagnostics v_moved = row_count;
  return v_moved;
end;
$$;

-- Mot de la semaine : tiré au sort une seule fois par lundi, parmi les mots actifs les
-- moins récemment joués (aucune répétition tant que la liste n'est pas épuisée).
create or replace function gamification_private.word_of_day_ensure(p_date date)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_week date := date_trunc('week', p_date)::date;
  v_word_id integer;
begin
  select s.word_id into v_word_id
  from gamification_private.word_of_day_schedule s
  where s.play_date = v_week;
  if v_word_id is not null then
    return v_word_id;
  end if;

  perform pg_advisory_xact_lock(hashtext('gamification:word-of-day:schedule'));

  select s.word_id into v_word_id
  from gamification_private.word_of_day_schedule s
  where s.play_date = v_week;
  if v_word_id is not null then
    return v_word_id;
  end if;

  select w.id into v_word_id
  from gamification_private.word_of_day_words w
  where w.is_active
  order by (
    select max(s.play_date)
    from gamification_private.word_of_day_schedule s
    where s.word_id = w.id
  ) nulls first, random()
  limit 1;

  if v_word_id is null then
    raise exception 'No word available';
  end if;

  insert into gamification_private.word_of_day_schedule (play_date, word_id)
  values (v_week, v_word_id);

  return v_word_id;
end;
$$;

-- État complet de la partie de la semaine pour un joueur. La solution n'y figure que si
-- la partie est terminée.
create or replace function gamification_private.word_of_day_state(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_week date := gamification_private.word_of_day_week_start();
  v_word gamification_private.word_of_day_words%rowtype;
  v_attempts jsonb;
  v_attempt_count integer;
  v_won boolean;
  v_status text;
  v_xp integer;
  v_played integer;
  v_wins integer;
  v_best integer;
  v_streak integer := 0;
  v_cursor date;
begin
  select w.* into v_word
  from gamification_private.word_of_day_words w
  where w.id = gamification_private.word_of_day_ensure(v_week);

  select
    coalesce(jsonb_agg(jsonb_build_object('guess', g.guess, 'feedback', g.feedback)
      order by g.attempt_no), '[]'::jsonb),
    count(*),
    coalesce(bool_or(g.is_correct), false)
  into v_attempts, v_attempt_count, v_won
  from gamification_private.word_of_day_guesses g
  where g.user_id = p_user_id and g.play_date = v_week;

  v_status := case
    when v_won then 'won'
    when v_attempt_count >= 6 then 'lost'
    else 'in_progress'
  end;

  select coalesce(sum(xh.amount), 0) into v_xp
  from public.xp_history xh
  where xh.user_id = p_user_id
    and xh.event_key = any (gamification_private.word_of_day_event_keys(v_week));

  -- Parties jouées : terminées (trouvé ou 6 essais) ou abandonnées une semaine passée.
  -- Seules les lignes datées d'un lundi sont des parties hebdomadaires.
  with games as (
    select g.play_date, bool_or(g.is_correct) as won, count(*) as attempts
    from gamification_private.word_of_day_guesses g
    where g.user_id = p_user_id
      and g.play_date = date_trunc('week', g.play_date)::date
    group by g.play_date
  ),
  finished as (
    select * from games gm
    where gm.won or gm.attempts >= 6 or gm.play_date < v_week
  ),
  islands as (
    select f.play_date,
           f.play_date - (7 * row_number() over (order by f.play_date))::integer as island
    from finished f
    where f.won
  )
  select
    (select count(*) from finished),
    (select count(*) from finished f where f.won),
    coalesce((select max(i.weeks) from (
      select count(*) as weeks from islands group by island
    ) i), 0)
  into v_played, v_wins, v_best;

  -- Série en cours : semaines consécutives avec le mot trouvé, jusqu'à cette semaine, ou
  -- jusqu'à la semaine passée tant que la partie de la semaine n'est pas terminée.
  if v_status <> 'lost' then
    v_cursor := case when v_status = 'won' then v_week else v_week - 7 end;
    while exists (
      select 1 from gamification_private.word_of_day_guesses g
      where g.user_id = p_user_id and g.play_date = v_cursor and g.is_correct
    ) loop
      v_streak := v_streak + 1;
      v_cursor := v_cursor - 7;
    end loop;
  end if;

  return jsonb_build_object(
    'eligible', true,
    'period', 'week',
    'play_date', v_week,
    'week_start', v_week,
    'week_end', v_week + 6,
    'next_word_at', ((v_week + 7)::timestamp at time zone 'Europe/Zurich'),
    'word_length', char_length(v_word.word),
    'max_attempts', 6,
    'attempts', v_attempts,
    'status', v_status,
    'xp_awarded', v_xp,
    'solution', case
      when v_status = 'in_progress' then null
      else jsonb_build_object(
        'word', v_word.display_word,
        'definition', v_word.definition,
        'theme', v_word.theme
      )
    end,
    'stats', jsonb_build_object(
      'played', v_played,
      'won', v_wins,
      'win_rate', case when v_played > 0 then round(100.0 * v_wins / v_played)::integer else 0 end,
      'current_streak', v_streak,
      'best_streak', greatest(v_best, v_streak)
    )
  );
end;
$$;

-- Proposition d'un essai. Le serveur compare, enregistre, et attribue les XP si le mot
-- est trouvé. La réponse ne contient jamais le mot tant que la partie continue.
create or replace function public.submit_my_word_of_day_guess(p_guess text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_week date := gamification_private.word_of_day_week_start();
  v_target text;
  v_guess text;
  v_feedback text;
  v_attempt_count integer;
  v_won boolean;
  v_correct boolean;
  v_amount integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if not gamification_private.is_rollout_member(v_user_id) then
    raise exception 'Word of day not open for this account';
  end if;

  select w.word into v_target
  from gamification_private.word_of_day_words w
  where w.id = gamification_private.word_of_day_ensure(v_week);

  v_guess := upper(translate(
    btrim(coalesce(p_guess, '')),
    'àâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ',
    'aaaeeeeiioouuucAAAEEEEIIOOUUUC'
  ));
  if v_guess !~ '^[A-Z]+$' or char_length(v_guess) <> char_length(v_target) then
    raise exception 'Invalid guess';
  end if;

  -- Un essai à la fois par joueur : le compteur lu reste exact jusqu'à l'écriture.
  perform pg_advisory_xact_lock(hashtext('gamification:word-of-day:' || v_user_id::text));

  select count(*), coalesce(bool_or(g.is_correct), false)
  into v_attempt_count, v_won
  from gamification_private.word_of_day_guesses g
  where g.user_id = v_user_id and g.play_date = v_week;

  if v_won or v_attempt_count >= 6 then
    raise exception 'Word of day already finished';
  end if;

  v_feedback := gamification_private.word_of_day_feedback(v_target, v_guess);
  v_correct := v_guess = v_target;

  insert into gamification_private.word_of_day_guesses (
    user_id, play_date, attempt_no, guess, feedback, is_correct
  ) values (
    v_user_id, v_week, v_attempt_count + 1, v_guess, v_feedback, v_correct
  );

  -- Un seul gain par semaine : rien si le joueur a déjà été payé cette semaine, y compris
  -- pour un ancien « mot du jour » de la même semaine.
  if v_correct and coalesce((
    select rc.rewards_enabled
    from gamification_private.rollout_config rc
    where rc.singleton
  ), false) and not exists (
    select 1 from public.xp_history xh
    where xh.user_id = v_user_id
      and xh.event_key = any (gamification_private.word_of_day_event_keys(v_week))
  ) then
    v_amount := 30 + case when v_attempt_count + 1 <= 3 then 15 else 0 end;
    perform public.gamification_award_xp_internal(
      v_user_id,
      'WORD_OF_WEEK',
      v_amount,
      'word-of-week:' || v_week::text,
      'word_of_week',
      null,
      case
        when v_attempt_count + 1 <= 3 then 'Mot de la semaine trouvé en 3 essais ou moins'
        else 'Mot de la semaine trouvé'
      end
    );
  end if;

  return gamification_private.word_of_day_state(v_user_id);
end;
$$;

revoke all on function gamification_private.word_of_day_week_start(timestamptz) from public, anon, authenticated;
revoke all on function gamification_private.word_of_day_event_keys(date) from public, anon, authenticated;
revoke all on function gamification_private.word_of_day_adopt_daily_rows() from public, anon, authenticated;
revoke all on function gamification_private.word_of_day_ensure(date) from public, anon, authenticated;
revoke all on function gamification_private.word_of_day_state(uuid) from public, anon, authenticated;
revoke all on function public.submit_my_word_of_day_guess(text) from public, anon;
grant execute on function public.submit_my_word_of_day_guess(text) to authenticated;

-- Reprise immédiate : le mot tiré le 11 novembre 2026 devient le mot de la semaine du
-- 9 au 15 novembre, avec les essais déjà enregistrés.
select gamification_private.word_of_day_adopt_daily_rows();
