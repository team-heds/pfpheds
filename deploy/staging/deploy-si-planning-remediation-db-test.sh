#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "$0")/../.." && pwd)
migration="$root/supabase/migrations/20260930060553_secure_si_planning_remediation.sql"
alignment="$root/supabase/migrations/20260930065312_align_si_course_remediation_evidence.sql"
isolation="$root/supabase/tests/si_planning_remediation_isolation.sql"
stamp=$(date +%Y%m%d-%H%M%S)
remote_backup="/opt/pfpheds-staging/backups/before-si-planning-remediation-$stamp.dump"

test -f "$migration"
test -f "$alignment"
test -f "$isolation"

already_deployed=$(ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  "sudo -n docker exec pfpheds-staging-db-1 psql -X -U postgres -d staging -Atc \"select to_regprocedure('public.apply_si_planning_remediation(uuid,bigint,text,jsonb,jsonb,text)') is not null and to_regclass('public.si_planning_remediation_history') is not null\"")
already_aligned=$(ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  "sudo -n docker exec pfpheds-staging-db-1 psql -X -U postgres -d staging -Atc \"select coalesce(pg_get_functiondef(to_regprocedure('public.apply_si_planning_remediation(uuid,bigint,text,jsonb,jsonb,text)')) like '%verified planning donor%', false)\"")

if [ "$already_deployed" != "t" ] || [ "$already_aligned" != "t" ]; then
  ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
    "sudo -n bash -s -- '$remote_backup'" <<'REMOTE'
set -euo pipefail
backup=$1
test "$(docker exec pfpheds-staging-db-1 psql -X -U postgres -d staging -Atc 'select current_database()')" = staging
test ! -e "$backup"
docker exec pfpheds-staging-db-1 pg_dump -U postgres -d staging -Fc > "$backup"
test -s "$backup"
REMOTE

fi

if [ "$already_deployed" != "t" ]; then
  ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
    'sudo -n docker exec -i pfpheds-staging-db-1 psql -X -1 -v ON_ERROR_STOP=1 -U postgres -d staging' \
    < "$migration"
fi

if [ "$already_aligned" != "t" ]; then
  ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
    'sudo -n docker exec -i pfpheds-staging-db-1 psql -X -1 -v ON_ERROR_STOP=1 -U postgres -d staging' \
    < "$alignment"
fi

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  'sudo -n docker exec -i pfpheds-staging-db-1 psql -X -v ON_ERROR_STOP=1 -U postgres -d staging' \
  < "$isolation"

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  'sudo -n docker exec pfpheds-staging-db-1 psql -X -v ON_ERROR_STOP=1 -U postgres -d staging -c "notify pgrst, '\''reload schema'\'';"'

verification=$(ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  'sudo -n docker exec pfpheds-staging-db-1 psql -X -U postgres -d staging -Atc "select to_regprocedure('\''public.apply_si_planning_remediation(uuid,bigint,text,jsonb,jsonb,text)'\'') is not null and to_regprocedure('\''public.revert_si_planning_remediation(uuid,uuid)'\'') is not null and to_regclass('\''public.si_planning_remediation_history'\'') is not null and not has_table_privilege('\''authenticated'\'', '\''public.si_planning_remediation_history'\'', '\''SELECT'\'');"')
test "$verification" = "t"

printf 'ENVIRONMENT=test\nMIGRATION=secure_si_planning_remediation\nPRODUCTION_TOUCHED=false\n'
if [ "$already_deployed" != "t" ] || [ "$already_aligned" != "t" ]; then printf 'DB_BACKUP=%s\n' "$remote_backup"; fi
