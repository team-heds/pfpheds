#!/bin/bash
set -euo pipefail

root=$(cd "$(dirname "$0")/../.." && pwd)
migration="$root/supabase/migrations/20260922094338_gamification_data_quality_controls.sql"
test -f "$migration"

if [ "$#" -gt 0 ]; then
  tests=("$@")
else
  tests=("supabase/tests/gamification_data_quality_isolation.sql")
fi

for relative_test in "${tests[@]}"; do
  test_sql="$root/$relative_test"
  test -f "$test_sql"
  printf 'TEST=%s\n' "$relative_test"
  {
    printf '%s\n' '\set ON_ERROR_STOP on' 'begin;'
    sed '/^\\set ON_ERROR_STOP on$/d' "$migration"
    sed \
      -e '/^\\set ON_ERROR_STOP on$/d' \
      -e '/^begin;$/d' \
      -e '/^rollback;$/d' \
      "$test_sql"
    printf '%s\n' 'rollback;'
  } | ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
    'sudo -n docker exec -i pfpheds-staging-db-1 psql -X -q -v ON_ERROR_STOP=1 -U postgres -d staging'
done
