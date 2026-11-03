-- HEDS25-477: complete the authoritative action engine with configurable caps
-- and atomic quest-step progression. This migration is append-only and keeps
-- all configuration/progression internals outside the exposed public schema.

create schema if not exists gamification_private;
revoke all on schema gamification_private from public, anon, authenticated;

create table if not exists gamification_private.action_rules (
  action_code text primary key,
  rule_version text not null,
  xp_amount integer not null check (xp_amount > 0),
  challenge_action text not null,
  window_kind text not null check (window_kind in ('event', 'day', 'week')),
  max_awards_per_window integer check (max_awards_per_window is null or max_awards_per_window > 0),
  is_active boolean not null default true,
  effective_from timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint gamification_action_rules_code_check
    check (action_code ~ '^[A-Z][A-Z0-9_]{1,63}$'),
  constraint gamification_action_rules_version_check
    check (rule_version ~ '^[a-z0-9][a-z0-9._:-]{2,127}$'),
  constraint gamification_action_rules_window_check
    check (
      (window_kind = 'event' and max_awards_per_window is null)
      or (window_kind in ('day', 'week') and max_awards_per_window is not null)
    )
);

alter table gamification_private.action_rules enable row level security;
revoke all on gamification_private.action_rules from public, anon, authenticated;

insert into gamification_private.action_rules (
  action_code,
  rule_version,
  xp_amount,
  challenge_action,
  window_kind,
  max_awards_per_window,
  is_active
)
values
  ('LOGIN', 'gamification-action-v2', 5, 'daily_login', 'day', 1, true),
  ('PROFILE_UPDATE', 'gamification-action-v2', 10, 'update_profile', 'day', 1, true),
  -- Test-only value. A production rollout requires explicit business approval.
  ('POST', 'gamification-action-v2', 25, 'create_post', 'day', 3, true)
on conflict (action_code) do update
set rule_version = excluded.rule_version,
    xp_amount = excluded.xp_amount,
    challenge_action = excluded.challenge_action,
    window_kind = excluded.window_kind,
    max_awards_per_window = excluded.max_awards_per_window,
    is_active = excluded.is_active,
    effective_from = excluded.effective_from,
    updated_at = now();

alter table public.xp_history
  add column if not exists occurred_at timestamptz;

update public.xp_history
set occurred_at = created_at at time zone 'UTC'
where occurred_at is null;

alter table public.xp_history
  alter column occurred_at set default now(),
  alter column occurred_at set not null;

create index if not exists xp_history_user_action_occurred_idx
  on public.xp_history (user_id, action, occurred_at);

alter table public.quest_steps
  add column if not exists action_type text,
  add column if not exists target_value integer not null default 1;

alter table public.quest_steps
  drop constraint if exists quest_steps_action_type_check,
  add constraint quest_steps_action_type_check
    check (action_type is null or action_type ~ '^[A-Z][A-Z0-9_]{1,63}$'),
  drop constraint if exists quest_steps_target_value_check,
  add constraint quest_steps_target_value_check check (target_value > 0);

create unique index if not exists quest_steps_id_quest_uidx
  on public.quest_steps (id, quest_id);

create table if not exists gamification_private.user_quest_step_progress (
  user_id uuid not null references public.user_profiles(user_id) on delete cascade,
  quest_id uuid not null references public.quests(id) on delete cascade,
  step_id uuid not null,
  current_value integer not null default 0 check (current_value >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, quest_id, step_id),
  constraint gamification_quest_step_progress_step_fk
    foreign key (step_id, quest_id)
    references public.quest_steps(id, quest_id)
    on delete cascade,
  constraint gamification_quest_step_progress_completion_check
    check (completed_at is null or current_value > 0)
);

alter table gamification_private.user_quest_step_progress enable row level security;
revoke all on gamification_private.user_quest_step_progress
  from public, anon, authenticated;

create index if not exists gamification_quest_step_progress_user_idx
  on gamification_private.user_quest_step_progress (user_id, quest_id);

create or replace function public.record_my_gamification_action(
  p_action text,
  p_source_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, gamification_private
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_action text := upper(btrim(coalesce(p_action, '')));
  v_rule gamification_private.action_rules%rowtype;
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
  v_local_now timestamp := now() at time zone 'Europe/Zurich';
  v_local_day date;
  v_window_start timestamptz;
  v_window_end timestamptz;
  v_window_key text;
  v_window_awards integer := 0;
  v_quest_step record;
  v_step_value integer;
  v_step_completed_at timestamptz;
  v_required_steps integer;
  v_completed_steps integer;
  v_quest_completed boolean;
  v_quests_progressed jsonb := '[]'::jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select * into v_rule
  from gamification_private.action_rules ar
  where ar.action_code = v_action
    and ar.is_active = true
    and ar.effective_from <= now();

  if not found then
    return jsonb_build_object(
      'awarded', false,
      'duplicate', false,
      'cap_reached', false,
      'reason', 'rule_unavailable',
      'action', v_action,
      'xp_gained', 0,
      'badges_unlocked', v_unlocked_badges,
      'quests_progressed', v_quests_progressed
    );
  end if;

  v_local_day := v_local_now::date;

  case v_action
    when 'LOGIN' then
      v_event_key := 'login:' || v_local_day::text;
      v_description := 'Connexion quotidienne';

    when 'PROFILE_UPDATE' then
      select
        'profile_update:' || v_local_day::text,
        'Profil mis à jour'
      into v_event_key, v_description
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

      v_event_key := 'post:' || p_source_id::text;
      v_description := 'Publication créée';

    else
      return jsonb_build_object(
        'awarded', false,
        'duplicate', false,
        'cap_reached', false,
        'reason', 'unsupported_action',
        'action', v_action,
        'xp_gained', 0,
        'badges_unlocked', v_unlocked_badges,
        'quests_progressed', v_quests_progressed
      );
  end case;

  -- Serialize one user's action window so concurrent requests cannot both
  -- observe capacity and exceed the configured cap.
  if v_rule.window_kind = 'day' then
    v_window_start := v_local_day::timestamp at time zone 'Europe/Zurich';
    v_window_end := (v_local_day + 1)::timestamp at time zone 'Europe/Zurich';
    v_window_key := v_local_day::text;
  elsif v_rule.window_kind = 'week' then
    v_window_start := date_trunc('week', v_local_now) at time zone 'Europe/Zurich';
    v_window_end := v_window_start + interval '7 days';
    v_window_key := to_char(v_local_now, 'IYYY-IW');
  else
    v_window_start := '-infinity'::timestamptz;
    v_window_end := 'infinity'::timestamptz;
    v_window_key := coalesce(p_source_id::text, v_event_key);
  end if;

  perform pg_advisory_xact_lock(
    hashtext(v_user_id::text),
    hashtext(v_action || ':' || v_window_key)
  );

  select coalesce(gd.total_xp, 0), coalesce(gd.current_level, 1)
  into v_total_xp, v_level
  from public.gamification_data gd
  where gd.user_id = v_user_id;

  v_total_xp := coalesce(v_total_xp, 0);
  v_level := coalesce(v_level, 1);

  if exists (
    select 1 from public.xp_history xh
    where xh.user_id = v_user_id and xh.event_key = v_event_key
  ) then
    return jsonb_build_object(
      'awarded', false,
      'duplicate', true,
      'cap_reached', false,
      'reason', 'duplicate_event',
      'action', v_action,
      'rule_version', v_rule.rule_version,
      'xp_gained', 0,
      'total_xp', v_total_xp,
      'current_level', v_level,
      'badges_unlocked', v_unlocked_badges,
      'quests_progressed', v_quests_progressed
    );
  end if;

  if v_rule.max_awards_per_window is not null then
    select count(*) into v_window_awards
    from public.xp_history xh
    where xh.user_id = v_user_id
      and xh.action = v_action
      and xh.occurred_at >= v_window_start
      and xh.occurred_at < v_window_end;

    if v_window_awards >= v_rule.max_awards_per_window then
      return jsonb_build_object(
        'awarded', false,
        'duplicate', false,
        'cap_reached', true,
        'reason', 'cap_reached',
        'action', v_action,
        'rule_version', v_rule.rule_version,
        'window_kind', v_rule.window_kind,
        'window_key', v_window_key,
        'awards_in_window', v_window_awards,
        'max_awards_in_window', v_rule.max_awards_per_window,
        'xp_gained', 0,
        'total_xp', v_total_xp,
        'current_level', v_level,
        'badges_unlocked', v_unlocked_badges,
        'quests_progressed', v_quests_progressed
      );
    end if;
  end if;

  -- Snapshot badge conditions before the action. Historical state must not be
  -- interpreted as a new unlock by this event.
  v_previous_total_xp := v_total_xp;
  v_previous_level := v_level;

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
    v_rule.xp_amount,
    v_event_key,
    lower(v_action),
    p_source_id,
    v_description
  );

  if not coalesce((v_result ->> 'awarded')::boolean, false) then
    return v_result || jsonb_build_object(
      'action', v_action,
      'rule_version', v_rule.rule_version,
      'cap_reached', false,
      'badges_unlocked', v_unlocked_badges,
      'quests_progressed', v_quests_progressed
    );
  end if;

  -- Progress active challenges matching the verified server-side action.
  for v_challenge in
    select c.*
    from public.challenges c
    where c.is_active = true
      and lower(c.action_type) = lower(v_rule.challenge_action)
      and (c.start_date is null or c.start_date <= v_local_day)
      and (c.end_date is null or c.end_date >= v_local_day)
  loop
    select coalesce(ucp.completed, false)
    into v_was_completed
    from public.user_challenge_progress ucp
    where ucp.user_id = v_user_id
      and ucp.challenge_id = v_challenge.id
    for update;

    v_was_completed := coalesce(v_was_completed, false);

    insert into public.user_challenge_progress (
      user_id, challenge_id, current_value, completed, completed_at
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
            else least(public.user_challenge_progress.current_value + 1, v_challenge.target_value)
          end,
          completed = public.user_challenge_progress.completed
            or public.user_challenge_progress.current_value + 1 >= v_challenge.target_value,
          completed_at = case
            when public.user_challenge_progress.completed then public.user_challenge_progress.completed_at
            when public.user_challenge_progress.current_value + 1 >= v_challenge.target_value then now()
            else null
          end
    returning completed into v_is_completed;

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

  -- Only the earliest unfinished step of each assigned quest may progress.
  for v_quest_step in
    select
      uqp.id as progress_id,
      uqp.quest_id,
      q.title as quest_title,
      coalesce(q.xp_reward, q.points, 0) as quest_xp,
      next_step.id as step_id,
      next_step.target_value
    from public.user_quest_progress uqp
    join public.quests q on q.id = uqp.quest_id
    join lateral (
      select qs.id, qs.action_type, qs.target_value
      from public.quest_steps qs
      left join gamification_private.user_quest_step_progress uqsp
        on uqsp.user_id = uqp.user_id
       and uqsp.quest_id = uqp.quest_id
       and uqsp.step_id = qs.id
      where qs.quest_id = uqp.quest_id
        and uqsp.completed_at is null
      order by qs.step_order, qs.id
      limit 1
    ) next_step on next_step.action_type = v_action
    where uqp.user_id = v_user_id
      and uqp.status in ('not_started', 'in_progress')
      and q.status = 'active'
      and (q.start_date is null or q.start_date <= now())
      and (q.end_date is null or q.end_date >= now())
  loop
    insert into gamification_private.user_quest_step_progress (
      user_id, quest_id, step_id, current_value, completed_at
    )
    values (
      v_user_id,
      v_quest_step.quest_id,
      v_quest_step.step_id,
      1,
      case when v_quest_step.target_value <= 1 then now() end
    )
    on conflict (user_id, quest_id, step_id) do update
      set current_value = least(
            gamification_private.user_quest_step_progress.current_value + 1,
            v_quest_step.target_value
          ),
          completed_at = case
            when gamification_private.user_quest_step_progress.completed_at is not null
              then gamification_private.user_quest_step_progress.completed_at
            when gamification_private.user_quest_step_progress.current_value + 1 >= v_quest_step.target_value
              then now()
            else null
          end,
          updated_at = now()
    returning current_value, completed_at
    into v_step_value, v_step_completed_at;

    select count(*) into v_required_steps
    from public.quest_steps qs
    where qs.quest_id = v_quest_step.quest_id
      and qs.required = true;

    if v_required_steps = 0 then
      select count(*) into v_required_steps
      from public.quest_steps qs
      where qs.quest_id = v_quest_step.quest_id;
    end if;

    select count(*) into v_completed_steps
    from public.quest_steps qs
    join gamification_private.user_quest_step_progress uqsp
      on uqsp.user_id = v_user_id
     and uqsp.quest_id = qs.quest_id
     and uqsp.step_id = qs.id
     and uqsp.completed_at is not null
    where qs.quest_id = v_quest_step.quest_id
      and (
        qs.required = true
        or not exists (
          select 1 from public.quest_steps required_step
          where required_step.quest_id = v_quest_step.quest_id
            and required_step.required = true
        )
      );

    v_quest_completed := v_required_steps > 0 and v_completed_steps >= v_required_steps;
    v_progress := case
      when v_required_steps = 0 then 0
      else least(100, round((v_completed_steps::numeric * 100) / v_required_steps)::integer)
    end;

    update public.user_quest_progress
    set status = case when v_quest_completed then 'completed' else 'in_progress' end,
        progress = v_progress,
        current_step = v_completed_steps,
        started_at = coalesce(started_at, now()),
        completed_at = case when v_quest_completed then coalesce(completed_at, now()) else null end,
        updated_at = now()
    where id = v_quest_step.progress_id;

    if v_quest_completed and v_quest_step.quest_xp > 0 then
      perform public.gamification_award_xp_internal(
        v_user_id,
        'QUEST_COMPLETE',
        v_quest_step.quest_xp,
        'quest:' || v_quest_step.quest_id::text,
        'quest',
        v_quest_step.quest_id,
        'Quête complétée: ' || v_quest_step.quest_title
      );
    end if;

    v_quests_progressed := v_quests_progressed || jsonb_build_array(
      jsonb_build_object(
        'quest_id', v_quest_step.quest_id,
        'step_id', v_quest_step.step_id,
        'step_value', v_step_value,
        'step_completed', v_step_completed_at is not null,
        'quest_progress', v_progress,
        'quest_completed', v_quest_completed
      )
    );
  end loop;

  select gd.total_xp, gd.current_level
  into v_total_xp, v_level
  from public.gamification_data gd
  where gd.user_id = v_user_id;

  -- Unlock badges only when this verified transaction crosses the boundary.
  for v_badge in
    select b.*
    from public.badges b
    where b.is_active = true
      and not exists (
        select 1 from public.user_badges ub
        where ub.user_id = v_user_id and ub.badge_id = b.id
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

      select count(*) into v_current_action_count
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
    'rule_version', v_rule.rule_version,
    'cap_reached', false,
    'window_kind', v_rule.window_kind,
    'window_key', v_window_key,
    'awards_in_window', v_window_awards + 1,
    'max_awards_in_window', v_rule.max_awards_per_window,
    'total_xp', v_total_xp,
    'current_level', v_level,
    'badges_unlocked', v_unlocked_badges,
    'quests_progressed', v_quests_progressed
  );
end;
$$;

revoke all on function public.record_my_gamification_action(text, uuid, jsonb)
  from public, anon;
grant execute on function public.record_my_gamification_action(text, uuid, jsonb)
  to authenticated;

-- The browser can read quest definitions through the existing RLS policies,
-- but never writes step progress or action rules directly.
revoke all on gamification_private.user_quest_step_progress
  from public, anon, authenticated;
revoke all on gamification_private.action_rules
  from public, anon, authenticated;

notify pgrst, 'reload schema';
