#!/usr/bin/env bash
set -euo pipefail
build=${1:?Isolated TEST build directory required}
test -f "$build/dist/index.html"
test -f "$build/dist/sw.js"
stamp=$(date -u +%Y%m%d-%H%M%S)
candidate="/tmp/pfpheds-storage-frontend-${stamp}"
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps "mkdir -m 700 '$candidate'"
rsync -az "$build/dist/" "heds-vps:$candidate/"
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps "sudo -n bash -s -- '$candidate' '$stamp'" <<'REMOTE'
set -euo pipefail
candidate=$1
stamp=$2
root=/opt/pfpheds-staging/frontend-dist
backup="/opt/pfpheds-staging/backups/frontend-before-storage-${stamp}.tar.gz"
test -f "$root/index.html"
test -f "$candidate/index.html"
tar -czf "$backup" -C "$root" .
test -s "$backup"
# Preserve old hashed assets for already-open browser tabs.
rsync -a --exclude=index.html --exclude=sw.js "$candidate/" "$root/"
install -m 644 "$candidate/index.html" "$root/index.html.next"
install -m 644 "$candidate/sw.js" "$root/sw.js.next"
mv "$root/index.html.next" "$root/index.html"
mv "$root/sw.js.next" "$root/sw.js"
cmp "$candidate/index.html" "$root/index.html"
cmp "$candidate/sw.js" "$root/sw.js"
docker exec pfpheds-staging-gateway-1 sha256sum /srv/frontend/index.html /srv/frontend/sw.js
echo "STORAGE_TEST_FRONTEND_BACKUP=$backup"
REMOTE
