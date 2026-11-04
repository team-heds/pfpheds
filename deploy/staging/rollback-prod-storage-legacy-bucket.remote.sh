#!/usr/bin/env bash
set -euo pipefail
# Pass the exact backup path printed by the forward script. Restores only the
# compose configuration and recreates only Storage; no object files are moved.
backup=${1:?Exact protected backup compose path required}
[[ "$backup" =~ ^/opt/supabase/backups/storage-config-[0-9]{8}T[0-9]{6}Z/docker-compose\.yml$ ]]
sudo -n test -f "$backup"
sudo -n cp -p "$backup" /opt/supabase/docker-compose.yml
sudo -n chmod 664 /opt/supabase/docker-compose.yml
sudo -n /usr/local/bin/docker-compose -p supabase --project-directory /opt/supabase -f /opt/supabase/docker-compose.yml config --quiet
sudo -n /usr/local/bin/docker-compose -p supabase --project-directory /opt/supabase -f /opt/supabase/docker-compose.yml up -d --no-deps --force-recreate storage
healthy=false
for attempt in $(seq 1 15); do
  if sudo -n docker exec supabase-storage-1 node -e 'fetch("http://127.0.0.1:5000/status").then(r=>process.exit(r.status===200?0:1)).catch(()=>process.exit(1))' >/dev/null 2>&1; then
    healthy=true
    break
  fi
  sleep 2
done
test "$healthy" = true
