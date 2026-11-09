#!/usr/bin/env bash
set -euo pipefail

compose=/opt/supabase/docker-compose.yml
patch_file=/tmp/pfpheds-storage-prod-legacy-bucket.patch
container=supabase-storage-1
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
backup=/opt/supabase/backups/storage-config-$timestamp

assert_mount() {
  test "$(sudo -n docker inspect "$container" --format '{{range .Mounts}}{{if eq .Destination "/var/lib/storage"}}{{.Type}}|{{.Source}}|{{.RW}}{{end}}{{end}}')" = 'bind|/opt/supabase/storage|true'
  test "$(sudo -n docker inspect "$container" --format '{{index .Config.Labels "com.docker.compose.project.config_files"}}')" = "$compose"
  test "$(sudo -n docker inspect "$container" --format '{{index .Config.Labels "com.docker.compose.project"}}')" = 'supabase'
  sudo -n test -d /opt/supabase/storage/undefined/storage-single-tenant
}
db_inventory() {
  sudo -n docker exec -i supabase-db-1 psql -X -U postgres -d postgres -At <<'SQL'
SELECT md5(coalesce(string_agg(id::text || '|' || bucket_id || '|' || name || '|' || coalesce(version,''), E'\n' ORDER BY id),'')) || '|' || count(*) FROM storage.objects;
SQL
}
physical_inventory() {
  sudo -n find /opt/supabase/storage -type f -printf '%P|%s|%T@\n' | LC_ALL=C sort | sha256sum | awk '{print $1}'
}
other_containers() {
  sudo -n docker ps --format '{{.Names}}|{{.ID}}' | LC_ALL=C sort | awk '!/^supabase-storage-1\|/'
}

assert_mount
sudo -n /usr/local/bin/docker-compose version >/dev/null
sudo -n /usr/local/bin/docker-compose -p supabase --project-directory /opt/supabase -f "$compose" config --quiet
test -f "$patch_file"
test "$(sudo -n grep -c '^[[:space:]]*STORAGE_BACKEND: file$' "$compose")" = '1'
if sudo -n grep -q '^[[:space:]]*\(GLOBAL_S3_BUCKET\|STORAGE_S3_BUCKET\):' "$compose"; then
  echo 'Storage bucket already configured; refusing an unreviewed second change.' >&2
  exit 1
fi
sudo -n docker exec "$container" node -e 'const c=require("/app/dist/config").getConfig();if(typeof c.storageS3Bucket!=="undefined"||c.storageFilePath!=="/var/lib/storage")process.exit(1)'
before_db=$(db_inventory)
[[ "$before_db" =~ ^[a-f0-9]{32}\|[0-9]+$ ]]
before_files=$(physical_inventory)
before_other=$(other_containers)
sudo -n install -d -m 700 "$backup"
sudo -n cp -p "$compose" "$backup/docker-compose.yml"
sudo -n chmod 600 "$backup/docker-compose.yml"
sudo -n patch --dry-run --batch --forward --directory /opt/supabase --strip 0 < "$patch_file"
# Recheck the exact mount and inventory immediately before the only mutation.
assert_mount
test "$(db_inventory)" = "$before_db"
test "$(physical_inventory)" = "$before_files"
sudo -n patch --batch --forward --directory /opt/supabase --strip 0 < "$patch_file"
sudo -n /usr/local/bin/docker-compose -p supabase --project-directory /opt/supabase -f "$compose" config --quiet
sudo -n /usr/local/bin/docker-compose -p supabase --project-directory /opt/supabase -f "$compose" up -d --no-deps --force-recreate storage
healthy=false
for attempt in $(seq 1 15); do
  if sudo -n docker exec "$container" node -e 'fetch("http://127.0.0.1:5000/status").then(r=>process.exit(r.status===200?0:1)).catch(()=>process.exit(1))' >/dev/null 2>&1; then
    healthy=true
    break
  fi
  sleep 2
done
test "$healthy" = true
assert_mount
sudo -n docker exec "$container" node -e 'const c=require("/app/dist/config").getConfig();if(c.storageS3Bucket!=="undefined"||c.storageFilePath!=="/var/lib/storage")process.exit(1)'
test "$(db_inventory)" = "$before_db"
test "$(physical_inventory)" = "$before_files"
test "$(other_containers)" = "$before_other"
printf 'Storage-only correction healthy; metadata and physical inventories unchanged. Protected rollback copy: %s\n' "$backup/docker-compose.yml"
