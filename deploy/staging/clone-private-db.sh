#!/usr/bin/env bash
set -euo pipefail
# Run as root on the verified HEdS VPS. Creates an OFFLINE candidate only.
# No production writes, no service switch, no deletion of the existing test DB.
test "$(hostname)" = ov-7a3a52
umask 077
archive=/opt/pfpheds-staging/backups/clone-20260915
test ! -e "$archive"
mkdir -p "$archive"
docker exec pfpheds-staging-db-1 pg_dump -U postgres -d staging -Fc > "$archive/test-before.dump"
test -s "$archive/test-before.dump"
docker exec supabase-db-1 pg_dump -U postgres -d postgres -Fc \
  --exclude-table-data='auth.sessions' \
  --exclude-table-data='auth.refresh_tokens' \
  --exclude-table-data='auth.flow_state' \
  --exclude-table-data='auth.mfa_*' \
  --exclude-table-data='auth.saml_*' \
  --exclude-table-data='auth.sso_*' \
  --exclude-table-data='auth.instances' \
  --exclude-table-data='auth.audit_log_entries' \
  --exclude-table-data='net.*' \
  --exclude-table-data='realtime.*' \
  --exclude-table-data='public.push_subscriptions' \
  --exclude-table-data='public.push_outbox' > "$archive/source.dump"
test -s "$archive/source.dump"
docker exec pfpheds-staging-db-1 createdb -U postgres -T template0 staging_clone_20260915
docker exec -i pfpheds-staging-db-1 pg_restore -U postgres -d staging_clone_20260915 --exit-on-error < "$archive/source.dump" > "$archive/restore.log" 2>&1
echo 'Offline candidate restored; existing test database unchanged.'
