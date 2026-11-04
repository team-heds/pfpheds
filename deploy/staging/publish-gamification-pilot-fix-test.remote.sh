#!/bin/bash
set -euo pipefail

candidate=${1:?candidate directory required}
case "$candidate" in
  /tmp/pfpheds-gamification-pilot-fix-*) ;;
  *) echo "Unexpected candidate path" >&2; exit 1 ;;
esac

root=/opt/pfpheds-staging
frontend=$root/frontend-dist
backup=$root/backups/frontend-entrypoints-before-gamification-empty-state-fix-20260923-1245.tar.gz

test -f "$candidate/index.html"
test -f "$candidate/sw.js"
test ! -e "$backup"
tar -czf "$backup" -C "$frontend" index.html sw.js
test -s "$backup"

rsync -a --exclude=index.html --exclude=sw.js "$candidate/" "$frontend/"
install -m 644 "$candidate/index.html" "$frontend/index.html.next"
install -m 644 "$candidate/sw.js" "$frontend/sw.js.next"
mv "$frontend/index.html.next" "$frontend/index.html"
mv "$frontend/sw.js.next" "$frontend/sw.js"
cmp "$candidate/index.html" "$frontend/index.html"
cmp "$candidate/sw.js" "$frontend/sw.js"

docker exec pfpheds-staging-gateway-1 \
  sha256sum /srv/frontend/index.html /srv/frontend/sw.js
rm -rf "$candidate"
