#!/usr/bin/env bash
set -euo pipefail
test "$(hostname)" = ov-7a3a52
umask 077
archive=/opt/pfpheds-staging/backups/clone-20260915
docker exec pfpheds-staging-db-1 sh -c 'export PGPASSWORD="$POSTGRES_PASSWORD"; createdb -U supabase_admin -T template0 staging_real_20260915'
docker exec -i pfpheds-staging-db-1 sh -c 'export PGPASSWORD="$POSTGRES_PASSWORD"; pg_restore -U supabase_admin -d staging_real_20260915 --exit-on-error' < "$archive/source.dump" > "$archive/restore-real.log" 2>&1
echo 'Offline real-data candidate restored.'
