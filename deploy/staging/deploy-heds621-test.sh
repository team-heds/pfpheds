#!/bin/bash
set -euo pipefail

candidate=/var/folders/bc/rk779r992jn72qy_td959_wm0000gn/T/heds-admin-preview-6t5lYd/dist
archive=$(mktemp /tmp/heds621-test-release.XXXXXX)
test -f "$candidate/index.html"
tar --no-xattrs -czf "$archive" -C "$candidate" .
scp -q -o BatchMode=yes -o StrictHostKeyChecking=yes "$archive" heds-vps:/tmp/heds621-test-20260922.tar.gz

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps 'sudo -n bash -s' <<'REMOTE'
set -euo pipefail
root=/opt/pfpheds-staging
candidate="$root/frontend-heds621-redirect-20260922"
backup="$root/backups/frontend-dist-before-HEDS25-621-redirect-20260922"
test ! -e "$candidate"
test ! -e "$backup"
echo 'a6f8bc913c06da70bea87d1ca63fad48e22c809738a96c2042b1c6c1f6d7f70e  /opt/pfpheds-staging/frontend-dist/index.html' | sha256sum -c -
mkdir "$candidate"
tar -xzf /tmp/heds621-test-20260922.tar.gz -C "$candidate"
test -f "$candidate/index.html"
test -f "$candidate/sw.js"
cp -a "$root/frontend-dist" "$backup"
# Conserver les anciens assets hashés pour les sessions déjà ouvertes et le rollback.
rsync -a --exclude=index.html --exclude=sw.js "$candidate/" "$root/frontend-dist/"
install -m 644 "$candidate/index.html" "$root/frontend-dist/index.html.next"
install -m 644 "$candidate/sw.js" "$root/frontend-dist/sw.js.next"
mv "$root/frontend-dist/index.html.next" "$root/frontend-dist/index.html"
mv "$root/frontend-dist/sw.js.next" "$root/frontend-dist/sw.js"
cmp "$candidate/index.html" "$root/frontend-dist/index.html"
docker exec pfpheds-staging-gateway-1 sha256sum /srv/frontend/index.html /srv/frontend/sw.js
printf 'BACKUP=%s\n' "$backup"
REMOTE
