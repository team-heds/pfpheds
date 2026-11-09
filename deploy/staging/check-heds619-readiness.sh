#!/usr/bin/env bash
set -euo pipefail

ssh -o BatchMode=yes heds-vps \
  'sudo -n docker ps --filter name=pfpheds-staging --format "{{.Names}}|{{.Status}}"'

ssh -o BatchMode=yes heds-vps \
  'sudo -n docker exec -i pfpheds-staging-db-1 psql -X -v ON_ERROR_STOP=1 -U postgres -d staging -At' <<'SQL'
select current_database();
select to_regclass('supabase_migrations.schema_migrations');
select count(*) from public.user_badges;
select count(*) from public.xp_history where action = 'BADGE_UNLOCK';
select count(*) from public.badges where is_active = true;
select count(*) from public.challenges where is_active = true;
SQL

ssh -o BatchMode=yes heds-vps \
  'df -h /opt/pfpheds-staging && sudo -n test -d /opt/pfpheds-staging/frontend-dist && sudo -n test -d /opt/pfpheds-staging/backups'
