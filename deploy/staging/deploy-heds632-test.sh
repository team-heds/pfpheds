#!/usr/bin/env bash
set -euo pipefail

candidate=${1:?Usage: deploy-heds632-test.sh /absolute/path/to/staging/build}
dist="$candidate/dist"
stamp=$(date +%Y%m%d-%H%M%S)
archive_dir=$(mktemp -d /tmp/heds632-test-release.XXXXXX)
archive="$archive_dir/release.tar.gz"
remote_archive="/tmp/heds632-test-$stamp.tar.gz"
remote_candidate="/opt/pfpheds-staging/frontend-heds632-$stamp"
remote_backup="/opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-632-$stamp"

test -f "$dist/index.html"
test -f "$dist/sw.js"
index_hash=$(shasum -a 256 "$dist/index.html" | awk '{print $1}')
sw_hash=$(shasum -a 256 "$dist/sw.js" | awk '{print $1}')
tar --no-xattrs -czf "$archive" -C "$dist" .
scp -q -o BatchMode=yes -o StrictHostKeyChecking=yes "$archive" "heds-vps:$remote_archive"

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  "sudo -n bash -s -- '$remote_archive' '$remote_candidate' '$remote_backup' '$index_hash' '$sw_hash'" <<'REMOTE'
set -euo pipefail
archive=$1
candidate=$2
backup=$3
index_hash=$4
sw_hash=$5
root=/opt/pfpheds-staging

test -d "$root/frontend-dist"
test ! -e "$candidate"
test ! -e "$backup"
cp -a "$root/frontend-dist" "$backup"
mkdir "$candidate"
tar -xzf "$archive" -C "$candidate"
test -f "$candidate/index.html"
test -f "$candidate/sw.js"
echo "$index_hash  $candidate/index.html" | sha256sum -c -
echo "$sw_hash  $candidate/sw.js" | sha256sum -c -

rsync -a --delete --exclude=index.html --exclude=sw.js "$candidate/" "$root/frontend-dist/"
install -m 644 "$candidate/index.html" "$root/frontend-dist/index.html.next"
install -m 644 "$candidate/sw.js" "$root/frontend-dist/sw.js.next"
mv "$root/frontend-dist/index.html.next" "$root/frontend-dist/index.html"
mv "$root/frontend-dist/sw.js.next" "$root/frontend-dist/sw.js"
echo "$index_hash  $root/frontend-dist/index.html" | sha256sum -c -
echo "$sw_hash  $root/frontend-dist/sw.js" | sha256sum -c -
docker exec pfpheds-staging-gateway-1 sha256sum /srv/frontend/index.html /srv/frontend/sw.js
rm -f "$archive"
rm -rf -- "$candidate"
REMOTE

status=$(curl -sS -o /dev/null -w '%{http_code}' https://test.hedsvs.ch/)
if [[ "$status" != '200' && "$status" != '401' && "$status" != '403' ]]; then
  printf 'unexpected test frontend status: %s\n' "$status" >&2
  exit 1
fi

printf 'FRONTEND_BACKUP=%s\nINDEX_SHA256=%s\nSW_SHA256=%s\nFRONTEND_STATUS=%s\n' \
  "$remote_backup" "$index_hash" "$sw_hash" "$status"

