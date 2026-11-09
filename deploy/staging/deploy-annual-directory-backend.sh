#!/bin/sh
set -eu
archive_dir=$(mktemp -d /tmp/heds-directory-release.XXXXXX)
COPYFILE_DISABLE=1 tar --no-xattrs -czf "$archive_dir/backend.tar.gz" backend/domain/studentDirectoryYear.mjs backend/supabase/audienceDirectoryBackend.js deploy/staging/Dockerfile.annual-directory
scp "$archive_dir/backend.tar.gz" heds-vps:/tmp/heds-annual-directory-20260916.tar.gz
ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps 'sudo -n sh -s' <<'REMOTE'
set -eu
cd /opt/pfpheds-staging
test ! -e backups/backend-before-annual-directory-20260916.tar.gz
test "$(docker inspect pfpheds-staging-backend-1 --format '{{.Image}}')" = sha256:b4e3d9c2e0a4630d5106d2d0707c3f16fc5e5e0caf753147773461caf73427e9
tar -czf backups/backend-before-annual-directory-20260916.tar.gz backend/supabase/audienceDirectoryBackend.js
docker tag b4e3d9c2e0a4630d5106d2d0707c3f16fc5e5e0caf753147773461caf73427e9 pfpheds-staging-backend:before-annual-directory-20260916
mkdir release-annual-directory-20260916
tar -xzf /tmp/heds-annual-directory-20260916.tar.gz -C release-annual-directory-20260916
docker build -t pfpheds-staging-backend -f release-annual-directory-20260916/deploy/staging/Dockerfile.annual-directory release-annual-directory-20260916
cp release-annual-directory-20260916/backend/domain/studentDirectoryYear.mjs backend/domain/studentDirectoryYear.mjs
cp release-annual-directory-20260916/backend/supabase/audienceDirectoryBackend.js backend/supabase/audienceDirectoryBackend.js
docker-compose -p pfpheds-staging up -d --no-deps --no-build backend
REMOTE
