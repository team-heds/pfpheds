#!/bin/bash
set -euo pipefail

# Frontend-only production release explicitly authorized on 22 September 2026.
# This does not modify the database, sessions, votes, notifications, or backend.
candidate=/var/folders/bc/rk779r992jn72qy_td959_wm0000gn/T/heds-admin-preview-KYt6in/dist
release_stamp=20260922-votation-pfp2-eligibility
expected_current_index=c987281a53e0a9191b02f700ff6b97e72fbd963e9810e64433cecf8e7e95c80d
archive="$(mktemp /tmp/heds-votation-prod.XXXXXX)"

test -f "$candidate/index.html"
test -f "$candidate/sw.js"
tar --no-xattrs -czf "$archive" -C "$candidate" .
scp -q -o BatchMode=yes -o StrictHostKeyChecking=yes \
  "$archive" "heds-vps:/tmp/${release_stamp}.tar.gz"

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  "EXPECTED_CURRENT_INDEX='$expected_current_index' RELEASE_STAMP='$release_stamp' sudo -n -E bash -s" <<'REMOTE'
set -euo pipefail

container=supabase-caddy-1
root=/var/www/pfpheds-frontend
candidate="/var/www/pfpheds-${RELEASE_STAMP}-candidate"
backup="/var/www/pfpheds-frontend.backup-${RELEASE_STAMP}"
archive="/tmp/${RELEASE_STAMP}.tar.gz"

test ! -e "$candidate"
test ! -e "$backup"
echo "${EXPECTED_CURRENT_INDEX}  ${root}/index.html" | sha256sum -c -
docker exec "$container" sh -c \
  "echo '${EXPECTED_CURRENT_INDEX}  ${root}/index.html' | sha256sum -c -"

mkdir "$candidate"
tar -xzf "$archive" -C "$candidate"
test -f "$candidate/index.html"
test -f "$candidate/sw.js"

cp -a "$root" "$backup"
docker exec "$container" sh -c \
  "test ! -e '${backup}' && cp -a '${root}' '${backup}'"

rsync -a --exclude=index.html --exclude=sw.js "$candidate/" "$root/"
install -m 644 "$candidate/index.html" "$root/index.html.next"
install -m 644 "$candidate/sw.js" "$root/sw.js.next"
mv "$root/index.html.next" "$root/index.html"
mv "$root/sw.js.next" "$root/sw.js"
chown -R www-data:www-data "$root"

docker cp "$candidate/assets/." "$container:$root/assets/"
docker cp "$candidate/index.html" "$container:$root/index.html.next"
docker cp "$candidate/sw.js" "$container:$root/sw.js.next"
docker exec "$container" sh -c \
  "chmod 644 '${root}/index.html.next' '${root}/sw.js.next' && mv '${root}/index.html.next' '${root}/index.html' && mv '${root}/sw.js.next' '${root}/sw.js'"

cmp "$candidate/index.html" "$root/index.html"
cmp "$candidate/sw.js" "$root/sw.js"
docker exec "$container" sha256sum "$root/index.html" "$root/sw.js"
printf 'BACKUP=%s\n' "$backup"
REMOTE
