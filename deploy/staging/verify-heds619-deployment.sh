#!/usr/bin/env bash
set -euo pipefail

ssh -o BatchMode=yes heds-vps \
  'sudo -n docker exec -i pfpheds-staging-db-1 psql -X -v ON_ERROR_STOP=1 -U postgres -d staging -At' <<'SQL'
select json_build_object(
  'user_badges', (select count(*) from public.user_badges),
  'badge_events', (select count(*) from public.xp_history where action = 'BADGE_UNLOCK'),
  'duplicates', (
    select count(*) from (
      select user_id, badge_id from public.user_badges
      group by user_id, badge_id having count(*) > 1
    ) duplicate_rows
  ),
  'active_badges', (select count(*) from public.badges where is_active),
  'unsupported_badges', (
    select count(*) from public.badges b
    where b.is_active and not coalesce(
      (gamification_private.validate_badge_conditions(b.conditions) ->> 'valid')::boolean,
      false
    )
  ),
  'unsupported_challenges', (
    select count(*) from public.challenges c
    where c.is_active and not exists (
      select 1 from gamification_private.action_rules ar
      where ar.is_active and ar.challenge_action = lower(c.action_type)
    )
  ),
  'audit_rows', (select count(*) from gamification_private.badge_condition_audit),
  'anon_progress_execute', has_function_privilege(
    'anon', 'public.get_my_badge_progress()', 'execute'
  ),
  'authenticated_progress_execute', has_function_privilege(
    'authenticated', 'public.get_my_badge_progress()', 'execute'
  )
);
SQL

production_status="$(curl -fsS -o /dev/null -w '%{http_code}' https://hedsvs.ch/)"
test "$production_status" = 200
printf 'PRODUCTION=%s\n' "$production_status"

node deploy/staging/diagnose-public-login.mjs

ssh -o BatchMode=yes heds-vps \
  'sudo -n test -s /opt/pfpheds-staging/backups/HEDS25-619-20260921-171913/staging.dump && printf "BACKUP=ok\n"'
