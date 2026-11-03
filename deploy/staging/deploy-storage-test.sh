#!/usr/bin/env bash
set -euo pipefail
# TEST-only overlay. Production services, data, and frontend are never targeted.
stamp=$(date -u +%Y%m%d-%H%M%S)
bundle=$(mktemp -d /tmp/pfpheds-storage-release.XXXXXX)
archive="$bundle/storage.tar.gz"
COPYFILE_DISABLE=1 tar --no-xattrs -czf "$archive" \
  backend/supabase/filePhysioBackendStore.js \
  backend/supabase/filePhysioMediaBackend.js \
  backend/supabase/pfpDocumentMediaBackend.js \
  backend/supabase/storageUrls.js \
  backend/supabase/institutionsStoreBackend.js \
  backend/uploads/documentValidation.js \
  deploy/staging/Dockerfile.storage \
  deploy/staging/enable-storage-test-origin.cjs \
  deploy/staging/setup-media-buckets.cjs \
  deploy/staging/compose.yml
remote_archive="/tmp/pfpheds-storage-${stamp}.tar.gz"
scp -q "$archive" "heds-vps:$remote_archive"
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  "sudo -n bash -s -- '$remote_archive' '$stamp'" <<'REMOTE'
set -euo pipefail
archive=$1
stamp=$2
root=/opt/pfpheds-staging
release="$root/release-storage-${stamp}"
backup="$root/backups/storage-before-${stamp}"
base="pfpheds-staging-backend:before-storage-${stamp}"
expected=sha256:32a61215b061413d8eab7150568a22da9cbd3cd2c0b127a46cf094fbbbe90398
test "$(docker inspect pfpheds-staging-backend-1 --format '{{.Image}}')" = "$expected"
echo 'e1bfc798d1628ada9cf6ad9520c579e6131078ee1a85cd123c658800bc062c1c  /opt/pfpheds-staging/compose.yml' | sha256sum -c -
mkdir -m 700 "$release" "$backup"
tar -xzf "$archive" -C "$release"
cp -a "$root/compose.yml" "$backup/compose.yml"
tar -czf "$backup/backend.tar.gz" -C "$root" backend
docker tag "$expected" "$base"
docker build --build-arg "BASE_IMAGE=$base" -t "pfpheds-staging-backend:storage-${stamp}" -f "$release/deploy/staging/Dockerfile.storage" "$release"
changed=0
rollback() {
  status=$?
  if [ "$status" -ne 0 ] && [ "$changed" -eq 1 ]; then
    cp -a "$backup/compose.yml" "$root/compose.yml"
    tar -xzf "$backup/backend.tar.gz" -C "$root"
    docker tag "$base" pfpheds-staging-backend
    (cd "$root" && docker-compose -p pfpheds-staging up -d --no-deps --no-build backend storage)
    echo "Rolled back TEST backend/config to $backup" >&2
  fi
  exit "$status"
}
trap rollback EXIT
changed=1
install -m 644 "$release/deploy/staging/compose.yml" "$root/compose.yml"
for file in supabase/filePhysioBackendStore.js supabase/filePhysioMediaBackend.js supabase/pfpDocumentMediaBackend.js supabase/storageUrls.js supabase/institutionsStoreBackend.js uploads/documentValidation.js; do
  install -m 644 "$release/backend/$file" "$root/backend/$file"
done
docker tag "pfpheds-staging-backend:storage-${stamp}" pfpheds-staging-backend
cd "$root"
docker-compose -p pfpheds-staging up -d --no-deps --no-build storage backend
test "$(docker inspect pfpheds-staging-backend-1 --format '{{.Image}}')" = "$(docker image inspect "pfpheds-staging-backend:storage-${stamp}" --format '{{.Id}}')"
for attempt in $(seq 1 30); do
  if docker exec pfpheds-staging-backend-1 node -e "fetch('http://127.0.0.1:3000/api/ping').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then break; fi
  if [ "$attempt" -eq 30 ]; then exit 1; fi
  sleep 1
done
docker cp "$release/deploy/staging/setup-media-buckets.cjs" pfpheds-staging-backend-1:/tmp/setup-media-buckets.cjs
docker exec pfpheds-staging-backend-1 node /tmp/setup-media-buckets.cjs
docker exec pfpheds-staging-backend-1 node -e "fetch('http://127.0.0.1:3000/api/ping',{method:'OPTIONS',headers:{Origin:'https://test.hedsvs.ch','Access-Control-Request-Method':'POST'}}).then(r=>{if(r.status!==204||r.headers.get('access-control-allow-origin')!=='https://test.hedsvs.ch')process.exit(1);console.log('TEST CORS verified')})"
changed=0
echo "STORAGE_TEST_RELEASE=$release"
echo "STORAGE_TEST_BACKUP=$backup"
echo "STORAGE_TEST_PREVIOUS_IMAGE=$base"
REMOTE
