#!/bin/bash
set -euo pipefail

root=$(cd "$(dirname "$0")/../.." && pwd)
migration="$root/supabase/migrations/20260922150638_gamification_admin_console.sql"
test_sql="$root/supabase/tests/gamification_admin_console_isolation.sql"

test -f "$migration"
test -f "$test_sql"

{
  printf 'begin;\n'
  sed '/^begin;$/d; /^rollback;$/d' "$migration" "$test_sql"
  printf 'rollback;\n'
} | ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  'sudo -n docker exec -i pfpheds-staging-db-1 psql -X -v ON_ERROR_STOP=1 -U postgres -d staging'
