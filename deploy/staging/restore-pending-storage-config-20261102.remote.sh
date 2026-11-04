#!/usr/bin/env bash
set -euo pipefail
# Undo only the pending compose edit after the unavailable Compose plugin was
# detected. The live Storage container has not been recreated at this point.
compose=/opt/supabase/docker-compose.yml
backup=/opt/supabase/backups/storage-config-20261102T115523Z/docker-compose.yml
expected=$(sudo -n sha256sum "$backup" | awk '{print $1}')
actual=$(sudo -n sed '/^      GLOBAL_S3_BUCKET: "undefined"$/d' "$compose" | sha256sum | awk '{print $1}')
test "$actual" = "$expected"
sudo -n docker exec supabase-storage-1 node -e 'if(typeof require("/app/dist/config").getConfig().storageS3Bucket!=="undefined")process.exit(1)'
sudo -n cp -p "$backup" "$compose"
sudo -n chmod 664 "$compose"
printf 'Pending single-line compose change restored; original Storage container remains running.\n'
