#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  printf 'usage: %s <build-directory>\n' "$0" >&2
  exit 2
fi

build_dir=$1
dist="$build_dir/dist"
stamp=$(date -u +%Y%m%d-%H%M%S)
remote_dir="/tmp/pfpheds-current-test-${stamp}"

test -f "$dist/index.html"
test -f "$dist/sw.js"

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  "mkdir -p '$remote_dir'"
rsync -az "$dist/" "heds-vps:$remote_dir/"

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  "sudo -n bash -s -- '$remote_dir' '$stamp'" <<'REMOTE'
set -euo pipefail
candidate=$1
stamp=$2
root=/opt/pfpheds-staging
backup="$root/backups/frontend-dist-before-gamification-notification-${stamp}.tar.gz"

tar -czf "$backup" -C "$root/frontend-dist" .
test -s "$backup"

rsync -a --delete --exclude=index.html --exclude=sw.js \
  "$candidate/" "$root/frontend-dist/"
install -m 644 "$candidate/index.html" "$root/frontend-dist/index.html.next"
install -m 644 "$candidate/sw.js" "$root/frontend-dist/sw.js.next"
mv "$root/frontend-dist/index.html.next" "$root/frontend-dist/index.html"
mv "$root/frontend-dist/sw.js.next" "$root/frontend-dist/sw.js"
cmp "$candidate/index.html" "$root/frontend-dist/index.html"
cmp "$candidate/sw.js" "$root/frontend-dist/sw.js"
rm -rf "$candidate"

docker exec pfpheds-staging-gateway-1 \
  sha256sum /srv/frontend/index.html /srv/frontend/sw.js
printf 'backup=%s\n' "$backup"
REMOTE

status=$(curl -sS -o /dev/null -w '%{http_code}' https://test.hedsvs.ch/)
if [[ "$status" != '200' && "$status" != '401' ]]; then
  printf 'unexpected test frontend status: %s\n' "$status" >&2
  exit 1
fi
printf 'frontend_status=%s\n' "$status"
