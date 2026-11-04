#!/bin/bash
set -euo pipefail

root=$(cd "$(dirname "$0")/../.." && pwd)
candidate=${1:?Usage: deploy-heds628-test.sh /absolute/path/to/staging/dist}
migration="$root/supabase/migrations/20260929094941_secure_si_postulation_votes.sql"
isolation="$root/supabase/tests/si_postulation_votes_isolation.sql"
stamp=$(date +%Y%m%d-%H%M%S)
archive_dir=$(mktemp -d /tmp/heds628-test-release.XXXXXX)
archive="$archive_dir/release.tar.gz"
remote_archive="/tmp/heds628-test-$stamp.tar.gz"
remote_candidate="/opt/pfpheds-staging/frontend-heds628-$stamp"
remote_db_backup="/opt/pfpheds-staging/backups/before-HEDS25-628-$stamp.dump"
remote_frontend_backup="/opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-628-$stamp"

test -f "$migration"
test -f "$isolation"
test -f "$candidate/index.html"
test -f "$candidate/sw.js"

index_hash=$(shasum -a 256 "$candidate/index.html" | awk '{print $1}')
sw_hash=$(shasum -a 256 "$candidate/sw.js" | awk '{print $1}')
tar --no-xattrs -czf "$archive" -C "$candidate" .
scp -q -o BatchMode=yes -o StrictHostKeyChecking=yes "$archive" "heds-vps:$remote_archive"

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  "sudo -n bash -s -- '$remote_db_backup' '$remote_frontend_backup' '$remote_candidate'" <<'REMOTE'
set -euo pipefail
db_backup=$1
frontend_backup=$2
candidate=$3

test "$(docker exec pfpheds-staging-db-1 psql -X -U postgres -d staging -Atc 'select current_database()')" = staging
test "$(docker exec pfpheds-staging-db-1 psql -X -U postgres -d staging -Atc "select count(*) from pg_policies where schemaname='public' and tablename='planning_slot_votes' and policyname='planning_slot_votes_select_auth'")" = 1
test ! -e "$db_backup"
test ! -e "$frontend_backup"
test ! -e "$candidate"
docker exec pfpheds-staging-db-1 pg_dump -U postgres -d staging -Fc > "$db_backup"
test -s "$db_backup"
cp -a /opt/pfpheds-staging/frontend-dist "$frontend_backup"
mkdir "$candidate"
sha256sum "$db_backup"
REMOTE

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  'sudo -n docker exec -i pfpheds-staging-db-1 psql -X -1 -v ON_ERROR_STOP=1 -U postgres -d staging' \
  < "$migration"

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  'sudo -n docker exec -i pfpheds-staging-db-1 psql -X -v ON_ERROR_STOP=1 -U postgres -d staging' \
  < "$isolation"

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  "sudo -n bash -s -- '$remote_archive' '$remote_candidate' '$index_hash' '$sw_hash'" <<'REMOTE'
set -euo pipefail
archive=$1
candidate=$2
index_hash=$3
sw_hash=$4
root=/opt/pfpheds-staging

tar -xzf "$archive" -C "$candidate"
test -f "$candidate/index.html"
test -f "$candidate/sw.js"
echo "$index_hash  $candidate/index.html" | sha256sum -c -
echo "$sw_hash  $candidate/sw.js" | sha256sum -c -

rsync -a --exclude=index.html --exclude=sw.js "$candidate/" "$root/frontend-dist/"
install -m 644 "$candidate/index.html" "$root/frontend-dist/index.html.next"
install -m 644 "$candidate/sw.js" "$root/frontend-dist/sw.js.next"
mv "$root/frontend-dist/index.html.next" "$root/frontend-dist/index.html"
mv "$root/frontend-dist/sw.js.next" "$root/frontend-dist/sw.js"

echo "$index_hash  $root/frontend-dist/index.html" | sha256sum -c -
echo "$sw_hash  $root/frontend-dist/sw.js" | sha256sum -c -
docker exec pfpheds-staging-gateway-1 sha256sum /srv/frontend/index.html /srv/frontend/sw.js

docker exec pfpheds-staging-db-1 psql -X -U postgres -d staging -Atc "
select count(*) = 4
from pg_policies
where schemaname = 'public'
  and tablename = 'planning_slot_votes'
  and policyname in (
    'planning_slot_votes_select_scoped',
    'planning_slot_votes_insert_own',
    'planning_slot_votes_update_own',
    'planning_slot_votes_delete_scoped'
  );
select not has_table_privilege('anon', 'public.planning_slot_votes', 'SELECT,INSERT,UPDATE,DELETE');
"
REMOTE

printf 'DB_BACKUP=%s\nFRONTEND_BACKUP=%s\nINDEX_SHA256=%s\n' \
  "$remote_db_backup" "$remote_frontend_backup" "$index_hash"
