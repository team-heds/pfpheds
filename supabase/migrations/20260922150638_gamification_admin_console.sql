-- HEDS25-625 / GAM-013: privileged, aggregate and read-only gamification
-- administration console. The response deliberately contains no user-level
-- identifiers and reports unavailable measurements explicitly.

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
begin
  if (select auth.uid()) is null or not (select public.app_is_privileged()) then
    raise exception 'Insufficient privileges';
  end if;

  v_quality := gamification_private.data_quality_summary();

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'action_code', ar.action_code,
      'rule_version', ar.rule_version,
      'xp_amount', ar.xp_amount,
      'window_kind', ar.window_kind,
      'max_awards_per_window', ar.max_awards_per_window,
      'is_active', ar.is_active,
      'effective_from', ar.effective_from
    ) order by ar.action_code
  ), '[]'::jsonb)
  into v_rules
  from gamification_private.action_rules ar;

  select jsonb_build_object(
    'total', count(*)::integer,
    'draft', count(*) filter (where q.status = 'draft')::integer,
    'scheduled', count(*) filter (where q.status = 'scheduled')::integer,
    'active', count(*) filter (where q.status = 'active')::integer,
    'completed', count(*) filter (where q.status = 'completed')::integer,
    'archived', count(*) filter (where q.status = 'archived')::integer
  ) into v_quest_counts
  from public.quests q;

  select jsonb_build_object(
    'total', count(*)::integer,
    'draft', count(*) filter (where c.status = 'draft')::integer,
    'scheduled', count(*) filter (where c.status = 'scheduled')::integer,
    'active', count(*) filter (where c.status = 'active')::integer,
    'completed', count(*) filter (where c.status = 'completed')::integer,
    'archived', count(*) filter (where c.status = 'archived')::integer
  ) into v_challenge_counts
  from public.challenges c;

  select jsonb_build_object(
    'total', count(*)::integer,
    'active', count(*) filter (where coalesce(b.is_active, false))::integer,
    'inactive', count(*) filter (where not coalesce(b.is_active, false))::integer
  ) into v_badge_counts
  from public.badges b;

  select jsonb_build_object(
    'active_users_30d', count(distinct xh.user_id)::integer,
    'awards_30d', count(*)::integer,
    'xp_awarded_30d', coalesce(sum(xh.amount), 0)::bigint,
    'latest_award_at', max(xh.occurred_at),
    'lifecycle_transitions_30d', (
      select count(*)::integer
      from gamification_private.lifecycle_audit la
      where la.created_at >= now() - interval '30 days'
    ),
    'rejected_events', null,
    'rejected_events_status', 'unavailable',
    'rejected_events_reason', 'not_persisted'
  ) into v_activity
  from public.xp_history xh
  where xh.occurred_at >= now() - interval '30 days'
    -- Opening balances are migration history, not recent engagement.
    and xh.action <> 'OPENING_BALANCE';

  return jsonb_build_object(
    'version', '1',
    'as_of', now(),
    'timezone', 'Europe/Zurich',
    'contains_personal_data', false,
    'write_performed', false,
    'rules', v_rules,
    'content', jsonb_build_object(
      'quests', v_quest_counts,
      'challenges', v_challenge_counts,
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
