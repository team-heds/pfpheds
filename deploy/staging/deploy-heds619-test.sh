#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../.." && pwd)"
migration="$root/supabase/migrations/20260921145302_align_challenges_badges_action_catalog.sql"
stamp="$(date +%Y%m%d-%H%M%S)"
build_log="$(mktemp)"
trap 'rm -f "$build_log"' EXIT

test -f "$migration"
test "$(git -C "$root" branch --show-current)" = "codex/HEDS25-619-badges-challenges"

node "$root/deploy/staging/build-admin-preview.mjs" --gamification | tee "$build_log"
build_dir="$(sed -n 's/^FRONTEND_BUILD=//p' "$build_log" | tail -1)"
test -n "$build_dir"
test -f "$build_dir/dist/index.html"

ssh -o BatchMode=yes heds-vps "sudo -n bash -s -- '$stamp'" <<'REMOTE'
set -euo pipefail
stamp="$1"
root=/opt/pfpheds-staging
backup="$root/backups/HEDS25-619-$stamp"
test ! -e "$backup"
install -d -m 700 "$backup"
docker exec pfpheds-staging-db-1 pg_dump -U postgres -d staging -Fc > "$backup/staging.dump"
test -s "$backup/staging.dump"
cp -a "$root/frontend-dist" "$backup/frontend-dist"
printf '%s\n' "$backup"
REMOTE

{
  printf 'begin;\n'
  cat "$migration"
  printf 'commit;\n'
} | ssh -o BatchMode=yes heds-vps \
  'sudo -n docker exec -i pfpheds-staging-db-1 psql -X -v ON_ERROR_STOP=1 -U postgres -d staging'

ssh -o BatchMode=yes heds-vps \
  "sudo -n install -d -m 700 /opt/pfpheds-staging/applied-migrations && sudo -n tee /opt/pfpheds-staging/applied-migrations/20260921145302_align_challenges_badges_action_catalog.sql >/dev/null" \
  < "$migration"

ssh -o BatchMode=yes heds-vps \
  "sudo -n install -d -m 755 /opt/pfpheds-staging/frontend-next-$stamp"
tar -C "$build_dir/dist" -cf - . | ssh -o BatchMode=yes heds-vps \
  "sudo -n tar -xf - -C /opt/pfpheds-staging/frontend-next-$stamp"
ssh -o BatchMode=yes heds-vps "sudo -n bash -s -- '$stamp'" <<'REMOTE'
set -euo pipefail
stamp="$1"
root=/opt/pfpheds-staging
rsync -a --delete "$root/frontend-next-$stamp/" "$root/frontend-dist/"
rm -rf "$root/frontend-next-$stamp"
test -f "$root/frontend-dist/index.html"
REMOTE

ssh -o BatchMode=yes heds-vps \
  'sudo -n docker exec -i pfpheds-staging-db-1 psql -X -v ON_ERROR_STOP=1 -U postgres -d staging -At' <<'SQL'
select json_build_object(
  'user_badges', (select count(*) from public.user_badges),
  'badge_events', (select count(*) from public.xp_history where action = 'BADGE_UNLOCK'),
  'active_badges', (select count(*) from public.badges where is_active = true),
  'nested_active_conditions', (
    select count(*) from public.badges
    where is_active = true and jsonb_typeof(conditions -> 'action_count') = 'object'
  ),
  'unsupported_active_badges', (
    select count(*) from public.badges b
    where b.is_active = true
      and not coalesce(
        (gamification_private.validate_badge_conditions(b.conditions) ->> 'valid')::boolean,
        false
      )
  ),
  'unsupported_active_challenges', (
    select count(*) from public.challenges c
    where c.is_active = true and not exists (
      select 1 from gamification_private.action_rules ar
      where ar.is_active = true and ar.challenge_action = lower(c.action_type)
    )
  ),
  'audit_rows', (select count(*) from gamification_private.badge_condition_audit)
);
SQL

printf 'HEDS25-619 deployed to test.hedsvs.ch at %s\n' "$stamp"
