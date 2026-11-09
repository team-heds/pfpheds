-- GAM-016 follow-up: a disabled profile never receives a new reward, even if
-- it remains in the rollout allowlist or the rollout is open to everyone.

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

  return gamification_private.record_my_gamification_action_audited_engine(
    p_action, p_source_id, coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.record_my_gamification_action(text, uuid, jsonb)
  from public, anon;
grant execute on function public.record_my_gamification_action(text, uuid, jsonb)
  to authenticated;

notify pgrst, 'reload schema';
