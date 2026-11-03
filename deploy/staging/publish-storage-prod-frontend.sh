#!/usr/bin/env bash
set -euo pipefail
candidate=.codex-tmp/storage-prod-release
test -f "$candidate/SHA256SUMS"
stamp=$(date -u +%Y%m%d-%H%M%S)
bundle=$(mktemp -d /tmp/pfpheds-storage-frontend-prod.XXXXXX)
archive="$bundle/frontend.tar.gz"
COPYFILE_DISABLE=1 tar --no-xattrs -czf "$archive" -C "$candidate" .
remote_archive="/tmp/pfpheds-storage-frontend-prod-${stamp}.tar.gz"
scp -q "$archive" "heds-vps:$remote_archive"
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps "sudo -n bash -s -- '$remote_archive' '$stamp'" <<'REMOTE'
set -euo pipefail
archive=$1
stamp=$2
root=/var/www/pfpheds-frontend
backup="/opt/pfpheds-production-backups/storage-frontend-${stamp}"
release="$backup/candidate"
mkdir -m 700 "$backup" "$release"
tar -xzf "$archive" -C "$release"
(cd "$release" && sha256sum -c SHA256SUMS)
index_before=$(sha256sum "$root/index.html" | cut -d' ' -f1)
worker_before=$(sha256sum "$root/sw.js" | cut -d' ' -f1)
case "$index_before:$worker_before" in
  de9289f157dcc56c4b1ba4a991605e792c5a27fe29bec6658c4419128c537fb6:c77c6d21f12f99491c12b33a868bfef3f07db700a08f2a6e798391e15f168129) ;;
  f7ee497c62690245b05568663d093f787098c1eac06e51665d641706c8b6c87b:a63ccb54131aecd5010ba86539e8e0d0899aee17a8f94e97e4098c034dd8ce68) ;;
  *) echo 'Unexpected production frontend version; stopped.' >&2; exit 1 ;;
esac
(cd "$root" && sha256sum -c "$release/PRESERVED_SHA256SUMS" > "$backup/voting-before-verified.txt")
for file in "$release"/assets/*; do
  if [ -e "$root/assets/$(basename "$file")" ]; then cmp "$file" "$root/assets/$(basename "$file")"; fi
done
tar -czf "$backup/frontend-before.tar.gz" -C "$root" .
test -s "$backup/frontend-before.tar.gz"
changed=0
rollback() {
  status=$?
  if [ "$status" -ne 0 ] && [ "$changed" -eq 1 ]; then
    tar -xOf "$backup/frontend-before.tar.gz" ./index.html > "$root/index.html.next"
    tar -xOf "$backup/frontend-before.tar.gz" ./sw.js > "$root/sw.js.next"
    chmod 644 "$root/index.html.next" "$root/sw.js.next"
    mv "$root/index.html.next" "$root/index.html"
    mv "$root/sw.js.next" "$root/sw.js"
    echo "Restored production entry/worker from $backup" >&2
  fi
  exit "$status"
}
trap rollback EXIT
# Existing hashed assets and their contents are retained byte-for-byte.
for file in "$release"/assets/*; do
  if [ ! -e "$root/assets/$(basename "$file")" ]; then install -m 644 "$file" "$root/assets/"; fi
done
changed=1
install -m 644 "$release/index.html" "$root/index.html.next"
install -m 644 "$release/sw.js" "$root/sw.js.next"
mv "$root/index.html.next" "$root/index.html"
mv "$root/sw.js.next" "$root/sw.js"
(cd "$root" && sha256sum -c "$release/SHA256SUMS" > "$backup/published-verified.txt")
(cd "$root" && sha256sum -c "$release/PRESERVED_SHA256SUMS" > "$backup/voting-after-verified.txt")
cmp "$backup/voting-before-verified.txt" "$backup/voting-after-verified.txt"
docker exec supabase-caddy-1 sha256sum /var/www/pfpheds-frontend/index.html /var/www/pfpheds-frontend/sw.js
changed=0
echo "STORAGE_PROD_FRONTEND_BACKUP=$backup"
echo "EXISTING_VOTING_ASSETS_UNCHANGED=true"
REMOTE
