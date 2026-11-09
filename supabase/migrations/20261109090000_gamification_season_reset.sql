-- Saisons de gamification : archiver puis remettre à zéro l'XP, les niveaux et
-- les points des maisons au début d'une année académique.
--
-- Conservé : maisons des étudiants, badges, historique des défis et quêtes.
-- Le journal XP reste cohérent : une écriture « SEASON_RESET » par compte
-- ramène la somme du journal à 0, sans effacer l'historique.
-- Une saison ne peut être ouverte qu'une fois.

create table if not exists gamification_private.season_resets (
  season text primary key check (season ~ '^[0-9]{4}-[0-9]{4}$'),
  reset_at timestamptz not null default now(),
  reset_by uuid not null references auth.users(id) on delete restrict,
  reason text not null check (char_length(btrim(reason)) >= 5),
  summary jsonb not null default '{}'::jsonb
);

create table if not exists gamification_private.season_user_archive (
  season text not null references gamification_private.season_resets(season) on delete restrict,
  user_id uuid not null,
  email text,
  house_id uuid,
  total_xp integer not null,
  current_level integer not null,
  house_points integer not null,
  primary key (season, user_id)
);

create table if not exists gamification_private.season_house_archive (
  season text not null references gamification_private.season_resets(season) on delete restrict,
  house_id uuid not null,
  name text not null,
  total_xp bigint not null,
  member_count integer not null,
  level integer not null,
  primary key (season, house_id)
);

alter table gamification_private.season_resets enable row level security;
alter table gamification_private.season_user_archive enable row level security;
alter table gamification_private.season_house_archive enable row level security;
revoke all on gamification_private.season_resets from public, anon, authenticated;
revoke all on gamification_private.season_user_archive from public, anon, authenticated;
revoke all on gamification_private.season_house_archive from public, anon, authenticated;

create or replace function public.preview_gamification_season_reset(p_season text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or not (select public.app_is_privileged()) then
    raise exception 'Insufficient privileges';
  end if;

  return jsonb_build_object(
    'season', p_season,
    'already_reset', exists (
      select 1 from gamification_private.season_resets sr where sr.season = p_season
    ),
    'accounts', (select count(*) from public.gamification_data),
    'accounts_with_xp', (
      select count(*) from public.gamification_data gd
      where coalesce(gd.total_xp, 0) <> 0 or coalesce(gd.house_points, 0) <> 0
    ),
    'total_xp', (select coalesce(sum(gd.total_xp), 0) from public.gamification_data gd),
    'houses', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'name', h.name, 'total_xp', coalesce(h.total_xp, 0), 'members', coalesce(h.member_count, 0)
      ) order by h.name), '[]'::jsonb)
      from public.houses h
    ),
    'write_performed', false
  );
end;
$$;

revoke all on function public.preview_gamification_season_reset(text) from public, anon;
grant execute on function public.preview_gamification_season_reset(text) to authenticated;

create or replace function public.apply_gamification_season_reset(p_season text, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_accounts integer;
  v_ledger_rows integer;
  v_total_xp bigint;
  v_summary jsonb;
begin
  if v_actor is null or not (select public.app_is_privileged()) then
    raise exception 'Insufficient privileges';
  end if;
  if p_season is null or p_season !~ '^[0-9]{4}-[0-9]{4}$'
     or split_part(p_season, '-', 2)::integer <> split_part(p_season, '-', 1)::integer + 1 then
    raise exception 'Season must look like 2026-2027';
  end if;
  if char_length(btrim(coalesce(p_reason, ''))) < 5 then
    raise exception 'A reset reason is required';
  end if;

  -- Bloque les gains concurrents pendant la remise à zéro.
  lock table public.gamification_data in share row exclusive mode;

  if exists (select 1 from gamification_private.season_resets sr where sr.season = p_season) then
    raise exception 'Season % already started', p_season;
  end if;

  select count(*), coalesce(sum(gd.total_xp), 0)
  into v_accounts, v_total_xp
  from public.gamification_data gd;

  insert into gamification_private.season_resets (season, reset_by, reason)
  values (p_season, v_actor, btrim(p_reason));

  insert into gamification_private.season_user_archive (
    season, user_id, email, house_id, total_xp, current_level, house_points
  )
  select p_season, gd.user_id, gd.email, gd.house_id,
         coalesce(gd.total_xp, 0), coalesce(gd.current_level, 1), coalesce(gd.house_points, 0)
  from public.gamification_data gd;

  insert into gamification_private.season_house_archive (
    season, house_id, name, total_xp, member_count, level
  )
  select p_season, h.id, h.name, coalesce(h.total_xp, 0), coalesce(h.member_count, 0), coalesce(h.level, 1)
  from public.houses h;

  -- Une écriture compensatoire par compte : la somme du journal suit le total remis à 0.
  insert into public.xp_history (
    user_id, amount, action, description, source_type, total_xp_after, event_key
  )
  select gd.user_id,
         -gd.total_xp,
         'SEASON_RESET',
         'Nouvelle saison ' || p_season || ' : remise à zéro',
         'season',
         0,
         'season-reset:' || p_season
  from public.gamification_data gd
  where coalesce(gd.total_xp, 0) <> 0
    and exists (select 1 from public.user_profiles up where up.user_id = gd.user_id)
  on conflict (user_id, event_key) where event_key is not null do nothing;
  get diagnostics v_ledger_rows = row_count;

  update public.gamification_data
  set total_xp = 0,
      current_level = 1,
      house_points = 0,
      updated_at = now()
  where coalesce(total_xp, 0) <> 0
     or coalesce(current_level, 1) <> 1
     or coalesce(house_points, 0) <> 0;

  -- Le déclencheur update_house_stats recalcule total_xp et member_count ; le niveau suit.
  update public.houses h
  set total_xp = coalesce((select sum(gd.total_xp) from public.gamification_data gd where gd.house_id = h.id), 0),
      member_count = (select count(*) from public.gamification_data gd where gd.house_id = h.id),
      level = public.calculate_house_level(0::bigint),
      updated_at = now();

  v_summary := jsonb_build_object(
    'season', p_season,
    'accounts_archived', v_accounts,
    'xp_archived', v_total_xp,
    'ledger_entries', v_ledger_rows,
    'remaining_xp', (select coalesce(sum(gd.total_xp), 0) from public.gamification_data gd)
  );

  update gamification_private.season_resets
  set summary = v_summary
  where season = p_season;

  return v_summary || jsonb_build_object('write_performed', true);
end;
$$;

revoke all on function public.apply_gamification_season_reset(text, text) from public, anon;
grant execute on function public.apply_gamification_season_reset(text, text) to authenticated;
