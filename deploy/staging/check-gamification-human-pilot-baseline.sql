\set ON_ERROR_STOP on
\pset pager off
\pset format unaligned
\pset fieldsep '|'

select
  pr.status as pilot_status,
  pr.starts_on,
  pr.ends_on,
  gd.total_xp,
  gd.current_level,
  gd.house_points,
  (select count(*) from public.xp_history x
    where x.user_id = pr.student_user_id) as xp_events,
  (select count(*) from public.user_badges b
    where b.user_id = pr.student_user_id) as badges,
  (select count(*) from public.user_challenge_progress c
    where c.user_id = pr.student_user_id) as challenge_progressions,
  (select count(*) from public.user_quest_progress q
    where q.user_id = pr.student_user_id) as quest_progressions,
  rc.rewards_enabled,
  rc.audience_mode,
  (select count(*) from gamification_private.rollout_audience) as allowlisted_users,
  exists (
    select 1
    from gamification_private.rollout_audience ra
    where ra.user_id = pr.student_user_id
  ) as pilot_student_allowlisted
from gamification_private.pilot_runs pr
join public.gamification_data gd on gd.user_id = pr.student_user_id
cross join gamification_private.rollout_config rc
where pr.batch_key = 'heds25-617-pilot-v1'
  and rc.singleton;

select
  rae.action_code,
  rae.rejection_reason,
  count(*) as rejection_count,
  max(rae.rejected_at) as latest_rejection_at
from gamification_private.rejected_action_events rae
join gamification_private.pilot_runs pr on pr.student_user_id = rae.user_id
where pr.batch_key = 'heds25-617-pilot-v1'
  and rae.rejected_at >= now() - interval '30 minutes'
group by rae.action_code, rae.rejection_reason
order by latest_rejection_at desc;
