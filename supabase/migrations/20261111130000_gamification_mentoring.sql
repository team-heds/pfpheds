-- Mentorat entre étudiants : créneaux d'entraide en personne, réservation, confirmation
-- de la rencontre et points de gamification.
--
-- Règles :
--   * tout compte actif peut proposer un créneau (date, début, fin, lieu, sujets, étiquettes,
--     note) ; la classe du mentor est affichée ;
--   * un seul étudiant par créneau, jamais son propre créneau ; la réservation est atomique
--     (verrou de ligne + index unique sur la réservation active) ;
--   * annulation d'une réservation ou d'un créneau possible jusqu'au début du créneau ;
--   * après l'heure de fin, le mentor et l'étudiant confirment chacun la rencontre ; quand les
--     deux ont confirmé, chacun reçoit 30 XP (comptés aussi pour sa maison), au plus
--     2 rencontres récompensées par personne et par semaine (semaine de la rencontre,
--     heure de Zurich) ; les points sont réservés aux joueurs
--     (gamification_private.is_rollout_member) et suivent l'interrupteur général des récompenses ;
--   * vie privée : le message et le détail d'une réservation ne sont lisibles que par le mentor
--     et l'étudiant concerné ; les autres voient seulement que le créneau est pris ;
--   * les administrateurs peuvent retirer un créneau inapproprié ;
--   * l'autre personne est prévenue par le système de notifications existant (push_outbox).
--
-- Le navigateur n'écrit jamais dans ces tables : toutes les écritures passent par les
-- fonctions ci-dessous, qui décident seules de l'identité, des horaires et des points.
-- Aucune fonction existante n'est redéfinie.

create table if not exists public.mentoring_slots (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references auth.users(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text not null,
  topics text not null,
  tags text[] not null default '{}'::text[],
  note text,
  status text not null default 'open',
  cancelled_at timestamptz,
  removed_by uuid references auth.users(id) on delete set null,
  removed_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mentoring_slots_status_check
    check (status in ('open', 'booked', 'cancelled', 'removed')),
  constraint mentoring_slots_period_check
    check (ends_at >= starts_at + interval '15 minutes' and ends_at <= starts_at + interval '4 hours'),
  constraint mentoring_slots_location_check check (char_length(location) between 2 and 160),
  constraint mentoring_slots_topics_check check (char_length(topics) between 3 and 500),
  constraint mentoring_slots_note_check check (note is null or char_length(note) <= 500),
  constraint mentoring_slots_tags_check check (coalesce(array_length(tags, 1), 0) <= 6)
);

comment on table public.mentoring_slots is
  'Mentorat : créneaux d''entraide proposés par des étudiants. Écritures par fonctions uniquement.';

create index if not exists idx_mentoring_slots_upcoming
  on public.mentoring_slots (starts_at)
  where status in ('open', 'booked');
create index if not exists idx_mentoring_slots_mentor
  on public.mentoring_slots (mentor_id, starts_at);

create table if not exists public.mentoring_bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.mentoring_slots(id) on delete cascade,
  mentor_id uuid not null references auth.users(id) on delete cascade,
  mentee_id uuid not null references auth.users(id) on delete cascade,
  message text,
  status text not null default 'active',
  cancelled_at timestamptz,
  cancelled_by uuid references auth.users(id) on delete set null,
  mentor_confirmed_at timestamptz,
  mentee_confirmed_at timestamptz,
  completed_at timestamptz,
  mentor_xp integer,
  mentee_xp integer,
  mentor_reward_reason text,
  mentee_reward_reason text,
  created_at timestamptz not null default now(),
  constraint mentoring_bookings_status_check check (status in ('active', 'cancelled')),
  constraint mentoring_bookings_not_self_check check (mentor_id <> mentee_id),
  constraint mentoring_bookings_message_check check (message is null or char_length(message) <= 500)
);

comment on table public.mentoring_bookings is
  'Mentorat : réservations (privées : mentor et étudiant concerné seulement).';

-- Un seul étudiant par créneau : garde-fou contre toute double réservation.
create unique index if not exists mentoring_bookings_one_active_per_slot
  on public.mentoring_bookings (slot_id)
  where status = 'active';
create index if not exists idx_mentoring_bookings_mentee
  on public.mentoring_bookings (mentee_id, created_at desc);
create index if not exists idx_mentoring_bookings_mentor
  on public.mentoring_bookings (mentor_id, created_at desc);

alter table public.mentoring_slots enable row level security;
alter table public.mentoring_bookings enable row level security;

revoke all on table public.mentoring_slots from public, anon, authenticated;
revoke all on table public.mentoring_bookings from public, anon, authenticated;
grant select on table public.mentoring_slots to authenticated;
grant select on table public.mentoring_bookings to authenticated;

do $policies$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'mentoring_slots' and policyname = 'mentoring_slots_select_visible') then
    create policy mentoring_slots_select_visible
      on public.mentoring_slots
      for select
      to authenticated
      using (status in ('open', 'booked') or mentor_id = (select auth.uid()));
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'mentoring_bookings' and policyname = 'mentoring_bookings_select_participants') then
    create policy mentoring_bookings_select_participants
      on public.mentoring_bookings
      for select
      to authenticated
      using (mentee_id = (select auth.uid()) or mentor_id = (select auth.uid()));
  end if;
end
$policies$;

-- ---------------------------------------------------------------------------
-- Aides internes (non exposées)
-- ---------------------------------------------------------------------------

create or replace function gamification_private.mentoring_require_user()
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
    raise exception 'mentoring_auth_required';
  end if;
  if not exists (
    select 1 from public.user_profiles up
    where up.user_id = v_user_id and coalesce(up.is_active, true)
  ) then
    raise exception 'mentoring_profile_required';
  end if;
  return v_user_id;
end;
$$;

create or replace function gamification_private.mentoring_display_name(p_user_id uuid)
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
    'Un étudiant'
  )::text;
$$;

-- Notification dans la plateforme : file existante des notifications push (push_outbox).
create or replace function gamification_private.mentoring_notify(
  p_user_id uuid,
  p_title text,
  p_body text
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.push_outbox (user_id, title, body, url)
  select p_user_id, left(p_title, 120), left(p_body, 400), '/mentorat?onglet=mes-creneaux'
  where p_user_id is not null;
$$;

create or replace function gamification_private.mentoring_slot_label(p_starts_at timestamptz)
returns text
language sql
stable
set search_path = ''
as $$
  select pg_catalog.to_char(p_starts_at at time zone 'Europe/Zurich', 'DD.MM.YYYY "à" HH24:MI');
$$;

-- Attribue (ou non) les 30 XP d'une rencontre confirmée à une personne.
-- Appelée une seule fois par personne et par réservation, sous verrou.
create or replace function gamification_private.mentoring_award(
  p_user_id uuid,
  p_booking_id uuid,
  p_slot_id uuid,
  p_starts_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_week_start timestamptz :=
    pg_catalog.date_trunc('week', p_starts_at at time zone 'Europe/Zurich') at time zone 'Europe/Zurich';
  v_rewarded integer;
  v_award jsonb;
begin
  if not coalesce((
    select rc.rewards_enabled from gamification_private.rollout_config rc where rc.singleton
  ), false) then
    return jsonb_build_object('xp', 0, 'reason', 'rewards_disabled');
  end if;

  if not gamification_private.is_rollout_member(p_user_id) then
    return jsonb_build_object('xp', 0, 'reason', 'not_player');
  end if;

  select count(*) into v_rewarded
  from public.mentoring_bookings b
  join public.mentoring_slots s on s.id = b.slot_id
  where b.id <> p_booking_id
    and s.starts_at >= v_week_start
    and s.starts_at < v_week_start + interval '7 days'
    and (
      (b.mentor_id = p_user_id and coalesce(b.mentor_xp, 0) > 0)
      or (b.mentee_id = p_user_id and coalesce(b.mentee_xp, 0) > 0)
    );

  if v_rewarded >= 2 then
    return jsonb_build_object('xp', 0, 'reason', 'weekly_cap');
  end if;

  v_award := public.gamification_award_xp_internal(
    p_user_id,
    'MENTORING_SESSION',
    30,
    'mentoring:' || p_booking_id::text,
    'mentoring',
    p_slot_id,
    'Rencontre de mentorat confirmée'
  );

  if coalesce((v_award ->> 'awarded')::boolean, false) then
    return jsonb_build_object(
      'xp', 30,
      'reason', 'awarded',
      'level_up', coalesce((v_award ->> 'level_up')::boolean, false),
      'current_level', v_award -> 'current_level'
    );
  end if;
  return jsonb_build_object('xp', 0, 'reason', 'duplicate');
end;
$$;

revoke all on function gamification_private.mentoring_require_user() from public, anon, authenticated;
revoke all on function gamification_private.mentoring_display_name(uuid) from public, anon, authenticated;
revoke all on function gamification_private.mentoring_notify(uuid, text, text) from public, anon, authenticated;
revoke all on function gamification_private.mentoring_slot_label(timestamptz) from public, anon, authenticated;
revoke all on function gamification_private.mentoring_award(uuid, uuid, uuid, timestamptz) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Proposer un créneau
-- ---------------------------------------------------------------------------

create or replace function public.create_mentoring_slot(
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_location text,
  p_topics text,
  p_tags text[] default '{}'::text[],
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := gamification_private.mentoring_require_user();
  v_location text := btrim(coalesce(p_location, ''));
  v_topics text := btrim(coalesce(p_topics, ''));
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_tags text[];
  v_slot_id uuid;
begin
  if p_starts_at is null or p_ends_at is null then
    raise exception 'mentoring_invalid_period';
  end if;
  if p_starts_at <= now() then
    raise exception 'mentoring_slot_in_past';
  end if;
  if p_starts_at > now() + interval '180 days' then
    raise exception 'mentoring_slot_too_far';
  end if;
  if p_ends_at < p_starts_at + interval '15 minutes'
     or p_ends_at > p_starts_at + interval '4 hours' then
    raise exception 'mentoring_invalid_duration';
  end if;
  if char_length(v_location) not between 2 and 160 then
    raise exception 'mentoring_invalid_location';
  end if;
  if char_length(v_topics) not between 3 and 500 then
    raise exception 'mentoring_invalid_topics';
  end if;
  if v_note is not null and char_length(v_note) > 500 then
    raise exception 'mentoring_invalid_note';
  end if;

  select coalesce(array_agg(t.tag order by t.first_position), '{}'::text[])
  into v_tags
  from (
    select lower(btrim(raw.tag)) as tag, min(raw.position) as first_position
    from unnest(coalesce(p_tags, '{}'::text[])) with ordinality as raw(tag, position)
    where btrim(coalesce(raw.tag, '')) <> ''
    group by lower(btrim(raw.tag))
  ) t;

  if coalesce(array_length(v_tags, 1), 0) > 6
     or exists (select 1 from unnest(v_tags) as x(tag) where char_length(x.tag) > 30) then
    raise exception 'mentoring_invalid_tags';
  end if;

  -- Une création à la fois par mentor : les contrôles ci-dessous restent exacts.
  perform pg_advisory_xact_lock(hashtextextended('mentoring:mentor:' || v_user_id::text, 0));

  if (
    select count(*) from public.mentoring_slots s
    where s.mentor_id = v_user_id and s.status in ('open', 'booked') and s.ends_at > now()
  ) >= 20 then
    raise exception 'mentoring_too_many_slots';
  end if;

  if exists (
    select 1 from public.mentoring_slots s
    where s.mentor_id = v_user_id
      and s.status in ('open', 'booked')
      and s.starts_at < p_ends_at
      and s.ends_at > p_starts_at
  ) then
    raise exception 'mentoring_slot_overlap';
  end if;

  insert into public.mentoring_slots (mentor_id, starts_at, ends_at, location, topics, tags, note)
  values (v_user_id, p_starts_at, p_ends_at, v_location, v_topics, v_tags, v_note)
  returning id into v_slot_id;

  return v_slot_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Réserver un créneau (atomique)
-- ---------------------------------------------------------------------------

create or replace function public.book_mentoring_slot(
  p_slot_id uuid,
  p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := gamification_private.mentoring_require_user();
  v_slot public.mentoring_slots%rowtype;
  v_message text := nullif(btrim(coalesce(p_message, '')), '');
  v_booking_id uuid;
begin
  if v_message is not null and char_length(v_message) > 500 then
    raise exception 'mentoring_invalid_message';
  end if;

  -- Verrou de ligne : deux réservations simultanées passent l'une après l'autre.
  select * into v_slot
  from public.mentoring_slots s
  where s.id = p_slot_id
  for update;

  if not found or v_slot.status in ('cancelled', 'removed') then
    raise exception 'mentoring_slot_not_found';
  end if;
  if v_slot.mentor_id = v_user_id then
    raise exception 'mentoring_own_slot';
  end if;
  if v_slot.starts_at <= now() then
    raise exception 'mentoring_slot_started';
  end if;
  if v_slot.status <> 'open' then
    raise exception 'mentoring_slot_taken';
  end if;

  begin
    insert into public.mentoring_bookings (slot_id, mentor_id, mentee_id, message)
    values (v_slot.id, v_slot.mentor_id, v_user_id, v_message)
    returning id into v_booking_id;
  exception when unique_violation then
    raise exception 'mentoring_slot_taken';
  end;

  update public.mentoring_slots
  set status = 'booked', updated_at = now()
  where id = v_slot.id;

  perform gamification_private.mentoring_notify(
    v_slot.mentor_id,
    'Mentorat : créneau réservé',
    gamification_private.mentoring_display_name(v_user_id)
      || ' a réservé votre créneau du '
      || gamification_private.mentoring_slot_label(v_slot.starts_at) || '.'
  );

  return v_booking_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Annuler sa réservation (étudiant) : le créneau redevient libre
-- ---------------------------------------------------------------------------

create or replace function public.cancel_mentoring_booking(p_slot_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := gamification_private.mentoring_require_user();
  v_slot public.mentoring_slots%rowtype;
  v_booking_id uuid;
begin
  select * into v_slot
  from public.mentoring_slots s
  where s.id = p_slot_id
  for update;

  if not found then
    raise exception 'mentoring_slot_not_found';
  end if;

  select b.id into v_booking_id
  from public.mentoring_bookings b
  where b.slot_id = p_slot_id and b.status = 'active' and b.mentee_id = v_user_id;

  if v_booking_id is null then
    raise exception 'mentoring_booking_not_found';
  end if;
  if v_slot.starts_at <= now() then
    raise exception 'mentoring_slot_started';
  end if;

  update public.mentoring_bookings
  set status = 'cancelled', cancelled_at = now(), cancelled_by = v_user_id
  where id = v_booking_id;

  update public.mentoring_slots
  set status = 'open', updated_at = now()
  where id = p_slot_id and status = 'booked';

  perform gamification_private.mentoring_notify(
    v_slot.mentor_id,
    'Mentorat : réservation annulée',
    gamification_private.mentoring_display_name(v_user_id)
      || ' a annulé sa réservation du '
      || gamification_private.mentoring_slot_label(v_slot.starts_at)
      || '. Votre créneau est de nouveau libre.'
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Annuler son créneau (mentor)
-- ---------------------------------------------------------------------------

create or replace function public.cancel_mentoring_slot(p_slot_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := gamification_private.mentoring_require_user();
  v_slot public.mentoring_slots%rowtype;
  v_mentee_id uuid;
begin
  select * into v_slot
  from public.mentoring_slots s
  where s.id = p_slot_id and s.mentor_id = v_user_id
  for update;

  if not found or v_slot.status in ('cancelled', 'removed') then
    raise exception 'mentoring_slot_not_found';
  end if;
  if v_slot.starts_at <= now() then
    raise exception 'mentoring_slot_started';
  end if;

  update public.mentoring_bookings
  set status = 'cancelled', cancelled_at = now(), cancelled_by = v_user_id
  where slot_id = p_slot_id and status = 'active'
  returning mentee_id into v_mentee_id;

  update public.mentoring_slots
  set status = 'cancelled', cancelled_at = now(), updated_at = now()
  where id = p_slot_id;

  perform gamification_private.mentoring_notify(
    v_mentee_id,
    'Mentorat : créneau annulé',
    gamification_private.mentoring_display_name(v_user_id)
      || ' a annulé le créneau du '
      || gamification_private.mentoring_slot_label(v_slot.starts_at) || '.'
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Confirmer que la rencontre a eu lieu ; points quand les deux ont confirmé
-- ---------------------------------------------------------------------------

create or replace function public.confirm_mentoring_session(p_slot_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := gamification_private.mentoring_require_user();
  v_slot public.mentoring_slots%rowtype;
  v_booking public.mentoring_bookings%rowtype;
  v_is_mentor boolean;
  v_mentor_award jsonb;
  v_mentee_award jsonb;
  v_my_award jsonb;
  v_other_id uuid;
  v_other_xp integer;
begin
  select * into v_slot
  from public.mentoring_slots s
  where s.id = p_slot_id
  for update;

  if not found or v_slot.status <> 'booked' then
    raise exception 'mentoring_booking_not_found';
  end if;

  select * into v_booking
  from public.mentoring_bookings b
  where b.slot_id = p_slot_id
    and b.status = 'active'
    and (b.mentor_id = v_user_id or b.mentee_id = v_user_id)
  for update;

  if not found then
    raise exception 'mentoring_booking_not_found';
  end if;
  if v_slot.ends_at > now() then
    raise exception 'mentoring_session_not_finished';
  end if;
  if v_slot.ends_at < now() - interval '14 days' then
    raise exception 'mentoring_confirmation_closed';
  end if;

  v_is_mentor := v_booking.mentor_id = v_user_id;
  v_other_id := case when v_is_mentor then v_booking.mentee_id else v_booking.mentor_id end;

  if v_booking.completed_at is not null then
    return jsonb_build_object(
      'status', 'completed',
      'already_confirmed', true,
      'xp_gained', coalesce(case when v_is_mentor then v_booking.mentor_xp else v_booking.mentee_xp end, 0),
      'reason', case when v_is_mentor then v_booking.mentor_reward_reason else v_booking.mentee_reward_reason end
    );
  end if;

  if v_is_mentor then
    if v_booking.mentor_confirmed_at is null then
      update public.mentoring_bookings set mentor_confirmed_at = now() where id = v_booking.id;
      v_booking.mentor_confirmed_at := now();
    end if;
  elsif v_booking.mentee_confirmed_at is null then
    update public.mentoring_bookings set mentee_confirmed_at = now() where id = v_booking.id;
    v_booking.mentee_confirmed_at := now();
  end if;

  -- Une seule confirmation : aucun point, on attend l'autre personne.
  if v_booking.mentor_confirmed_at is null or v_booking.mentee_confirmed_at is null then
    return jsonb_build_object('status', 'waiting_other', 'xp_gained', 0);
  end if;

  -- Les deux ont confirmé : plafond hebdomadaire calculé sous verrou par personne
  -- (toujours pris dans le même ordre pour éviter tout interblocage).
  perform pg_advisory_xact_lock(hashtextextended('mentoring:reward:' || least(v_booking.mentor_id, v_booking.mentee_id)::text, 0));
  perform pg_advisory_xact_lock(hashtextextended('mentoring:reward:' || greatest(v_booking.mentor_id, v_booking.mentee_id)::text, 0));

  v_mentor_award := gamification_private.mentoring_award(
    v_booking.mentor_id, v_booking.id, v_slot.id, v_slot.starts_at
  );
  v_mentee_award := gamification_private.mentoring_award(
    v_booking.mentee_id, v_booking.id, v_slot.id, v_slot.starts_at
  );

  update public.mentoring_bookings
  set completed_at = now(),
      mentor_xp = (v_mentor_award ->> 'xp')::integer,
      mentee_xp = (v_mentee_award ->> 'xp')::integer,
      mentor_reward_reason = v_mentor_award ->> 'reason',
      mentee_reward_reason = v_mentee_award ->> 'reason'
  where id = v_booking.id;

  v_my_award := case when v_is_mentor then v_mentor_award else v_mentee_award end;
  v_other_xp := case when v_is_mentor then (v_mentee_award ->> 'xp')::integer else (v_mentor_award ->> 'xp')::integer end;

  perform gamification_private.mentoring_notify(
    v_other_id,
    'Mentorat : rencontre confirmée',
    gamification_private.mentoring_display_name(v_user_id)
      || ' a confirmé la rencontre du '
      || gamification_private.mentoring_slot_label(v_slot.starts_at) || '.'
      || case when v_other_xp > 0 then ' Vous gagnez ' || v_other_xp::text || ' XP.' else '' end
  );

  return jsonb_build_object(
    'status', 'completed',
    'already_confirmed', false,
    'xp_gained', (v_my_award ->> 'xp')::integer,
    'reason', v_my_award ->> 'reason',
    'level_up', coalesce((v_my_award ->> 'level_up')::boolean, false),
    'current_level', v_my_award -> 'current_level'
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Administration : retirer un créneau inapproprié
-- ---------------------------------------------------------------------------

create or replace function public.admin_remove_mentoring_slot(
  p_slot_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_slot public.mentoring_slots%rowtype;
  v_mentee_id uuid;
begin
  if v_actor is null or not (select public.app_is_privileged()) then
    raise exception 'mentoring_admin_required';
  end if;

  select * into v_slot
  from public.mentoring_slots s
  where s.id = p_slot_id
  for update;

  if not found or v_slot.status = 'removed' then
    raise exception 'mentoring_slot_not_found';
  end if;

  update public.mentoring_bookings
  set status = 'cancelled', cancelled_at = now(), cancelled_by = v_actor
  where slot_id = p_slot_id and status = 'active' and completed_at is null
  returning mentee_id into v_mentee_id;

  update public.mentoring_slots
  set status = 'removed',
      removed_by = v_actor,
      removed_reason = nullif(left(btrim(coalesce(p_reason, '')), 300), ''),
      updated_at = now()
  where id = p_slot_id;

  perform gamification_private.mentoring_notify(
    v_slot.mentor_id,
    'Mentorat : créneau retiré',
    'Votre créneau du ' || gamification_private.mentoring_slot_label(v_slot.starts_at)
      || ' a été retiré par l''administration.'
  );
  perform gamification_private.mentoring_notify(
    v_mentee_id,
    'Mentorat : créneau retiré',
    'Le créneau du ' || gamification_private.mentoring_slot_label(v_slot.starts_at)
      || ' que vous aviez réservé a été retiré par l''administration.'
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Lecture : créneaux à venir (sans aucun détail de réservation)
-- ---------------------------------------------------------------------------

create or replace function public.get_mentoring_slots()
returns table (
  slot_id uuid,
  starts_at timestamptz,
  ends_at timestamptz,
  location text,
  topics text,
  tags text[],
  note text,
  is_booked boolean,
  is_mine boolean,
  booked_by_me boolean,
  mentor_id uuid,
  mentor_name text,
  mentor_classe text,
  mentor_avatar_url text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.id,
    s.starts_at,
    s.ends_at,
    s.location,
    s.topics,
    s.tags,
    s.note,
    s.status = 'booked',
    s.mentor_id = (select auth.uid()),
    exists (
      select 1 from public.mentoring_bookings b
      where b.slot_id = s.id and b.status = 'active' and b.mentee_id = (select auth.uid())
    ),
    s.mentor_id,
    gamification_private.mentoring_display_name(s.mentor_id),
    nullif(btrim(up.classe), ''),
    up.avatar_url
  from public.mentoring_slots s
  left join public.user_profiles up on up.user_id = s.mentor_id
  where (select auth.uid()) is not null
    and s.status in ('open', 'booked')
    and s.starts_at > now()
  order by s.starts_at, s.id
  limit 500;
$$;

-- ---------------------------------------------------------------------------
-- Lecture : mes créneaux (proposés et réservés), avec le détail privé
-- ---------------------------------------------------------------------------

create or replace function public.get_my_mentoring_slots()
returns table (
  slot_id uuid,
  my_role text,
  starts_at timestamptz,
  ends_at timestamptz,
  location text,
  topics text,
  tags text[],
  note text,
  slot_status text,
  booking_id uuid,
  booking_status text,
  booking_message text,
  booked_at timestamptz,
  other_user_id uuid,
  other_name text,
  other_classe text,
  other_avatar_url text,
  my_confirmed_at timestamptz,
  other_confirmed boolean,
  completed_at timestamptz,
  my_xp integer,
  my_reward_reason text
)
language sql
stable
security definer
set search_path = ''
as $$
  -- Créneaux que je propose, avec la réservation active s'il y en a une.
  select
    s.id,
    'mentor'::text,
    s.starts_at,
    s.ends_at,
    s.location,
    s.topics,
    s.tags,
    s.note,
    s.status,
    b.id,
    b.status,
    b.message,
    b.created_at,
    b.mentee_id,
    case when b.id is not null then gamification_private.mentoring_display_name(b.mentee_id) end,
    nullif(btrim(up.classe), ''),
    up.avatar_url,
    b.mentor_confirmed_at,
    b.mentee_confirmed_at is not null,
    b.completed_at,
    b.mentor_xp,
    b.mentor_reward_reason
  from public.mentoring_slots s
  left join public.mentoring_bookings b on b.slot_id = s.id and b.status = 'active'
  left join public.user_profiles up on up.user_id = b.mentee_id
  where s.mentor_id = (select auth.uid())
    and s.ends_at > now() - interval '60 days'

  union all

  -- Créneaux que j'ai réservés (y compris mes réservations annulées récentes).
  select
    s.id,
    'mentee'::text,
    s.starts_at,
    s.ends_at,
    s.location,
    s.topics,
    s.tags,
    s.note,
    s.status,
    b.id,
    b.status,
    b.message,
    b.created_at,
    s.mentor_id,
    gamification_private.mentoring_display_name(s.mentor_id),
    nullif(btrim(up.classe), ''),
    up.avatar_url,
    b.mentee_confirmed_at,
    b.mentor_confirmed_at is not null,
    b.completed_at,
    b.mentee_xp,
    b.mentee_reward_reason
  from public.mentoring_bookings b
  join public.mentoring_slots s on s.id = b.slot_id
  left join public.user_profiles up on up.user_id = s.mentor_id
  where b.mentee_id = (select auth.uid())
    and s.status <> 'removed'
    and s.ends_at > now() - interval '60 days'
    and (b.status = 'active' or s.ends_at > now())

  order by 3, 1;
$$;

revoke all on function public.create_mentoring_slot(timestamptz, timestamptz, text, text, text[], text) from public, anon;
revoke all on function public.book_mentoring_slot(uuid, text) from public, anon;
revoke all on function public.cancel_mentoring_booking(uuid) from public, anon;
revoke all on function public.cancel_mentoring_slot(uuid) from public, anon;
revoke all on function public.confirm_mentoring_session(uuid) from public, anon;
revoke all on function public.admin_remove_mentoring_slot(uuid, text) from public, anon;
revoke all on function public.get_mentoring_slots() from public, anon;
revoke all on function public.get_my_mentoring_slots() from public, anon;

grant execute on function public.create_mentoring_slot(timestamptz, timestamptz, text, text, text[], text) to authenticated;
grant execute on function public.book_mentoring_slot(uuid, text) to authenticated;
grant execute on function public.cancel_mentoring_booking(uuid) to authenticated;
grant execute on function public.cancel_mentoring_slot(uuid) to authenticated;
grant execute on function public.confirm_mentoring_session(uuid) to authenticated;
grant execute on function public.admin_remove_mentoring_slot(uuid, text) to authenticated;
grant execute on function public.get_mentoring_slots() to authenticated;
grant execute on function public.get_my_mentoring_slots() to authenticated;

notify pgrst, 'reload schema';
