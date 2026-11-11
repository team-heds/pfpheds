-- Présence aux événements par QR code.
--
-- L'organisateur (enseignant, admin, maître du jeu) affiche un QR code qui se renouvelle ;
-- la personne présente le scanne et le serveur enregistre sa présence. Tout est décidé ici :
--   * les codes sont créés et stockés côté serveur, valables 90 secondes, uniquement
--     pendant l'événement (15 minutes de marge avant le début et après la fin) ;
--   * une seule présence par personne et par événement ;
--   * les points (10 à 100, 30 par défaut) passent par gamification_award_xp_internal,
--     donc comptent pour la maison comme les autres gains ; ils sont réservés aux joueurs
--     (gamification_private.is_rollout_member), les autres sont enregistrés sans points.
--
-- Les tables de codes et de validations sont génériques (colonne « kind ») : la présence
-- à un événement aujourd'hui, la chasse au trésor du campus ensuite, sans nouvelle table.
-- Aucune table n'est exposée à l'API : tout passe par les fonctions ci-dessous.

create schema if not exists gamification_private;
revoke all on schema gamification_private from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists gamification_private.event_checkin_settings (
  event_id uuid primary key references public.events(id) on delete cascade,
  xp_reward integer not null default 30 check (xp_reward between 10 and 100),
  configured_by uuid not null,
  created_at timestamptz not null default now(),
  configured_at timestamptz not null default now()
);

create table if not exists gamification_private.scan_codes (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('event_attendance', 'treasure_hunt')),
  -- Ce que le code valide ; une personne ne valide qu'une fois le même sujet.
  subject_key text not null check (btrim(subject_key) <> ''),
  event_id uuid references public.events(id) on delete cascade,
  token text not null unique check (token ~ '^[0-9a-f]{32}$'),
  short_code text not null check (short_code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  xp_reward integer not null default 0 check (xp_reward between 0 and 500),
  valid_from timestamptz not null default now(),
  -- null = code permanent (chasse au trésor) ; jamais pour une présence.
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  constraint scan_codes_event_attendance_check check (
    kind <> 'event_attendance' or (event_id is not null and expires_at is not null)
  )
);

create index if not exists scan_codes_short_code_idx
  on gamification_private.scan_codes (short_code, created_at desc);
create index if not exists scan_codes_event_idx
  on gamification_private.scan_codes (event_id, created_at desc)
  where event_id is not null;

create table if not exists gamification_private.scan_redemptions (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('event_attendance', 'treasure_hunt')),
  subject_key text not null,
  event_id uuid references public.events(id) on delete cascade,
  code_id uuid references gamification_private.scan_codes(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  method text not null check (method in ('qr', 'code')),
  is_player boolean not null default false,
  xp_awarded integer not null default 0 check (xp_awarded >= 0),
  redeemed_at timestamptz not null default now(),
  constraint scan_redemptions_once_per_subject unique (subject_key, user_id)
);

create index if not exists scan_redemptions_event_idx
  on gamification_private.scan_redemptions (event_id, redeemed_at)
  where event_id is not null;
create index if not exists scan_redemptions_user_idx
  on gamification_private.scan_redemptions (user_id, redeemed_at desc);

-- Essais refusés : sert à freiner la recherche de codes courts au hasard.
create table if not exists gamification_private.scan_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  outcome text not null,
  attempted_at timestamptz not null default now()
);

create index if not exists scan_attempts_user_idx
  on gamification_private.scan_attempts (user_id, attempted_at desc);

alter table gamification_private.event_checkin_settings enable row level security;
alter table gamification_private.scan_codes enable row level security;
alter table gamification_private.scan_redemptions enable row level security;
alter table gamification_private.scan_attempts enable row level security;

-- Aucune policy : seules les fonctions « security definer » ci-dessous lisent et écrivent.
revoke all on gamification_private.event_checkin_settings from public, anon, authenticated;
revoke all on gamification_private.scan_codes from public, anon, authenticated;
revoke all on gamification_private.scan_redemptions from public, anon, authenticated;
revoke all on gamification_private.scan_attempts from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Fonctions internes
-- ---------------------------------------------------------------------------

-- Qui peut afficher un QR code et voir la liste des présents : administration,
-- enseignants et maîtres du jeu. Créer un événement ne suffit pas (tout le monde peut
-- en créer un) : sinon chacun pourrait se distribuer des points.
create or replace function gamification_private.can_manage_scan_codes(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_user_id is not null and (
    exists (
      select 1
      from public.user_profiles up
      where up.user_id = p_user_id
        and coalesce(up.is_active, true)
        and (
          lower(coalesce(up.role, '')) in (
            'admin', 'super.all', 'adminphysio', 'adminsoins',
            'teacher', 'enseignant', 'enseignantsoins', 'game_master'
          )
          or coalesce(up.permissions, '[]'::jsonb) ?| array[
            'admin', 'super.all', 'editor', 'teacher', 'enseignant', 'EnseignantSoins', 'game_master'
          ]
        )
    )
    or exists (
      select 1
      from public.user_track_roles utr
      where utr.user_id = p_user_id
        and utr.is_active = true
        and utr.role::text in ('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT', 'RF', 'RM', 'TEACHER')
        and (utr.expires_at is null or utr.expires_at > now())
    )
    or exists (
      select 1
      from public.gamification_data gd
      join public.houses h on h.id = gd.house_id
      where gd.user_id = p_user_id
        and lower(h.name) = 'gamemaster'
    )
  );
$$;

-- État de la fenêtre de présence d'un événement à l'instant donné.
create or replace function gamification_private.event_checkin_state(
  p_status text,
  p_start timestamptz,
  p_end timestamptz,
  p_now timestamptz default now()
)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when p_status is distinct from 'published' then 'unavailable'
    when p_now < p_start - interval '15 minutes' then 'upcoming'
    when p_now > p_end + interval '15 minutes' then 'closed'
    else 'open'
  end;
$$;

-- Code court lisible (sans 0/O ni 1/I), tiré de 6 octets aléatoires d'un UUID v4.
create or replace function gamification_private.new_scan_short_code()
returns text
language sql
volatile
set search_path = ''
as $$
  select string_agg(
    substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', (get_byte(b.bytes, i) % 32) + 1, 1),
    '' order by i
  )
  from (select uuid_send(gen_random_uuid()) as bytes) b
  cross join generate_series(0, 5) as i;
$$;

revoke all on function gamification_private.can_manage_scan_codes(uuid) from public, anon, authenticated;
revoke all on function gamification_private.event_checkin_state(text, timestamptz, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function gamification_private.new_scan_short_code() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Organisateur
-- ---------------------------------------------------------------------------

-- Résumé pour la fiche d'un événement : droits, points, fenêtre, ma présence.
create or replace function public.get_event_checkin_overview(p_event_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_event public.events%rowtype;
  v_can_manage boolean;
  v_mine gamification_private.scan_redemptions%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_can_manage := gamification_private.can_manage_scan_codes(v_user_id);

  select * into v_event from public.events e where e.id = p_event_id;
  if not found or (v_event.status is distinct from 'published' and not v_can_manage) then
    return jsonb_build_object('found', false, 'can_manage', false);
  end if;

  select * into v_mine
  from gamification_private.scan_redemptions r
  where r.subject_key = 'event:' || p_event_id::text and r.user_id = v_user_id;

  return jsonb_build_object(
    'found', true,
    'can_manage', v_can_manage,
    'state', gamification_private.event_checkin_state(v_event.status, v_event.start_date, v_event.end_date),
    'opens_at', v_event.start_date - interval '15 minutes',
    'closes_at', v_event.end_date + interval '15 minutes',
    'server_now', now(),
    'xp_reward', coalesce((
      select s.xp_reward from gamification_private.event_checkin_settings s where s.event_id = p_event_id
    ), 30),
    'attendee_count', case when v_can_manage then (
      select count(*) from gamification_private.scan_redemptions r
      where r.subject_key = 'event:' || p_event_id::text
    ) end,
    'my_attendance', case when v_mine.id is null then null else jsonb_build_object(
      'redeemed_at', v_mine.redeemed_at,
      'xp_awarded', v_mine.xp_awarded
    ) end
  );
end;
$$;

-- Points accordés pour la présence à un événement (10 à 100).
create or replace function public.configure_event_checkin(p_event_id uuid, p_xp_reward integer)
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
    raise exception 'Insufficient privileges';
  end if;
  if p_xp_reward is null or p_xp_reward < 10 or p_xp_reward > 100 then
    raise exception 'XP reward must be between 10 and 100';
  end if;
  if not exists (select 1 from public.events e where e.id = p_event_id) then
    raise exception 'Event not found';
  end if;

  insert into gamification_private.event_checkin_settings as s (event_id, xp_reward, configured_by)
  values (p_event_id, p_xp_reward, v_user_id)
  on conflict (event_id) do update
    set xp_reward = excluded.xp_reward,
        configured_by = excluded.configured_by,
        configured_at = now();

  return jsonb_build_object('event_id', p_event_id, 'xp_reward', p_xp_reward);
end;
$$;

-- Nouveau code de présence. L'écran de projection l'appelle toutes les 60 secondes ;
-- chaque code reste valable 90 secondes pour laisser finir un scan en cours.
create or replace function public.issue_event_checkin_code(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_event public.events%rowtype;
  v_state text;
  v_xp integer;
  v_code gamification_private.scan_codes%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if not gamification_private.can_manage_scan_codes(v_user_id) then
    raise exception 'Insufficient privileges';
  end if;

  select * into v_event from public.events e where e.id = p_event_id;
  if not found then
    raise exception 'Event not found';
  end if;

  v_state := gamification_private.event_checkin_state(v_event.status, v_event.start_date, v_event.end_date);
  if v_state <> 'open' then
    return jsonb_build_object(
      'issued', false,
      'state', v_state,
      'opens_at', v_event.start_date - interval '15 minutes',
      'closes_at', v_event.end_date + interval '15 minutes',
      'server_now', now()
    );
  end if;

  select coalesce((
    select s.xp_reward from gamification_private.event_checkin_settings s where s.event_id = p_event_id
  ), 30) into v_xp;

  -- Un écran qui s'emballe ne crée pas un code par appel : le code de moins de
  -- 20 secondes du même organisateur est simplement renvoyé.
  select * into v_code
  from gamification_private.scan_codes c
  where c.kind = 'event_attendance'
    and c.event_id = p_event_id
    and c.created_by = v_user_id
    and c.xp_reward = v_xp
    and c.created_at > now() - interval '20 seconds'
    and c.expires_at > now() + interval '30 seconds'
  order by c.created_at desc
  limit 1;

  if not found then
    insert into gamification_private.scan_codes (
      kind, subject_key, event_id, token, short_code, xp_reward, expires_at, created_by
    ) values (
      'event_attendance',
      'event:' || p_event_id::text,
      p_event_id,
      replace(gen_random_uuid()::text, '-', ''),
      gamification_private.new_scan_short_code(),
      v_xp,
      least(now() + interval '90 seconds', v_event.end_date + interval '15 minutes'),
      v_user_id
    )
    returning * into v_code;
  end if;

  return jsonb_build_object(
    'issued', true,
    'state', 'open',
    'token', v_code.token,
    'short_code', v_code.short_code,
    'xp_reward', v_code.xp_reward,
    'issued_at', v_code.created_at,
    'refresh_at', v_code.created_at + interval '60 seconds',
    'expires_at', v_code.expires_at,
    'closes_at', v_event.end_date + interval '15 minutes',
    'server_now', now()
  );
end;
$$;

-- Liste des présents, pour l'écran de projection et l'export.
create or replace function public.get_event_attendance(p_event_id uuid)
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
    raise exception 'Insufficient privileges';
  end if;

  return (
    select jsonb_build_object(
      'event_id', p_event_id,
      'count', count(*),
      'attendees', coalesce(jsonb_agg(
        jsonb_build_object(
          'user_id', r.user_id,
          'display_name', coalesce(
            nullif(btrim(concat_ws(' ', up.forname, up.family_name)), ''),
            nullif(btrim(up.display_name), ''),
            'Compte sans nom'
          ),
          'classe', up.classe,
          'redeemed_at', r.redeemed_at,
          'method', r.method,
          'is_player', r.is_player,
          'xp_awarded', r.xp_awarded
        ) order by r.redeemed_at desc, r.id
      ), '[]'::jsonb)
    )
    from gamification_private.scan_redemptions r
    left join public.user_profiles up on up.user_id = r.user_id
    where r.subject_key = 'event:' || p_event_id::text
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Participant
-- ---------------------------------------------------------------------------

-- Valide un code scanné (jeton du QR) ou saisi (code court). Générique : le type du
-- code décide du traitement. Renvoie toujours un statut lisible plutôt qu'une erreur,
-- pour que les essais refusés restent comptés.
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
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if (
    select count(*) from gamification_private.scan_attempts a
    where a.user_id = v_user_id and a.attempted_at > now() - interval '10 minutes'
  ) >= 12 then
    return jsonb_build_object('status', 'rate_limited');
  end if;

  if lower(v_raw) ~ '^[0-9a-f]{32}$' then
    v_method := 'qr';
    select * into v_code from gamification_private.scan_codes c where c.token = lower(v_raw);
  else
    v_method := 'code';
    v_short := upper(regexp_replace(v_raw, '[\s-]', '', 'g'));
    if v_short ~ '^[A-HJ-NP-Z2-9]{6}$' then
      -- Deux événements peuvent tirer le même code court : le code encore valable gagne.
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

-- Mes présences, pour l'espace gamification.
create or replace function public.get_my_event_attendances(p_limit integer default 50)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(item order by redeemed_at desc), '[]'::jsonb)
  from (
    select
      r.redeemed_at,
      jsonb_build_object(
        'event_id', e.id,
        'title', e.title,
        'lieu', e.lieu,
        'start_date', e.start_date,
        'end_date', e.end_date,
        'redeemed_at', r.redeemed_at,
        'xp_awarded', r.xp_awarded
      ) as item
    from gamification_private.scan_redemptions r
    join public.events e on e.id = r.event_id
    where r.user_id = (select auth.uid())
      and r.kind = 'event_attendance'
    order by r.redeemed_at desc
    limit least(greatest(coalesce(p_limit, 50), 1), 200)
  ) mine;
$$;

revoke all on function public.get_event_checkin_overview(uuid) from public, anon;
revoke all on function public.configure_event_checkin(uuid, integer) from public, anon;
revoke all on function public.issue_event_checkin_code(uuid) from public, anon;
revoke all on function public.get_event_attendance(uuid) from public, anon;
revoke all on function public.redeem_scan_code(text) from public, anon;
revoke all on function public.get_my_event_attendances(integer) from public, anon;

grant execute on function public.get_event_checkin_overview(uuid) to authenticated;
grant execute on function public.configure_event_checkin(uuid, integer) to authenticated;
grant execute on function public.issue_event_checkin_code(uuid) to authenticated;
grant execute on function public.get_event_attendance(uuid) to authenticated;
grant execute on function public.redeem_scan_code(text) to authenticated;
grant execute on function public.get_my_event_attendances(integer) to authenticated;

notify pgrst, 'reload schema';
