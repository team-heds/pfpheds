#!/bin/bash
set -euo pipefail

root=$(cd "$(dirname "$0")/../.." && pwd)
migration="$root/supabase/migrations/20260929094941_secure_si_postulation_votes.sql"
isolation="$root/supabase/tests/si_postulation_votes_isolation.sql"

test -f "$migration"
test -f "$isolation"

{
  printf 'begin;\n'
  sed '/^begin;$/d; /^rollback;$/d' "$migration" "$isolation"
  printf 'rollback;\n'
} | ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  'sudo -n docker exec -i pfpheds-staging-db-1 psql -X -v ON_ERROR_STOP=1 -U postgres -d staging'
