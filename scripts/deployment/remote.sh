#!/usr/bin/env bash
set -euo pipefail
mode="${1:?Mode requis}"
app=/var/www/pfpheds-frontend
backend=/opt/pfpheds-backend
stack=/opt/supabase
caddy=supabase-caddy-1
[[ "$mode" == check || "$mode" == deploy ]]
[[ "$(hostname)" == ov-7a3a52 ]] || { echo 'VPS inattendu'; exit 1; }
sudo -n true
test -d "$app"
test -d "$backend"
sudo test -f "$backend/.env"
sudo test -f "$stack/docker-compose.yml"
if sudo docker compose version >/dev/null 2>&1; then
  compose=(sudo docker compose)
else
  compose=(sudo docker-compose)
fi
"${compose[@]}" version >/dev/null
sudo docker inspect -f '{{.State.Running}}' "$caddy" | grep -qx true
# Refuse before any write when fewer than 4 GiB remain for builds/backups.
available=$(df -Pk /opt /var/www /tmp | awk 'NR>1 {if(min==0 || $4<min) min=$4} END {print min}')
[[ "$available" -ge 4194304 ]] || { echo 'Espace libre insuffisant (< 4 GiB).'; exit 1; }
echo 'VPS, sudo, stack, Caddy et espace disque vérifiés.'
[[ "$mode" == deploy ]] || exit 0
release="${2:?Identifiant requis}"
[[ "$release" =~ ^pfpheds-deploy-[a-zA-Z0-9]+$ ]]
source_dir="/tmp/$release"
test -f "$source_dir/frontend.tar.gz"
test -f "$source_dir/backend.tar.gz"
# Serialize deployments; the kernel releases the lock even on failure.
exec 9>/tmp/pfpheds-deploy.lock
flock -n 9 || { echo 'Un déploiement est déjà en cours.'; exit 1; }
backup="/opt/pfpheds-releases/$release"
sudo mkdir -p "$backup"
sudo chmod 700 "$backup"
sudo cp -a "$app" "$backup/frontend"
sudo cp -a "$backend" "$backup/backend"
echo "Sauvegarde conservée : $backup"
trap 'echo "Échec : vérifier la stack et restaurer si nécessaire depuis $backup. Archives conservées dans $source_dir." >&2' ERR

# Prepare assets before changing live files.
sudo mkdir "$source_dir/frontend"
sudo tar -xzf "$source_dir/frontend.tar.gz" -C "$source_dir/frontend"
sudo test -f "$source_dir/frontend/index.html"
sudo test -f "$source_dir/frontend/docs/index.html"
sudo test -f "$source_dir/frontend/presentation/index.html"
# Overlay preserves the server environment. It also preserves obsolete source files.
sudo tar -xzf "$source_dir/backend.tar.gz" -C "$backend"
cd "$stack"
"${compose[@]}" -f docker-compose.yml \
  -f "$backend/deployment/supabase-healthchecks.override.yml" \
  -f "$backend/deployment/supabase-auth-security.override.yml" config --quiet
"${compose[@]}" -f docker-compose.yml \
  -f "$backend/deployment/supabase-healthchecks.override.yml" \
  -f "$backend/deployment/supabase-auth-security.override.yml" up -d --build --wait --wait-timeout 180
sudo docker exec pfpheds-backend node -e \
  "fetch('http://127.0.0.1:3000/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Keep the previous asset hashes available to browsers with an older index.html.
sudo cp -a "$source_dir/frontend/." "$app/"
sudo chown -R www-data:www-data "$app"
sudo docker cp "$app/." "$caddy:$app/"
sudo docker exec "$caddy" caddy reload --config /etc/caddy/Caddyfile
sudo docker ps --format 'table {{.Names}}\t{{.Status}}'
sudo rm -rf "$source_dir"
echo "Publication effectuée. Sauvegarde : $backup"
