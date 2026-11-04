#!/bin/bash
set -euo pipefail

root=$(cd "$(dirname "$0")/../.." && pwd)
migration="$root/supabase/migrations/20260929094941_secure_si_postulation_votes.sql"
isolation="$root/supabase/tests/si_postulation_votes_isolation.sql"
stamp=$(date +%Y%m%d-%H%M%S)
remote_backup="/opt/pfpheds-staging/backups/before-HEDS25-628-db-$stamp.dump"

test -f "$migration"
test -f "$isolation"

already_deployed=$(ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  "sudo -n docker exec pfpheds-staging-db-1 psql -X -U postgres -d staging -Atc \"select to_regprocedure('public.app_is_si_postulation_teacher()') is not null\"")

if [ "$already_deployed" = "t" ]; then
  printf 'HEDS25-628 database migration already present on test.\n'
else
  ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
    "sudo -n bash -s -- '$remote_backup'" <<'REMOTE'
set -euo pipefail
backup=$1
test "$(docker exec pfpheds-staging-db-1 psql -X -U postgres -d staging -Atc 'select current_database()')" = staging
test ! -e "$backup"
docker exec pfpheds-staging-db-1 pg_dump -U postgres -d staging -Fc > "$backup"
test -s "$backup"
REMOTE

  ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
    'sudo -n docker exec -i pfpheds-staging-db-1 psql -X -1 -v ON_ERROR_STOP=1 -U postgres -d staging' \
    < "$migration"
fi

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  'sudo -n docker exec -i pfpheds-staging-db-1 psql -X -v ON_ERROR_STOP=1 -U postgres -d staging' \
  < "$isolation"

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  'sudo -n docker exec pfpheds-staging-db-1 psql -X -v ON_ERROR_STOP=1 -U postgres -d staging -c "notify pgrst, '\''reload schema'\'';"'

verification=$(ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  'sudo -n docker exec pfpheds-staging-db-1 psql -X -U postgres -d staging -Atc "select (select count(*) from pg_policies where schemaname='\''public'\'' and tablename='\''planning_slot_votes'\'' and policyname in ('\''planning_slot_votes_select_scoped'\'', '\''planning_slot_votes_insert_own'\'', '\''planning_slot_votes_update_own'\'', '\''planning_slot_votes_delete_scoped'\'')) = 4 and to_regprocedure('\''public.app_is_si_postulation_teacher()'\'') is not null and to_regprocedure('\''public.app_is_si_postulation_manager()'\'') is not null and to_regprocedure('\''public.app_can_manage_si_postulation_slot(bigint)'\'') is not null;"')
test "$verification" = "t"

printf 'ENVIRONMENT=test\nMIGRATION=HEDS25-628\nISOLATION_TEST=passed\nPRODUCTION_TOUCHED=false\n'
if [ "$already_deployed" != "t" ]; then
  printf 'DB_BACKUP=%s\n' "$remote_backup"
fi
