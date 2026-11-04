#!/bin/bash
set -euo pipefail

root=$(cd "$(dirname "$0")/../.." && pwd)
migration="$root/supabase/migrations/20260923121500_gamification_rollout_controls.sql"
isolation="$root/supabase/tests/gamification_rollout_controls.sql"
configuration="$root/deploy/staging/configure-gamification-rollout-test.sql"
stamp=$(date +%Y%m%d-%H%M%S)
remote_backup="/opt/pfpheds-staging/backups/before-gamification-rollout-$stamp.dump"

test -f "$migration"
test -f "$isolation"
test -f "$configuration"

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  "sudo -n bash -s -- '$remote_backup'" <<'REMOTE'
set -euo pipefail
backup=$1
test ! -e "$backup"
test "$(docker exec pfpheds-staging-db-1 psql -X -U postgres -d staging -Atc \
  "select to_regprocedure('public.preview_gamification_rollout()') is not null")" = f
docker exec pfpheds-staging-db-1 pg_dump -U postgres -d staging -Fc > "$backup"
test -s "$backup"
sha256sum "$backup"
REMOTE

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  'sudo -n docker exec -i pfpheds-staging-db-1 psql -X -1 -v ON_ERROR_STOP=1 -U postgres -d staging' \
  < "$migration"

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  'sudo -n docker exec -i pfpheds-staging-db-1 psql -X -v ON_ERROR_STOP=1 -U postgres -d staging' \
  < "$configuration"

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  'sudo -n docker exec -i pfpheds-staging-db-1 psql -X -v ON_ERROR_STOP=1 -U postgres -d staging' \
  < "$isolation"

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  'sudo -n docker exec -i pfpheds-staging-db-1 psql -X -At -v ON_ERROR_STOP=1 -U postgres -d staging' <<'SQL'
select jsonb_pretty(gamification_private.rollout_summary());
select jsonb_pretty(gamification_private.data_quality_summary());
SQL

printf 'DB_BACKUP=%s\n' "$remote_backup"
