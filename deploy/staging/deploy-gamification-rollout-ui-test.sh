#!/bin/bash
set -euo pipefail

root=$(cd "$(dirname "$0")/../.." && pwd)
dist="$root/dist"
remote_dir=/tmp/pfpheds-gamification-rollout-ui-20260923

test -f "$dist/index.html"
test -f "$dist/sw.js"

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  "rm -rf '$remote_dir' && mkdir -p '$remote_dir'"
rsync -az --exclude index.html --exclude sw.js "$dist/" "heds-vps:$remote_dir/"
scp -q -o BatchMode=yes -o StrictHostKeyChecking=yes \
  "$dist/index.html" "$dist/sw.js" "heds-vps:$remote_dir/"

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  "sudo -n bash -s -- '$remote_dir'" <<'REMOTE'
set -euo pipefail
candidate=$1
root=/opt/pfpheds-staging
backup=$root/backups/frontend-entrypoints-before-gamification-rollout-20260923.tar.gz

if test ! -e "$backup"; then
  tar -czf "$backup" -C "$root/frontend-dist" index.html sw.js
fi
test -s "$backup"

rsync -a --exclude=index.html --exclude=sw.js "$candidate/" "$root/frontend-dist/"
install -m 644 "$candidate/index.html" "$root/frontend-dist/index.html.next"
install -m 644 "$candidate/sw.js" "$root/frontend-dist/sw.js.next"
mv "$root/frontend-dist/index.html.next" "$root/frontend-dist/index.html"
mv "$root/frontend-dist/sw.js.next" "$root/frontend-dist/sw.js"
cmp "$candidate/index.html" "$root/frontend-dist/index.html"
cmp "$candidate/sw.js" "$root/frontend-dist/sw.js"
rm -rf "$candidate"

docker exec pfpheds-staging-gateway-1 \
  sha256sum /srv/frontend/index.html /srv/frontend/sw.js
df -h /opt/pfpheds-staging
REMOTE

curl -fsS https://test.hedsvs.ch/ | grep -q 'index-MFlegpZZ.js'
