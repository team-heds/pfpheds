-- A current action may only unlock rewards whose conditions transition from
-- false to true during that action. Historical XP and completed challenges
-- must never be rewarded by a later login.

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
  v_previous_total_xp integer := 0;
  v_previous_level integer := 1;
  v_previous_action_counts jsonb := '{}'::jsonb;
  v_current_action_count integer;
  v_previous_action_count integer;
  v_condition_action text;
  v_badge record;
  v_condition jsonb;
  v_meets_condition boolean;
  v_previously_met_condition boolean;
  v_unlocked_badges jsonb := '[]'::jsonb;
  v_challenge record;
  v_progress integer;
  v_was_completed boolean;
  v_is_completed boolean;
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

  -- Snapshot every condition before the action. This is the boundary that
  -- prevents an old account state from being interpreted as a new unlock.
  select coalesce(gd.total_xp, 0), coalesce(gd.current_level, 1)
  into v_previous_total_xp, v_previous_level
  from public.gamification_data gd
  where gd.user_id = v_user_id;

  v_previous_total_xp := coalesce(v_previous_total_xp, 0);
  v_previous_level := coalesce(v_previous_level, 1);

  select coalesce(jsonb_object_agg(condition_counts.action_name, condition_counts.action_total), '{}'::jsonb)
  into v_previous_action_counts
  from (
    select
      badge_actions.action_name,
      (
        select count(*)
        from public.xp_history xh
        where xh.user_id = v_user_id
          and xh.action = badge_actions.action_name
      ) as action_total
    from (
      select distinct upper(b.conditions ->> 'action_type') as action_name
      from public.badges b
      where b.is_active = true
        and b.conditions ? 'action_count'
        and nullif(b.conditions ->> 'action_type', '') is not null
    ) badge_actions
  ) condition_counts;

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
    returning current_value, completed into v_progress, v_is_completed;

    -- A completed challenge is rewarded only on its actual transition.
    if not v_was_completed and v_is_completed then
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

  -- Unlock only when the verified action crosses the badge boundary.
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
    v_previously_met_condition := false;

    if v_condition ? 'total_xp' then
      v_previously_met_condition := v_previous_total_xp >= (v_condition ->> 'total_xp')::integer;
      v_meets_condition := v_total_xp >= (v_condition ->> 'total_xp')::integer;
    elsif v_condition ? 'level' then
      v_previously_met_condition := v_previous_level >= (v_condition ->> 'level')::integer;
      v_meets_condition := v_level >= (v_condition ->> 'level')::integer;
    elsif v_condition ? 'action_count' then
      v_condition_action := upper(v_condition ->> 'action_type');
      v_previous_action_count := coalesce((v_previous_action_counts ->> v_condition_action)::integer, 0);

      select count(*)
      into v_current_action_count
      from public.xp_history xh
      where xh.user_id = v_user_id
        and xh.action = v_condition_action;

      v_previously_met_condition := v_previous_action_count >= (v_condition ->> 'count')::integer;
      v_meets_condition := v_current_action_count >= (v_condition ->> 'count')::integer;
    end if;

    if not v_previously_met_condition and v_meets_condition then
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
