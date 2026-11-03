#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "$0")/../.." && pwd)
migration="$root/supabase/migrations/20260928114500_return_new_badges_in_action_response.sql"
pilot_isolation="$root/supabase/tests/gamification_pilot_isolation.sql"

test -f "$migration"
test -f "$pilot_isolation"

{
  printf 'begin;\n'
  sed '/^begin;$/d; /^rollback;$/d' "$migration" "$pilot_isolation"
  printf 'rollback;\n'
} | ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  'sudo -n docker exec -i pfpheds-staging-db-1 psql -X -v ON_ERROR_STOP=1 -U postgres -d staging'
