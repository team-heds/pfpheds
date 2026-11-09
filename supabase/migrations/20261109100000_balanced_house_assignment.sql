-- Attribution des maisons équilibrée côté serveur.
--
-- Avant : le navigateur comptait les membres pour équilibrer, mais un étudiant ne lit que
-- sa propre ligne de gamification_data ; l'équilibrage ne fonctionnait donc pas.
-- Maintenant :
--   - seul un compte du public de la gamification, sans maison, peut passer le quiz ;
--   - la maison préférée au quiz est retenue si elle compte au plus 1 joueur de plus que la
--     maison la moins remplie ; sinon la maison la moins remplie est attribuée ;
--   - les effectifs comptés sont ceux des joueurs (public de la gamification), maisons
--     de compétition seulement (pas « gamemaster ») ;
--   - une maison déjà attribuée n'est jamais modifiée par le quiz.

create or replace function gamification_private.is_rollout_member(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_profiles up
    where up.user_id = p_user_id and coalesce(up.is_active, true)
  )
  and coalesce((
    select rc.audience_mode = 'all'
        or exists (
          select 1 from gamification_private.rollout_audience ra
          where ra.user_id = p_user_id
        )
    from gamification_private.rollout_config rc
    where rc.singleton
  ), false);
$$;

revoke all on function gamification_private.is_rollout_member(uuid) from public, anon, authenticated;

-- Effectifs de joueurs par maison de compétition.
create or replace function gamification_private.house_player_counts()
returns table (house_id uuid, house_name text, players bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select h.id, h.name, count(gd.user_id)
  from public.houses h
  left join public.gamification_data gd
    on gd.house_id = h.id
   and gamification_private.is_rollout_member(gd.user_id)
  where lower(h.name) <> 'gamemaster'
  group by h.id, h.name;
$$;

revoke all on function gamification_private.house_player_counts() from public, anon, authenticated;

-- Maison attribuée pour une préférence donnée (sans écriture).
create or replace function gamification_private.balanced_house_for(p_preferred uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  with counts as (select * from gamification_private.house_player_counts()),
  floor_count as (select min(players) as m from counts)
  select coalesce(
    (select c.house_id from counts c, floor_count f
      where c.house_id = p_preferred and c.players <= f.m + 1),
    (select c.house_id from counts c, floor_count f
      where c.players = f.m
      order by c.house_name
      limit 1)
  );
$$;

revoke all on function gamification_private.balanced_house_for(uuid) from public, anon, authenticated;

-- État du compte courant pour l'interface : quiz ouvert ou non.
create or replace function public.get_my_house_quiz_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_house_id uuid;
  v_member boolean;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select gd.house_id into v_house_id
  from public.gamification_data gd
  where gd.user_id = v_user_id;

  v_member := gamification_private.is_rollout_member(v_user_id);

  return jsonb_build_object(
    'has_house', v_house_id is not null,
    'house_id', v_house_id,
    'is_player', v_member,
    'quiz_open', v_member and v_house_id is null
  );
end;
$$;

revoke all on function public.get_my_house_quiz_status() from public, anon;
grant execute on function public.get_my_house_quiz_status() to authenticated;

-- Aperçu de la maison qui serait attribuée pour la préférence du quiz (sans écriture).
create or replace function public.preview_my_house_assignment(p_house_id uuid)
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_house_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select gd.house_id into v_house_id
  from public.gamification_data gd
  where gd.user_id = v_user_id;

  if v_house_id is not null then
    return v_house_id;
  end if;
  if not gamification_private.is_rollout_member(v_user_id) then
    raise exception 'House quiz not open for this account';
  end if;

  return gamification_private.balanced_house_for(p_house_id);
end;
$$;

revoke all on function public.preview_my_house_assignment(uuid) from public, anon;
grant execute on function public.preview_my_house_assignment(uuid) to authenticated;

create or replace function public.assign_my_house(p_house_id uuid)
returns public.gamification_data
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_previous_house_id uuid;
  v_effective_house_id uuid;
  v_result public.gamification_data;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;
  if not exists (
    select 1 from public.user_profiles up where up.user_id = v_user_id
  ) then
    raise exception 'Application profile required';
  end if;
  if not exists (
    select 1 from public.houses h
    where h.id = p_house_id and lower(h.name) <> 'gamemaster'
  ) then
    raise exception 'House not found';
  end if;

  -- Une attribution à la fois : les effectifs lus restent exacts jusqu'à l'écriture.
  perform pg_advisory_xact_lock(hashtext('gamification:house-balance'));

  select gd.house_id into v_previous_house_id
  from public.gamification_data gd
  where gd.user_id = v_user_id
  for update;

  if not found or v_previous_house_id is null then
    if not gamification_private.is_rollout_member(v_user_id) then
      raise exception 'House quiz not open for this account';
    end if;

    v_effective_house_id := gamification_private.balanced_house_for(p_house_id);

    perform public.gamification_award_xp_internal(
      v_user_id,
      'HOUSE_ASSIGNMENT',
      50,
      'house-assignment:v1',
      'house',
      v_effective_house_id,
      'Maison attribuée'
    );
    update public.gamification_data
    set house_id = v_effective_house_id,
        gamification_metadata = coalesce(gamification_metadata, '{}'::jsonb)
          || jsonb_build_object(
            'quiz_completed', true,
            'quiz_date', now(),
            'quiz_preference', p_house_id,
            'balanced', v_effective_house_id is distinct from p_house_id
          ),
        updated_at = now()
    where user_id = v_user_id;
  else
    v_effective_house_id := v_previous_house_id;
  end if;

  if exists (
    select 1
    from public.user_profiles up
    where up.user_id = v_user_id
      and up.house_id is distinct from v_effective_house_id
  ) then
    insert into gamification_private.profile_house_sync_audit (
      user_id, previous_house_id, new_house_id, reason, changed_by
    )
    select
      up.user_id, up.house_id, v_effective_house_id,
      'self_assignment', v_user_id
    from public.user_profiles up
    where up.user_id = v_user_id;

    update public.user_profiles
    set house_id = v_effective_house_id, updated_at = now()
    where user_id = v_user_id;
  end if;

  select gd.* into v_result
  from public.gamification_data gd
  where gd.user_id = v_user_id;

  return v_result;
end;
$$;

revoke all on function public.assign_my_house(uuid) from public, anon;
grant execute on function public.assign_my_house(uuid) to authenticated;
