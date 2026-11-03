#!/bin/bash
set -euo pipefail

root=$(cd "$(dirname "$0")/../.." && pwd)
migration="$root/supabase/migrations/20260922174340_audit_rejected_gamification_events.sql"
engine_isolation="$root/supabase/tests/gamification_action_engine_isolation.sql"
isolation="$root/supabase/tests/gamification_rejected_events_isolation.sql"

test -f "$migration"
test -f "$engine_isolation"
test -f "$isolation"

{
  printf 'begin;\n'
  sed '/^begin;$/d; /^rollback;$/d' "$migration" "$engine_isolation" "$isolation"
  printf 'rollback;\n'
} | ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  'sudo -n docker exec -i pfpheds-staging-db-1 psql -X -v ON_ERROR_STOP=1 -U postgres -d staging'
