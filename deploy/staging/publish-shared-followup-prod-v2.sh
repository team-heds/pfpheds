#!/bin/bash
set -euo pipefail
# Explicitly authorized frontend-only follow-up UX release, 22 September 2026.
candidate=/var/folders/bc/rk779r992jn72qy_td959_wm0000gn/T/heds-admin-preview-zt2uu6/dist
archive=$(mktemp /tmp/heds-followup-v2-release.XXXXXX)
test -f "$candidate/index.html"
tar --no-xattrs -czf "$archive" -C "$candidate" .
scp -q -o BatchMode=yes -o StrictHostKeyChecking=yes "$archive" heds-vps:/tmp/heds-followup-v2-20260922.tar.gz
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps 'sudo -n bash -s' <<'REMOTE'
set -euo pipefail
container=supabase-caddy-1
root=/var/www/pfpheds-frontend
candidate=/var/www/pfpheds-followup-v2-candidate-20260922
backup=/var/www/pfpheds-frontend.backup-followup-v2-20260922
test ! -e "$candidate"
test ! -e "$backup"
echo '3e4b97a3e2bcd8a75f0f850511318154075b6ace5bbc8d5b8016d2bd5fd1d6a4  /var/www/pfpheds-frontend/index.html' | sha256sum -c -
docker exec "$container" sh -c 'echo "3e4b97a3e2bcd8a75f0f850511318154075b6ace5bbc8d5b8016d2bd5fd1d6a4  /var/www/pfpheds-frontend/index.html" | sha256sum -c -'
mkdir "$candidate"
tar -xzf /tmp/heds-followup-v2-20260922.tar.gz -C "$candidate"
cp -a "$root" "$backup"
docker exec "$container" sh -c 'test ! -e /var/www/pfpheds-frontend.backup-followup-v2-20260922 && cp -a /var/www/pfpheds-frontend /var/www/pfpheds-frontend.backup-followup-v2-20260922'
rsync -a --exclude=index.html --exclude=sw.js "$candidate/" "$root/"
install -m 644 "$candidate/index.html" "$root/index.html.next"
install -m 644 "$candidate/sw.js" "$root/sw.js.next"
mv "$root/index.html.next" "$root/index.html"
mv "$root/sw.js.next" "$root/sw.js"
chown -R www-data:www-data "$root"
docker cp "$candidate/assets/." "$container:$root/assets/"
docker cp "$candidate/index.html" "$container:$root/index.html.next"
docker cp "$candidate/sw.js" "$container:$root/sw.js.next"
docker exec "$container" sh -c 'chmod 644 /var/www/pfpheds-frontend/index.html.next /var/www/pfpheds-frontend/sw.js.next && mv /var/www/pfpheds-frontend/index.html.next /var/www/pfpheds-frontend/index.html && mv /var/www/pfpheds-frontend/sw.js.next /var/www/pfpheds-frontend/sw.js'
cmp "$candidate/index.html" "$root/index.html"
docker exec "$container" sha256sum "$root/index.html" "$root/sw.js"
printf 'BACKUP=%s\n' "$backup"
REMOTE
