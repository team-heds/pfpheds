-- HEDS25-626 / GAM-014: append-only, private audit of rejected XP events.
-- The public console receives aggregate counts only.

create schema if not exists gamification_private;
revoke all on schema gamification_private from public, anon, authenticated;

create table if not exists gamification_private.rejected_action_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  action_code text not null,
  rejection_reason text not null,
  rule_version text,
  window_kind text,
  rejected_at timestamptz not null default now(),
  constraint rejected_action_events_action_check
    check (action_code ~ '^[A-Z][A-Z0-9_]{1,63}$'),
  constraint rejected_action_events_reason_check
    check (rejection_reason in (
      'rule_unavailable', 'unsupported_action', 'verification_failed',
      'duplicate_event', 'cap_reached', 'award_rejected'
    )),
  constraint rejected_action_events_window_check
    check (window_kind is null or window_kind in ('event', 'day', 'week'))
);

alter table gamification_private.rejected_action_events enable row level security;
revoke all on gamification_private.rejected_action_events
  from public, anon, authenticated;

create index if not exists rejected_action_events_rejected_at_idx
  on gamification_private.rejected_action_events (rejected_at desc);
create index if not exists rejected_action_events_reason_action_idx
  on gamification_private.rejected_action_events (
    rejection_reason, action_code, rejected_at desc
  );

-- Preserve the authoritative implementation in the private schema. The public
-- API below is only an audited wrapper and cannot choose an XP amount.
do $move_engine$
begin
  if to_regprocedure(
       'gamification_private.record_my_gamification_action_engine(text,uuid,jsonb)'
     ) is null then
    alter function public.record_my_gamification_action(text, uuid, jsonb)
      set schema gamification_private;
    alter function gamification_private.record_my_gamification_action(text, uuid, jsonb)
      rename to record_my_gamification_action_engine;
  end if;
end
$move_engine$;

revoke all on function gamification_private.record_my_gamification_action_engine(
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
  v_result jsonb;
  v_reason text;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_audit_action := case
    when v_action ~ '^[A-Z][A-Z0-9_]{1,63}$' then v_action
    else 'INVALID_ACTION'
  end;

  begin
    v_result := gamification_private.record_my_gamification_action_engine(
      p_action, p_source_id, coalesce(p_metadata, '{}'::jsonb)
    );
  exception when raise_exception then
    if sqlerrm in (
      'Recent profile update not found',
      'Recent post not found or not owned by current user'
    ) then
      v_result := jsonb_build_object(
        'awarded', false,
        'duplicate', false,
        'cap_reached', false,
        'reason', 'verification_failed',
        'action', v_action,
        'xp_gained', 0,
        'badges_unlocked', '[]'::jsonb,
        'quests_progressed', '[]'::jsonb
      );
    else
      raise;
    end if;
  end;

  if not coalesce((v_result ->> 'awarded')::boolean, false) then
    v_reason := case v_result ->> 'reason'
      when 'rule_unavailable' then 'rule_unavailable'
      when 'unsupported_action' then 'unsupported_action'
      when 'verification_failed' then 'verification_failed'
      when 'duplicate_event' then 'duplicate_event'
      when 'cap_reached' then 'cap_reached'
      else 'award_rejected'
    end;

    insert into gamification_private.rejected_action_events (
      user_id, action_code, rejection_reason, rule_version, window_kind
    ) values (
      v_user_id,
      v_audit_action,
      v_reason,
      nullif(v_result ->> 'rule_version', ''),
      case when v_result ->> 'window_kind' in ('event', 'day', 'week')
        then v_result ->> 'window_kind'
      end
    );
  end if;

  return v_result;
end;
$$;

revoke all on function public.record_my_gamification_action(text, uuid, jsonb)
  from public, anon;
grant execute on function public.record_my_gamification_action(text, uuid, jsonb)
  to authenticated;

create or replace function gamification_private.rejected_action_summary()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with recent as (
    select rae.action_code, rae.rejection_reason, rae.rejected_at
    from gamification_private.rejected_action_events rae
    where rae.rejected_at >= now() - interval '30 days'
  ),
  reasons as (
    select coalesce(
      jsonb_object_agg(grouped.rejection_reason, grouped.event_count),
      '{}'::jsonb
    ) as values
    from (
      select rejection_reason, count(*)::integer as event_count
      from recent group by rejection_reason
    ) grouped
  ),
  actions as (
    select coalesce(
      jsonb_object_agg(grouped.action_code, grouped.event_count),
      '{}'::jsonb
    ) as values
    from (
      select action_code, count(*)::integer as event_count
      from recent group by action_code
    ) grouped
  )
  select jsonb_build_object(
    'count', (select count(*)::integer from recent),
    'latest_at', (select max(rejected_at) from recent),
    'by_reason', reasons.values,
    'by_action', actions.values
  )
  from reasons cross join actions;
$$;

revoke all on function gamification_private.rejected_action_summary()
  from public, anon, authenticated;

create or replace function public.preview_gamification_admin_console()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_quality jsonb;
  v_rules jsonb;
  v_quest_counts jsonb;
  v_challenge_counts jsonb;
  v_badge_counts jsonb;
  v_activity jsonb;
  v_rejections jsonb;
begin
  if (select auth.uid()) is null or not (select public.app_is_privileged()) then
    raise exception 'Insufficient privileges';
  end if;

  v_quality := gamification_private.data_quality_summary();
  v_rejections := gamification_private.rejected_action_summary();

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'action_code', ar.action_code, 'rule_version', ar.rule_version,
      'xp_amount', ar.xp_amount, 'window_kind', ar.window_kind,
      'max_awards_per_window', ar.max_awards_per_window,
      'is_active', ar.is_active, 'effective_from', ar.effective_from
    ) order by ar.action_code
  ), '[]'::jsonb) into v_rules
  from gamification_private.action_rules ar;

  select jsonb_build_object(
    'total', count(*)::integer,
    'draft', count(*) filter (where q.status = 'draft')::integer,
    'scheduled', count(*) filter (where q.status = 'scheduled')::integer,
    'active', count(*) filter (where q.status = 'active')::integer,
    'completed', count(*) filter (where q.status = 'completed')::integer,
    'archived', count(*) filter (where q.status = 'archived')::integer
  ) into v_quest_counts from public.quests q;

  select jsonb_build_object(
    'total', count(*)::integer,
    'draft', count(*) filter (where c.status = 'draft')::integer,
    'scheduled', count(*) filter (where c.status = 'scheduled')::integer,
    'active', count(*) filter (where c.status = 'active')::integer,
    'completed', count(*) filter (where c.status = 'completed')::integer,
    'archived', count(*) filter (where c.status = 'archived')::integer
  ) into v_challenge_counts from public.challenges c;

  select jsonb_build_object(
    'total', count(*)::integer,
    'active', count(*) filter (where coalesce(b.is_active, false))::integer,
    'inactive', count(*) filter (where not coalesce(b.is_active, false))::integer
  ) into v_badge_counts from public.badges b;

  select jsonb_build_object(
    'active_users_30d', count(distinct xh.user_id)::integer,
    'awards_30d', count(*)::integer,
    'xp_awarded_30d', coalesce(sum(xh.amount), 0)::bigint,
    'latest_award_at', max(xh.occurred_at),
    'lifecycle_transitions_30d', (
      select count(*)::integer from gamification_private.lifecycle_audit la
      where la.created_at >= now() - interval '30 days'
    ),
    'rejected_events', (v_rejections ->> 'count')::integer,
    'rejected_events_status', 'ok',
    'rejected_events_reason', null,
    'rejected_events_latest_at', v_rejections -> 'latest_at',
    'rejected_events_by_reason', v_rejections -> 'by_reason',
    'rejected_events_by_action', v_rejections -> 'by_action'
  ) into v_activity
  from public.xp_history xh
  where xh.occurred_at >= now() - interval '30 days'
    and xh.action <> 'OPENING_BALANCE';

  return jsonb_build_object(
    'version', '1', 'as_of', now(), 'timezone', 'Europe/Zurich',
    'contains_personal_data', false, 'write_performed', false,
    'rules', v_rules,
    'content', jsonb_build_object(
      'quests', v_quest_counts, 'challenges', v_challenge_counts,
      'badges', v_badge_counts
    ),
    'activity', v_activity,
    'quality', v_quality
  );
end;
$$;

comment on function public.preview_gamification_admin_console() is
  'Aggregate read-only gamification operations view for privileged users; no personal data.';
revoke all on function public.preview_gamification_admin_console()
  from public, anon;
grant execute on function public.preview_gamification_admin_console()
  to authenticated;

notify pgrst, 'reload schema';
