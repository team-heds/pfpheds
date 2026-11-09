#!/bin/bash
set -euo pipefail

expected_index=af4bdadd9c4ec949ebb7253a6b472c1de4609f0c673d2ea37a2e780f862f2090
expected_sw=b7275efaa7777b14e43b880d02fa8b9b03e9a479350a4e991116d9f9ba968da4

targets=(
  /opt/pfpheds-staging/frontend-annual-directory-20260916
  /opt/pfpheds-staging/frontend-dist.local-backup-20260915
  /opt/pfpheds-staging/frontend-followup-filters-20260923
  /opt/pfpheds-staging/frontend-heds621-20260922
  /opt/pfpheds-staging/frontend-heds621-redirect-20260922
  /opt/pfpheds-staging/frontend-heds623-20260922
  /opt/pfpheds-staging/frontend-heds623-final-20260922
  /opt/pfpheds-staging/frontend-heds624-20260922
  /opt/pfpheds-staging/frontend-heds625-20260922
  /opt/pfpheds-staging/frontend-heds626-20260922
  /opt/pfpheds-staging/frontend-votation-admin-polish-20260922
  /opt/pfpheds-staging/frontend-votation-admin-polish-final-20260922
  /opt/pfpheds-staging/frontend-votation-form-polish-20260922
  /opt/pfpheds-staging/frontend-votation-pfp2-criteria-20260922
  /opt/pfpheds-staging/frontend-votation-pfp2-strict-eligibility-20260922
  /opt/pfpheds-staging/frontend-votation-responsive-20260922
  /opt/pfpheds-staging/releases-admin-preview-20260916
  /opt/pfpheds-staging/backups/frontend-dist-HEDS25-617-before-quests-fix-20260921
  /opt/pfpheds-staging/backups/frontend-dist-HEDS25-617-before-storage-fix-20260921
  /opt/pfpheds-staging/backups/frontend-dist-HEDS25-617-before-toast-fix-20260921
  /opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-615-20260921-100537
  /opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-617-20260921-1140
  /opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-620-20260921-1535
  /opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-620-challenges-20260921-1540
  /opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-620-link-20260921-1545
  /opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-616-20260921-1035
  /opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-621-20260922
  /opt/pfpheds-staging/backups/HEDS25-619-20260921-171913
  /opt/pfpheds-staging/backups/20260921-admin-recovery
  /opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-621-redirect-20260922
  /opt/pfpheds-staging/backups/20260921-recovery-prefetch-fix
  /opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-623-20260922
  /opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-623-final-20260922
  /opt/pfpheds-staging/backups/frontend-dist-before-votation-responsive-20260922
  /opt/pfpheds-staging/backups/frontend-dist-before-votation-admin-polish-20260922
  /opt/pfpheds-staging/backups/frontend-dist-before-votation-admin-polish-final-20260922
  /opt/pfpheds-staging/backups/frontend-dist-before-votation-form-polish-20260922
  /opt/pfpheds-staging/backups/frontend-dist-before-votation-pfp2-criteria-20260922
  /opt/pfpheds-staging/backups/frontend-dist-before-votation-pfp2-strict-eligibility-20260922
  /opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-624-20260922
  /opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-625-20260922
  /opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-626-20260922
)

ssh -o BatchMode=yes -o StrictHostKeyChecking=yes heds-vps \
  "sudo -n bash -s -- '$expected_index' '$expected_sw' ${targets[*]}" <<'REMOTE'
set -euo pipefail
expected_index=$1
expected_sw=$2
shift 2
targets=("$@")

root=/opt/pfpheds-staging
current=$root/frontend-dist
latest_db=$root/backups/before-gamification-rollout-20260923-121630.dump
latest_entries=$root/backups/frontend-entrypoints-before-gamification-rollout-20260923.tar.gz
latest_full_dir=$root/backups/frontend-dist-before-followup-filters-20260923
latest_full_archive=$root/backups/frontend-dist-before-followup-cases-20260923.tar.gz
pilot_backup=$root/backups/gamification-20260921

test -f "$current/index.html"
test -f "$current/sw.js"
test -s "$latest_db"
test -s "$latest_entries"
test -d "$latest_full_dir"
test -s "$latest_full_archive"
test -d "$pilot_backup"

printf '%s  %s\n' "$expected_index" "$current/index.html" | sha256sum -c -
printf '%s  %s\n' "$expected_sw" "$current/sw.js" | sha256sum -c -

before_available=$(df --output=avail -B1 / | tail -1 | tr -d ' ')
printf 'Validated current frontend and retained rollback assets.\n'
printf 'Deleting %s explicit stale frontend paths:\n' "${#targets[@]}"

for target in "${targets[@]}"; do
  case "$target" in
    /opt/pfpheds-staging/frontend-*|/opt/pfpheds-staging/releases-*|/opt/pfpheds-staging/backups/*)
      ;;
    *)
      printf 'Refusing unexpected target: %s\n' "$target" >&2
      exit 1
      ;;
  esac
  if test -e "$target"; then
    du -sh "$target"
    rm -rf -- "$target"
  fi
done

docker image prune -f
journalctl --vacuum-size=100M

after_available=$(df --output=avail -B1 / | tail -1 | tr -d ' ')
freed=$((after_available - before_available))
printf 'Freed bytes: %s\n' "$freed"

test -f "$current/index.html"
test -f "$current/sw.js"
printf '%s  %s\n' "$expected_index" "$current/index.html" | sha256sum -c -
printf '%s  %s\n' "$expected_sw" "$current/sw.js" | sha256sum -c -

docker ps --format '{{.Names}}|{{.Status}}' | sort
docker exec pfpheds-staging-db-1 psql -X -U postgres -d staging -Atc \
  "select current_database(), (gamification_private.data_quality_summary()->>'blocking_issue_count')::integer"
docker exec supabase-db-1 psql -X -U postgres -d postgres -Atc \
  "select current_database(), now() is not null"
docker exec pfpheds-staging-gateway-1 sha256sum /srv/frontend/index.html /srv/frontend/sw.js
df -h /
du -sh /opt/pfpheds-staging/backups /opt/pfpheds-staging
REMOTE
