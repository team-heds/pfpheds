-- Chasse au trésor sur le campus.
--
-- Les organisateurs (administration, enseignants, maîtres du jeu : la même règle que pour
-- afficher un QR code de présence, gamification_private.can_manage_scan_codes) créent une
-- chasse (titre, description, dates, classes visées, ordre libre ou imposé) et ses étapes
-- (nom, indice, 5 à 50 XP). Chaque étape a un QR code fixe, à imprimer et à coller : il
-- reste valable jusqu'à ce qu'on le désactive ou le régénère (code photographié et partagé).
--
-- Les joueurs scannent avec le scanner existant : la validation générique
-- public.redeem_scan_code (présence par QR code) reçoit ici une branche « treasure_hunt ».
-- Aucune nouvelle table de codes : gamification_private.scan_codes (kind 'treasure_hunt',
-- expires_at null = code actif, subject_key 'treasure-step:<étape>') et
-- gamification_private.scan_redemptions (une seule validation par étape et par personne).
--
-- Tout est décidé côté serveur :
--   * points de l'étape une seule fois par joueur (clé d'événement par étape), comptés pour
--     la maison via gamification_award_xp_internal ; réservés aux joueurs
--     (is_rollout_member + rewards_enabled), les autres comptes valident sans points ;
--   * bonus de 20 XP quand toutes les étapes de la chasse sont trouvées ;
--   * classement de la chasse (joueurs et maisons) ;
--   * anti-devinette : au plus 20 codes inconnus par heure et par personne (en plus de la
--     limite existante de 12 essais refusés en 10 minutes), pour tous les types de codes.
-- Aucune table n'est exposée à l'API : tout passe par les fonctions ci-dessous.

create schema if not exists gamification_private;
revoke all on schema gamification_private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists gamification_private.treasure_hunts (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 3 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  -- Classes visées (ex. {BA24,BA25}) ; tableau vide = toutes les classes.
  target_classes text[] not null default '{}'::text[],
  -- Ordre imposé : une étape ne se valide qu'après les précédentes.
  ordered boolean not null default false,
  published boolean not null default false,
  completion_bonus integer not null default 20 check (completion_bonus between 0 and 100),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint treasure_hunts_dates_check check (
    ends_at > starts_at and ends_at <= starts_at + interval '366 days'
  ),
  constraint treasure_hunts_target_classes_check check (
    cardinality(target_classes) <= 12
    and array_to_string(target_classes, ',') ~ '^([A-Z0-9]{2,10}(,[A-Z0-9]{2,10})*)?$'
  )
);

create index if not exists treasure_hunts_published_idx
  on gamification_private.treasure_hunts (ends_at desc)
  where published;

create table if not exists gamification_private.treasure_hunt_steps (
  id uuid primary key default gen_random_uuid(),
  hunt_id uuid not null references gamification_private.treasure_hunts(id) on delete cascade,
  position integer not null check (position between 1 and 50),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  hint text not null check (char_length(btrim(hint)) between 1 and 300),
  xp_reward integer not null check (xp_reward between 5 and 50),
  -- Code actuel de l'étape ; un code régénéré remplace le précédent.
  code_id uuid references gamification_private.scan_codes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint treasure_hunt_steps_position_key unique (hunt_id, position) deferrable initially deferred
);

create index if not exists treasure_hunt_steps_code_idx
  on gamification_private.treasure_hunt_steps (code_id)
  where code_id is not null;

create table if not exists gamification_private.treasure_hunt_completions (
  hunt_id uuid not null references gamification_private.treasure_hunts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  completed_at timestamptz not null default now(),
  bonus_awarded integer not null default 0 check (bonus_awarded >= 0),
  primary key (hunt_id, user_id)
);

create index if not exists treasure_hunt_completions_user_idx
  on gamification_private.treasure_hunt_completions (user_id);

-- Freine la recherche de codes inconnus sur l'heure écoulée.
create index if not exists scan_attempts_invalid_idx
  on gamification_private.scan_attempts (user_id, attempted_at desc)
  where outcome = 'invalid';

alter table gamification_private.treasure_hunts enable row level security;
alter table gamification_private.treasure_hunt_steps enable row level security;
alter table gamification_private.treasure_hunt_completions enable row level security;

-- Aucune policy : seules les fonctions « security definer » ci-dessous lisent et écrivent.
revoke all on gamification_private.treasure_hunts from public, anon, authenticated;
revoke all on gamification_private.treasure_hunt_steps from public, anon, authenticated;
revoke all on gamification_private.treasure_hunt_completions from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Fonctions internes
-- ---------------------------------------------------------------------------

create or replace function gamification_private.treasure_hunt_state(
  p_published boolean,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_now timestamptz default now()
)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when not coalesce(p_published, false) then 'draft'
    when p_now < p_starts_at then 'upcoming'
    when p_now >= p_ends_at then 'ended'
    else 'open'
  end;
$$;

-- La chasse vise-t-elle cette personne ? Les organisateurs voient toutes les chasses.
create or replace function gamification_private.treasure_hunt_targets(p_user_id uuid, p_target_classes text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select cardinality(coalesce(p_target_classes, '{}'::text[])) = 0
    or gamification_private.can_manage_scan_codes(p_user_id)
    or exists (
      select 1 from public.user_profiles up
      where up.user_id = p_user_id
        and upper(btrim(coalesce(up.classe, ''))) = any (p_target_classes)
    );
$$;

create or replace function gamification_private.treasure_step_subject(p_step_id uuid)
returns text
language sql
immutable
set search_path = ''
as $$
  select 'treasure-step:' || p_step_id::text;
$$;

-- Nom affiché dans le classement : prénom et initiale du nom.
create or replace function gamification_private.treasure_player_name(p_user_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select coalesce(
      nullif(btrim(concat_ws(' ',
        nullif(btrim(up.forname), ''),
        case when nullif(btrim(up.family_name), '') is not null then left(btrim(up.family_name), 1) || '.' end
      )), ''),
      nullif(btrim(up.display_name), '')
    )
    from public.user_profiles up where up.user_id = p_user_id
  ), 'Joueur·se');
$$;

-- Nouveau code fixe pour une étape (le précédent, s'il existe, doit déjà être désactivé).
create or replace function gamification_private.issue_treasure_step_code(p_step_id uuid, p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_step gamification_private.treasure_hunt_steps%rowtype;
  v_short text;
  v_code_id uuid;
  v_try integer := 0;
begin
  select * into v_step from gamification_private.treasure_hunt_steps s where s.id = p_step_id;
  if not found then
    raise exception 'Étape introuvable.';
  end if;

  -- Le code court doit rester unique parmi les codes encore valables.
  loop
    v_short := gamification_private.new_scan_short_code();
    exit when not exists (
      select 1 from gamification_private.scan_codes c
      where c.short_code = v_short
        and (c.expires_at is null or c.expires_at > now() - interval '1 day')
    );
    v_try := v_try + 1;
    if v_try >= 20 then
      raise exception 'Impossible de créer un code unique, réessayez.';
    end if;
  end loop;

  insert into gamification_private.scan_codes (
    kind, subject_key, token, short_code, xp_reward, expires_at, created_by
  ) values (
    'treasure_hunt',
    gamification_private.treasure_step_subject(p_step_id),
    replace(gen_random_uuid()::text, '-', ''),
    v_short,
    v_step.xp_reward,
    null,
    p_user_id
  )
  returning id into v_code_id;

  update gamification_private.treasure_hunt_steps
  set code_id = v_code_id, updated_at = now()
  where id = p_step_id;

  return v_code_id;
end;
$$;

-- Classement d'une chasse : 20 meilleurs joueurs, ma place, maisons.
create or replace function gamification_private.treasure_hunt_ranking(p_hunt_id uuid, p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with finds as (
    select r.user_id, count(*) as found, sum(r.xp_awarded) as step_xp, max(r.redeemed_at) as last_found
    from gamification_private.treasure_hunt_steps s
    join gamification_private.scan_redemptions r
      on r.subject_key = gamification_private.treasure_step_subject(s.id)
     and r.is_player
    where s.hunt_id = p_hunt_id
    group by r.user_id
  ),
  players as (
    select
      f.user_id,
      f.found,
      f.step_xp + coalesce(c.bonus_awarded, 0) as points,
      c.completed_at,
      f.last_found,
      gd.house_id,
      rank() over (order by f.found desc, f.step_xp + coalesce(c.bonus_awarded, 0) desc, f.last_found asc) as rank
    from finds f
    left join gamification_private.treasure_hunt_completions c
      on c.hunt_id = p_hunt_id and c.user_id = f.user_id
    left join public.gamification_data gd on gd.user_id = f.user_id
  ),
  houses as (
    select h.id, h.name, h.color,
           coalesce(sum(p.points), 0) as points,
           count(p.user_id) as players
    from public.houses h
    left join players p on p.house_id = h.id
    where lower(h.name) <> 'gamemaster'
    group by h.id, h.name, h.color
  )
  select jsonb_build_object(
    'player_count', (select count(*) from players),
    'players', coalesce((
      select jsonb_agg(jsonb_build_object(
        'rank', p.rank,
        'name', gamification_private.treasure_player_name(p.user_id),
        'house', h.name,
        'house_color', h.color,
        'found', p.found,
        'points', p.points,
        'completed', p.completed_at is not null,
        'is_me', p.user_id = p_user_id
      ) order by p.rank, p.last_found)
      from (select * from players order by rank, last_found limit 20) p
      left join public.houses h on h.id = p.house_id
    ), '[]'::jsonb),
    'me', (
      select jsonb_build_object('rank', p.rank, 'found', p.found, 'points', p.points)
      from players p where p.user_id = p_user_id
    ),
    'houses', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', x.name, 'color', x.color, 'points', x.points, 'players', x.players
      ) order by x.points desc, x.name)
      from houses x
    ), '[]'::jsonb)
  );
$$;

revoke all on function gamification_private.treasure_hunt_state(boolean, timestamptz, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function gamification_private.treasure_hunt_targets(uuid, text[]) from public, anon, authenticated;
revoke all on function gamification_private.treasure_step_subject(uuid) from public, anon, authenticated;
revoke all on function gamification_private.treasure_player_name(uuid) from public, anon, authenticated;
revoke all on function gamification_private.issue_treasure_step_code(uuid, uuid) from public, anon, authenticated;
revoke all on function gamification_private.treasure_hunt_ranking(uuid, uuid) from public, anon, authenticated;

-- Validation d'un code de chasse au trésor, appelée par public.redeem_scan_code.
create or replace function gamification_private.redeem_treasure_code(
  p_user_id uuid,
  p_code_id uuid,
  p_method text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code gamification_private.scan_codes%rowtype;
  v_step gamification_private.treasure_hunt_steps%rowtype;
  v_hunt gamification_private.treasure_hunts%rowtype;
  v_hunt_json jsonb;
  v_state text;
  v_existing gamification_private.scan_redemptions%rowtype;
  v_expected integer;
  v_is_player boolean := false;
  v_award jsonb := '{}'::jsonb;
  v_bonus_award jsonb := '{}'::jsonb;
  v_xp integer := 0;
  v_bonus integer := 0;
  v_redemption_id uuid;
  v_found integer;
  v_total integer;
  v_completed boolean := false;
begin
  select * into v_code from gamification_private.scan_codes c where c.id = p_code_id;

  select * into v_step
  from gamification_private.treasure_hunt_steps s
  where s.id = (regexp_match(v_code.subject_key, '^treasure-step:([0-9a-f-]{36})$'))[1]::uuid;

  if v_step.id is null then
    insert into gamification_private.scan_attempts (user_id, outcome) values (p_user_id, 'invalid');
    return jsonb_build_object('status', 'invalid');
  end if;

  select * into v_hunt from gamification_private.treasure_hunts h where h.id = v_step.hunt_id;
  v_state := gamification_private.treasure_hunt_state(v_hunt.published, v_hunt.starts_at, v_hunt.ends_at);

  -- Une chasse en brouillon reste invisible (sauf pour les organisateurs, qui testent leurs codes).
  if v_state = 'draft' and not gamification_private.can_manage_scan_codes(p_user_id) then
    insert into gamification_private.scan_attempts (user_id, outcome) values (p_user_id, 'hunt_unavailable');
    return jsonb_build_object('status', 'hunt_unavailable', 'kind', 'treasure_hunt');
  end if;

  v_hunt_json := jsonb_build_object(
    'id', v_hunt.id,
    'title', v_hunt.title,
    'starts_at', v_hunt.starts_at,
    'ends_at', v_hunt.ends_at
  );

  if v_step.code_id is distinct from v_code.id
     or (v_code.expires_at is not null and v_code.expires_at <= now()) then
    insert into gamification_private.scan_attempts (user_id, outcome) values (p_user_id, 'revoked');
    return jsonb_build_object('status', 'code_revoked', 'kind', 'treasure_hunt', 'hunt', v_hunt_json);
  end if;

  if not gamification_private.treasure_hunt_targets(p_user_id, v_hunt.target_classes) then
    insert into gamification_private.scan_attempts (user_id, outcome) values (p_user_id, 'not_eligible');
    return jsonb_build_object('status', 'not_eligible', 'kind', 'treasure_hunt', 'hunt', v_hunt_json);
  end if;

  select count(*) into v_total
  from gamification_private.treasure_hunt_steps s where s.hunt_id = v_hunt.id;

  select * into v_existing
  from gamification_private.scan_redemptions r
  where r.subject_key = v_code.subject_key and r.user_id = p_user_id;

  if v_existing.id is not null then
    select count(*) into v_found
    from gamification_private.treasure_hunt_steps s
    join gamification_private.scan_redemptions r
      on r.subject_key = gamification_private.treasure_step_subject(s.id) and r.user_id = p_user_id
    where s.hunt_id = v_hunt.id;

    return jsonb_build_object(
      'status', 'already',
      'kind', 'treasure_hunt',
      'hunt', v_hunt_json,
      'step', jsonb_build_object('name', v_step.name, 'position', v_step.position),
      'found', v_found,
      'total', v_total,
      'redeemed_at', v_existing.redeemed_at,
      'xp_gained', 0,
      'xp_awarded', v_existing.xp_awarded
    );
  end if;

  if v_state in ('upcoming', 'ended') then
    insert into gamification_private.scan_attempts (user_id, outcome) values (p_user_id, 'hunt_' || v_state);
    return jsonb_build_object(
      'status', case v_state when 'upcoming' then 'hunt_not_started' else 'hunt_ended' end,
      'kind', 'treasure_hunt',
      'hunt', v_hunt_json
    );
  end if;

  -- Une validation à la fois par personne et par chasse : l'ordre et le bonus restent justes
  -- même si deux étapes sont scannées au même moment.
  perform pg_advisory_xact_lock(hashtextextended('treasure-hunt:' || v_hunt.id::text || ':' || p_user_id::text, 0));

  if v_hunt.ordered then
    select min(s.position) into v_expected
    from gamification_private.treasure_hunt_steps s
    where s.hunt_id = v_hunt.id
      and s.position < v_step.position
      and not exists (
        select 1 from gamification_private.scan_redemptions r
        where r.subject_key = gamification_private.treasure_step_subject(s.id) and r.user_id = p_user_id
      );

    if v_expected is not null then
      return jsonb_build_object(
        'status', 'order_required',
        'kind', 'treasure_hunt',
        'hunt', v_hunt_json,
        'expected_position', v_expected,
        'scanned_position', v_step.position
      );
    end if;
  end if;

  -- Chasse en brouillon : l'organisateur teste ses codes, sans points.
  v_is_player := v_state = 'open'
    and gamification_private.is_rollout_member(p_user_id)
    and coalesce((
      select rc.rewards_enabled from gamification_private.rollout_config rc where rc.singleton
    ), false);

  if v_is_player and v_step.xp_reward > 0 then
    v_award := public.gamification_award_xp_internal(
      p_user_id,
      'TREASURE_HUNT',
      v_step.xp_reward,
      gamification_private.treasure_step_subject(v_step.id),
      'treasure_hunt',
      v_hunt.id,
      'Chasse au trésor : ' || v_hunt.title || ' – ' || v_step.name
    );
    v_xp := coalesce((v_award ->> 'xp_gained')::integer, 0);
  end if;

  insert into gamification_private.scan_redemptions (
    kind, subject_key, event_id, code_id, user_id, method, is_player, xp_awarded
  ) values (
    'treasure_hunt', v_code.subject_key, null, v_code.id, p_user_id, p_method, v_is_player, v_xp
  )
  on conflict on constraint scan_redemptions_once_per_subject do nothing
  returning id into v_redemption_id;

  if v_redemption_id is null then
    return jsonb_build_object(
      'status', 'already', 'kind', 'treasure_hunt', 'hunt', v_hunt_json,
      'step', jsonb_build_object('name', v_step.name, 'position', v_step.position), 'xp_gained', 0
    );
  end if;

  select count(*) into v_found
  from gamification_private.treasure_hunt_steps s
  join gamification_private.scan_redemptions r
    on r.subject_key = gamification_private.treasure_step_subject(s.id) and r.user_id = p_user_id
  where s.hunt_id = v_hunt.id;

  if v_total > 0 and v_found >= v_total then
    insert into gamification_private.treasure_hunt_completions (hunt_id, user_id)
    values (v_hunt.id, p_user_id)
    on conflict do nothing;
    v_completed := found;

    if v_completed and v_is_player and v_hunt.completion_bonus > 0 then
      v_bonus_award := public.gamification_award_xp_internal(
        p_user_id,
        'TREASURE_HUNT_COMPLETE',
        v_hunt.completion_bonus,
        'treasure-hunt-complete:' || v_hunt.id::text,
        'treasure_hunt',
        v_hunt.id,
        'Chasse au trésor terminée : ' || v_hunt.title
      );
      v_bonus := coalesce((v_bonus_award ->> 'xp_gained')::integer, 0);
      update gamification_private.treasure_hunt_completions
      set bonus_awarded = v_bonus
      where hunt_id = v_hunt.id and user_id = p_user_id;
    end if;
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'kind', 'treasure_hunt',
    'hunt', v_hunt_json,
    'step', jsonb_build_object('name', v_step.name, 'position', v_step.position),
    'found', v_found,
    'total', v_total,
    'completed', v_completed,
    'is_player', v_is_player,
    'xp_gained', v_xp,
    'bonus_xp', v_bonus,
    'total_xp', coalesce(v_bonus_award -> 'total_xp', v_award -> 'total_xp'),
    'current_level', coalesce(v_bonus_award -> 'current_level', v_award -> 'current_level'),
    'level_up', coalesce((v_award ->> 'level_up')::boolean, false)
      or coalesce((v_bonus_award ->> 'level_up')::boolean, false),
    'redeemed_at', now()
  );
end;
$$;

revoke all on function gamification_private.redeem_treasure_code(uuid, uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Validation générique des codes (présence + chasse au trésor)
-- ---------------------------------------------------------------------------
-- Reprise de la version du 20261111140000 avec deux changements :
--   * limite supplémentaire : 20 codes inconnus par heure et par personne ;
--   * les codes « treasure_hunt » sont validés par redeem_treasure_code.

create or replace function public.redeem_scan_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_raw text := btrim(coalesce(p_code, ''));
  v_short text;
  v_method text;
  v_code gamification_private.scan_codes%rowtype;
  v_event public.events%rowtype;
  v_event_json jsonb;
  v_existing gamification_private.scan_redemptions%rowtype;
  v_state text;
  v_is_player boolean := false;
  v_award jsonb := '{}'::jsonb;
  v_xp integer := 0;
  v_redemption_id uuid;
  v_oldest_invalid timestamptz;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if (
    select count(*) from gamification_private.scan_attempts a
    where a.user_id = v_user_id and a.attempted_at > now() - interval '10 minutes'
  ) >= 12 then
    return jsonb_build_object('status', 'rate_limited', 'retry_at', now() + interval '10 minutes');
  end if;

  -- Deviner un code court : au plus 20 codes inconnus sur l'heure écoulée.
  select min(x.attempted_at) into v_oldest_invalid
  from (
    select a.attempted_at
    from gamification_private.scan_attempts a
    where a.user_id = v_user_id
      and a.outcome = 'invalid'
      and a.attempted_at > now() - interval '1 hour'
    order by a.attempted_at desc
    limit 20
  ) x
  having count(*) >= 20;

  if v_oldest_invalid is not null then
    return jsonb_build_object('status', 'rate_limited', 'retry_at', v_oldest_invalid + interval '1 hour');
  end if;

  if lower(v_raw) ~ '^[0-9a-f]{32}$' then
    v_method := 'qr';
    select * into v_code from gamification_private.scan_codes c where c.token = lower(v_raw);
  else
    v_method := 'code';
    v_short := upper(regexp_replace(v_raw, '[\s-]', '', 'g'));
    if v_short ~ '^[A-HJ-NP-Z2-9]{6}$' then
      -- Deux codes peuvent partager le même code court : le code encore valable gagne.
      select * into v_code
      from gamification_private.scan_codes c
      where c.short_code = v_short
        and c.valid_from <= now()
        and (c.expires_at is null or c.expires_at > now() - interval '1 day')
      order by (c.expires_at is null or c.expires_at > now()) desc, c.created_at desc
      limit 1;
    end if;
  end if;

  if v_code.id is null then
    insert into gamification_private.scan_attempts (user_id, outcome) values (v_user_id, 'invalid');
    return jsonb_build_object('status', 'invalid');
  end if;

  if v_code.kind = 'treasure_hunt' then
    return gamification_private.redeem_treasure_code(v_user_id, v_code.id, v_method);
  end if;

  if v_code.kind <> 'event_attendance' then
    return jsonb_build_object('status', 'unsupported', 'kind', v_code.kind);
  end if;

  select * into v_event from public.events e where e.id = v_code.event_id;
  v_state := gamification_private.event_checkin_state(v_event.status, v_event.start_date, v_event.end_date);
  if v_event.id is null or v_state = 'unavailable' then
    insert into gamification_private.scan_attempts (user_id, outcome) values (v_user_id, 'event_unavailable');
    return jsonb_build_object('status', 'event_unavailable', 'kind', v_code.kind);
  end if;

  v_event_json := jsonb_build_object(
    'id', v_event.id,
    'title', v_event.title,
    'lieu', v_event.lieu,
    'start_date', v_event.start_date,
    'end_date', v_event.end_date
  );

  select * into v_existing
  from gamification_private.scan_redemptions r
  where r.subject_key = v_code.subject_key and r.user_id = v_user_id;

  if v_existing.id is not null then
    return jsonb_build_object(
      'status', 'already',
      'kind', v_code.kind,
      'event', v_event_json,
      'redeemed_at', v_existing.redeemed_at,
      'xp_gained', 0,
      'xp_awarded', v_existing.xp_awarded
    );
  end if;

  if v_state <> 'open' then
    insert into gamification_private.scan_attempts (user_id, outcome)
    values (v_user_id, 'event_' || v_state);
    return jsonb_build_object(
      'status', case v_state when 'upcoming' then 'event_not_started' else 'event_ended' end,
      'kind', v_code.kind,
      'event', v_event_json
    );
  end if;

  if v_code.valid_from > now() or v_code.expires_at <= now() then
    insert into gamification_private.scan_attempts (user_id, outcome) values (v_user_id, 'expired');
    return jsonb_build_object('status', 'expired', 'kind', v_code.kind, 'event', v_event_json);
  end if;

  v_is_player := gamification_private.is_rollout_member(v_user_id)
    and coalesce((
      select rc.rewards_enabled from gamification_private.rollout_config rc where rc.singleton
    ), false);

  -- L'attribution est idempotente (clé par événement) : deux scans simultanés de la
  -- même personne ne donnent les points qu'une fois.
  if v_is_player and v_code.xp_reward > 0 then
    v_award := public.gamification_award_xp_internal(
      v_user_id,
      'EVENT_CHECKIN',
      v_code.xp_reward,
      'event-checkin:' || v_event.id::text,
      'event',
      v_event.id,
      'Présence : ' || v_event.title
    );
    v_xp := coalesce((v_award ->> 'xp_gained')::integer, 0);
  end if;

  insert into gamification_private.scan_redemptions (
    kind, subject_key, event_id, code_id, user_id, method, is_player, xp_awarded
  ) values (
    v_code.kind, v_code.subject_key, v_event.id, v_code.id, v_user_id, v_method, v_is_player, v_xp
  )
  on conflict on constraint scan_redemptions_once_per_subject do nothing
  returning id into v_redemption_id;

  if v_redemption_id is null then
    return jsonb_build_object(
      'status', 'already', 'kind', v_code.kind, 'event', v_event_json, 'xp_gained', 0
    );
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'kind', v_code.kind,
    'event', v_event_json,
    'is_player', v_is_player,
    'xp_gained', v_xp,
    'total_xp', v_award -> 'total_xp',
    'current_level', v_award -> 'current_level',
    'level_up', coalesce((v_award ->> 'level_up')::boolean, false),
    'redeemed_at', now()
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Joueurs
-- ---------------------------------------------------------------------------

-- Chasses en cours, à venir et terminées depuis moins de 30 jours, pour ma classe.
create or replace function public.list_treasure_hunts()
returns jsonb
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

  return jsonb_build_object(
    'can_manage', gamification_private.can_manage_scan_codes(v_user_id),
    'server_now', now(),
    'hunts', coalesce((
      select jsonb_agg(item order by sort_state, sort_date)
      from (
        select
          case gamification_private.treasure_hunt_state(h.published, h.starts_at, h.ends_at)
            when 'open' then 0 when 'upcoming' then 1 else 2 end as sort_state,
          case when now() >= h.ends_at then -extract(epoch from h.ends_at) else extract(epoch from h.ends_at) end as sort_date,
          jsonb_build_object(
            'id', h.id,
            'title', h.title,
            'description', h.description,
            'starts_at', h.starts_at,
            'ends_at', h.ends_at,
            'ordered', h.ordered,
            'state', gamification_private.treasure_hunt_state(h.published, h.starts_at, h.ends_at),
            'step_count', (select count(*) from gamification_private.treasure_hunt_steps s where s.hunt_id = h.id),
            'found_count', (
              select count(*) from gamification_private.treasure_hunt_steps s
              join gamification_private.scan_redemptions r
                on r.subject_key = gamification_private.treasure_step_subject(s.id) and r.user_id = v_user_id
              where s.hunt_id = h.id
            ),
            'max_xp', coalesce((select sum(s.xp_reward) from gamification_private.treasure_hunt_steps s where s.hunt_id = h.id), 0)
              + h.completion_bonus,
            'completed', exists (
              select 1 from gamification_private.treasure_hunt_completions c
              where c.hunt_id = h.id and c.user_id = v_user_id
            )
          ) as item
        from gamification_private.treasure_hunts h
        where h.published
          and h.ends_at > now() - interval '30 days'
          and gamification_private.treasure_hunt_targets(v_user_id, h.target_classes)
      ) list
    ), '[]'::jsonb)
  );
end;
$$;

-- Détail d'une chasse pour un joueur : indices, progression, classement.
create or replace function public.get_treasure_hunt(p_hunt_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_hunt gamification_private.treasure_hunts%rowtype;
  v_can_manage boolean;
  v_next integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_can_manage := gamification_private.can_manage_scan_codes(v_user_id);
  select * into v_hunt from gamification_private.treasure_hunts h where h.id = p_hunt_id;

  if v_hunt.id is null
     or (not v_hunt.published and not v_can_manage)
     or not gamification_private.treasure_hunt_targets(v_user_id, v_hunt.target_classes) then
    return jsonb_build_object('found', false);
  end if;

  -- Ordre imposé : seule la prochaine étape non trouvée dévoile son indice.
  if v_hunt.ordered then
    select min(s.position) into v_next
    from gamification_private.treasure_hunt_steps s
    where s.hunt_id = p_hunt_id
      and not exists (
        select 1 from gamification_private.scan_redemptions r
        where r.subject_key = gamification_private.treasure_step_subject(s.id) and r.user_id = v_user_id
      );
  end if;

  return jsonb_build_object(
    'found', true,
    'can_manage', v_can_manage,
    'server_now', now(),
    'hunt', jsonb_build_object(
      'id', v_hunt.id,
      'title', v_hunt.title,
      'description', v_hunt.description,
      'starts_at', v_hunt.starts_at,
      'ends_at', v_hunt.ends_at,
      'ordered', v_hunt.ordered,
      'completion_bonus', v_hunt.completion_bonus,
      'state', gamification_private.treasure_hunt_state(v_hunt.published, v_hunt.starts_at, v_hunt.ends_at)
    ),
    'steps', coalesce((
      select jsonb_agg(jsonb_build_object(
        'position', s.position,
        'name', case when r.id is not null then s.name end,
        'hint', case when r.id is not null or not v_hunt.ordered or s.position = v_next then s.hint end,
        'locked', r.id is null and v_hunt.ordered and s.position is distinct from v_next,
        'xp_reward', s.xp_reward,
        'found', r.id is not null,
        'found_at', r.redeemed_at,
        'xp_awarded', r.xp_awarded
      ) order by s.position)
      from gamification_private.treasure_hunt_steps s
      left join gamification_private.scan_redemptions r
        on r.subject_key = gamification_private.treasure_step_subject(s.id) and r.user_id = v_user_id
      where s.hunt_id = p_hunt_id
    ), '[]'::jsonb),
    'completed_at', (
      select c.completed_at from gamification_private.treasure_hunt_completions c
      where c.hunt_id = p_hunt_id and c.user_id = v_user_id
    ),
    'ranking', gamification_private.treasure_hunt_ranking(p_hunt_id, v_user_id)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Organisateurs
-- ---------------------------------------------------------------------------

create or replace function public.manage_list_treasure_hunts()
returns jsonb
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
  if not gamification_private.can_manage_scan_codes(v_user_id) then
    return jsonb_build_object('allowed', false, 'hunts', '[]'::jsonb);
  end if;

  return jsonb_build_object(
    'allowed', true,
    'hunts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', h.id,
        'title', h.title,
        'starts_at', h.starts_at,
        'ends_at', h.ends_at,
        'target_classes', h.target_classes,
        'ordered', h.ordered,
        'published', h.published,
        'state', gamification_private.treasure_hunt_state(h.published, h.starts_at, h.ends_at),
        'step_count', (select count(*) from gamification_private.treasure_hunt_steps s where s.hunt_id = h.id),
        'player_count', (
          select count(distinct r.user_id) from gamification_private.treasure_hunt_steps s
          join gamification_private.scan_redemptions r on r.subject_key = gamification_private.treasure_step_subject(s.id)
          where s.hunt_id = h.id
        ),
        'completed_count', (select count(*) from gamification_private.treasure_hunt_completions c where c.hunt_id = h.id)
      ) order by h.starts_at desc, h.created_at desc)
      from gamification_private.treasure_hunts h
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.manage_get_treasure_hunt(p_hunt_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_hunt gamification_private.treasure_hunts%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if not gamification_private.can_manage_scan_codes(v_user_id) then
    raise exception 'Accès réservé aux organisateurs.';
  end if;

  select * into v_hunt from gamification_private.treasure_hunts h where h.id = p_hunt_id;
  if v_hunt.id is null then
    return jsonb_build_object('found', false);
  end if;

  return jsonb_build_object(
    'found', true,
    'hunt', jsonb_build_object(
      'id', v_hunt.id,
      'title', v_hunt.title,
      'description', v_hunt.description,
      'starts_at', v_hunt.starts_at,
      'ends_at', v_hunt.ends_at,
      'target_classes', v_hunt.target_classes,
      'ordered', v_hunt.ordered,
      'published', v_hunt.published,
      'completion_bonus', v_hunt.completion_bonus,
      'state', gamification_private.treasure_hunt_state(v_hunt.published, v_hunt.starts_at, v_hunt.ends_at),
      'completed_count', (select count(*) from gamification_private.treasure_hunt_completions c where c.hunt_id = p_hunt_id)
    ),
    'steps', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id,
        'position', s.position,
        'name', s.name,
        'hint', s.hint,
        'xp_reward', s.xp_reward,
        'token', c.token,
        'short_code', c.short_code,
        'code_active', c.id is not null and c.expires_at is null,
        'code_created_at', c.created_at,
        'find_count', (
          select count(*) from gamification_private.scan_redemptions r
          where r.subject_key = gamification_private.treasure_step_subject(s.id)
        )
      ) order by s.position)
      from gamification_private.treasure_hunt_steps s
      left join gamification_private.scan_codes c on c.id = s.code_id
      where s.hunt_id = p_hunt_id
    ), '[]'::jsonb),
    'ranking', gamification_private.treasure_hunt_ranking(p_hunt_id, v_user_id)
  );
end;
$$;

-- Crée (p_hunt_id null) ou modifie une chasse. Une nouvelle chasse est un brouillon.
create or replace function public.save_treasure_hunt(
  p_hunt_id uuid,
  p_title text,
  p_description text,
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_target_classes text[],
  p_ordered boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_title text := btrim(coalesce(p_title, ''));
  v_description text := btrim(coalesce(p_description, ''));
  v_classes text[];
  v_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if not gamification_private.can_manage_scan_codes(v_user_id) then
    raise exception 'Accès réservé aux organisateurs.';
  end if;
  if char_length(v_title) < 3 or char_length(v_title) > 120 then
    raise exception 'Le titre doit compter entre 3 et 120 caractères.';
  end if;
  if char_length(v_description) > 1000 then
    raise exception 'La description est limitée à 1000 caractères.';
  end if;
  if p_starts_at is null or p_ends_at is null or p_ends_at <= p_starts_at then
    raise exception 'La date de fin doit suivre la date de début.';
  end if;
  if p_ends_at > p_starts_at + interval '366 days' then
    raise exception 'Une chasse dure au plus un an.';
  end if;

  select coalesce(array_agg(distinct upper(btrim(c))) filter (where btrim(coalesce(c, '')) <> ''), '{}'::text[])
  into v_classes
  from unnest(coalesce(p_target_classes, '{}'::text[])) as c;

  if array_to_string(v_classes, ',') !~ '^([A-Z0-9]{2,10}(,[A-Z0-9]{2,10})*)?$' or cardinality(v_classes) > 12 then
    raise exception 'Classes visées invalides.';
  end if;

  if p_hunt_id is null then
    insert into gamification_private.treasure_hunts (
      title, description, starts_at, ends_at, target_classes, ordered, created_by
    ) values (
      v_title, v_description, p_starts_at, p_ends_at, v_classes, coalesce(p_ordered, false), v_user_id
    )
    returning id into v_id;
  else
    update gamification_private.treasure_hunts
    set title = v_title,
        description = v_description,
        starts_at = p_starts_at,
        ends_at = p_ends_at,
        target_classes = v_classes,
        ordered = coalesce(p_ordered, false),
        updated_at = now()
    where id = p_hunt_id
    returning id into v_id;
    if v_id is null then
      raise exception 'Chasse introuvable.';
    end if;
  end if;

  return jsonb_build_object('id', v_id);
end;
$$;

create or replace function public.set_treasure_hunt_published(p_hunt_id uuid, p_published boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if not gamification_private.can_manage_scan_codes(v_user_id) then
    raise exception 'Accès réservé aux organisateurs.';
  end if;
  if not exists (select 1 from gamification_private.treasure_hunts h where h.id = p_hunt_id) then
    raise exception 'Chasse introuvable.';
  end if;
  if coalesce(p_published, false) and not exists (
    select 1 from gamification_private.treasure_hunt_steps s where s.hunt_id = p_hunt_id
  ) then
    raise exception 'Ajoutez au moins une étape avant de publier la chasse.';
  end if;

  update gamification_private.treasure_hunts
  set published = coalesce(p_published, false), updated_at = now()
  where id = p_hunt_id;

  return jsonb_build_object('id', p_hunt_id, 'published', coalesce(p_published, false));
end;
$$;

-- Supprime une chasse que personne n'a encore commencée (sinon : la dépublier).
create or replace function public.delete_treasure_hunt(p_hunt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if not gamification_private.can_manage_scan_codes(v_user_id) then
    raise exception 'Accès réservé aux organisateurs.';
  end if;
  if exists (
    select 1 from gamification_private.treasure_hunt_steps s
    join gamification_private.scan_redemptions r on r.subject_key = gamification_private.treasure_step_subject(s.id)
    where s.hunt_id = p_hunt_id
  ) then
    raise exception 'Des joueurs ont déjà trouvé des étapes : dépubliez la chasse au lieu de la supprimer.';
  end if;

  delete from gamification_private.scan_codes c
  where c.kind = 'treasure_hunt'
    and c.subject_key in (
      select gamification_private.treasure_step_subject(s.id)
      from gamification_private.treasure_hunt_steps s where s.hunt_id = p_hunt_id
    );
  delete from gamification_private.treasure_hunts h where h.id = p_hunt_id;

  return jsonb_build_object('deleted', found);
end;
$$;

-- Crée (p_step_id null) ou modifie une étape. Une nouvelle étape reçoit son QR code.
create or replace function public.save_treasure_hunt_step(
  p_step_id uuid,
  p_hunt_id uuid,
  p_name text,
  p_hint text,
  p_xp_reward integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_name text := btrim(coalesce(p_name, ''));
  v_hint text := btrim(coalesce(p_hint, ''));
  v_id uuid;
  v_position integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if not gamification_private.can_manage_scan_codes(v_user_id) then
    raise exception 'Accès réservé aux organisateurs.';
  end if;
  if char_length(v_name) < 1 or char_length(v_name) > 80 then
    raise exception 'Le nom de l’étape doit compter entre 1 et 80 caractères.';
  end if;
  if char_length(v_hint) < 1 or char_length(v_hint) > 300 then
    raise exception 'L’indice doit compter entre 1 et 300 caractères.';
  end if;
  if p_xp_reward is null or p_xp_reward < 5 or p_xp_reward > 50 then
    raise exception 'Une étape rapporte entre 5 et 50 XP.';
  end if;

  if p_step_id is null then
    -- Les ajouts simultanés à la même chasse passent l'un après l'autre.
    perform 1 from gamification_private.treasure_hunts h where h.id = p_hunt_id for update;
    if not found then
      raise exception 'Chasse introuvable.';
    end if;
    select coalesce(max(s.position), 0) + 1 into v_position
    from gamification_private.treasure_hunt_steps s where s.hunt_id = p_hunt_id;
    if v_position > 30 then
      raise exception 'Une chasse compte au plus 30 étapes.';
    end if;

    insert into gamification_private.treasure_hunt_steps (hunt_id, position, name, hint, xp_reward)
    values (p_hunt_id, v_position, v_name, v_hint, p_xp_reward)
    returning id into v_id;
    perform gamification_private.issue_treasure_step_code(v_id, v_user_id);
  else
    update gamification_private.treasure_hunt_steps
    set name = v_name, hint = v_hint, xp_reward = p_xp_reward, updated_at = now()
    where id = p_step_id
    returning id into v_id;
    if v_id is null then
      raise exception 'Étape introuvable.';
    end if;
    update gamification_private.scan_codes c
    set xp_reward = p_xp_reward
    where c.id = (select s.code_id from gamification_private.treasure_hunt_steps s where s.id = v_id);
  end if;

  return jsonb_build_object('id', v_id);
end;
$$;

-- Supprime une étape que personne n'a trouvée ; les suivantes remontent d'un rang.
create or replace function public.delete_treasure_hunt_step(p_step_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_step gamification_private.treasure_hunt_steps%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if not gamification_private.can_manage_scan_codes(v_user_id) then
    raise exception 'Accès réservé aux organisateurs.';
  end if;

  select * into v_step from gamification_private.treasure_hunt_steps s where s.id = p_step_id;
  if v_step.id is null then
    raise exception 'Étape introuvable.';
  end if;
  if exists (
    select 1 from gamification_private.scan_redemptions r
    where r.subject_key = gamification_private.treasure_step_subject(p_step_id)
  ) then
    raise exception 'Des joueurs ont déjà trouvé cette étape : désactivez son QR code au lieu de la supprimer.';
  end if;

  delete from gamification_private.treasure_hunt_steps s where s.id = p_step_id;
  delete from gamification_private.scan_codes c
  where c.kind = 'treasure_hunt' and c.subject_key = gamification_private.treasure_step_subject(p_step_id);

  update gamification_private.treasure_hunt_steps s
  set position = s.position - 1, updated_at = now()
  where s.hunt_id = v_step.hunt_id and s.position > v_step.position;

  return jsonb_build_object('deleted', true);
end;
$$;

-- Nouvel ordre des étapes : la liste complète des identifiants, dans l'ordre voulu.
create or replace function public.reorder_treasure_hunt_steps(p_hunt_id uuid, p_step_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if not gamification_private.can_manage_scan_codes(v_user_id) then
    raise exception 'Accès réservé aux organisateurs.';
  end if;

  if (
    select count(*) from gamification_private.treasure_hunt_steps s where s.hunt_id = p_hunt_id
  ) <> coalesce(cardinality(p_step_ids), 0)
  or (
    select count(distinct x.id) from unnest(p_step_ids) as x(id)
    join gamification_private.treasure_hunt_steps s on s.id = x.id and s.hunt_id = p_hunt_id
  ) <> coalesce(cardinality(p_step_ids), 0) then
    raise exception 'La liste des étapes ne correspond pas à la chasse.';
  end if;

  update gamification_private.treasure_hunt_steps s
  set position = x.ord, updated_at = now()
  from unnest(p_step_ids) with ordinality as x(id, ord)
  where s.id = x.id and s.hunt_id = p_hunt_id and s.position <> x.ord;

  return jsonb_build_object('id', p_hunt_id);
end;
$$;

-- Désactive le QR code d'une étape (p_disable) ou le remplace par un nouveau.
-- L'ancien code imprimé cesse aussitôt de fonctionner ; les étapes déjà trouvées restent.
create or replace function public.renew_treasure_hunt_step_code(p_step_id uuid, p_disable boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_step gamification_private.treasure_hunt_steps%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if not gamification_private.can_manage_scan_codes(v_user_id) then
    raise exception 'Accès réservé aux organisateurs.';
  end if;

  select * into v_step from gamification_private.treasure_hunt_steps s where s.id = p_step_id for update;
  if v_step.id is null then
    raise exception 'Étape introuvable.';
  end if;

  update gamification_private.scan_codes c
  set expires_at = now()
  where c.kind = 'treasure_hunt'
    and c.subject_key = gamification_private.treasure_step_subject(p_step_id)
    and c.expires_at is null;

  if not coalesce(p_disable, false) then
    perform gamification_private.issue_treasure_step_code(p_step_id, v_user_id);
  end if;

  return jsonb_build_object('id', p_step_id, 'code_active', not coalesce(p_disable, false));
end;
$$;

revoke all on function public.redeem_scan_code(text) from public, anon;
revoke all on function public.list_treasure_hunts() from public, anon;
revoke all on function public.get_treasure_hunt(uuid) from public, anon;
revoke all on function public.manage_list_treasure_hunts() from public, anon;
revoke all on function public.manage_get_treasure_hunt(uuid) from public, anon;
revoke all on function public.save_treasure_hunt(uuid, text, text, timestamptz, timestamptz, text[], boolean) from public, anon;
revoke all on function public.set_treasure_hunt_published(uuid, boolean) from public, anon;
revoke all on function public.delete_treasure_hunt(uuid) from public, anon;
revoke all on function public.save_treasure_hunt_step(uuid, uuid, text, text, integer) from public, anon;
revoke all on function public.delete_treasure_hunt_step(uuid) from public, anon;
revoke all on function public.reorder_treasure_hunt_steps(uuid, uuid[]) from public, anon;
revoke all on function public.renew_treasure_hunt_step_code(uuid, boolean) from public, anon;

grant execute on function public.redeem_scan_code(text) to authenticated;
grant execute on function public.list_treasure_hunts() to authenticated;
grant execute on function public.get_treasure_hunt(uuid) to authenticated;
grant execute on function public.manage_list_treasure_hunts() to authenticated;
grant execute on function public.manage_get_treasure_hunt(uuid) to authenticated;
grant execute on function public.save_treasure_hunt(uuid, text, text, timestamptz, timestamptz, text[], boolean) to authenticated;
grant execute on function public.set_treasure_hunt_published(uuid, boolean) to authenticated;
grant execute on function public.delete_treasure_hunt(uuid) to authenticated;
grant execute on function public.save_treasure_hunt_step(uuid, uuid, text, text, integer) to authenticated;
grant execute on function public.delete_treasure_hunt_step(uuid) to authenticated;
grant execute on function public.reorder_treasure_hunt_steps(uuid, uuid[]) to authenticated;
grant execute on function public.renew_treasure_hunt_step_code(uuid, boolean) to authenticated;

notify pgrst, 'reload schema';
