#!/bin/bash
set -euo pipefail
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps 'sudo -n bash -s' <<'REMOTE'
set -euo pipefail
container=supabase-caddy-1
root=/var/www/pfpheds-frontend
candidate=/var/www/pfpheds-followup-candidate-20260922
docker exec "$container" sh -c 'echo "49fcc73b009b1042adbc3fd6cde2c98303163f41dbb701a72e5f55c17f20bbae  /var/www/pfpheds-frontend/index.html" | sha256sum -c -'
docker exec "$container" sh -c 'test ! -e /var/www/pfpheds-frontend.backup-followup-20260922 && cp -a /var/www/pfpheds-frontend /var/www/pfpheds-frontend.backup-followup-20260922'
docker cp "$candidate/assets/." "$container:$root/assets/"
docker cp "$candidate/index.html" "$container:$root/index.html.next"
docker cp "$candidate/sw.js" "$container:$root/sw.js.next"
docker exec "$container" sh -c 'chmod 644 /var/www/pfpheds-frontend/index.html.next /var/www/pfpheds-frontend/sw.js.next && mv /var/www/pfpheds-frontend/index.html.next /var/www/pfpheds-frontend/index.html && mv /var/www/pfpheds-frontend/sw.js.next /var/www/pfpheds-frontend/sw.js'
docker exec "$container" sha256sum "$root/index.html" "$root/sw.js"
REMOTE
