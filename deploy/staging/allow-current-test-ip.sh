#!/usr/bin/env bash
set -euo pipefail

ip="${1:?IPv4 or IPv6 address required}"
if [[ ! "$ip" =~ ^([0-9]{1,3}\.){3}[0-9]{1,3}(/[0-9]{1,2})?$ ]] \
   && [[ ! "$ip" =~ ^[0-9a-fA-F:]+(/[0-9]{1,3})?$ || "$ip" != *:* ]]; then
  printf 'Invalid IP address\n' >&2
  exit 1
fi

ssh -o BatchMode=yes heds-vps "sudo -n bash -s -- '$ip'" <<'REMOTE'
set -euo pipefail
ip="$1"
file=/opt/supabase/reverse-proxy/Caddyfile
stamp="$(date +%Y%m%d-%H%M%S)"
backup="/opt/supabase/reverse-proxy/Caddyfile.before-HEDS25-619-ip-$stamp"

if grep -Eq "@outsideTeam not remote_ip .*([[:space:]]|^)$ip([[:space:]]|$)" "$file"; then
  already_allowed=true
else
  already_allowed=false
  cp -a "$file" "$backup"
  temporary=$(mktemp)
  sed "\|@outsideTeam not remote_ip| s|$| $ip|" "$file" > "$temporary"
  # Preserve the bind-mounted inode instead of replacing it with sed -i.
  cat "$temporary" > "$file"
  rm -f "$temporary"
fi

if ! docker exec -i supabase-caddy-1 caddy validate --config - --adapter caddyfile < "$file"; then
  if [ "$already_allowed" = false ]; then
    cat "$backup" > "$file"
  fi
  exit 1
fi

# Feed the validated host configuration through stdin. This also repairs a
# running container that still references an older bind-mounted inode.
docker exec -i supabase-caddy-1 caddy reload --config - --adapter caddyfile < "$file"
if [ "$already_allowed" = true ]; then
  printf 'IP_ALREADY_ALLOWED=%s\nCONFIG_RELOADED=true\n' "$ip"
else
  printf 'IP_ALLOWED=%s\nBACKUP=%s\n' "$ip" "$backup"
fi
REMOTE
