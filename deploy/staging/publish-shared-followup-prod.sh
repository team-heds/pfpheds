#!/bin/bash
set -euo pipefail
# Explicitly authorized frontend-only release, 22 September 2026.
candidate=/var/folders/bc/rk779r992jn72qy_td959_wm0000gn/T/heds-admin-preview-cG2vNj/dist
test -f "$candidate/index.html"
archive=$(mktemp /tmp/heds-followup-release.XXXXXX)
tar -czf "$archive" -C "$candidate" .
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps 'test ! -e /tmp/heds-followup-20260922.tar.gz'
scp -q -o BatchMode=yes -o StrictHostKeyChecking=yes "$archive" heds-vps:/tmp/heds-followup-20260922.tar.gz
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps 'sudo -n bash -s' <<'REMOTE'
set -euo pipefail
root=/var/www/pfpheds-frontend
backup=/var/www/pfpheds-frontend.backup-followup-20260922
candidate=/var/www/pfpheds-followup-candidate-20260922
test ! -e "$backup"
test ! -e "$candidate"
echo '49fcc73b009b1042adbc3fd6cde2c98303163f41dbb701a72e5f55c17f20bbae  /var/www/pfpheds-frontend/index.html' | sha256sum -c -
mkdir "$candidate"
tar -xzf /tmp/heds-followup-20260922.tar.gz -C "$candidate"
test -f "$candidate/index.html"
test -f "$candidate/sw.js"
cp -a "$root" "$backup"
# Retain old hashed assets for already-open browser sessions and rollback.
rsync -a --exclude=index.html --exclude=sw.js "$candidate/" "$root/"
install -m 644 "$candidate/index.html" "$root/index.html.next"
install -m 644 "$candidate/sw.js" "$root/sw.js.next"
chown -R www-data:www-data "$root"
mv "$root/index.html.next" "$root/index.html"
mv "$root/sw.js.next" "$root/sw.js"
cmp "$candidate/index.html" "$root/index.html"
cmp "$candidate/sw.js" "$root/sw.js"
printf 'BACKUP=%s\n' "$backup"
REMOTE
