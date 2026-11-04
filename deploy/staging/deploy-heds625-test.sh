#!/bin/bash
set -euo pipefail

root=$(cd "$(dirname "$0")/../.." && pwd)
migration="$root/supabase/migrations/20260922150638_gamification_admin_console.sql"
candidate=/var/folders/bc/rk779r992jn72qy_td959_wm0000gn/T/heds-admin-preview-YR17Ic/dist
archive=$(mktemp /tmp/heds625-test-release.XXXXXX)
remote_archive=/tmp/heds625-test-20260922.tar.gz
remote_db_backup=/opt/pfpheds-staging/backups/before-HEDS25-625-20260922.dump
remote_frontend_backup=/opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-625-20260922

test -f "$migration"
test -f "$candidate/index.html"
test -f "$candidate/sw.js"
tar --no-xattrs -czf "$archive" -C "$candidate" .
scp -q -o BatchMode=yes -o StrictHostKeyChecking=yes "$archive" "heds-vps:$remote_archive"

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  "sudo -n bash -s -- '$remote_db_backup' '$remote_frontend_backup'" <<'REMOTE'
set -euo pipefail
db_backup=$1
frontend_backup=$2
test ! -e "$db_backup"
test ! -e "$frontend_backup"
test "$(docker exec pfpheds-staging-db-1 psql -X -U postgres -d staging -Atc "select to_regprocedure('public.preview_gamification_admin_console()') is not null")" = f
echo '5fa7661d8d13ed8e6bbaf912a02e562c3f20473b716bfef843aa3ff7f21fa38b  /opt/pfpheds-staging/frontend-dist/index.html' | sha256sum -c -
docker exec pfpheds-staging-db-1 pg_dump -U postgres -d staging -Fc > "$db_backup"
test -s "$db_backup"
cp -a /opt/pfpheds-staging/frontend-dist "$frontend_backup"
sha256sum "$db_backup"
REMOTE

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  'sudo -n docker exec -i pfpheds-staging-db-1 psql -X -1 -v ON_ERROR_STOP=1 -U postgres -d staging' \
  < "$migration"

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  'sudo -n docker exec pfpheds-staging-db-1 psql -X -v ON_ERROR_STOP=1 -U postgres -d staging -c "notify pgrst, '\''reload schema'\'';"'

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps 'sudo -n bash -s' <<'REMOTE'
set -euo pipefail
root=/opt/pfpheds-staging
candidate="$root/frontend-heds625-20260922"
test ! -e "$candidate"
mkdir "$candidate"
tar -xzf /tmp/heds625-test-20260922.tar.gz -C "$candidate"
test -f "$candidate/index.html"
test -f "$candidate/sw.js"
rsync -a --exclude=index.html --exclude=sw.js "$candidate/" "$root/frontend-dist/"
install -m 644 "$candidate/index.html" "$root/frontend-dist/index.html.next"
install -m 644 "$candidate/sw.js" "$root/frontend-dist/sw.js.next"
mv "$root/frontend-dist/index.html.next" "$root/frontend-dist/index.html"
mv "$root/frontend-dist/sw.js.next" "$root/frontend-dist/sw.js"
cmp "$candidate/index.html" "$root/frontend-dist/index.html"
cmp "$candidate/sw.js" "$root/frontend-dist/sw.js"
docker exec pfpheds-staging-gateway-1 sha256sum /srv/frontend/index.html /srv/frontend/sw.js
REMOTE

printf 'DB_BACKUP=%s\nFRONTEND_BACKUP=%s\n' "$remote_db_backup" "$remote_frontend_backup"
