# Script de déploiement optimisé pour hedsvs.ch
# Version améliorée avec meilleure gestion des erreurs
# Déploie le frontend Vue.js sur hedsvs.ch

param(
    [string]$Version = "auto",
    [switch]$SkipBuild,
    [switch]$Force
)

function Write-Info($message) { Write-Host "[INFO] $message" -ForegroundColor Cyan }
function Write-Success($message) { Write-Host "[SUCCESS] $message" -ForegroundColor Green }
function Write-Warning($message) { Write-Host "[WARNING] $message" -ForegroundColor Yellow }
function Write-Error($message) { Write-Host "[ERROR] $message" -ForegroundColor Red; exit 1 }

Write-Host "=== DÉPLOIEMENT HEDSVS.CH - SCRIPT AMÉLIORÉ ===" -ForegroundColor Yellow

# Vérification des prérequis
if (-not (Test-Path "package.json")) {
    Write-Error "package.json non trouvé. Exécutez ce script depuis la racine du projet."
}

# Lecture de la version
if ($Version -eq "auto") {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    $Version = $packageJson.version
}
Write-Info "Version à déployer: $Version"

# Configuration
$remoteUser = "ubuntu"
$remoteHost = "83.228.204.5"
$remoteDir = "/tmp"  # Utilisation de /tmp pour le transfert
$localKeyPath = "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt"
$remoteAppPath = "/var/www/pfpheds-frontend"

# ÉTAPE 1: Build du frontend Vue.js + documentation Docusaurus (si nécessaire)
if (-not $SkipBuild) {
    Write-Info "ÉTAPE 1: Build du frontend Vue.js + documentation..."

    # Nettoyage si Force
    if ($Force) {
        Write-Info "Nettoyage forcé des dépendances..."
        if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
        if (Test-Path "package-lock.json") { Remove-Item -Force "package-lock.json" }
        npm install --force --legacy-peer-deps
    }

    if (-not (Test-Path "documentation/node_modules")) {
        Write-Info "Installation des dépendances documentation..."
        npm ci --prefix documentation
        if ($LASTEXITCODE -ne 0) { Write-Error "Échec de l'installation des dépendances documentation" }
    }

    # Build frontend + documentation, puis copie doc dans dist/docs (scripts/copy-docs-to-dist.js)
    npm run build:all
    if ($LASTEXITCODE -ne 0) { Write-Error "Échec du build" }
    Write-Success "Build terminé (frontend + documentation)"
} else {
    Write-Info "ÉTAPE 1: Build ignoré (--SkipBuild)"
}

# ÉTAPE 2: Création de l'archive
Write-Info "ÉTAPE 2: Création de l'archive de déploiement..."
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archiveName = "pfp-frontend-v$Version-$timestamp.tar.gz"

if (Test-Path "dist") {
    # Nettoyage des dossiers lourds non nécessaires en production
    if (Test-Path "dist/demo") { Write-Info "Suppression dist/demo..."; Remove-Item -Recurse -Force "dist/demo" }
    if (Test-Path "dist/layout") { Write-Info "Suppression dist/layout..."; Remove-Item -Recurse -Force "dist/layout" }
    # Utilisation de tar pour créer une archive compatible Linux
    Write-Info "Création de l'archive tar.gz..."
    Push-Location "dist"
    & tar -czf "../$archiveName" *
    $tarResult = $LASTEXITCODE
    Pop-Location

    if ($tarResult -ne 0) {
        Write-Error "Échec de la création de l'archive"
    }
    Write-Success "Archive créée: $archiveName"
} else {
    Write-Error "Répertoire dist non trouvé. Exécutez d'abord le build."
}

# Vérification de la connexion SSH
Write-Info "Vérification de la connexion SSH au serveur..."
$testConnection = ssh -i $localKeyPath -o BatchMode=yes -o ConnectTimeout=5 "${remoteUser}@${remoteHost}" "echo 'OK'" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "Impossible de se connecter au serveur. Vérifiez la clé SSH et la connexion réseau."
}
Write-Success "Connexion SSH vérifiée"

# Nettoyage des anciennes archives sur le serveur
Write-Info "Nettoyage des anciennes archives sur le serveur..."
$cleanupCmd = "rm -f /tmp/pfp-frontend-*.tar.gz"
ssh -i $localKeyPath "${remoteUser}@${remoteHost}" $cleanupCmd

# ÉTAPE 3: Transfert vers le VPS
Write-Info "ÉTAPE 3: Transfert vers le VPS..."
$transferStart = Get-Date
$archiveFileName = Split-Path $archiveName -Leaf
$remoteArchivePath = "$remoteDir/$archiveFileName"

Write-Info "Transfert de $archiveName vers ${remoteUser}@${remoteHost}:$remoteArchivePath"

# Utilisation de scp sans mode verbose pour éviter les problèmes
$scpCommand = "scp -i `"$localKeyPath`" -o StrictHostKeyChecking=no `"$archiveName`" `"${remoteUser}@${remoteHost}:$remoteArchivePath`""
Invoke-Expression $scpCommand

if ($LASTEXITCODE -ne 0) {
    Write-Error "Échec du transfert SCP. Vérifiez les permissions et l'espace disque disponible."
}

# Vérification que le fichier est bien arrivé sur le serveur
Write-Info "Vérification du fichier sur le serveur..."
$verifyCmd = "test -f '$remoteArchivePath' && echo 'OK' || echo 'FAIL'"
$verifyResult = ssh -i $localKeyPath "${remoteUser}@${remoteHost}" $verifyCmd
if ($verifyResult -ne "OK") {
    Write-Error "Le fichier n'a pas été transféré correctement sur le serveur."
}

$transferTime = (Get-Date) - $transferStart
Write-Success "Archive transférée et vérifiée en $([math]::Round($transferTime.TotalSeconds, 2)) secondes"

# ÉTAPE 4: Déploiement sur le VPS
Write-Info "ÉTAPE 4: Déploiement sur le VPS..."

$deployScript = @"
#!/bin/bash
set -e

ARCHIVE_PATH='$remoteArchivePath'
APP_PATH='$remoteAppPath'
VERSION='$Version'
TIMESTAMP='$timestamp'

echo '[DEPLOY] Vérification de l archive...'
if [ ! -f "`$ARCHIVE_PATH" ]; then
    echo "[ERROR] Fichier `$ARCHIVE_PATH non trouve sur le serveur"
    exit 1
fi

echo '[DEPLOY] Sauvegarde de l ancienne version...'
sudo cp -r `$APP_PATH `${APP_PATH}.backup-`$TIMESTAMP 2>/dev/null || echo '[INFO] Pas de version precedente a sauvegarder'

echo '[DEPLOY] Nettoyage des anciens backups (conservation du plus recent)...'
sudo bash -c "ls -dt \`${APP_PATH}.backup-* 2>/dev/null | tail -n +2 | xargs -r rm -rf"

echo '[DEPLOY] Vérification espace disque...'
FREE_MB=`$(df -m / | tail -1 | awk '{print `$4}')
echo "[INFO] Espace libre: `$FREE_MB MB"

if [ "`$FREE_MB" -lt 2000 ]; then
  echo '[DEPLOY] Espace critique (< 2GB), nettoyage agressif...'
  # Identifier l'archive courante pour ne pas la supprimer
  CURRENT_ARCHIVE=`$(basename "`$ARCHIVE_PATH")
  sudo find /tmp -name 'pfp-frontend-*.tar.gz' ! -name "`$CURRENT_ARCHIVE" -delete 2>/dev/null || true
  
  # Suppression de TOUS les backups si espace critique (via xargs pour eviter erreurs si vide)
  ls -d "`$APP_PATH".backup-* 2>/dev/null | xargs -r sudo rm -rf
  
  # Nettoyage Docker
  sudo docker system prune -f 2>/dev/null || true
fi

echo '[DEPLOY] Extraction de la nouvelle version...'
sudo mkdir -p `$APP_PATH
sudo tar -xzf "`$ARCHIVE_PATH" -C `$APP_PATH

echo '[DEPLOY] Configuration des permissions...'
sudo chown -R www-data:www-data `$APP_PATH
sudo chmod -R 755 `$APP_PATH

echo '[DEPLOY] Mise a jour du conteneur Caddy...'
sudo docker exec supabase-caddy-1 rm -rf /var/www/pfpheds-frontend 2>/dev/null || true
sudo docker exec supabase-caddy-1 mkdir -p /var/www/pfpheds-frontend
sudo docker cp `$APP_PATH/. supabase-caddy-1:/var/www/pfpheds-frontend/

echo '[DEPLOY] Rechargement de Caddy...'
sudo docker exec supabase-caddy-1 caddy reload --config /etc/caddy/Caddyfile

echo '[DEPLOY] Nettoyage...'
rm -f "`$ARCHIVE_PATH"

echo "[SUCCESS] Deploiement termine - Version `$VERSION active sur https://hedsvs.ch"
"@

# Exécution du script de déploiement
Write-Info "Exécution du script de déploiement sur le serveur..."

# Envoyer et exécuter le script bash directement
$sshCommand = @"
bash -s << 'HEREDOC'
$deployScript
HEREDOC
"@

ssh -i $localKeyPath "${remoteUser}@${remoteHost}" $sshCommand

if ($LASTEXITCODE -eq 0) {
    Write-Success "Déploiement réussi !"
    Write-Info "Votre application est maintenant disponible sur: https://hedsvs.ch"
    Write-Info "Version déployée: $Version"

    # Nettoyage local
    Remove-Item $archiveName -Force -ErrorAction SilentlyContinue
    Write-Info "Archive locale supprimée"
} else {
    Write-Error "Échec du déploiement. Consultez les logs ci-dessus pour plus de détails."
    exit 1
}

Write-Host "`n=== DÉPLOIEMENT TERMINÉ ===" -ForegroundColor Green
Write-Host "Testez votre application sur https://hedsvs.ch" -ForegroundColor Yellow