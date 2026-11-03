-- GAM-016: server-authoritative rollout controls for gamification rewards.
-- New rewards are disabled by default. Operators can enable all users or an
-- explicit allowlist without deleting profiles, XP history or content.

create schema if not exists gamification_private;
revoke all on schema gamification_private from public, anon, authenticated;

create table if not exists gamification_private.rollout_config (
  singleton boolean primary key default true check (singleton),
  rewards_enabled boolean not null default false,
  audience_mode text not null default 'allowlist'
    check (audience_mode in ('allowlist', 'all')),
  updated_by uuid references auth.users(id) on delete restrict,
  updated_at timestamptz not null default now()
);

insert into gamification_private.rollout_config (
  singleton, rewards_enabled, audience_mode
) values (true, false, 'allowlist')
on conflict (singleton) do nothing;

create table if not exists gamification_private.rollout_audience (
  user_id uuid primary key
    references public.user_profiles(user_id) on delete cascade,
  added_by uuid not null references auth.users(id) on delete restrict,
  added_at timestamptz not null default now()
);

create table if not exists gamification_private.rollout_audit (
  id bigint generated always as identity primary key,
  actor_id uuid not null references auth.users(id) on delete restrict,
  action text not null check (action in ('configure', 'add_member', 'remove_member')),
  reason text not null check (char_length(btrim(reason)) between 5 and 500),
  previous_state jsonb not null default '{}'::jsonb,
  next_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table gamification_private.rollout_config enable row level security;
alter table gamification_private.rollout_audience enable row level security;
alter table gamification_private.rollout_audit enable row level security;
revoke all on gamification_private.rollout_config from public, anon, authenticated;
revoke all on gamification_private.rollout_audience from public, anon, authenticated;
revoke all on gamification_private.rollout_audit from public, anon, authenticated;

create index if not exists gamification_rollout_audit_created_at_idx
  on gamification_private.rollout_audit (created_at desc);

alter table gamification_private.rejected_action_events
  drop constraint if exists rejected_action_events_reason_check;
alter table gamification_private.rejected_action_events
  add constraint rejected_action_events_reason_check
  check (rejection_reason in (
    'system_disabled', 'audience_restricted',
    'rule_unavailable', 'unsupported_action', 'verification_failed',
    'duplicate_event', 'cap_reached', 'award_rejected'
  ));

create or replace function gamification_private.rollout_summary()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'rewards_enabled', rc.rewards_enabled,
    'audience_mode', rc.audience_mode,
    'allowlisted_users', (
      select count(*)::integer from gamification_private.rollout_audience
    ),
    'eligible_users', case
      when not rc.rewards_enabled then 0
      when rc.audience_mode = 'all' then (
        select count(*)::integer
        from public.user_profiles up
        where coalesce(up.is_active, true)
      )
      else (
        select count(*)::integer
        from gamification_private.rollout_audience ra
        join public.user_profiles up on up.user_id = ra.user_id
        where coalesce(up.is_active, true)
      )
    end,
    'updated_at', rc.updated_at,
    'contains_personal_data', false,
    'write_performed', false
  )
  from gamification_private.rollout_config rc
  where rc.singleton;
$$;

revoke all on function gamification_private.rollout_summary()
  from public, anon, authenticated;

create or replace function public.preview_gamification_rollout()
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
  return gamification_private.rollout_summary();
end;
$$;

revoke all on function public.preview_gamification_rollout()
  from public, anon;
grant execute on function public.preview_gamification_rollout()
  to authenticated;

create or replace function public.configure_gamification_rollout(
  p_rewards_enabled boolean,
  p_audience_mode text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_previous jsonb;
  v_next jsonb;
begin
  if v_actor is null or not (select public.app_is_privileged()) then
    raise exception 'Insufficient privileges';
  end if;
  if p_audience_mode not in ('allowlist', 'all') then
    raise exception 'Unsupported audience mode';
  end if;
  if char_length(btrim(coalesce(p_reason, ''))) < 5 then
    raise exception 'A rollout reason is required';
  end if;

  select gamification_private.rollout_summary() into v_previous;

  update gamification_private.rollout_config
  set rewards_enabled = p_rewards_enabled,
      audience_mode = p_audience_mode,
      updated_by = v_actor,
      updated_at = now()
  where singleton;

  select gamification_private.rollout_summary() into v_next;

  insert into gamification_private.rollout_audit (
    actor_id, action, reason, previous_state, next_state
  ) values (v_actor, 'configure', btrim(p_reason), v_previous, v_next);

  return v_next || jsonb_build_object('write_performed', true);
end;
$$;

revoke all on function public.configure_gamification_rollout(boolean, text, text)
  from public, anon;
grant execute on function public.configure_gamification_rollout(boolean, text, text)
  to authenticated;

create or replace function public.set_gamification_rollout_member(
  p_user_id uuid,
  p_enabled boolean,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_existed boolean;
begin
  if v_actor is null or not (select public.app_is_privileged()) then
    raise exception 'Insufficient privileges';
  end if;
  if char_length(btrim(coalesce(p_reason, ''))) < 5 then
    raise exception 'A rollout reason is required';
  end if;
  if not exists (
    select 1 from public.user_profiles up
    where up.user_id = p_user_id and coalesce(up.is_active, true)
  ) then
    raise exception 'Active profile not found';
  end if;

  select exists (
    select 1 from gamification_private.rollout_audience ra
    where ra.user_id = p_user_id
  ) into v_existed;

  if p_enabled then
    insert into gamification_private.rollout_audience (user_id, added_by)
    values (p_user_id, v_actor)
    on conflict (user_id) do nothing;
  else
    delete from gamification_private.rollout_audience where user_id = p_user_id;
  end if;

  if v_existed is distinct from p_enabled then
    insert into gamification_private.rollout_audit (
      actor_id, action, reason, previous_state, next_state
    ) values (
      v_actor,
      case when p_enabled then 'add_member' else 'remove_member' end,
      btrim(p_reason),
      jsonb_build_object('member_enabled', v_existed),
      jsonb_build_object('member_enabled', p_enabled)
    );
  end if;

  return gamification_private.rollout_summary()
    || jsonb_build_object('write_performed', v_existed is distinct from p_enabled);
end;
$$;

revoke all on function public.set_gamification_rollout_member(uuid, boolean, text)
  from public, anon;
grant execute on function public.set_gamification_rollout_member(uuid, boolean, text)
  to authenticated;

-- Keep the existing audited engine intact and put the rollout gate in front.
do $move_audited_engine$
begin
  if to_regprocedure(
       'gamification_private.record_my_gamification_action_audited_engine(text,uuid,jsonb)'
     ) is null then
    alter function public.record_my_gamification_action(text, uuid, jsonb)
      set schema gamification_private;
    alter function gamification_private.record_my_gamification_action(text, uuid, jsonb)
      rename to record_my_gamification_action_audited_engine;
  end if;
end
$move_audited_engine$;

revoke all on function gamification_private.record_my_gamification_action_audited_engine(
  text, uuid, jsonb
) from public, anon, authenticated;

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

comment on function public.preview_gamification_rollout() is
  'Aggregate rollout state for privileged operators; no personal data.';
comment on function public.configure_gamification_rollout(boolean, text, text) is
  'Audited kill switch and audience-mode configuration for privileged operators.';
comment on function public.set_gamification_rollout_member(uuid, boolean, text) is
  'Audited allowlist membership change for privileged operators.';

notify pgrst, 'reload schema';
