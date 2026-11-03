-- HEDS25-619 follow-up: badges granted by challenge completion must be
-- returned immediately by the public action RPC. The authoritative engine,
-- rollout gate and audit layers remain unchanged.

create or replace function public.record_my_gamification_action(
  p_action text,
  p_source_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_action text := upper(btrim(coalesce(p_action, '')));
  v_audit_action text;
  v_config gamification_private.rollout_config%rowtype;
  v_reason text;
  v_badges_before uuid[] := '{}'::uuid[];
  v_result jsonb;
  v_new_badges jsonb := '[]'::jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_audit_action := case
    when v_action ~ '^[A-Z][A-Z0-9_]{1,63}$' then v_action
    else 'INVALID_ACTION'
  end;

  select * into v_config
  from gamification_private.rollout_config rc
  where rc.singleton;

  if not coalesce(v_config.rewards_enabled, false) then
    v_reason := 'system_disabled';
  elsif not exists (
    select 1 from public.user_profiles up
    where up.user_id = v_user_id and coalesce(up.is_active, true)
  ) then
    v_reason := 'audience_restricted';
  elsif v_config.audience_mode = 'allowlist' and not exists (
    select 1 from gamification_private.rollout_audience ra
    where ra.user_id = v_user_id
  ) then
    v_reason := 'audience_restricted';
  end if;

  if v_reason is not null then
    insert into gamification_private.rejected_action_events (
      user_id, action_code, rejection_reason
    ) values (v_user_id, v_audit_action, v_reason);

    return jsonb_build_object(
      'awarded', false,
      'duplicate', false,
      'cap_reached', false,
      'reason', v_reason,
      'action', v_action,
      'xp_gained', 0,
      'badges_unlocked', '[]'::jsonb,
      'quests_progressed', '[]'::jsonb
    );
  end if;

  select coalesce(array_agg(ub.badge_id), '{}'::uuid[])
  into v_badges_before
  from public.user_badges ub
  where ub.user_id = v_user_id;

  v_result := gamification_private.record_my_gamification_action_audited_engine(
    p_action, p_source_id, coalesce(p_metadata, '{}'::jsonb)
  );

  if coalesce((v_result ->> 'awarded')::boolean, false) then
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', b.id,
          'name', b.name,
          'rarity', b.rarity,
          'xp_bonus', coalesce(b.xp_bonus, 0)
        ) order by ub.earned_at, b.id
      ),
      '[]'::jsonb
    )
    into v_new_badges
    from public.user_badges ub
    join public.badges b on b.id = ub.badge_id
    where ub.user_id = v_user_id
      and not (ub.badge_id = any(v_badges_before))
      and not exists (
        select 1
        from jsonb_array_elements(
          coalesce(v_result -> 'badges_unlocked', '[]'::jsonb)
        ) returned_badge
        where returned_badge ->> 'id' = ub.badge_id::text
      );

    if jsonb_array_length(v_new_badges) > 0 then
      v_result := jsonb_set(
        v_result,
        '{badges_unlocked}',
        coalesce(v_result -> 'badges_unlocked', '[]'::jsonb) || v_new_badges,
        true
      );
    end if;
  end if;

  return v_result;
end;
$$;

revoke all on function public.record_my_gamification_action(text, uuid, jsonb)
  from public, anon;
grant execute on function public.record_my_gamification_action(text, uuid, jsonb)
  to authenticated;

notify pgrst, 'reload schema';
