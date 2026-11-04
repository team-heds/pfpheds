-- HEDS25-617: reproducible gamification pilot, hard-locked to the staging DB.
-- The participant accounts are created separately through the staging Auth API;
-- this migration never stores or generates a password.

create schema if not exists gamification_private;
revoke all on schema gamification_private from public, anon, authenticated;

create table if not exists gamification_private.pilot_runs (
  id uuid primary key default gen_random_uuid(),
  batch_key text not null unique,
  rule_version text not null,
  status text not null check (status in ('installing', 'installed', 'resetting', 'reset')),
  admin_user_id uuid not null references auth.users(id) on delete restrict,
  student_user_id uuid not null references auth.users(id) on delete restrict,
  starts_on date not null,
  ends_on date not null,
  requested_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  installed_at timestamptz,
  reset_at timestamptz,
  summary jsonb not null default '{}'::jsonb,
  constraint gamification_pilot_batch_key_check
    check (batch_key ~ '^[a-z0-9][a-z0-9._:-]{2,127}$'),
  constraint gamification_pilot_rule_version_check
    check (rule_version ~ '^[a-z0-9][a-z0-9._:-]{2,127}$'),
  constraint gamification_pilot_distinct_users_check
    check (admin_user_id <> student_user_id),
  constraint gamification_pilot_dates_check
    check (ends_on >= starts_on)
);

alter table gamification_private.pilot_runs enable row level security;
revoke all on gamification_private.pilot_runs from public, anon, authenticated;

create table if not exists gamification_private.pilot_audit (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references gamification_private.pilot_runs(id) on delete restrict,
  action text not null check (action in ('install', 'reset')),
  actor_id uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  summary jsonb not null,
  constraint gamification_pilot_audit_summary_check
    check (coalesce((summary ->> 'contains_personal_data')::boolean, true) = false)
);

alter table gamification_private.pilot_audit enable row level security;
revoke all on gamification_private.pilot_audit from public, anon, authenticated;

create or replace function gamification_private.pilot_asset_uuid(
  p_batch_key text,
  p_asset_kind text
)
returns uuid
language sql
immutable
set search_path = pg_catalog
as $$
  select (
    substr(md5(p_batch_key || ':' || p_asset_kind), 1, 8) || '-' ||
    substr(md5(p_batch_key || ':' || p_asset_kind), 9, 4) || '-4' ||
    substr(md5(p_batch_key || ':' || p_asset_kind), 14, 3) || '-8' ||
    substr(md5(p_batch_key || ':' || p_asset_kind), 18, 3) || '-' ||
    substr(md5(p_batch_key || ':' || p_asset_kind), 21, 12)
  )::uuid;
$$;

revoke all on function gamification_private.pilot_asset_uuid(text, text)
  from public, anon, authenticated;

create or replace function gamification_private.assert_staging_pilot_context(
  p_admin_user_id uuid,
  p_student_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_admin_email text;
  v_student_email text;
  v_admin_role text;
  v_student_role text;
begin
  if current_database() <> 'staging' then
    raise exception 'Gamification pilots are restricted to the staging database';
  end if;

  if (select auth.uid()) is null or not (select public.app_is_privileged()) then
    raise exception 'Insufficient privileges';
  end if;

  select lower(au.email), lower(coalesce(up.role, ''))
  into v_admin_email, v_admin_role
  from auth.users au
  join public.user_profiles up on up.user_id = au.id
  where au.id = p_admin_user_id;

  select lower(au.email), lower(coalesce(up.role, ''))
  into v_student_email, v_student_role
  from auth.users au
  join public.user_profiles up on up.user_id = au.id
  where au.id = p_student_user_id;

  if p_admin_user_id = p_student_user_id
     or v_admin_email is null
     or v_student_email is null
     or v_admin_email !~ '^[a-z0-9._%+-]+@example\.invalid$'
     or v_student_email !~ '^[a-z0-9._%+-]+@example\.invalid$'
     or v_admin_role not in ('admin', 'super.all', 'adminphysio', 'adminsoins')
     or v_student_role not in ('student', 'etudiant', 'étudiant') then
    raise exception 'Pilot participants must be distinct synthetic admin/student accounts';
  end if;
end;
$$;

revoke all on function gamification_private.assert_staging_pilot_context(uuid, uuid)
  from public, anon, authenticated;

create or replace function gamification_private.pilot_summary(p_run_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public, gamification_private
as $$
  select jsonb_build_object(
    'batch_key', pr.batch_key,
    'rule_version', pr.rule_version,
    'status', pr.status,
    'contains_personal_data', false,
    'gamification_profiles', (
      select count(*) from public.gamification_data gd
      where gd.user_id = pr.student_user_id
    ),
    'xp_events', (
      select count(*) from public.xp_history xh
      where xh.user_id = pr.student_user_id
    ),
    'badges', (
      select count(*) from public.user_badges ub
      where ub.user_id = pr.student_user_id
    ),
    'challenge_progress', (
      select count(*) from public.user_challenge_progress ucp
      where ucp.user_id = pr.student_user_id
    ),
    'quest_progress', (
      select count(*) from public.user_quest_progress uqp
      where uqp.user_id = pr.student_user_id
    ),
    'posts', (
      select count(*) from public.posts p
      where p.user_id = pr.student_user_id
    ),
    'pilot_quests', (
      select count(*) from public.quests q
      where q.id = gamification_private.pilot_asset_uuid(pr.batch_key, 'quest')
    ),
    'pilot_challenges', (
      select count(*) from public.challenges c
      where c.id in (
        gamification_private.pilot_asset_uuid(pr.batch_key, 'challenge-login'),
        gamification_private.pilot_asset_uuid(pr.batch_key, 'challenge-profile'),
        gamification_private.pilot_asset_uuid(pr.batch_key, 'challenge-post')
      )
    ),
    'pilot_badges', (
      select count(*) from public.badges b
      where b.id = gamification_private.pilot_asset_uuid(pr.batch_key, 'badge-post')
    )
  )
  from gamification_private.pilot_runs pr
  where pr.id = p_run_id;
$$;

revoke all on function gamification_private.pilot_summary(uuid)
  from public, anon, authenticated;

create or replace function public.preview_gamification_pilot(
  p_batch_key text,
  p_admin_user_id uuid,
  p_student_user_id uuid,
  p_starts_on date,
  p_ends_on date
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, gamification_private
as $$
declare
  v_run gamification_private.pilot_runs;
  v_existing_student_rows integer;
begin
  p_batch_key := lower(btrim(coalesce(p_batch_key, '')));
  if p_batch_key !~ '^[a-z0-9][a-z0-9._:-]{2,127}$'
     or p_starts_on is null
     or p_ends_on is null
     or p_ends_on < p_starts_on then
    raise exception 'Invalid pilot parameters';
  end if;

  perform gamification_private.assert_staging_pilot_context(
    p_admin_user_id,
    p_student_user_id
  );

  select * into v_run
  from gamification_private.pilot_runs pr
  where pr.batch_key = p_batch_key;

  select
    (select count(*) from public.gamification_data where user_id = p_student_user_id)
    + (select count(*) from public.xp_history where user_id = p_student_user_id)
    + (select count(*) from public.user_badges where user_id = p_student_user_id)
    + (select count(*) from public.user_challenge_progress where user_id = p_student_user_id)
    + (select count(*) from public.user_quest_progress where user_id = p_student_user_id)
    + (select count(*) from public.posts where user_id = p_student_user_id)
  into v_existing_student_rows;

  return jsonb_build_object(
    'batch_key', p_batch_key,
    'rule_version', 'gamification-pilot-v1',
    'write_performed', false,
    'contains_personal_data', false,
    'existing_run', v_run.id is not null,
    'current_status', v_run.status,
    'existing_student_rows', v_existing_student_rows,
    'install_allowed', v_run.id is not null or v_existing_student_rows = 0,
    'planned_quests', 1,
    'planned_challenges', 3,
    'planned_badges', 1,
    'scenario_login', 'ready',
    'scenario_profile', 'ready',
    'scenario_post', 'ready',
    'scenario_challenge', 'ready',
    'scenario_badge', 'ready',
    'scenario_replay', 'ready',
    'scenario_quest_completion', 'pending_dependency',
    'scenario_expiration', 'pending_dependency',
    'scenario_cap', 'pending_dependency'
  );
end;
$$;

revoke all on function public.preview_gamification_pilot(text, uuid, uuid, date, date)
  from public, anon;
grant execute on function public.preview_gamification_pilot(text, uuid, uuid, date, date)
  to authenticated;

create or replace function public.install_gamification_pilot(
  p_batch_key text,
  p_admin_user_id uuid,
  p_student_user_id uuid,
  p_starts_on date,
  p_ends_on date
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, gamification_private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_run gamification_private.pilot_runs;
  v_preview jsonb;
  v_summary jsonb;
  v_house_id uuid;
  v_student_email text;
  v_quest_id uuid;
  v_login_challenge_id uuid;
  v_profile_challenge_id uuid;
  v_post_challenge_id uuid;
  v_badge_id uuid;
begin
  p_batch_key := lower(btrim(coalesce(p_batch_key, '')));
  perform pg_advisory_xact_lock(hashtext('gamification-pilot:' || p_batch_key));

  v_preview := public.preview_gamification_pilot(
    p_batch_key,
    p_admin_user_id,
    p_student_user_id,
    p_starts_on,
    p_ends_on
  );

  select * into v_run
  from gamification_private.pilot_runs pr
  where pr.batch_key = p_batch_key
  for update;

  if v_run.id is not null and v_run.status = 'installed' then
    return gamification_private.pilot_summary(v_run.id) || jsonb_build_object(
      'duplicate', true,
      'write_performed', false
    );
  end if;

  if v_run.id is null and coalesce((v_preview ->> 'existing_student_rows')::integer, 0) <> 0 then
    raise exception 'Pilot student account is not empty';
  end if;

  if v_run.id is null then
    insert into gamification_private.pilot_runs (
      batch_key,
      rule_version,
      status,
      admin_user_id,
      student_user_id,
      starts_on,
      ends_on,
      requested_by
    )
    values (
      p_batch_key,
      'gamification-pilot-v1',
      'installing',
      p_admin_user_id,
      p_student_user_id,
      p_starts_on,
      p_ends_on,
      v_actor
    )
    returning * into v_run;
  else
    if v_run.admin_user_id <> p_admin_user_id
       or v_run.student_user_id <> p_student_user_id
       or v_run.starts_on <> p_starts_on
       or v_run.ends_on <> p_ends_on then
      raise exception 'Pilot batch parameters do not match the registered run';
    end if;

    update gamification_private.pilot_runs
    set status = 'installing',
        requested_by = v_actor,
        reset_at = null
    where id = v_run.id
    returning * into v_run;
  end if;

  select h.id into v_house_id
  from public.houses h
  where lower(h.name) <> 'gamemaster'
  order by h.name
  limit 1;

  if v_house_id is null then
    raise exception 'No pilot house is available';
  end if;

  select email into v_student_email
  from auth.users
  where id = p_student_user_id;

  v_quest_id := gamification_private.pilot_asset_uuid(p_batch_key, 'quest');
  v_login_challenge_id := gamification_private.pilot_asset_uuid(p_batch_key, 'challenge-login');
  v_profile_challenge_id := gamification_private.pilot_asset_uuid(p_batch_key, 'challenge-profile');
  v_post_challenge_id := gamification_private.pilot_asset_uuid(p_batch_key, 'challenge-post');
  v_badge_id := gamification_private.pilot_asset_uuid(p_batch_key, 'badge-post');

  insert into public.gamification_data (
    user_id,
    email,
    total_xp,
    current_level,
    house_id,
    house_points,
    gamification_metadata
  )
  values (
    p_student_user_id,
    v_student_email,
    0,
    1,
    v_house_id,
    0,
    jsonb_build_object('pilot_batch', p_batch_key)
  )
  on conflict (user_id) do update
    set email = excluded.email,
        total_xp = 0,
        current_level = 1,
        house_id = excluded.house_id,
        house_points = 0,
        gamification_metadata = excluded.gamification_metadata,
        updated_at = now();

  insert into public.quests (
    id, title, description, type, difficulty, points, xp_reward, status,
    start_date, end_date, icon, duration, is_recurring, min_level, created_by
  )
  values (
    v_quest_id,
    'TEST — Premiers pas dans ma maison',
    'Quête réservée au scénario reproductible HEDS25-617.',
    'progression',
    'EASY',
    0,
    0,
    'active',
    p_starts_on::timestamptz,
    (p_ends_on + 1)::timestamptz - interval '1 second',
    'pi pi-home',
    10,
    false,
    1,
    p_admin_user_id
  )
  on conflict (id) do update set
    title = excluded.title,
    description = excluded.description,
    status = excluded.status,
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    updated_at = now();

  delete from public.quest_steps where quest_id = v_quest_id;
  insert into public.quest_steps (quest_id, step_order, title, description, required)
  values
    (v_quest_id, 1, 'Consulter mon profil', 'Étape en attente du moteur de progression des quêtes.', true),
    (v_quest_id, 2, 'Voir le classement', 'Étape en attente du moteur de progression des quêtes.', true);

  insert into public.user_quest_progress (
    user_id, quest_id, status, progress, current_step, created_at, updated_at
  )
  values (p_student_user_id, v_quest_id, 'not_started', 0, 0, now(), now())
  on conflict (user_id, quest_id) do update set
    status = 'not_started',
    progress = 0,
    current_step = 0,
    started_at = null,
    completed_at = null,
    updated_at = now();

  insert into public.badges (
    id, name, description, icon, rarity, xp_bonus, conditions, is_active
  )
  values (
    v_badge_id,
    'TEST — Première publication',
    'Badge réservé au scénario reproductible HEDS25-617.',
    'pi pi-send',
    'common',
    0,
    jsonb_build_object('action_count', true, 'action_type', 'POST', 'count', 1),
    true
  )
  on conflict (id) do update set
    name = excluded.name,
    description = excluded.description,
    xp_bonus = excluded.xp_bonus,
    conditions = excluded.conditions,
    is_active = excluded.is_active;

  insert into public.challenges (
    id, name, description, target_value, action_type, xp_reward,
    badge_reward, week_number, year, start_date, end_date, is_active
  )
  values
    (
      v_login_challenge_id,
      'TEST — Deux connexions',
      'Scénario pilote de progression quotidienne.',
      2,
      'daily_login',
      0,
      null,
      extract(week from p_starts_on)::integer,
      extract(year from p_starts_on)::integer,
      p_starts_on,
      p_ends_on,
      true
    ),
    (
      v_profile_challenge_id,
      'TEST — Profil à jour',
      'Scénario pilote de mise à jour du profil.',
      1,
      'update_profile',
      0,
      null,
      extract(week from p_starts_on)::integer,
      extract(year from p_starts_on)::integer,
      p_starts_on,
      p_ends_on,
      true
    ),
    (
      v_post_challenge_id,
      'TEST — Publication vérifiée',
      'Scénario pilote de publication et de rejeu.',
      1,
      'create_post',
      15,
      v_badge_id,
      extract(week from p_starts_on)::integer,
      extract(year from p_starts_on)::integer,
      p_starts_on,
      p_ends_on,
      true
    )
  on conflict (id) do update set
    name = excluded.name,
    description = excluded.description,
    target_value = excluded.target_value,
    action_type = excluded.action_type,
    xp_reward = excluded.xp_reward,
    badge_reward = excluded.badge_reward,
    week_number = excluded.week_number,
    year = excluded.year,
    start_date = excluded.start_date,
    end_date = excluded.end_date,
    is_active = excluded.is_active;

  update gamification_private.pilot_runs
  set status = 'installed',
      installed_at = now(),
      summary = '{}'::jsonb
  where id = v_run.id;

  v_summary := gamification_private.pilot_summary(v_run.id) || jsonb_build_object(
    'duplicate', false,
    'write_performed', true,
    'scenario_quest_completion', 'pending_dependency',
    'scenario_expiration', 'pending_dependency',
    'scenario_cap', 'pending_dependency'
  );

  update gamification_private.pilot_runs
  set summary = v_summary
  where id = v_run.id;

  insert into gamification_private.pilot_audit (run_id, action, actor_id, summary)
  values (v_run.id, 'install', v_actor, v_summary);

  update public.houses h
  set total_xp = coalesce((
        select sum(gd.total_xp)::bigint
        from public.gamification_data gd
        where gd.house_id = v_house_id
      ), 0),
      member_count = (
        select count(*)::integer
        from public.gamification_data gd
        where gd.house_id = v_house_id
      ),
      updated_at = now()
  where h.id = v_house_id;
  return v_summary;
end;
$$;

revoke all on function public.install_gamification_pilot(text, uuid, uuid, date, date)
  from public, anon;
grant execute on function public.install_gamification_pilot(text, uuid, uuid, date, date)
  to authenticated;

create or replace function public.reset_gamification_pilot(p_batch_key text)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, gamification_private
as $$
declare
  v_actor uuid := (select auth.uid());
  v_run gamification_private.pilot_runs;
  v_summary jsonb;
  v_house_id uuid;
  v_quest_id uuid;
  v_login_challenge_id uuid;
  v_profile_challenge_id uuid;
  v_post_challenge_id uuid;
  v_badge_id uuid;
  v_deleted_rows integer := 0;
  v_count integer;
begin
  p_batch_key := lower(btrim(coalesce(p_batch_key, '')));
  perform pg_advisory_xact_lock(hashtext('gamification-pilot:' || p_batch_key));

  if current_database() <> 'staging'
     or v_actor is null
     or not (select public.app_is_privileged()) then
    raise exception 'Insufficient privileges';
  end if;

  select * into v_run
  from gamification_private.pilot_runs pr
  where pr.batch_key = p_batch_key
  for update;

  if v_run.id is null then
    raise exception 'Pilot run not found';
  end if;

  perform gamification_private.assert_staging_pilot_context(
    v_run.admin_user_id,
    v_run.student_user_id
  );

  if v_run.status = 'reset' then
    return gamification_private.pilot_summary(v_run.id) || jsonb_build_object(
      'duplicate', true,
      'write_performed', false,
      'deleted_rows', 0
    );
  end if;

  update gamification_private.pilot_runs
  set status = 'resetting'
  where id = v_run.id;

  select house_id into v_house_id
  from public.gamification_data
  where user_id = v_run.student_user_id;

  v_quest_id := gamification_private.pilot_asset_uuid(p_batch_key, 'quest');
  v_login_challenge_id := gamification_private.pilot_asset_uuid(p_batch_key, 'challenge-login');
  v_profile_challenge_id := gamification_private.pilot_asset_uuid(p_batch_key, 'challenge-profile');
  v_post_challenge_id := gamification_private.pilot_asset_uuid(p_batch_key, 'challenge-post');
  v_badge_id := gamification_private.pilot_asset_uuid(p_batch_key, 'badge-post');

  delete from public.user_badges
  where user_id in (v_run.student_user_id, v_run.admin_user_id);
  get diagnostics v_count = row_count;
  v_deleted_rows := v_deleted_rows + v_count;

  delete from public.user_challenge_progress
  where user_id in (v_run.student_user_id, v_run.admin_user_id);
  get diagnostics v_count = row_count;
  v_deleted_rows := v_deleted_rows + v_count;

  delete from public.user_quest_progress
  where user_id in (v_run.student_user_id, v_run.admin_user_id);
  get diagnostics v_count = row_count;
  v_deleted_rows := v_deleted_rows + v_count;

  delete from public.posts
  where user_id in (v_run.student_user_id, v_run.admin_user_id);
  get diagnostics v_count = row_count;
  v_deleted_rows := v_deleted_rows + v_count;

  delete from public.xp_history
  where user_id in (v_run.student_user_id, v_run.admin_user_id);
  get diagnostics v_count = row_count;
  v_deleted_rows := v_deleted_rows + v_count;

  delete from public.gamification_data
  where user_id in (v_run.student_user_id, v_run.admin_user_id);
  get diagnostics v_count = row_count;
  v_deleted_rows := v_deleted_rows + v_count;

  delete from public.challenges
  where id in (v_login_challenge_id, v_profile_challenge_id, v_post_challenge_id);
  get diagnostics v_count = row_count;
  v_deleted_rows := v_deleted_rows + v_count;

  delete from public.quest_steps where quest_id = v_quest_id;
  get diagnostics v_count = row_count;
  v_deleted_rows := v_deleted_rows + v_count;

  delete from public.quests where id = v_quest_id;
  get diagnostics v_count = row_count;
  v_deleted_rows := v_deleted_rows + v_count;

  delete from public.badges where id = v_badge_id;
  get diagnostics v_count = row_count;
  v_deleted_rows := v_deleted_rows + v_count;

  update gamification_private.pilot_runs
  set status = 'reset',
      reset_at = now(),
      summary = '{}'::jsonb
  where id = v_run.id;

  if v_house_id is not null then
    update public.houses h
    set total_xp = coalesce((
          select sum(gd.total_xp)::bigint
          from public.gamification_data gd
          where gd.house_id = v_house_id
        ), 0),
        member_count = (
          select count(*)::integer
          from public.gamification_data gd
          where gd.house_id = v_house_id
        ),
        updated_at = now()
    where h.id = v_house_id;
  end if;

  v_summary := gamification_private.pilot_summary(v_run.id) || jsonb_build_object(
    'duplicate', false,
    'write_performed', true,
    'deleted_rows', v_deleted_rows
  );

  update gamification_private.pilot_runs
  set summary = v_summary
  where id = v_run.id;

  insert into gamification_private.pilot_audit (run_id, action, actor_id, summary)
  values (v_run.id, 'reset', v_actor, v_summary);

  return v_summary;
end;
$$;

revoke all on function public.reset_gamification_pilot(text)
  from public, anon;
grant execute on function public.reset_gamification_pilot(text)
  to authenticated;
