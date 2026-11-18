-- Duel de quiz (gamification 2026-2027) : deux joueurs répondent aux 5 mêmes questions,
-- chacun quand il veut dans les 48 heures ; le gagnant rapporte des points à sa maison.
--
-- Déroulement :
--   * lancer un duel : défier un joueur précis (recherche par nom) ou demander un adversaire
--     au hasard dans une autre maison ; thème au choix ou « tous thèmes » ;
--   * les 5 questions sont tirées par le serveur parmi les questions des quiz PUBLIÉS
--     (public.quiz_questions), déjà ouverts, destinés aux classes des deux joueurs et dont
--     aucun des deux n'est l'auteur ; moins de 5 questions disponibles = refus explicite
--     (code duel_not_enough_questions, nombre disponible dans le détail) ;
--   * l'adversaire est prévenu (file push_outbox) et peut refuser ; jouer vaut acceptation ;
--   * une question à la fois, 20 secondes chacune, mesurées par le serveur (heure d'affichage
--     posée par next_quiz_duel_question, heure de réponse par answer_quiz_duel_question,
--     3 secondes de marge réseau) ; hors délai = réponse fausse comptée 20 s ;
--   * score : bonnes réponses, puis temps total le plus court ; égalité parfaite = match nul.
--
-- Points (décidés ici, jamais par le navigateur) :
--   * 15 XP au gagnant, 5 XP au perdant (qui a donc terminé), 8 XP chacun en cas d'égalité ;
--   * au plus 3 duels récompensés par joueur et par jour (heure de Zurich) ;
--   * aucun point si un seul joueur a joué avant l'expiration (victoire par forfait sans XP),
--     ni si le duel est refusé ou expire sans avoir été joué ;
--   * joueurs de la gamification uniquement, interrupteur général des récompenses respecté ;
--     l'XP passe par gamification_award_xp_internal et compte donc aussi pour la maison.
--
-- Sécurité :
--   * les bonnes réponses ne sortent jamais avant que les DEUX joueurs aient terminé ; même
--     sa propre correction n'est donnée qu'une fois le duel clos (pas de partage de réponses) ;
--   * une réponse est définitive, une question affichée ne peut pas être « rejouée » ;
--   * la correction n'est montrée qu'à qui a joué les 5 questions ;
--   * tables en écriture fermée au navigateur (RLS + aucun droit d'écriture) ; tout passe par
--     les fonctions ci-dessous.
--
-- Tables en ajout seul (aucun UPDATE ni DELETE) : l'état d'un duel se déduit des lignes
-- présentes. Aucune fonction existante n'est redéfinie. Migration additive et rejouable.

-- ---------------------------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------------------------

create table if not exists public.quiz_duels (
  id uuid not null default gen_random_uuid(),
  challenger_id uuid not null references auth.users(id) on delete cascade,
  opponent_id uuid not null references auth.users(id) on delete cascade,
  -- null = tous thèmes
  theme text,
  matchmaking text not null default 'direct',
  question_ids uuid[] not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint quiz_duels_pkey primary key (id),
  constraint quiz_duels_players_check check (challenger_id <> opponent_id),
  constraint quiz_duels_matchmaking_check check (matchmaking in ('direct', 'random')),
  constraint quiz_duels_theme_length check (theme is null or char_length(theme) between 1 and 40),
  constraint quiz_duels_questions_check check (cardinality(question_ids) = 5),
  constraint quiz_duels_expiry_check check (expires_at > created_at)
);

comment on table public.quiz_duels is
  'Duels de quiz : deux joueurs, 5 questions tirées par le serveur, 48 heures pour jouer.';

create index if not exists idx_quiz_duels_challenger on public.quiz_duels (challenger_id, created_at desc);
create index if not exists idx_quiz_duels_opponent on public.quiz_duels (opponent_id, created_at desc);
create index if not exists idx_quiz_duels_expires on public.quiz_duels (expires_at);

-- Réponse de l'adversaire à l'invitation (jouer vaut acceptation).
create table if not exists public.quiz_duel_responses (
  duel_id uuid not null references public.quiz_duels(id) on delete cascade,
  response text not null,
  responded_at timestamptz not null default now(),
  constraint quiz_duel_responses_pkey primary key (duel_id),
  constraint quiz_duel_responses_check check (response in ('accepted', 'declined'))
);

-- Heure à laquelle le serveur a montré une question à un joueur (départ du chronomètre).
create table if not exists public.quiz_duel_steps (
  duel_id uuid not null references public.quiz_duels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  position integer not null,
  shown_at timestamptz not null default clock_timestamp(),
  constraint quiz_duel_steps_pkey primary key (duel_id, user_id, position),
  constraint quiz_duel_steps_position_check check (position between 1 and 5)
);

-- Réponses données, corrigées par le serveur ; définitives.
create table if not exists public.quiz_duel_answers (
  duel_id uuid not null,
  user_id uuid not null,
  position integer not null,
  question_id uuid not null,
  selected text[] not null,
  is_correct boolean not null,
  timed_out boolean not null default false,
  elapsed_ms integer not null,
  answered_at timestamptz not null default clock_timestamp(),
  constraint quiz_duel_answers_pkey primary key (duel_id, user_id, position),
  constraint quiz_duel_answers_step_fkey foreign key (duel_id, user_id, position)
    references public.quiz_duel_steps (duel_id, user_id, position) on delete cascade,
  constraint quiz_duel_answers_elapsed_check check (elapsed_ms between 0 and 20000),
  constraint quiz_duel_answers_timeout_check check (not timed_out or not is_correct)
);

create index if not exists idx_quiz_duel_answers_question on public.quiz_duel_answers (question_id);

-- Issue du duel, écrite une seule fois par gamification_private.quiz_duel_settle.
create table if not exists public.quiz_duel_outcomes (
  duel_id uuid not null references public.quiz_duels(id) on delete cascade,
  -- completed : les deux ont joué ; forfeit : un seul a joué avant l'expiration ;
  -- declined : refusé par l'adversaire ; expired : personne n'a terminé à temps.
  reason text not null,
  winner_id uuid references auth.users(id) on delete set null,
  challenger_correct integer,
  opponent_correct integer,
  challenger_ms bigint,
  opponent_ms bigint,
  challenger_xp integer not null default 0,
  opponent_xp integer not null default 0,
  settled_at timestamptz not null default now(),
  constraint quiz_duel_outcomes_pkey primary key (duel_id),
  constraint quiz_duel_outcomes_reason_check check (reason in ('completed', 'forfeit', 'declined', 'expired')),
  constraint quiz_duel_outcomes_xp_check check (
    challenger_xp in (0, 5, 8, 15) and opponent_xp in (0, 5, 8, 15)
    and (reason = 'completed' or (challenger_xp = 0 and opponent_xp = 0))
  ),
  constraint quiz_duel_outcomes_winner_check check (
    (reason in ('declined', 'expired') and winner_id is null)
    or (reason = 'forfeit' and winner_id is not null)
    or reason = 'completed'
  )
);

create index if not exists idx_quiz_duel_outcomes_settled on public.quiz_duel_outcomes (settled_at);

comment on table public.quiz_duel_outcomes is
  'Résultat d''un duel de quiz et XP attribués, calculés par le serveur ; jamais modifié.';

-- ---------------------------------------------------------------------------------------------
-- Droits et RLS
-- ---------------------------------------------------------------------------------------------

alter table public.quiz_duels enable row level security;
alter table public.quiz_duel_responses enable row level security;
alter table public.quiz_duel_steps enable row level security;
alter table public.quiz_duel_answers enable row level security;
alter table public.quiz_duel_outcomes enable row level security;

revoke all on table public.quiz_duels from public, anon, authenticated;
revoke all on table public.quiz_duel_responses from public, anon, authenticated;
revoke all on table public.quiz_duel_steps from public, anon, authenticated;
revoke all on table public.quiz_duel_answers from public, anon, authenticated;
revoke all on table public.quiz_duel_outcomes from public, anon, authenticated;

-- Lecture directe limitée aux deux joueurs et à ce qui ne révèle aucune réponse.
-- Les réponses (et leur correction) ne sont lisibles que par les fonctions.
grant select on table public.quiz_duels to authenticated;
grant select on table public.quiz_duel_responses to authenticated;
grant select on table public.quiz_duel_outcomes to authenticated;

do $policies$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'quiz_duels' and policyname = 'quiz_duels_select_players') then
    create policy quiz_duels_select_players
      on public.quiz_duels for select to authenticated
      using ((select auth.uid()) in (challenger_id, opponent_id));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'quiz_duel_responses' and policyname = 'quiz_duel_responses_select_players') then
    create policy quiz_duel_responses_select_players
      on public.quiz_duel_responses for select to authenticated
      using (exists (
        select 1 from public.quiz_duels d
        where d.id = quiz_duel_responses.duel_id
          and (select auth.uid()) in (d.challenger_id, d.opponent_id)
      ));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'quiz_duel_outcomes' and policyname = 'quiz_duel_outcomes_select_players') then
    create policy quiz_duel_outcomes_select_players
      on public.quiz_duel_outcomes for select to authenticated
      using (exists (
        select 1 from public.quiz_duels d
        where d.id = quiz_duel_outcomes.duel_id
          and (select auth.uid()) in (d.challenger_id, d.opponent_id)
      ));
  end if;

  -- Étapes et réponses : aucun droit pour le navigateur ; politique « ses propres lignes »
  -- en défense en profondeur si un droit était accordé par erreur.
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'quiz_duel_steps' and policyname = 'quiz_duel_steps_select_own') then
    create policy quiz_duel_steps_select_own
      on public.quiz_duel_steps for select to authenticated
      using (user_id = (select auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'quiz_duel_answers' and policyname = 'quiz_duel_answers_select_own') then
    create policy quiz_duel_answers_select_own
      on public.quiz_duel_answers for select to authenticated
      using (user_id = (select auth.uid()));
  end if;
end
$policies$;

-- ---------------------------------------------------------------------------------------------
-- Fonctions internes
-- ---------------------------------------------------------------------------------------------

-- Réglages du duel (une seule source pour le serveur ; l'interface les reçoit dans les réponses).
create or replace function gamification_private.quiz_duel_settings()
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'question_count', 5,
    'time_limit_ms', 20000,
    'grace_ms', 3000,
    'duration_hours', 48,
    'daily_reward_cap', 3,
    'xp_win', 15,
    'xp_loss', 5,
    'xp_draw', 8
  );
$$;

-- Personne connectée, joueuse de la gamification.
create or replace function gamification_private.quiz_duel_require_player()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if not gamification_private.is_rollout_member(v_user_id) then
    raise exception 'duel_not_player' using errcode = 'P0001';
  end if;
  return v_user_id;
end;
$$;

-- Questions disponibles pour un duel entre ces joueurs (thème null = tous thèmes).
create or replace function gamification_private.quiz_duel_question_pool(
  p_players uuid[],
  p_theme text
)
returns table (question_id uuid, theme text)
language sql
stable
security definer
set search_path = ''
as $$
  select qq.id, btrim(q.theme)
  from public.quiz_questions qq
  join public.quizzes q on q.id = qq.quiz_id
  where q.status = 'published'
    and (q.opens_at is null or q.opens_at <= now())
    and not (q.author_id = any (p_players))
    and (
      nullif(btrim(coalesce(p_theme, '')), '') is null
      or lower(btrim(q.theme)) = lower(btrim(p_theme))
    )
    and (
      cardinality(q.target_classes) = 0
      or not exists (
        select 1
        from unnest(p_players) as p(player_id)
        where not exists (
          select 1 from public.user_profiles up
          where up.user_id = p.player_id
            and upper(btrim(coalesce(up.classe, ''))) = any (q.target_classes)
        )
      )
    );
$$;

-- Duel encore ouvert entre deux joueurs (dans un sens ou dans l'autre).
create or replace function gamification_private.quiz_duel_open_between(p_a uuid, p_b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.quiz_duels d
    where ((d.challenger_id = p_a and d.opponent_id = p_b) or (d.challenger_id = p_b and d.opponent_id = p_a))
      and d.expires_at + interval '1 minute' > now()
      and not exists (select 1 from public.quiz_duel_outcomes o where o.duel_id = d.id)
  );
$$;

-- Maison d'un joueur (nom et couleur) pour l'affichage.
create or replace function gamification_private.quiz_duel_player(p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', p_user_id,
    'name', gamification_private.quiz_display_name(p_user_id),
    'classe', (select nullif(btrim(up.classe), '') from public.user_profiles up where up.user_id = p_user_id),
    'house_name', h.name,
    'house_color', h.color
  )
  from (select 1) as one
  left join public.gamification_data gd on gd.user_id = p_user_id
  left join public.houses h on h.id = gd.house_id;
$$;

-- Avancement d'un joueur : réponses données, bonnes réponses, temps total, fin.
create or replace function gamification_private.quiz_duel_progress(p_duel_id uuid, p_user_id uuid)
returns table (answered integer, correct integer, total_ms bigint, finished_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select
    count(*)::integer,
    (count(*) filter (where a.is_correct))::integer,
    coalesce(sum(a.elapsed_ms), 0)::bigint,
    case when count(*) >= 5 then max(a.answered_at) end
  from public.quiz_duel_answers a
  where a.duel_id = p_duel_id and a.user_id = p_user_id;
$$;

-- Notification dans la plateforme et sur l'appareil (file existante push_outbox).
create or replace function gamification_private.quiz_duel_notify(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_duel_id uuid
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.push_outbox (user_id, title, body, url)
  select p_user_id, left(p_title, 120), left(p_body, 400), '/duels?duel=' || p_duel_id::text
  where p_user_id is not null;
$$;

-- Points d'un joueur pour un duel, avec le plafond de 3 duels récompensés par jour.
-- Doit être appelée avec le verrou du joueur (voir quiz_duel_settle).
create or replace function gamification_private.quiz_duel_reward(
  p_user_id uuid,
  p_duel_id uuid,
  p_action text,
  p_amount integer,
  p_description text
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_day_start timestamptz :=
    pg_catalog.date_trunc('day', now() at time zone 'Europe/Zurich') at time zone 'Europe/Zurich';
  v_rewarded integer;
  v_award jsonb;
begin
  if not coalesce((
    select rc.rewards_enabled from gamification_private.rollout_config rc where rc.singleton
  ), false) then
    return 0;
  end if;

  if not gamification_private.is_rollout_member(p_user_id) then
    return 0;
  end if;

  select count(*) into v_rewarded
  from public.quiz_duel_outcomes o
  join public.quiz_duels d on d.id = o.duel_id
  where o.settled_at >= v_day_start
    and o.duel_id <> p_duel_id
    and (
      (d.challenger_id = p_user_id and o.challenger_xp > 0)
      or (d.opponent_id = p_user_id and o.opponent_xp > 0)
    );

  if v_rewarded >= 3 then
    return 0;
  end if;

  v_award := public.gamification_award_xp_internal(
    p_user_id,
    p_action,
    p_amount,
    'quiz-duel:' || p_duel_id::text,
    'quiz_duel',
    p_duel_id,
    p_description
  );

  if coalesce((v_award ->> 'awarded')::boolean, false) then
    return p_amount;
  end if;
  return 0;
end;
$$;

-- Clôt un duel si son issue est connue (les deux ont joué, refus, ou expiration).
-- Idempotente : renvoie la ligne d'issue existante si le duel est déjà clos, null s'il est
-- encore en cours.
create or replace function gamification_private.quiz_duel_settle(p_duel_id uuid)
returns public.quiz_duel_outcomes
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_duel public.quiz_duels%rowtype;
  v_outcome public.quiz_duel_outcomes%rowtype;
  v_c record;
  v_o record;
  v_c_done boolean;
  v_o_done boolean;
  v_reason text;
  v_winner uuid;
  v_c_xp integer := 0;
  v_o_xp integer := 0;
  v_c_name text;
  v_o_name text;
  v_theme_label text;
begin
  -- Un seul règlement à la fois pour ce duel.
  select d.* into v_duel from public.quiz_duels d where d.id = p_duel_id for update;
  if not found then
    return null;
  end if;

  select o.* into v_outcome from public.quiz_duel_outcomes o where o.duel_id = p_duel_id;
  if found then
    return v_outcome;
  end if;

  select * into v_c from gamification_private.quiz_duel_progress(v_duel.id, v_duel.challenger_id);
  select * into v_o from gamification_private.quiz_duel_progress(v_duel.id, v_duel.opponent_id);
  v_c_done := v_c.answered >= 5;
  v_o_done := v_o.answered >= 5;

  if exists (select 1 from public.quiz_duel_responses r where r.duel_id = v_duel.id and r.response = 'declined') then
    v_reason := 'declined';
  elsif v_c_done and v_o_done then
    v_reason := 'completed';
    if v_c.correct > v_o.correct or (v_c.correct = v_o.correct and v_c.total_ms < v_o.total_ms) then
      v_winner := v_duel.challenger_id;
    elsif v_o.correct > v_c.correct or (v_o.correct = v_c.correct and v_o.total_ms < v_c.total_ms) then
      v_winner := v_duel.opponent_id;
    end if;
  elsif now() <= v_duel.expires_at + interval '1 minute' then
    -- Encore en cours.
    return null;
  elsif v_c_done or v_o_done then
    v_reason := 'forfeit';
    v_winner := case when v_c_done then v_duel.challenger_id else v_duel.opponent_id end;
  else
    v_reason := 'expired';
  end if;

  v_c_name := gamification_private.quiz_display_name(v_duel.challenger_id);
  v_o_name := gamification_private.quiz_display_name(v_duel.opponent_id);
  v_theme_label := coalesce(v_duel.theme, 'tous thèmes');

  if v_reason = 'completed' then
    -- Verrous des deux joueurs, toujours dans le même ordre (plafond journalier exact).
    perform pg_advisory_xact_lock(hashtextextended('quiz-duel:reward:' || least(v_duel.challenger_id, v_duel.opponent_id)::text, 0));
    perform pg_advisory_xact_lock(hashtextextended('quiz-duel:reward:' || greatest(v_duel.challenger_id, v_duel.opponent_id)::text, 0));

    if v_winner is null then
      v_c_xp := gamification_private.quiz_duel_reward(v_duel.challenger_id, v_duel.id, 'QUIZ_DUEL_DRAW', 8, 'Duel de quiz : égalité contre ' || v_o_name);
      v_o_xp := gamification_private.quiz_duel_reward(v_duel.opponent_id, v_duel.id, 'QUIZ_DUEL_DRAW', 8, 'Duel de quiz : égalité contre ' || v_c_name);
    elsif v_winner = v_duel.challenger_id then
      v_c_xp := gamification_private.quiz_duel_reward(v_duel.challenger_id, v_duel.id, 'QUIZ_DUEL_WIN', 15, 'Duel de quiz gagné contre ' || v_o_name);
      v_o_xp := gamification_private.quiz_duel_reward(v_duel.opponent_id, v_duel.id, 'QUIZ_DUEL_LOSS', 5, 'Duel de quiz terminé contre ' || v_c_name);
    else
      v_c_xp := gamification_private.quiz_duel_reward(v_duel.challenger_id, v_duel.id, 'QUIZ_DUEL_LOSS', 5, 'Duel de quiz terminé contre ' || v_o_name);
      v_o_xp := gamification_private.quiz_duel_reward(v_duel.opponent_id, v_duel.id, 'QUIZ_DUEL_WIN', 15, 'Duel de quiz gagné contre ' || v_c_name);
    end if;
  end if;

  insert into public.quiz_duel_outcomes (
    duel_id, reason, winner_id,
    challenger_correct, opponent_correct, challenger_ms, opponent_ms,
    challenger_xp, opponent_xp, settled_at
  )
  values (
    v_duel.id, v_reason, v_winner,
    case when v_c_done then v_c.correct end,
    case when v_o_done then v_o.correct end,
    case when v_c_done then v_c.total_ms end,
    case when v_o_done then v_o.total_ms end,
    v_c_xp, v_o_xp, clock_timestamp()
  )
  returning * into v_outcome;

  -- Prévenir les joueurs qui ne sont pas devant leur écran.
  -- (La personne qui vient de terminer voit déjà le résultat à l'écran.)
  if v_reason = 'completed' then
    if v_duel.challenger_id is distinct from (select auth.uid()) then
      perform gamification_private.quiz_duel_notify(
        v_duel.challenger_id,
        'Duel de quiz : résultat',
        case
          when v_winner is null then 'Égalité contre '
          when v_winner = v_duel.challenger_id then 'Victoire contre '
          else 'Défaite contre '
        end || v_o_name || ' (' || v_theme_label || '). Voir la correction.',
        v_duel.id
      );
    end if;
    if v_duel.opponent_id is distinct from (select auth.uid()) then
      perform gamification_private.quiz_duel_notify(
        v_duel.opponent_id,
        'Duel de quiz : résultat',
        case
          when v_winner is null then 'Égalité contre '
          when v_winner = v_duel.opponent_id then 'Victoire contre '
          else 'Défaite contre '
        end || v_c_name || ' (' || v_theme_label || '). Voir la correction.',
        v_duel.id
      );
    end if;
  elsif v_reason = 'forfeit' then
    perform gamification_private.quiz_duel_notify(
      v_winner,
      'Duel de quiz : victoire par forfait',
      case when v_winner = v_duel.challenger_id then v_o_name else v_c_name end
        || ' n''a pas joué à temps. Victoire par forfait, sans points.',
      v_duel.id
    );
  end if;

  return v_outcome;
end;
$$;

-- Clôt les duels expirés (appelée à chaque ouverture de « Mes duels »).
create or replace function gamification_private.quiz_duel_settle_expired(p_limit integer default 50)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_duel_id uuid;
  v_count integer := 0;
begin
  for v_duel_id in
    select d.id
    from public.quiz_duels d
    where d.expires_at + interval '1 minute' < now()
      and not exists (select 1 from public.quiz_duel_outcomes o where o.duel_id = d.id)
    order by d.expires_at
    limit greatest(1, least(coalesce(p_limit, 50), 200))
  loop
    perform gamification_private.quiz_duel_settle(v_duel_id);
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- Résumé d'un duel vu par un joueur (sans aucune bonne réponse).
create or replace function gamification_private.quiz_duel_summary(p_duel_id uuid, p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_duel public.quiz_duels%rowtype;
  v_outcome public.quiz_duel_outcomes%rowtype;
  v_has_outcome boolean;
  v_is_challenger boolean;
  v_other uuid;
  v_me record;
  v_them record;
  v_response text;
  v_state text;
  v_result text;
  v_steps integer;
begin
  select d.* into v_duel from public.quiz_duels d where d.id = p_duel_id;
  if not found or p_user_id not in (v_duel.challenger_id, v_duel.opponent_id) then
    return null;
  end if;

  v_is_challenger := p_user_id = v_duel.challenger_id;
  v_other := case when v_is_challenger then v_duel.opponent_id else v_duel.challenger_id end;

  select o.* into v_outcome from public.quiz_duel_outcomes o where o.duel_id = v_duel.id;
  v_has_outcome := found;

  select * into v_me from gamification_private.quiz_duel_progress(v_duel.id, p_user_id);
  select * into v_them from gamification_private.quiz_duel_progress(v_duel.id, v_other);
  select r.response into v_response from public.quiz_duel_responses r where r.duel_id = v_duel.id;
  select count(*) into v_steps from public.quiz_duel_steps s where s.duel_id = v_duel.id and s.user_id = p_user_id;

  if v_has_outcome then
    v_state := 'done';
    v_result := case
      when v_outcome.reason in ('declined', 'expired') then v_outcome.reason
      when v_outcome.winner_id is null then 'draw'
      when v_outcome.winner_id = p_user_id then 'win'
      else 'loss'
    end;
  elsif v_me.answered >= 5 then
    v_state := 'waiting';
  elsif now() > v_duel.expires_at then
    -- Délai écoulé, règlement imminent.
    v_state := case when v_steps > 0 then 'to_play' else 'closing' end;
  else
    v_state := 'to_play';
  end if;

  return jsonb_build_object(
    'id', v_duel.id,
    'role', case when v_is_challenger then 'challenger' else 'opponent' end,
    'state', v_state,
    'needs_response', not v_is_challenger and v_response is null and v_steps = 0 and not v_has_outcome,
    'response', v_response,
    'theme', v_duel.theme,
    'matchmaking', v_duel.matchmaking,
    'created_at', v_duel.created_at,
    'expires_at', v_duel.expires_at,
    'opponent', gamification_private.quiz_duel_player(v_other),
    'my_answered', v_me.answered,
    'my_started', v_steps > 0,
    'opponent_finished', v_them.answered >= 5,
    'outcome', case when v_has_outcome then jsonb_build_object(
      'reason', v_outcome.reason,
      'result', v_result,
      'forfeit', v_outcome.reason = 'forfeit',
      'my_correct', case when v_is_challenger then v_outcome.challenger_correct else v_outcome.opponent_correct end,
      'opponent_correct', case when v_is_challenger then v_outcome.opponent_correct else v_outcome.challenger_correct end,
      'my_ms', case when v_is_challenger then v_outcome.challenger_ms else v_outcome.opponent_ms end,
      'opponent_ms', case when v_is_challenger then v_outcome.opponent_ms else v_outcome.challenger_ms end,
      'my_xp', case when v_is_challenger then v_outcome.challenger_xp else v_outcome.opponent_xp end,
      'opponent_xp', case when v_is_challenger then v_outcome.opponent_xp else v_outcome.challenger_xp end,
      'settled_at', v_outcome.settled_at
    ) end
  );
end;
$$;

revoke all on function gamification_private.quiz_duel_settings() from public, anon, authenticated;
revoke all on function gamification_private.quiz_duel_require_player() from public, anon, authenticated;
revoke all on function gamification_private.quiz_duel_question_pool(uuid[], text) from public, anon, authenticated;
revoke all on function gamification_private.quiz_duel_open_between(uuid, uuid) from public, anon, authenticated;
revoke all on function gamification_private.quiz_duel_player(uuid) from public, anon, authenticated;
revoke all on function gamification_private.quiz_duel_progress(uuid, uuid) from public, anon, authenticated;
revoke all on function gamification_private.quiz_duel_notify(uuid, text, text, uuid) from public, anon, authenticated;
revoke all on function gamification_private.quiz_duel_reward(uuid, uuid, text, integer, text) from public, anon, authenticated;
revoke all on function gamification_private.quiz_duel_settle(uuid) from public, anon, authenticated;
revoke all on function gamification_private.quiz_duel_settle_expired(integer) from public, anon, authenticated;
revoke all on function gamification_private.quiz_duel_summary(uuid, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Fonctions appelées par l'application
-- ---------------------------------------------------------------------------------------------

-- « Mes duels » : bilan, thèmes disponibles, duels à jouer, en attente et terminés.
create or replace function public.get_my_quiz_duels()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := gamification_private.quiz_duel_require_player();
  v_day_start timestamptz :=
    pg_catalog.date_trunc('day', now() at time zone 'Europe/Zurich') at time zone 'Europe/Zurich';
  v_stats jsonb;
  v_streak integer := 0;
  v_best integer := 0;
  v_run integer := 0;
  v_current boolean := true;
  v_row record;
  v_duels jsonb;
  v_themes jsonb;
  v_pool integer;
  v_rewarded_today integer;
begin
  perform gamification_private.quiz_duel_settle_expired(50);

  -- Série en cours : victoires d'affilée depuis le duel le plus récent ; meilleure série.
  for v_row in
    select coalesce(o.winner_id = v_user_id, false) as won
    from public.quiz_duel_outcomes o
    join public.quiz_duels d on d.id = o.duel_id
    where v_user_id in (d.challenger_id, d.opponent_id)
      and o.reason in ('completed', 'forfeit')
    order by o.settled_at desc, o.duel_id
  loop
    if v_row.won then
      v_run := v_run + 1;
      if v_current then
        v_streak := v_streak + 1;
      end if;
    else
      v_current := false;
      v_best := greatest(v_best, v_run);
      v_run := 0;
    end if;
  end loop;
  v_best := greatest(v_best, v_run);

  select jsonb_build_object(
    'wins', count(*) filter (where o.winner_id = v_user_id),
    'losses', count(*) filter (where o.winner_id is not null and o.winner_id <> v_user_id),
    'draws', count(*) filter (where o.reason = 'completed' and o.winner_id is null),
    'forfeit_wins', count(*) filter (where o.reason = 'forfeit' and o.winner_id = v_user_id),
    'xp_total', coalesce(sum(case when d.challenger_id = v_user_id then o.challenger_xp else o.opponent_xp end), 0)
  )
  into v_stats
  from public.quiz_duel_outcomes o
  join public.quiz_duels d on d.id = o.duel_id
  where v_user_id in (d.challenger_id, d.opponent_id)
    and o.reason in ('completed', 'forfeit');

  select count(*) into v_rewarded_today
  from public.quiz_duel_outcomes o
  join public.quiz_duels d on d.id = o.duel_id
  where o.settled_at >= v_day_start
    and ((d.challenger_id = v_user_id and o.challenger_xp > 0)
      or (d.opponent_id = v_user_id and o.opponent_xp > 0));

  v_stats := v_stats || jsonb_build_object(
    'streak', v_streak,
    'best_streak', v_best,
    'rewarded_today', v_rewarded_today
  );

  -- Thèmes jouables (questions accessibles à la personne connectée).
  select count(*) into v_pool
  from gamification_private.quiz_duel_question_pool(array[v_user_id], null);

  select coalesce(jsonb_agg(jsonb_build_object('theme', t.label, 'question_count', t.n) order by t.label), '[]'::jsonb)
  into v_themes
  from (
    select min(p.theme) as label, count(*)::integer as n
    from gamification_private.quiz_duel_question_pool(array[v_user_id], null) p
    where p.theme <> ''
    group by lower(p.theme)
  ) t;

  -- Duels en cours, puis les 30 derniers terminés.
  select coalesce(jsonb_agg(s.summary order by s.sort_group, s.sort_at desc), '[]'::jsonb)
  into v_duels
  from (
    select
      gamification_private.quiz_duel_summary(d.id, v_user_id) as summary,
      case when o.duel_id is null then 0 else 1 end as sort_group,
      coalesce(o.settled_at, d.created_at) as sort_at
    from public.quiz_duels d
    left join public.quiz_duel_outcomes o on o.duel_id = d.id
    where v_user_id in (d.challenger_id, d.opponent_id)
      and (
        o.duel_id is null
        or o.duel_id in (
          select o2.duel_id
          from public.quiz_duel_outcomes o2
          join public.quiz_duels d2 on d2.id = o2.duel_id
          where v_user_id in (d2.challenger_id, d2.opponent_id)
          order by o2.settled_at desc
          limit 30
        )
      )
  ) s;

  return jsonb_build_object(
    'settings', gamification_private.quiz_duel_settings(),
    'stats', v_stats,
    'question_count', v_pool,
    'themes', v_themes,
    'duels', v_duels
  );
end;
$$;

-- Recherche d'un adversaire par nom parmi les joueurs de la gamification.
create or replace function public.search_quiz_duel_opponents(p_query text)
returns table (
  user_id uuid,
  display_name text,
  classe text,
  house_name text,
  house_color text,
  has_open_duel boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := gamification_private.quiz_duel_require_player();
  v_query text := lower(btrim(coalesce(p_query, '')));
begin
  if char_length(v_query) < 2 or char_length(v_query) > 60 then
    return;
  end if;

  return query
  select
    up.user_id,
    gamification_private.quiz_display_name(up.user_id),
    nullif(btrim(up.classe), '')::text,
    h.name::text,
    h.color::text,
    gamification_private.quiz_duel_open_between(v_user_id, up.user_id)
  from public.user_profiles up
  left join public.gamification_data gd on gd.user_id = up.user_id
  left join public.houses h on h.id = gd.house_id
  where up.user_id <> v_user_id
    and coalesce(up.is_active, true)
    and gamification_private.is_rollout_member(up.user_id)
    and lower(concat_ws(' ',
      up.display_name,
      concat_ws(' ', up.forname, up.family_name),
      concat_ws(' ', up.family_name, up.forname)
    )) like '%' || replace(replace(replace(v_query, '\', '\\'), '%', '\%'), '_', '\_') || '%'
  order by gamification_private.quiz_display_name(up.user_id)
  limit 10;
end;
$$;

-- Lance un duel : adversaire précis (p_opponent_id) ou au hasard dans une autre maison (null).
create or replace function public.create_quiz_duel(
  p_opponent_id uuid default null,
  p_theme text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := gamification_private.quiz_duel_require_player();
  v_theme text := nullif(btrim(coalesce(p_theme, '')), '');
  v_theme_label text;
  v_my_house uuid;
  v_opponent uuid;
  v_matchmaking text;
  v_available integer;
  v_question_ids uuid[];
  v_duel_id uuid;
  v_expires_at timestamptz := now() + interval '48 hours';
  v_candidate uuid;
begin
  if v_theme is not null and char_length(v_theme) > 40 then
    raise exception 'duel_invalid_theme' using errcode = 'P0001';
  end if;

  perform gamification_private.quiz_duel_settle_expired(50);

  -- Une création à la fois par joueur : les limites ci-dessous restent exactes.
  perform pg_advisory_xact_lock(hashtextextended('quiz-duel:create:' || v_user_id::text, 0));

  if (
    select count(*) from public.quiz_duels d
    where d.challenger_id = v_user_id and d.created_at > now() - interval '24 hours'
  ) >= 10 then
    raise exception 'duel_daily_limit' using errcode = 'P0001';
  end if;

  if (
    select count(*) from public.quiz_duels d
    where d.challenger_id = v_user_id
      and d.expires_at + interval '1 minute' > now()
      and not exists (select 1 from public.quiz_duel_outcomes o where o.duel_id = d.id)
  ) >= 5 then
    raise exception 'duel_too_many_open' using errcode = 'P0001';
  end if;

  -- Assez de questions pour moi seul ? Sinon inutile de chercher un adversaire.
  select count(*) into v_available
  from gamification_private.quiz_duel_question_pool(array[v_user_id], v_theme);
  if v_available < 5 then
    raise exception 'duel_not_enough_questions' using errcode = 'P0001', detail = v_available::text;
  end if;

  if p_opponent_id is null then
    v_matchmaking := 'random';
    select gd.house_id into v_my_house from public.gamification_data gd where gd.user_id = v_user_id;

    -- Joueurs d'une autre maison (hors maîtres du jeu), les moins sollicités d'abord.
    for v_candidate in
      select up.user_id
      from public.user_profiles up
      join public.gamification_data gd on gd.user_id = up.user_id
      join public.houses h on h.id = gd.house_id
      where up.user_id <> v_user_id
        and coalesce(up.is_active, true)
        and lower(h.name) <> 'gamemaster'
        and (v_my_house is null or gd.house_id <> v_my_house)
        and gamification_private.is_rollout_member(up.user_id)
        and not gamification_private.quiz_duel_open_between(v_user_id, up.user_id)
      order by (
        select count(*) from public.quiz_duels d
        where d.opponent_id = up.user_id
          and d.expires_at > now()
          and not exists (select 1 from public.quiz_duel_outcomes o where o.duel_id = d.id)
      ), random()
    loop
      if (
        select count(*) from gamification_private.quiz_duel_question_pool(array[v_user_id, v_candidate], v_theme)
      ) >= 5 then
        v_opponent := v_candidate;
        exit;
      end if;
    end loop;

    if v_opponent is null then
      raise exception 'duel_no_opponent' using errcode = 'P0001';
    end if;
  else
    v_matchmaking := 'direct';
    v_opponent := p_opponent_id;

    if v_opponent = v_user_id then
      raise exception 'duel_self' using errcode = 'P0001';
    end if;
    if not gamification_private.is_rollout_member(v_opponent) then
      raise exception 'duel_opponent_unavailable' using errcode = 'P0001';
    end if;
    if gamification_private.quiz_duel_open_between(v_user_id, v_opponent) then
      raise exception 'duel_already_open' using errcode = 'P0001';
    end if;

    select count(*) into v_available
    from gamification_private.quiz_duel_question_pool(array[v_user_id, v_opponent], v_theme);
    if v_available < 5 then
      raise exception 'duel_not_enough_questions' using errcode = 'P0001', detail = v_available::text;
    end if;
  end if;

  select array_agg(p.question_id order by random())
  into v_question_ids
  from (
    select pool.question_id
    from gamification_private.quiz_duel_question_pool(array[v_user_id, v_opponent], v_theme) pool
    order by random()
    limit 5
  ) p;

  -- Nom du thème tel qu'écrit dans les quiz.
  if v_theme is not null then
    select min(btrim(q.theme)) into v_theme_label
    from public.quiz_questions qq
    join public.quizzes q on q.id = qq.quiz_id
    where qq.id = any (v_question_ids);
  end if;

  insert into public.quiz_duels (challenger_id, opponent_id, theme, matchmaking, question_ids, expires_at)
  values (v_user_id, v_opponent, coalesce(v_theme_label, v_theme), v_matchmaking, v_question_ids, v_expires_at)
  returning id into v_duel_id;

  perform gamification_private.quiz_duel_notify(
    v_opponent,
    'Duel de quiz : vous êtes défié·e',
    gamification_private.quiz_display_name(v_user_id) || ' vous lance un duel de 5 questions ('
      || coalesce(v_theme_label, v_theme, 'tous thèmes') || '). Vous avez 48 heures pour jouer ou refuser.',
    v_duel_id
  );

  return gamification_private.quiz_duel_summary(v_duel_id, v_user_id);
end;
$$;

-- L'adversaire accepte ou refuse le duel (impossible de refuser après avoir commencé).
create or replace function public.respond_quiz_duel(p_duel_id uuid, p_accept boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := gamification_private.quiz_duel_require_player();
  v_duel public.quiz_duels%rowtype;
begin
  select d.* into v_duel from public.quiz_duels d where d.id = p_duel_id;
  if not found or v_duel.opponent_id <> v_user_id then
    raise exception 'duel_not_found' using errcode = 'P0002';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('quiz-duel:play:' || v_duel.id::text || ':' || v_user_id::text, 0));

  if exists (select 1 from public.quiz_duel_outcomes o where o.duel_id = v_duel.id) then
    raise exception 'duel_closed' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.quiz_duel_responses r where r.duel_id = v_duel.id) then
    -- Déjà accepté (ou déjà en jeu) : on ne peut plus refuser.
    if not coalesce(p_accept, false) then
      raise exception 'duel_already_started' using errcode = 'P0001';
    end if;
  else
    if now() > v_duel.expires_at then
      raise exception 'duel_expired' using errcode = 'P0001';
    end if;
    if not coalesce(p_accept, false)
       and exists (select 1 from public.quiz_duel_steps s where s.duel_id = v_duel.id and s.user_id = v_user_id) then
      raise exception 'duel_already_started' using errcode = 'P0001';
    end if;

    insert into public.quiz_duel_responses (duel_id, response)
    values (v_duel.id, case when coalesce(p_accept, false) then 'accepted' else 'declined' end)
    on conflict (duel_id) do nothing;

    if not coalesce(p_accept, false) then
      perform gamification_private.quiz_duel_notify(
        v_duel.challenger_id,
        'Duel de quiz refusé',
        gamification_private.quiz_display_name(v_user_id) || ' a refusé votre duel. Lancez-en un autre quand vous voulez.',
        v_duel.id
      );
      perform gamification_private.quiz_duel_settle(v_duel.id);
    end if;
  end if;

  return gamification_private.quiz_duel_summary(v_duel.id, v_user_id);
end;
$$;

-- Question suivante pour la personne connectée (chronomètre lancé par le serveur).
-- Une question restée sans réponse au-delà du délai est comptée fausse (20 s).
create or replace function public.next_quiz_duel_question(p_duel_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := gamification_private.quiz_duel_require_player();
  v_settings jsonb := gamification_private.quiz_duel_settings();
  v_limit_ms integer := (v_settings ->> 'time_limit_ms')::integer;
  v_grace_ms integer := (v_settings ->> 'grace_ms')::integer;
  v_duel public.quiz_duels%rowtype;
  v_answered integer;
  v_position integer;
  v_step public.quiz_duel_steps%rowtype;
  v_question public.quiz_questions%rowtype;
  v_now timestamptz;
  v_other uuid;
begin
  select d.* into v_duel from public.quiz_duels d where d.id = p_duel_id;
  if not found or v_user_id not in (v_duel.challenger_id, v_duel.opponent_id) then
    raise exception 'duel_not_found' using errcode = 'P0002';
  end if;
  v_other := case when v_user_id = v_duel.challenger_id then v_duel.opponent_id else v_duel.challenger_id end;

  perform pg_advisory_xact_lock(hashtextextended('quiz-duel:play:' || v_duel.id::text || ':' || v_user_id::text, 0));

  if exists (select 1 from public.quiz_duel_responses r where r.duel_id = v_duel.id and r.response = 'declined') then
    raise exception 'duel_closed' using errcode = 'P0001';
  end if;

  loop
    select count(*) into v_answered
    from public.quiz_duel_answers a
    where a.duel_id = v_duel.id and a.user_id = v_user_id;

    if v_answered >= 5 then
      perform gamification_private.quiz_duel_settle(v_duel.id);
      return jsonb_build_object('done', true, 'duel', gamification_private.quiz_duel_summary(v_duel.id, v_user_id));
    end if;

    v_position := v_answered + 1;
    v_now := clock_timestamp();

    select s.* into v_step
    from public.quiz_duel_steps s
    where s.duel_id = v_duel.id and s.user_id = v_user_id and s.position = v_position;

    if found then
      if v_now > v_step.shown_at + make_interval(secs => (v_limit_ms + v_grace_ms) / 1000.0) then
        -- Délai dépassé sans réponse : question perdue.
        insert into public.quiz_duel_answers (
          duel_id, user_id, position, question_id, selected, is_correct, timed_out, elapsed_ms, answered_at
        )
        values (
          v_duel.id, v_user_id, v_position, v_duel.question_ids[v_position], '{}'::text[], false, true,
          v_limit_ms, v_step.shown_at + make_interval(secs => v_limit_ms / 1000.0)
        )
        on conflict do nothing;
        continue;
      end if;
    else
      if exists (select 1 from public.quiz_duel_outcomes o where o.duel_id = v_duel.id) then
        raise exception 'duel_closed' using errcode = 'P0001';
      end if;
      if now() > v_duel.expires_at then
        raise exception 'duel_expired' using errcode = 'P0001';
      end if;

      -- Jouer vaut acceptation pour l'adversaire.
      if v_user_id = v_duel.opponent_id then
        insert into public.quiz_duel_responses (duel_id, response)
        values (v_duel.id, 'accepted')
        on conflict (duel_id) do nothing;
      end if;

      insert into public.quiz_duel_steps (duel_id, user_id, position, shown_at)
      values (v_duel.id, v_user_id, v_position, v_now)
      returning * into v_step;
    end if;

    select qq.* into v_question from public.quiz_questions qq where qq.id = v_duel.question_ids[v_position];
    if not found then
      -- Question supprimée entre-temps : comptée juste pour ne pénaliser personne.
      insert into public.quiz_duel_answers (
        duel_id, user_id, position, question_id, selected, is_correct, timed_out, elapsed_ms, answered_at
      )
      values (v_duel.id, v_user_id, v_position, v_duel.question_ids[v_position], '{}'::text[], true, false, 0, v_now)
      on conflict do nothing;
      continue;
    end if;

    return jsonb_build_object(
      'done', false,
      'position', v_position,
      'total', 5,
      'time_limit_ms', v_limit_ms,
      'remaining_ms', greatest(0, v_limit_ms - floor(extract(epoch from (v_now - v_step.shown_at)) * 1000)::integer),
      'question', jsonb_build_object(
        'kind', v_question.kind,
        'prompt', v_question.prompt,
        'image_path', v_question.image_path,
        'options', (
          select jsonb_agg(jsonb_build_object('id', o ->> 'id', 'label', o ->> 'label') order by ord)
          from jsonb_array_elements(v_question.options) with ordinality as t(o, ord)
        )
      )
    );
  end loop;
end;
$$;

-- Enregistre la réponse à la question affichée. Ne renvoie AUCUNE correction : elle n'est
-- donnée qu'une fois le duel clos (get_quiz_duel).
create or replace function public.answer_quiz_duel_question(
  p_duel_id uuid,
  p_position integer,
  p_selected text[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := gamification_private.quiz_duel_require_player();
  v_settings jsonb := gamification_private.quiz_duel_settings();
  v_limit_ms integer := (v_settings ->> 'time_limit_ms')::integer;
  v_grace_ms integer := (v_settings ->> 'grace_ms')::integer;
  v_duel public.quiz_duels%rowtype;
  v_step public.quiz_duel_steps%rowtype;
  v_question public.quiz_questions%rowtype;
  v_now timestamptz := clock_timestamp();
  v_elapsed integer;
  v_timed_out boolean;
  v_selected text[];
  v_valid_ids text[];
  v_already boolean;
  v_answered integer;
  v_other uuid;
  v_other_done boolean;
begin
  select d.* into v_duel from public.quiz_duels d where d.id = p_duel_id;
  if not found or v_user_id not in (v_duel.challenger_id, v_duel.opponent_id) then
    raise exception 'duel_not_found' using errcode = 'P0002';
  end if;
  v_other := case when v_user_id = v_duel.challenger_id then v_duel.opponent_id else v_duel.challenger_id end;

  perform pg_advisory_xact_lock(hashtextextended('quiz-duel:play:' || v_duel.id::text || ':' || v_user_id::text, 0));

  select s.* into v_step
  from public.quiz_duel_steps s
  where s.duel_id = v_duel.id and s.user_id = v_user_id and s.position = p_position;
  if not found then
    raise exception 'duel_question_not_shown' using errcode = 'P0001';
  end if;

  v_already := exists (
    select 1 from public.quiz_duel_answers a
    where a.duel_id = v_duel.id and a.user_id = v_user_id and a.position = p_position
  );

  if not v_already then
    select qq.* into v_question from public.quiz_questions qq where qq.id = v_duel.question_ids[p_position];

    v_elapsed := floor(extract(epoch from (v_now - v_step.shown_at)) * 1000)::integer;
    v_timed_out := v_elapsed > v_limit_ms + v_grace_ms;

    select coalesce(array_agg(distinct s order by s), '{}'::text[])
    into v_selected
    from unnest(coalesce(p_selected, '{}'::text[])) as u(s)
    where s is not null;

    if not v_timed_out and v_question.id is not null then
      select array_agg(o ->> 'id') into v_valid_ids
      from jsonb_array_elements(v_question.options) as t(o);

      if cardinality(v_selected) = 0 then
        raise exception 'duel_empty_answer' using errcode = 'P0001';
      end if;
      if not (v_selected <@ v_valid_ids) then
        raise exception 'duel_unknown_answer' using errcode = 'P0001';
      end if;
      if v_question.kind = 'single' and cardinality(v_selected) <> 1 then
        raise exception 'duel_single_answer' using errcode = 'P0001';
      end if;
    end if;

    insert into public.quiz_duel_answers (
      duel_id, user_id, position, question_id, selected, is_correct, timed_out, elapsed_ms, answered_at
    )
    values (
      v_duel.id,
      v_user_id,
      p_position,
      v_duel.question_ids[p_position],
      case when v_timed_out then '{}'::text[] else v_selected end,
      not v_timed_out and v_question.id is not null
        and gamification_private.quiz_grade_selection(v_question.options, v_selected),
      v_timed_out,
      least(greatest(v_elapsed, 0), v_limit_ms),
      v_now
    )
    on conflict do nothing;
  end if;

  select count(*) into v_answered
  from public.quiz_duel_answers a
  where a.duel_id = v_duel.id and a.user_id = v_user_id;

  if v_answered >= 5 and not v_already then
    v_other_done := (select p.answered >= 5 from gamification_private.quiz_duel_progress(v_duel.id, v_other) p);
    if v_other_done then
      perform gamification_private.quiz_duel_settle(v_duel.id);
    elsif not exists (select 1 from public.quiz_duel_outcomes o where o.duel_id = v_duel.id) then
      perform gamification_private.quiz_duel_notify(
        v_other,
        'Duel de quiz : à vous de jouer',
        gamification_private.quiz_display_name(v_user_id) || ' a terminé le duel. Jouez avant le '
          || to_char(v_duel.expires_at at time zone 'Europe/Zurich', 'DD.MM à HH24:MI') || ' pour ne pas perdre par forfait.',
        v_duel.id
      );
    end if;
  end if;

  return jsonb_build_object(
    'position', p_position,
    'already_answered', v_already,
    'timed_out', coalesce((
      select a.timed_out from public.quiz_duel_answers a
      where a.duel_id = v_duel.id and a.user_id = v_user_id and a.position = p_position
    ), false),
    'answered_count', v_answered,
    'finished', v_answered >= 5
  );
end;
$$;

-- Détail d'un duel. La correction (bonnes réponses, explications, réponses de chacun) n'est
-- donnée qu'une fois le duel clos ET si la personne a joué ses 5 questions.
create or replace function public.get_quiz_duel(p_duel_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := gamification_private.quiz_duel_require_player();
  v_duel public.quiz_duels%rowtype;
  v_other uuid;
  v_summary jsonb;
  v_correction jsonb;
  v_show_opponent boolean;
begin
  select d.* into v_duel from public.quiz_duels d where d.id = p_duel_id;
  if not found or v_user_id not in (v_duel.challenger_id, v_duel.opponent_id) then
    raise exception 'duel_not_found' using errcode = 'P0002';
  end if;
  v_other := case when v_user_id = v_duel.challenger_id then v_duel.opponent_id else v_duel.challenger_id end;

  perform gamification_private.quiz_duel_settle(v_duel.id);
  v_summary := gamification_private.quiz_duel_summary(v_duel.id, v_user_id);

  if (v_summary ->> 'state') = 'done' and (v_summary ->> 'my_answered')::integer >= 5 then
    v_show_opponent := (v_summary -> 'outcome' ->> 'reason') = 'completed';

    select coalesce(jsonb_agg(
      jsonb_build_object(
        'position', pos.n,
        'kind', qq.kind,
        'prompt', coalesce(qq.prompt, 'Question retirée'),
        'image_path', qq.image_path,
        'explanation', coalesce(qq.explanation, ''),
        'options', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', o ->> 'id', 'label', o ->> 'label', 'correct', o -> 'correct' = 'true'::jsonb
          ) order by ord)
          from jsonb_array_elements(qq.options) with ordinality as t(o, ord)
        ), '[]'::jsonb),
        'mine', (
          select jsonb_build_object('selected', to_jsonb(a.selected), 'is_correct', a.is_correct,
                                    'timed_out', a.timed_out, 'elapsed_ms', a.elapsed_ms)
          from public.quiz_duel_answers a
          where a.duel_id = v_duel.id and a.user_id = v_user_id and a.position = pos.n
        ),
        'opponent', case when v_show_opponent then (
          select jsonb_build_object('selected', to_jsonb(a.selected), 'is_correct', a.is_correct,
                                    'timed_out', a.timed_out, 'elapsed_ms', a.elapsed_ms)
          from public.quiz_duel_answers a
          where a.duel_id = v_duel.id and a.user_id = v_other and a.position = pos.n
        ) end
      ) order by pos.n
    ), '[]'::jsonb)
    into v_correction
    from generate_series(1, 5) as pos(n)
    left join public.quiz_questions qq on qq.id = v_duel.question_ids[pos.n];
  end if;

  return v_summary || jsonb_build_object(
    'settings', gamification_private.quiz_duel_settings(),
    'correction', v_correction
  );
end;
$$;

revoke all on function public.get_my_quiz_duels() from public, anon;
revoke all on function public.search_quiz_duel_opponents(text) from public, anon;
revoke all on function public.create_quiz_duel(uuid, text) from public, anon;
revoke all on function public.respond_quiz_duel(uuid, boolean) from public, anon;
revoke all on function public.next_quiz_duel_question(uuid) from public, anon;
revoke all on function public.answer_quiz_duel_question(uuid, integer, text[]) from public, anon;
revoke all on function public.get_quiz_duel(uuid) from public, anon;
grant execute on function public.get_my_quiz_duels() to authenticated;
grant execute on function public.search_quiz_duel_opponents(text) to authenticated;
grant execute on function public.create_quiz_duel(uuid, text) to authenticated;
grant execute on function public.respond_quiz_duel(uuid, boolean) to authenticated;
grant execute on function public.next_quiz_duel_question(uuid) to authenticated;
grant execute on function public.answer_quiz_duel_question(uuid, integer, text[]) to authenticated;
grant execute on function public.get_quiz_duel(uuid) to authenticated;

notify pgrst, 'reload schema';
