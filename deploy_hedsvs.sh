#!/usr/bin/env bash
set -euo pipefail

# ===== CONFIG =====
REMOTE_USER="ubuntu"
REMOTE_HOST="83.228.204.5"
SSH_KEY="${SSH_KEY:-$HOME/Desktop/HEdSLinux}"

REMOTE_TMP="/tmp"
REMOTE_APP_PATH="/var/www/pfpheds-frontend"
CADDY_CONTAINER="supabase-caddy-1"

VERSION="${VERSION:-auto}"
SKIP_BUILD="${SKIP_BUILD:-0}"
FORCE="${FORCE:-0}"

# Couleurs pour le logging
info(){  printf "\033[36m[INFO]\033[0m %s\n" "$*"; }
ok(){    printf "\033[32m[SUCCESS]\033[0m %s\n" "$*"; }
warn(){  printf "\033[33m[WARNING]\033[0m %s\n" "$*"; }
err(){   printf "\033[31m[ERROR]\033[0m %s\n" "$*"; exit 1; }

# ===== PRECHECKS =====
[[ -f "package.json" ]] || err "package.json introuvable. Lance depuis la racine du projet."
[[ -f "$SSH_KEY" ]] || err "Clé SSH introuvable: $SSH_KEY"
chmod 600 "$SSH_KEY" 2>/dev/null || true

for cmd in ssh scp tar npm node; do
    command -v "$cmd" >/dev/null || err "La commande '$cmd' est manquante localement."
done

# ===== VERSION =====
if [[ "$VERSION" == "auto" ]]; then
  VERSION="$(node -p "require('./package.json').version")"
fi
info "Version à déployer: $VERSION"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
ARCHIVE_NAME="pfp-frontend-v${VERSION}-${TIMESTAMP}.tar.gz"
REMOTE_ARCHIVE="${REMOTE_TMP}/${ARCHIVE_NAME}"

SSH=(ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no -o BatchMode=yes -o ConnectTimeout=8 "${REMOTE_USER}@${REMOTE_HOST}")
SCP=(scp -i "$SSH_KEY" -o StrictHostKeyChecking=no)

# ===== BUILD =====
if [[ "$SKIP_BUILD" == "0" ]]; then
  info "ÉTAPE 1: Build…"
  if [[ "$FORCE" == "1" ]]; then
    warn "Nettoyage complet (FORCE=1)"
    rm -rf node_modules package-lock.json 2>/dev/null || true
    npm install --force --legacy-peer-deps
  fi
  npm run build
  ok "Build terminé"
fi

# ===== ARCHIVE (Optimisé macOS) =====
info "ÉTAPE 2: Archive…"
[[ -d "dist" ]] || err "Le dossier dist/ est introuvable."

# On crée l'archive en excluant les fichiers inutiles de macOS et les dossiers de démo
tar -czf "$ARCHIVE_NAME" \
    --exclude='.DS_Store' \
    --exclude='dist/demo' \
    --exclude='dist/layout' \
    -C dist .

ok "Archive créée: $ARCHIVE_NAME"

# ===== SSH CHECK =====
"${SSH[@]}" "echo OK" >/dev/null || err "Impossible de se connecter au VPS."

# ===== TRANSFER =====
info "ÉTAPE 3: Transfert vers le serveur…"
"${SCP[@]}" "$ARCHIVE_NAME" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_ARCHIVE}" || err "Échec du transfert SCP."

# ===== DEPLOY REMOTE (Sécurisé) =====
info "ÉTAPE 4: Déploiement VPS…"
"${SSH[@]}" "bash -s" <<EOF
set -euo pipefail

# Vérification présence conteneur
if ! sudo docker ps --format '{{.Names}}' | grep -qx "$CADDY_CONTAINER"; then
    echo "[ERROR] Le conteneur $CADDY_CONTAINER n'est pas en cours d'exécution."
    exit 1
fi

echo "[DEPLOY] Création backup…"
if [ -d "$REMOTE_APP_PATH" ]; then
    sudo cp -a "$REMOTE_APP_PATH" "${REMOTE_APP_PATH}.backup-$TIMESTAMP"
fi

# Nettoyage anciens backups (garde les 2 plus récents pour sécurité)
ls -dt ${REMOTE_APP_PATH}.backup-* 2>/dev/null | tail -n +3 | xargs -r sudo rm -rf

echo "[DEPLOY] Extraction des fichiers…"
sudo mkdir -p "$REMOTE_APP_PATH"
# Nettoyage sécurisé du dossier cible uniquement
sudo find "$REMOTE_APP_PATH" -mindepth 1 -delete
sudo tar -xzf "$REMOTE_ARCHIVE" -C "$REMOTE_APP_PATH"

echo "[DEPLOY] Permissions…"
sudo chown -R www-data:www-data "$REMOTE_APP_PATH"
sudo chmod -R 755 "$REMOTE_APP_PATH"

echo "[DEPLOY] Mise à jour du conteneur Caddy…"
# On ne supprime que le contenu spécifique dans le conteneur
sudo docker exec "$CADDY_CONTAINER" rm -rf /var/www/pfpheds-frontend/* 2>/dev/null || true
sudo docker cp "$REMOTE_APP_PATH/." "$CADDY_CONTAINER:/var/www/pfpheds-frontend/"

echo "[DEPLOY] Nettoyage Docker sécurisé (uniquement images orphelines)..."
sudo docker image prune -f

echo "[DEPLOY] Nettoyage archive temporaire..."
rm -f "$REMOTE_ARCHIVE"
EOF

ok "Déploiement réussi ✅"

# ===== LOCAL CLEANUP =====
rm -f "$ARCHIVE_NAME"
info "Nettoyage local terminé."