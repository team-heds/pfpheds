#!/usr/bin/env bash
set -euo pipefail
stamp=$(date -u +%Y%m%d-%H%M%S)
bundle=$(mktemp -d /tmp/pfpheds-storage-prod.XXXXXX)
archive="$bundle/backend.tar.gz"
COPYFILE_DISABLE=1 tar --no-xattrs -czf "$archive" \
  backend/supabase/filePhysioBackendStore.js backend/supabase/filePhysioMediaBackend.js \
  backend/supabase/pfpDocumentMediaBackend.js backend/supabase/storageUrls.js \
  backend/supabase/institutionsStoreBackend.js backend/uploads/documentValidation.js \
  deploy/staging/Dockerfile.storage.prod deploy/staging/setup-media-buckets.prod.cjs
remote_archive="/tmp/pfpheds-storage-prod-${stamp}.tar.gz"
scp -q "$archive" "heds-vps:$remote_archive"
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps "sudo -n bash -s -- '$remote_archive' '$stamp'" <<'REMOTE'
set -euo pipefail
archive=$1
stamp=$2
root=/opt/supabase
backup="/opt/pfpheds-production-backups/storage-${stamp}"
release="$backup/release"
base="supabase-backend:before-storage-${stamp}"
image="supabase-backend:storage-${stamp}"
expected=sha256:7147c6941ff743dd242dddcca1e49bb886e1ab8619e7465db1d5af7c4f9eae33
test "$(docker inspect pfpheds-backend --format '{{.Image}}')" = "$expected"
mkdir -m 700 "$backup" "$release"
tar -xzf "$archive" -C "$release"
cp -a "$root/docker-compose.yml" "$backup/docker-compose.yml"
tar -czf "$backup/backend.tar.gz" -C /opt pfpheds-backend
docker tag "$expected" "$base"
docker build --build-arg "BASE_IMAGE=$base" -t "$image" -f "$release/deploy/staging/Dockerfile.storage.prod" "$release"
changed=0
compose_up() { sudo -n -u ubuntu docker compose -p supabase -f "$root/docker-compose.yml" up -d --no-deps --no-build backend; }
rollback() {
  status=$?
  if [ "$status" -ne 0 ] && [ "$changed" -eq 1 ]; then
    cp -a "$backup/docker-compose.yml" "$root/docker-compose.yml"
    tar -xzf "$backup/backend.tar.gz" -C /opt
    docker tag "$base" supabase-backend
    compose_up
    echo "Production backend restored from $backup" >&2
  fi
  exit "$status"
}
trap rollback EXIT
changed=1
python3 - "$root/docker-compose.yml" "$image" <<'PY'
import pathlib, re, sys
file = pathlib.Path(sys.argv[1])
source = file.read_text()
matches = list(re.finditer(r'(?m)^  backend:\n', source))
if len(matches) != 1:
    raise RuntimeError('Unexpected backend service; deployment stopped')
anchor = matches[0]
rest = source[anchor.end():]
next_service = re.search(r'(?m)^  \S', rest)
section = rest[:next_service.start()] if next_service else rest
if re.search(r'(?m)^    image:', section):
    raise RuntimeError('Unexpected existing backend image configuration')
file.write_text(source[:anchor.end()] + '    image: ' + sys.argv[2] + '\n' + rest)
PY
for file in supabase/filePhysioBackendStore.js supabase/filePhysioMediaBackend.js supabase/pfpDocumentMediaBackend.js supabase/storageUrls.js supabase/institutionsStoreBackend.js uploads/documentValidation.js; do
  install -m 644 "$release/backend/$file" "/opt/pfpheds-backend/$file"
done
cd "$root"
compose_up
test "$(docker inspect pfpheds-backend --format '{{.Image}}')" = "$(docker image inspect "$image" --format '{{.Id}}')"
for attempt in $(seq 1 30); do
  if docker exec pfpheds-backend node -e "fetch('http://127.0.0.1:3000/api/ping').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then break; fi
  if [ "$attempt" -eq 30 ]; then exit 1; fi
  sleep 1
done
docker cp "$release/deploy/staging/setup-media-buckets.prod.cjs" pfpheds-backend:/tmp/setup-media-buckets.prod.cjs
docker exec pfpheds-backend node /tmp/setup-media-buckets.prod.cjs
changed=0
echo "STORAGE_PROD_BACKUP=$backup"
echo "STORAGE_PROD_IMAGE=$image"
echo "STORAGE_PROD_PREVIOUS_IMAGE=$base"
REMOTE
