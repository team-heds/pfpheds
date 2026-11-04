#!/usr/bin/env bash
set -euo pipefail
test "$(hostname)" = ov-7a3a52
umask 077
cd /opt/pfpheds-staging
archive=/opt/pfpheds-staging/backups/clone-20260915
test -s "$archive/test-before.dump"
test "$(docker exec pfpheds-staging-db-1 psql -U postgres -d staging_real_20260915 -Atc 'select count(*) from auth.users')" = 327
test "$(docker exec pfpheds-staging-db-1 psql -U postgres -d staging_real_20260915 -Atc 'select count(*) from auth.sessions')" = 0
test -d /opt/supabase/storage/undefined/storage-single-tenant
test ! -e /var/lib/docker/volumes/pfpheds-staging_files/_data/staging/staging
tar -czf "$archive/files-before.tar.gz" -C /var/lib/docker/volumes/pfpheds-staging_files/_data .
docker-compose --env-file .env -f compose.yml stop gateway auth rest storage backend
docker exec -i pfpheds-staging-db-1 sh -c 'export PGPASSWORD="$POSTGRES_PASSWORD"; psql -X -v ON_ERROR_STOP=1 -U supabase_admin -d postgres' <<'SQL'
ALTER DATABASE staging RENAME TO staging_synthetic_20260915;
ALTER DATABASE staging_real_20260915 RENAME TO staging;
SQL
mkdir -p /var/lib/docker/volumes/pfpheds-staging_files/_data/staging
cp -a /opt/supabase/storage/undefined/storage-single-tenant /var/lib/docker/volumes/pfpheds-staging_files/_data/staging/staging
docker-compose --env-file .env -f compose.yml start auth rest storage backend gateway
echo 'Test database switched; synthetic database retained for rollback.'
