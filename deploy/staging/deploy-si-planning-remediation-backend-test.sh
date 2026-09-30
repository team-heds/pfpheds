#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "$0")/../.." && pwd)
stamp=$(date +%Y%m%d-%H%M%S)
archive_dir=$(mktemp -d /tmp/si-remediation-backend.XXXXXX)
archive="$archive_dir/backend.tar.gz"
remote_archive="/tmp/si-remediation-backend-$stamp.tar.gz"
remote_backup="/opt/pfpheds-staging/backups/backend-before-si-remediation-$stamp.tar.gz"
image_backup="pfpheds-staging-backend:before-si-remediation-$stamp"

tar --no-xattrs -czf "$archive" -C "$root" \
  backend/index.js backend/supabase/siPlanningRemediationBackend.js
scp -q -o BatchMode=yes -o StrictHostKeyChecking=yes "$archive" "heds-vps:$remote_archive"

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  "sudo -n bash -s -- '$remote_archive' '$remote_backup' '$image_backup'" <<'REMOTE'
set -euo pipefail
archive=$1
backup=$2
image_backup=$3
root=/opt/pfpheds-staging

test -f "$root/backend/index.js"
test ! -e "$backup"
tar -czf "$backup" -C "$root" backend/index.js
tar -tzf "$backup" >/dev/null
docker tag pfpheds-staging-backend "$image_backup"

tar -xzf "$archive" -C "$root"
test -f "$root/backend/supabase/siPlanningRemediationBackend.js"
cd "$root"
docker-compose -p pfpheds-staging build backend
docker-compose -p pfpheds-staging up -d --no-deps backend

for attempt in $(seq 1 30); do
  if docker exec pfpheds-staging-backend-1 node -e "fetch('http://127.0.0.1:3000/api/ping').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"; then
    break
  fi
  if [ "$attempt" = 30 ]; then exit 1; fi
  sleep 1
done
docker exec pfpheds-staging-backend-1 test -f /app/supabase/siPlanningRemediationBackend.js
rm -f "$archive"
REMOTE

printf 'ENVIRONMENT=test\nBACKEND_BACKUP=%s\nBACKEND_IMAGE_BACKUP=%s\nPRODUCTION_TOUCHED=false\n' \
  "$remote_backup" "$image_backup"
