#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "$0")/../.." && pwd)
migration="$root/supabase/migrations/20260928114500_return_new_badges_in_action_response.sql"

test -f "$migration"

backup_path=$(
  ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps 'sudo -n bash -s' <<'REMOTE'
set -euo pipefail
stamp=$(date -u +%Y%m%d-%H%M%S)
backup="/opt/pfpheds-staging/backups/before-HEDS25-619-immediate-badge-${stamp}.dump"
docker exec pfpheds-staging-db-1 pg_dump -U postgres -d staging -Fc > "$backup"
test -s "$backup"
sha256sum "$backup" > "${backup}.sha256"
printf '%s\n' "$backup"
REMOTE
)

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  'sudo -n docker exec -i pfpheds-staging-db-1 psql -X -v ON_ERROR_STOP=1 -U postgres -d staging' \
  < "$migration"

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  'sudo -n docker exec -i pfpheds-staging-db-1 psql -X -v ON_ERROR_STOP=1 -U postgres -d staging -At' <<'SQL'
select case
  when pg_get_functiondef(
    'public.record_my_gamification_action(text,uuid,jsonb)'::regprocedure
  ) like '%v_badges_before%'
  then 'immediate_badge_response=installed'
  else 'immediate_badge_response=missing'
end;
SQL

printf 'backup=%s\n' "$backup_path"
