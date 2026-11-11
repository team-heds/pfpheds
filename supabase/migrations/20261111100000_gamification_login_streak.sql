-- Série de connexions : jours de connexion consécutifs des joueurs.
--
-- La série est calculée côté serveur à partir des connexions quotidiennes déjà
-- enregistrées (xp_history, action LOGIN, un gain par jour civil Europe/Zurich).
-- Un jour sans connexion remet la série à zéro.
--
-- Paliers : 7 jours = +20 XP, 30 jours = +100 XP, 100 jours = +300 XP, avec un badge
-- par palier. Un palier est payé une seule fois par année académique (du 1er septembre
-- au 31 août), même si la série est perdue puis refaite. Le badge, lui, reste acquis.
--
-- Le bonus passe par gamification_award_xp_internal : il compte donc pour le joueur et
-- pour sa maison, comme tous les autres gains. Rien n'est décidé par le navigateur.
--
-- Migration idempotente et sans écriture sur les données existantes : elle n'ajoute que
-- deux tables privées, trois badges et des fonctions.

create schema if not exists gamification_private;
revoke all on schema gamification_private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 1. Conditions de badge : « login_streak » devient une condition reconnue.
--    Elle n'est jamais débloquée par le moteur d'actions générique (qui ne connaît
--    que total_xp, level et action_count) : seul le suivi de série l'attribue.
-- ---------------------------------------------------------------------------

create or replace function gamification_private.validate_badge_conditions(
  p_conditions jsonb
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_conditions jsonb := gamification_private.normalize_badge_conditions(p_conditions);
  v_errors jsonb := '[]'::jsonb;
  v_kind text;
  v_target integer;
  v_action text;
  v_supported_count integer := 0;
begin
  if v_conditions ? 'total_xp' then
    v_supported_count := v_supported_count + 1;
    v_kind := 'total_xp';
    if not (case
      when coalesce(v_conditions ->> 'total_xp', '') ~ '^[0-9]{1,10}$'
        then (v_conditions ->> 'total_xp')::numeric between 1 and 2147483647
      else false
    end) then
      v_errors := v_errors || jsonb_build_array('invalid_total_xp');
    else
      v_target := (v_conditions ->> 'total_xp')::integer;
    end if;
  end if;

  if v_conditions ? 'level' then
    v_supported_count := v_supported_count + 1;
    v_kind := 'level';
    if not (case
      when coalesce(v_conditions ->> 'level', '') ~ '^[0-9]{1,10}$'
        then (v_conditions ->> 'level')::numeric between 1 and 2147483647
      else false
    end) then
      v_errors := v_errors || jsonb_build_array('invalid_level');
    else
      v_target := (v_conditions ->> 'level')::integer;
    end if;
  end if;

  if v_conditions ? 'action_count' then
    v_supported_count := v_supported_count + 1;
    v_kind := 'action_count';
    v_action := upper(btrim(coalesce(v_conditions ->> 'action_type', '')));
    if not (case
      when coalesce(v_conditions ->> 'count', '') ~ '^[0-9]{1,10}$'
        then (v_conditions ->> 'count')::numeric between 1 and 2147483647
      else false
    end) then
      v_errors := v_errors || jsonb_build_array('invalid_action_count');
    else
      v_target := (v_conditions ->> 'count')::integer;
    end if;
    if not exists (
      select 1
      from gamification_private.action_rules ar
      where ar.action_code = v_action and ar.is_active = true
    ) then
      v_errors := v_errors || jsonb_build_array('unsupported_action');
    end if;
  end if;

  -- Jours de connexion consécutifs (attribué par le suivi de série uniquement).
  if v_conditions ? 'login_streak' then
    v_supported_count := v_supported_count + 1;
    v_kind := 'login_streak';
    if not (case
      when coalesce(v_conditions ->> 'login_streak', '') ~ '^[0-9]{1,4}$'
        then (v_conditions ->> 'login_streak')::integer between 1 and 3660
      else false
    end) then
      v_errors := v_errors || jsonb_build_array('invalid_login_streak');
    else
      v_target := (v_conditions ->> 'login_streak')::integer;
    end if;
  end if;

  if v_supported_count = 0 then
    v_errors := v_errors || jsonb_build_array('unsupported_condition');
  elsif v_supported_count > 1 then
    v_errors := v_errors || jsonb_build_array('multiple_conditions');
  end if;

  -- These legacy keys change the business meaning and must not be silently
  -- approximated by a supported condition.
  if v_conditions ?| array['quiz_complete', 'has_house'] then
    v_errors := v_errors || jsonb_build_array('unsupported_condition');
  end if;

  return jsonb_build_object(
    'valid', jsonb_array_length(v_errors) = 0,
    'errors', v_errors,
    'kind', v_kind,
    'target', v_target,
    'action_type', v_action,
    'normalized', v_conditions
  );
end;
$$;

revoke all on function gamification_private.validate_badge_conditions(jsonb)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Paliers et badges de série.
-- ---------------------------------------------------------------------------

insert into public.badges (id, name, description, icon, rarity, xp_bonus, conditions, is_active)
values
  (
    '5e21e7a0-0007-4c1b-9d3a-6f1b2c7d0007',
    'Flamme de 7 jours',
    'Se connecter 7 jours de suite.',
    'pi pi-bolt',
    'uncommon',
    0,
    jsonb_build_object('login_streak', 7, 'category', 'engagement'),
    true
  ),
  (
    '5e21e7a0-0030-4c1b-9d3a-6f1b2c7d0030',
    'Flamme de 30 jours',
    'Se connecter 30 jours de suite.',
    'pi pi-bolt',
    'rare',
    0,
    jsonb_build_object('login_streak', 30, 'category', 'engagement'),
    true
  ),
  (
    '5e21e7a0-0100-4c1b-9d3a-6f1b2c7d0100',
    'Flamme de 100 jours',
    'Se connecter 100 jours de suite.',
    'pi pi-bolt',
    'epic',
    0,
    jsonb_build_object('login_streak', 100, 'category', 'engagement'),
    true
  )
on conflict (id) do nothing;

create table if not exists gamification_private.login_streak_tiers (
  milestone_days integer primary key check (milestone_days > 0),
  xp_amount integer not null check (xp_amount > 0),
  badge_id uuid references public.badges(id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table gamification_private.login_streak_tiers enable row level security;
revoke all on gamification_private.login_streak_tiers from public, anon, authenticated;

insert into gamification_private.login_streak_tiers (milestone_days, xp_amount, badge_id)
values
  (7, 20, '5e21e7a0-0007-4c1b-9d3a-6f1b2c7d0007'),
  (30, 100, '5e21e7a0-0030-4c1b-9d3a-6f1b2c7d0030'),
  (100, 300, '5e21e7a0-0100-4c1b-9d3a-6f1b2c7d0100')
on conflict (milestone_days) do nothing;

-- Un palier payé = une ligne. La clé primaire garantit un seul paiement par joueur,
-- par année académique et par palier.
create table if not exists gamification_private.login_streak_milestones (
  user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  academic_year text not null check (academic_year ~ '^[0-9]{4}-[0-9]{4}$'),
  milestone_days integer not null
    references gamification_private.login_streak_tiers(milestone_days) on delete restrict,
  xp_amount integer not null check (xp_amount > 0),
  streak_days integer not null check (streak_days > 0),
  reached_on date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, academic_year, milestone_days)
);

alter table gamification_private.login_streak_milestones enable row level security;
revoke all on gamification_private.login_streak_milestones from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Calculs.
-- ---------------------------------------------------------------------------

-- Année académique d'un jour civil : du 1er septembre au 31 août.
create or replace function gamification_private.login_streak_academic_year(p_day date)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when extract(month from p_day) >= 9
      then extract(year from p_day)::integer::text || '-' || (extract(year from p_day)::integer + 1)::text
    else (extract(year from p_day)::integer - 1)::text || '-' || extract(year from p_day)::integer::text
  end;
$$;

revoke all on function gamification_private.login_streak_academic_year(date)
  from public, anon, authenticated;

-- Joueur concerné par la série : compte actif du public de la gamification, hors
-- maîtres du jeu (maison « gamemaster »).
create or replace function gamification_private.is_login_streak_player(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select gamification_private.is_rollout_member(p_user_id)
    and not exists (
      select 1
      from public.gamification_data gd
      join public.houses h on h.id = gd.house_id
      where gd.user_id = p_user_id
        and lower(h.name) = 'gamemaster'
    );
$$;

revoke all on function gamification_private.is_login_streak_player(uuid)
  from public, anon, authenticated;

-- Série en cours et meilleure série d'un compte, au jour civil p_today (Zurich).
-- La série en cours est celle qui se termine aujourd'hui ou hier : elle reste
-- affichée tant que la journée en cours peut encore la prolonger.
create or replace function gamification_private.login_streak_for(
  p_user_id uuid,
  p_today date default null
)
returns table (
  current_streak integer,
  best_streak integer,
  last_login_day date,
  logged_in_today boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with reference as (
    select coalesce(p_today, (now() at time zone 'Europe/Zurich')::date) as today
  ),
  login_days as (
    select distinct (xh.occurred_at at time zone 'Europe/Zurich')::date as login_day
    from public.xp_history xh
    where xh.user_id = p_user_id
      and xh.action = 'LOGIN'
      and xh.amount > 0
  ),
  numbered as (
    select ld.login_day,
           ld.login_day - (row_number() over (order by ld.login_day))::integer as run_key
    from login_days ld, reference r
    where ld.login_day <= r.today
  ),
  runs as (
    select max(n.login_day) as last_day, count(*)::integer as run_length
    from numbered n
    group by n.run_key
  )
  select
    coalesce((
      select ru.run_length from runs ru, reference r
      where ru.last_day >= r.today - 1
      order by ru.last_day desc
      limit 1
    ), 0),
    coalesce((select max(ru.run_length) from runs ru), 0),
    (select max(ru.last_day) from runs ru),
    exists (select 1 from runs ru, reference r where ru.last_day = r.today);
$$;

revoke all on function gamification_private.login_streak_for(uuid, date)
  from public, anon, authenticated;

-- Paie les paliers atteints et pas encore payés cette année académique.
create or replace function gamification_private.apply_login_streak_milestones(
  p_user_id uuid,
  p_day date
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_streak integer;
  v_year text;
  v_tier record;
  v_awarded jsonb := '[]'::jsonb;
begin
  if p_user_id is null or p_day is null
     or not gamification_private.is_login_streak_player(p_user_id) then
    return v_awarded;
  end if;

  -- Un seul calcul à la fois par joueur.
  perform pg_advisory_xact_lock(hashtext(p_user_id::text), hashtext('login-streak'));

  select s.current_streak into v_streak
  from gamification_private.login_streak_for(p_user_id, p_day) s;

  if coalesce(v_streak, 0) <= 0 then
    return v_awarded;
  end if;

  v_year := gamification_private.login_streak_academic_year(p_day);

  for v_tier in
    select t.milestone_days, t.xp_amount, t.badge_id
    from gamification_private.login_streak_tiers t
    where t.is_active and t.milestone_days <= v_streak
    order by t.milestone_days
  loop
    insert into gamification_private.login_streak_milestones (
      user_id, academic_year, milestone_days, xp_amount, streak_days, reached_on
    )
    values (p_user_id, v_year, v_tier.milestone_days, v_tier.xp_amount, v_streak, p_day)
    on conflict (user_id, academic_year, milestone_days) do nothing;

    if found then
      perform public.gamification_award_xp_internal(
        p_user_id,
        'LOGIN_STREAK',
        v_tier.xp_amount,
        'login-streak:' || v_year || ':' || v_tier.milestone_days::text,
        'login_streak',
        null,
        'Série de ' || v_tier.milestone_days::text || ' jours de connexion'
      );

      if v_tier.badge_id is not null then
        insert into public.user_badges (user_id, badge_id, earned_at)
        values (p_user_id, v_tier.badge_id, now())
        on conflict (user_id, badge_id) do nothing;
      end if;

      v_awarded := v_awarded || jsonb_build_array(jsonb_build_object(
        'days', v_tier.milestone_days,
        'xp_amount', v_tier.xp_amount,
        'badge_id', v_tier.badge_id
      ));
    end if;
  end loop;

  return v_awarded;
end;
$$;

revoke all on function gamification_private.apply_login_streak_milestones(uuid, date)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. Déclenchement : après chaque connexion quotidienne enregistrée.
--    Le déclencheur est différé à la fin de la transaction : le moteur d'actions a
--    alors fini d'écrire le total du joueur, et le bonus s'ajoute par-dessus sans
--    être écrasé.
-- ---------------------------------------------------------------------------

create or replace function gamification_private.login_streak_after_login()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.action = 'LOGIN' and coalesce(new.amount, 0) > 0 then
    perform gamification_private.apply_login_streak_milestones(
      new.user_id,
      (new.occurred_at at time zone 'Europe/Zurich')::date
    );
  end if;
  return null;
exception when others then
  -- Un incident sur la série ne doit jamais annuler la connexion du jour elle-même.
  -- Le palier sera rattrapé à la connexion suivante (paliers atteints et non payés).
  raise warning 'login streak milestone skipped for %: %', new.user_id, sqlerrm;
  return null;
end;
$$;

revoke all on function gamification_private.login_streak_after_login()
  from public, anon, authenticated;

do $$
begin
  if not exists (
    select 1 from pg_trigger t
    where t.tgname = 'login_streak_after_login'
      and t.tgrelid = 'public.xp_history'::regclass
      and not t.tgisinternal
  ) then
    create constraint trigger login_streak_after_login
      after insert on public.xp_history
      deferrable initially deferred
      for each row
      when (new.action = 'LOGIN')
      execute function gamification_private.login_streak_after_login();
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Lecture par le joueur connecté.
-- ---------------------------------------------------------------------------

create or replace function public.get_my_login_streak()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_today date := (now() at time zone 'Europe/Zurich')::date;
  v_year text;
  v_streak record;
  v_milestones jsonb;
  v_next jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_year := gamification_private.login_streak_academic_year(v_today);

  if not gamification_private.is_login_streak_player(v_user_id) then
    return jsonb_build_object(
      'is_player', false,
      'current_streak', 0,
      'best_streak', 0,
      'logged_in_today', false,
      'last_login_day', null,
      'academic_year', v_year,
      'next_milestone', null,
      'milestones', '[]'::jsonb
    );
  end if;

  select * into v_streak
  from gamification_private.login_streak_for(v_user_id, v_today);

  select coalesce(jsonb_agg(jsonb_build_object(
    'days', t.milestone_days,
    'xp_amount', t.xp_amount,
    'badge_id', t.badge_id,
    'badge_name', b.name,
    'reached', m.user_id is not null,
    'reached_on', m.reached_on,
    'reached_today', coalesce(m.reached_on = v_today, false),
    'event_key', 'login-streak:' || v_year || ':' || t.milestone_days::text
  ) order by t.milestone_days), '[]'::jsonb)
  into v_milestones
  from gamification_private.login_streak_tiers t
  left join public.badges b on b.id = t.badge_id
  left join gamification_private.login_streak_milestones m
    on m.user_id = v_user_id
   and m.academic_year = v_year
   and m.milestone_days = t.milestone_days
  where t.is_active;

  select jsonb_build_object(
    'days', t.milestone_days,
    'xp_amount', t.xp_amount,
    'days_remaining', t.milestone_days - v_streak.current_streak
  )
  into v_next
  from gamification_private.login_streak_tiers t
  where t.is_active
    and t.milestone_days > v_streak.current_streak
    and not exists (
      select 1 from gamification_private.login_streak_milestones m
      where m.user_id = v_user_id
        and m.academic_year = v_year
        and m.milestone_days = t.milestone_days
    )
  order by t.milestone_days
  limit 1;

  return jsonb_build_object(
    'is_player', true,
    'current_streak', v_streak.current_streak,
    'best_streak', v_streak.best_streak,
    'logged_in_today', v_streak.logged_in_today,
    'last_login_day', v_streak.last_login_day,
    'academic_year', v_year,
    'next_milestone', v_next,
    'milestones', v_milestones
  );
end;
$$;

revoke all on function public.get_my_login_streak() from public, anon;
grant execute on function public.get_my_login_streak() to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Progression des badges : la série en cours alimente les badges de série.
-- ---------------------------------------------------------------------------

create or replace function public.get_my_badge_progress()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select coalesce(jsonb_agg(item order by item ->> 'created_at'), '[]'::jsonb)
  into v_result
  from (
    select jsonb_build_object(
      'id', b.id,
      'name', b.name,
      'description', b.description,
      'icon', b.icon,
      'rarity', b.rarity,
      'xp_bonus', b.xp_bonus,
      'conditions', b.conditions,
      'is_active', b.is_active,
      'created_at', b.created_at,
      'earned_at', ub.earned_at,
      'condition_kind', condition_check.result ->> 'kind',
      'action_type', condition_check.result ->> 'action_type',
      'current_value', case condition_check.result ->> 'kind'
        when 'total_xp' then coalesce(gd.total_xp, 0)
        when 'level' then coalesce(gd.current_level, 1)
        when 'action_count' then (
          select count(*)
          from public.xp_history xh
          where xh.user_id = v_user_id
            and xh.action = condition_check.result ->> 'action_type'
        )
        when 'login_streak' then (
          select s.current_streak
          from gamification_private.login_streak_for(v_user_id) s
        )
        else 0
      end,
      'target_value', coalesce((condition_check.result ->> 'target')::integer, 0)
    ) as item
    from public.badges b
    cross join lateral (
      select gamification_private.validate_badge_conditions(b.conditions) as result
    ) condition_check
    left join public.user_badges ub
      on ub.user_id = v_user_id and ub.badge_id = b.id
    left join public.gamification_data gd on gd.user_id = v_user_id
    where b.is_active = true
      and coalesce((condition_check.result ->> 'valid')::boolean, false)
  ) progress_rows;

  return v_result;
end;
$$;

revoke all on function public.get_my_badge_progress() from public, anon;
grant execute on function public.get_my_badge_progress() to authenticated;

notify pgrst, 'reload schema';
