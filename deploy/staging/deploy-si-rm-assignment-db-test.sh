#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "$0")/../.." && pwd)
migration="$root/supabase/migrations/20260929180605_secure_si_rm_assignment.sql"
stamp=$(date +%Y%m%d-%H%M%S)
remote_backup="/opt/pfpheds-staging/backups/before-si-rm-assignment-db-$stamp.dump"

test -f "$migration"

already_deployed=$(ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  "sudo -n docker exec pfpheds-staging-db-1 psql -X -U postgres -d staging -Atc \"select to_regprocedure('public.assign_si_postulation_teachers(bigint,uuid[])') is not null and to_regclass('public.si_postulation_assignment_history') is not null\"")

if [ "$already_deployed" != "t" ]; then
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
  'sudo -n docker exec pfpheds-staging-db-1 psql -X -v ON_ERROR_STOP=1 -U postgres -d staging -c "notify pgrst, '\''reload schema'\'';"'

verification=$(ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  'sudo -n docker exec pfpheds-staging-db-1 psql -X -U postgres -d staging -Atc "select to_regprocedure('\''public.assign_si_postulation_teachers(bigint,uuid[])'\'') is not null and to_regprocedure('\''public.undo_si_postulation_assignment(uuid)'\'') is not null and to_regclass('\''public.si_postulation_assignment_history'\'') is not null and (select count(*) from pg_policies where schemaname='\''public'\'' and tablename='\''si_postulation_assignment_history'\'' and policyname='\''si_postulation_assignment_history_select_scoped'\'') = 1;"')
test "$verification" = "t"

printf 'ENVIRONMENT=test\nMIGRATION=secure_si_rm_assignment\nPRODUCTION_TOUCHED=false\n'
if [ "$already_deployed" != "t" ]; then
  printf 'DB_BACKUP=%s\n' "$remote_backup"
fi

