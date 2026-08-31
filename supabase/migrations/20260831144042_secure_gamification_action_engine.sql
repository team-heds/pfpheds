-- Supabase is the only authority allowed to award gamification rewards.
-- Browser callers never choose the user or the XP amount.

alter table public.xp_history
  add column if not exists event_key text;

alter table public.user_quest_progress
  add column if not exists created_at timestamptz not null default now();

create unique index if not exists xp_history_user_event_key_uidx
  on public.xp_history (user_id, event_key)
  where event_key is not null;

-- Historical permissive policies let users choose total_xp/current_level.
-- All reward writes now go through the identity-aware RPC below.
drop policy if exists "Users can insert own gamification data"
  on public.gamification_data;
drop policy if exists "Users can update own gamification data"
  on public.gamification_data;

create or replace function public.gamification_award_xp_internal(
  p_user_id uuid,
  p_action text,
  p_amount integer,
  p_event_key text,
  p_source_type text default null,
  p_source_id uuid default null,
  p_description text default null
)
returns jsonb
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  v_history_id uuid;
  v_old_level integer;
  v_new_level integer;
  v_new_total integer;
begin
  if p_user_id is null or p_amount <= 0 or nullif(btrim(p_event_key), '') is null then
    raise exception 'Invalid gamification award';
  end if;

  insert into public.gamification_data (
    user_id,
    email,
    total_xp,
    current_level,
    house_points
  )
  values (
    p_user_id,
    coalesce((select email from auth.users where id = p_user_id), ''),
    0,
    1,
    0
  )
  on conflict (user_id) do nothing;

  select gd.current_level, gd.total_xp
  into v_old_level, v_new_total
  from public.gamification_data gd
  where gd.user_id = p_user_id
  for update;

  insert into public.xp_history (
    user_id,
    amount,
    action,
    description,
    source_type,
    source_id,
    total_xp_after,
    event_key
  )
  values (
    p_user_id,
    p_amount,
    upper(p_action),
    p_description,
    p_source_type,
    p_source_id,
    v_new_total,
    p_event_key
  )
  on conflict (user_id, event_key) where event_key is not null do nothing
  returning id into v_history_id;

  if v_history_id is null then
    return jsonb_build_object(
      'awarded', false,
      'duplicate', true,
      'xp_gained', 0,
      'total_xp', v_new_total,
      'current_level', v_old_level
    );
  end if;

  v_new_total := v_new_total + p_amount;
  v_new_level := public.calculate_level_from_xp(v_new_total);

  update public.gamification_data
  set total_xp = v_new_total,
      current_level = v_new_level,
      house_points = coalesce(house_points, 0) + p_amount,
      updated_at = now()
  where user_id = p_user_id;

  update public.xp_history
  set total_xp_after = v_new_total
  where id = v_history_id;

  return jsonb_build_object(
    'awarded', true,
    'duplicate', false,
    'xp_gained', p_amount,
    'total_xp', v_new_total,
    'old_level', v_old_level,
    'current_level', v_new_level,
    'level_up', v_new_level > v_old_level
  );
end;
$$;

revoke all on function public.gamification_award_xp_internal(uuid, text, integer, text, text, uuid, text)
  from public, anon, authenticated;

create or replace function public.record_my_gamification_action(
  p_action text,
  p_source_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_action text := upper(btrim(coalesce(p_action, '')));
  v_amount integer;
  v_event_key text;
  v_description text;
  v_result jsonb;
  v_total_xp integer;
  v_level integer;
  v_badge record;
  v_condition jsonb;
  v_meets_condition boolean;
  v_unlocked_badges jsonb := '[]'::jsonb;
  v_challenge record;
  v_progress integer;
  v_was_completed boolean;
  v_challenge_action text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  case v_action
    when 'LOGIN' then
      v_amount := 5;
      v_event_key := 'login:' || current_date::text;
      v_description := 'Connexion quotidienne';
      v_challenge_action := 'daily_login';

    when 'PROFILE_UPDATE' then
      select
        10,
        'profile_update:' || current_date::text,
        'Profil mis à jour',
        'update_profile'
      into v_amount, v_event_key, v_description, v_challenge_action
      from public.user_profiles up
      where up.user_id = v_user_id
        and up.updated_at >= now() - interval '10 minutes'
        and up.updated_at <= now() + interval '1 minute';

      if v_event_key is null then
        raise exception 'Recent profile update not found';
      end if;

    when 'POST' then
      if p_source_id is null or not exists (
        select 1
        from public.posts p
        where p.id = p_source_id
          and p.user_id = v_user_id
          -- The RPC acknowledges the creation event; it cannot harvest
          -- rewards from posts that existed before the current session.
          and p.created_at >= now() - interval '10 minutes'
          and p.created_at <= now() + interval '1 minute'
      ) then
        raise exception 'Recent post not found or not owned by current user';
      end if;

      v_amount := 25;
      v_event_key := 'post:' || p_source_id::text;
      v_description := 'Publication créée';
      v_challenge_action := 'create_post';

    else
      raise exception 'Unsupported gamification action: %', v_action;
  end case;

  v_result := public.gamification_award_xp_internal(
    v_user_id,
    v_action,
    v_amount,
    v_event_key,
    lower(v_action),
    p_source_id,
    v_description
  );

  if not coalesce((v_result ->> 'awarded')::boolean, false) then
    return v_result || jsonb_build_object(
      'action', v_action,
      'badges_unlocked', v_unlocked_badges
    );
  end if;

  -- Progress only active challenges matching the verified server-side action.
  for v_challenge in
    select c.*
    from public.challenges c
    where c.is_active = true
      and lower(c.action_type) = lower(v_challenge_action)
      and (c.start_date is null or c.start_date <= current_date)
      and (c.end_date is null or c.end_date >= current_date)
  loop
    select coalesce(ucp.completed, false)
    into v_was_completed
    from public.user_challenge_progress ucp
    where ucp.user_id = v_user_id
      and ucp.challenge_id = v_challenge.id
    for update;

    v_was_completed := coalesce(v_was_completed, false);

    insert into public.user_challenge_progress (
      user_id,
      challenge_id,
      current_value,
      completed,
      completed_at
    )
    values (
      v_user_id,
      v_challenge.id,
      1,
      v_challenge.target_value <= 1,
      case when v_challenge.target_value <= 1 then now() end
    )
    on conflict (user_id, challenge_id) do update
      set current_value = case
            when public.user_challenge_progress.completed then public.user_challenge_progress.current_value
            else public.user_challenge_progress.current_value + 1
          end,
          completed = public.user_challenge_progress.completed
            or public.user_challenge_progress.current_value + 1 >= v_challenge.target_value,
          completed_at = case
            when public.user_challenge_progress.completed then public.user_challenge_progress.completed_at
            when public.user_challenge_progress.current_value + 1 >= v_challenge.target_value then now()
            else null
          end
    returning current_value, completed into v_progress, v_was_completed;

    if v_was_completed then
      if coalesce(v_challenge.xp_reward, 0) > 0 then
        perform public.gamification_award_xp_internal(
          v_user_id,
          'CHALLENGE_COMPLETE',
          v_challenge.xp_reward,
          'challenge:' || v_challenge.id::text,
          'challenge',
          v_challenge.id,
          'Défi complété: ' || v_challenge.name
        );
      end if;

      if v_challenge.badge_reward is not null then
        insert into public.user_badges (user_id, badge_id, earned_at)
        values (v_user_id, v_challenge.badge_reward, now())
        on conflict (user_id, badge_id) do nothing;
      end if;
    end if;
  end loop;

  select gd.total_xp, gd.current_level
  into v_total_xp, v_level
  from public.gamification_data gd
  where gd.user_id = v_user_id;

  -- Badge conditions are evaluated from authoritative Supabase history.
  for v_badge in
    select b.*
    from public.badges b
    where b.is_active = true
      and not exists (
        select 1
        from public.user_badges ub
        where ub.user_id = v_user_id
          and ub.badge_id = b.id
      )
  loop
    v_condition := coalesce(v_badge.conditions, '{}'::jsonb);
    v_meets_condition := false;

    if v_condition ? 'total_xp' then
      v_meets_condition := v_total_xp >= (v_condition ->> 'total_xp')::integer;
    elsif v_condition ? 'level' then
      v_meets_condition := v_level >= (v_condition ->> 'level')::integer;
    elsif v_condition ? 'action_count' then
      select count(*) >= (v_condition ->> 'count')::integer
      into v_meets_condition
      from public.xp_history xh
      where xh.user_id = v_user_id
        and xh.action = upper(v_condition ->> 'action_type');
    end if;

    if v_meets_condition then
      insert into public.user_badges (user_id, badge_id, earned_at)
      values (v_user_id, v_badge.id, now())
      on conflict (user_id, badge_id) do nothing;

      if found then
        v_unlocked_badges := v_unlocked_badges || jsonb_build_array(
          jsonb_build_object(
            'id', v_badge.id,
            'name', v_badge.name,
            'rarity', v_badge.rarity,
            'xp_bonus', coalesce(v_badge.xp_bonus, 0)
          )
        );

        if coalesce(v_badge.xp_bonus, 0) > 0 then
          perform public.gamification_award_xp_internal(
            v_user_id,
            'BADGE_UNLOCK',
            v_badge.xp_bonus,
            'badge:' || v_badge.id::text,
            'badge',
            v_badge.id,
            'Badge débloqué: ' || v_badge.name
          );
        end if;
      end if;
    end if;
  end loop;

  select gd.total_xp, gd.current_level
  into v_total_xp, v_level
  from public.gamification_data gd
  where gd.user_id = v_user_id;

  return v_result || jsonb_build_object(
    'action', v_action,
    'total_xp', v_total_xp,
    'current_level', v_level,
    'badges_unlocked', v_unlocked_badges
  );
end;
$$;

revoke all on function public.record_my_gamification_action(text, uuid, jsonb)
  from public, anon;
grant execute on function public.record_my_gamification_action(text, uuid, jsonb)
  to authenticated;

-- Legacy functions accepted an arbitrary browser-provided user id. Keep them
-- available to the database owner only while callers migrate to the safe RPC.
revoke all on function public.add_user_xp(uuid, text, integer, text, uuid, text)
  from public, anon, authenticated;
revoke all on function public.update_challenge_progress(uuid, text)
  from public, anon, authenticated;
revoke all on function public.check_and_unlock_badges(uuid, text, integer, integer)
  from public, anon, authenticated;

create or replace function public.start_my_quest(p_quest_id uuid)
returns public.user_quest_progress
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_quest public.quests;
  v_level integer;
  v_house_name text;
  v_result public.user_quest_progress;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select q.* into v_quest
  from public.quests q
  where q.id = p_quest_id
    and q.status = 'active'
    and (q.start_date is null or q.start_date <= now())
    and (q.end_date is null or q.end_date >= now());

  if not found then
    raise exception 'Quest not found or unavailable';
  end if;

  select coalesce(gd.current_level, 1), lower(h.name)
  into v_level, v_house_name
  from public.gamification_data gd
  left join public.houses h on h.id = gd.house_id
  where gd.user_id = v_user_id;

  v_level := coalesce(v_level, 1);

  if v_level < coalesce(v_quest.min_level, 1)
     or (v_quest.max_level is not null and v_level > v_quest.max_level) then
    raise exception 'Quest level requirements are not met';
  end if;

  if coalesce(array_length(v_quest.target_houses, 1), 0) > 0
     and not exists (
       select 1
       from unnest(v_quest.target_houses) as target_house(name)
       where lower(target_house.name) = v_house_name
     ) then
    raise exception 'Quest is not available for this house';
  end if;

  insert into public.user_quest_progress (
    user_id,
    quest_id,
    status,
    progress,
    current_step,
    started_at,
    updated_at
  )
  values (v_user_id, p_quest_id, 'in_progress', 0, 0, now(), now())
  on conflict (user_id, quest_id) do update
    set status = case
          when public.user_quest_progress.status = 'completed' then 'completed'
          else 'in_progress'
        end,
        started_at = coalesce(public.user_quest_progress.started_at, now()),
        updated_at = now()
  returning * into v_result;

  return v_result;
end;
$$;

revoke all on function public.start_my_quest(uuid) from public, anon;
grant execute on function public.start_my_quest(uuid) to authenticated;

drop policy if exists p0_owner_or_privileged on public.user_quest_progress;

create policy gamification_quest_progress_read
  on public.user_quest_progress
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.app_is_privileged())
  );

create policy gamification_quest_progress_privileged_write
  on public.user_quest_progress
  for all
  to authenticated
  using ((select public.app_is_privileged()))
  with check ((select public.app_is_privileged()));
