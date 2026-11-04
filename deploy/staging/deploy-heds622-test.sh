#!/bin/bash
set -euo pipefail

root=$(cd "$(dirname "$0")/../.." && pwd)
migration="$root/supabase/migrations/20260922094338_gamification_data_quality_controls.sql"
remote_backup=/opt/pfpheds-staging/backups/before-HEDS25-622-20260922.dump
batch_key=heds25-622-test-20260922-v1

test -f "$migration"

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  "sudo -n bash -s -- '$remote_backup'" <<'REMOTE'
set -euo pipefail
backup=$1
test ! -e "$backup"
docker exec pfpheds-staging-db-1 pg_dump -U postgres -d staging -Fc > "$backup"
test -s "$backup"
if docker exec pfpheds-staging-db-1 psql -X -U postgres -d staging -Atc \
  "select to_regprocedure('public.preview_gamification_data_quality()') is not null" \
  | grep -qx t; then
  echo 'HEDS25-622 is already installed' >&2
  exit 1
fi
sha256sum "$backup"
REMOTE

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  'sudo -n docker exec -i pfpheds-staging-db-1 psql -X -1 -v ON_ERROR_STOP=1 -U postgres -d staging' \
  < "$migration"

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  "sudo -n docker exec -i pfpheds-staging-db-1 psql -X -v ON_ERROR_STOP=1 -U postgres -d staging -At -v batch_key='$batch_key'" <<'SQL'
begin;
select set_config(
  'request.jwt.claim.sub',
  (
    select up.user_id::text
    from public.user_profiles up
    where lower(coalesce(up.role, '')) in (
      'admin', 'super.all', 'adminphysio', 'adminsoins'
    )
       or coalesce(up.permissions, '{}'::jsonb)
          ?| array['admin', 'super.all', 'editor']
    order by up.user_id
    limit 1
  ),
  true
);
set local role authenticated;
select public.apply_gamification_data_quality(:'batch_key');
commit;
select jsonb_build_object(
  'quarantine_rows', (
    select count(*) from gamification_private.data_quality_quarantine
  ),
  'house_sync_audit_rows', (
    select count(*) from gamification_private.profile_house_sync_audit
  ),
  'applied_runs', (
    select count(*) from gamification_private.data_quality_runs
    where status = 'applied'
  ),
  'public_history_rows', jsonb_build_object(
    'gamification_data', (select count(*) from public.gamification_data),
    'user_quest_progress', (select count(*) from public.user_quest_progress),
    'user_badges', (select count(*) from public.user_badges),
    'xp_history', (select count(*) from public.xp_history)
  )
);
SQL

printf 'BACKUP=%s\n' "$remote_backup"

