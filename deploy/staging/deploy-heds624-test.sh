#!/bin/bash
set -euo pipefail

candidate=/var/folders/bc/rk779r992jn72qy_td959_wm0000gn/T/heds-admin-preview-qkUHhY/dist
archive=$(mktemp /tmp/heds624-test-release.XXXXXX)
test -f "$candidate/index.html"
test -f "$candidate/sw.js"
tar --no-xattrs -czf "$archive" -C "$candidate" .
scp -q -o BatchMode=yes -o StrictHostKeyChecking=yes "$archive" heds-vps:/tmp/heds624-test-20260922.tar.gz

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps 'sudo -n bash -s' <<'REMOTE'
set -euo pipefail
root=/opt/pfpheds-staging
candidate="$root/frontend-heds624-20260922"
backup="$root/backups/frontend-dist-before-HEDS25-624-20260922"
test ! -e "$candidate"
test ! -e "$backup"
echo 'c306636a6025ded7cc0f636d61c4ea8a85ff1b17f7cc8b01e9936892d85e266d  /opt/pfpheds-staging/frontend-dist/index.html' | sha256sum -c -
mkdir "$candidate"
tar -xzf /tmp/heds624-test-20260922.tar.gz -C "$candidate"
test -f "$candidate/index.html"
test -f "$candidate/sw.js"
cp -a "$root/frontend-dist" "$backup"
rsync -a --exclude=index.html --exclude=sw.js "$candidate/" "$root/frontend-dist/"
install -m 644 "$candidate/index.html" "$root/frontend-dist/index.html.next"
install -m 644 "$candidate/sw.js" "$root/frontend-dist/sw.js.next"
mv "$root/frontend-dist/index.html.next" "$root/frontend-dist/index.html"
mv "$root/frontend-dist/sw.js.next" "$root/frontend-dist/sw.js"
cmp "$candidate/index.html" "$root/frontend-dist/index.html"
cmp "$candidate/sw.js" "$root/frontend-dist/sw.js"
docker exec pfpheds-staging-gateway-1 sha256sum /srv/frontend/index.html /srv/frontend/sw.js
printf 'BACKUP=%s\n' "$backup"
REMOTE
