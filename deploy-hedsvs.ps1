# Script de déploiement optimisé pour hedsvs.ch
# Version finale après résolution des conflits Nginx/Caddy
# Déploie le frontend Vue.js v0.1.0.22+ sur hedsvs.ch avec HTTPS

param(
    [string]$Version = "auto",
    [switch]$SkipBuild,
    [switch]$Force
)

function Write-Info($message) { Write-Host "[INFO] $message" -ForegroundColor Cyan }
function Write-Success($message) { Write-Host "[SUCCESS] $message" -ForegroundColor Green }
function Write-Warning($message) { Write-Host "[WARNING] $message" -ForegroundColor Yellow }
function Write-Error($message) { Write-Host "[ERROR] $message" -ForegroundColor Red; exit 1 }

Write-Host "=== DÉPLOIEMENT HEDSVS.CH - SCRIPT OPTIMISÉ ===" -ForegroundColor Yellow

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

# ÉTAPE 1: Build du frontend (si nécessaire)
if (-not $SkipBuild) {
    Write-Info "ÉTAPE 1: Build du frontend Vue.js..."
    
    # Nettoyage si Force
    if ($Force) {
        Write-Info "Nettoyage forcé des dépendances..."
        if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
        if (Test-Path "package-lock.json") { Remove-Item -Force "package-lock.json" }
        npm install --force --legacy-peer-deps
    }
    
    # Build
    npm run build
    if ($LASTEXITCODE -ne 0) { Write-Error "Échec du build" }
    Write-Success "Build terminé"
} else {
    Write-Info "ÉTAPE 1: Build ignoré (--SkipBuild)"
}

# ÉTAPE 2: Création de l'archive
Write-Info "ÉTAPE 2: Création de l'archive de déploiement..."
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archiveName = "pfpheds-frontend-v$Version-$timestamp.zip"

if (Test-Path "dist") {
    Compress-Archive -Path "dist\*" -DestinationPath $archiveName -Force
    Write-Success "Archive créée: $archiveName"
} else {
    Write-Error "Répertoire dist non trouvé. Exécutez d'abord le build."
}

# ÉTAPE 3: Transfert vers le VPS
Write-Info "ÉTAPE 3: Transfert vers le VPS..."
$scpResult = scp -i "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt" $archiveName ubuntu@83.228.204.5:/tmp/
if ($LASTEXITCODE -ne 0) { Write-Error "Échec du transfert SCP" }
Write-Success "Archive transférée vers le VPS"

# ÉTAPE 4: Déploiement sur le VPS
Write-Info "ÉTAPE 4: Déploiement sur le VPS..."
$deployCommands = @"
echo '[DEPLOY] Sauvegarde de l'ancienne version...';
sudo cp -r /var/www/pfpheds-frontend /var/www/pfpheds-frontend.backup-$timestamp 2>/dev/null || echo 'Pas de version précédente';

echo '[DEPLOY] Extraction de la nouvelle version...';
sudo rm -rf /var/www/pfpheds-frontend;
sudo mkdir -p /var/www/pfpheds-frontend;
cd /tmp && sudo unzip -q $archiveName -d /var/www/pfpheds-frontend/;

echo '[DEPLOY] Configuration des permissions...';
sudo chown -R www-data:www-data /var/www/pfpheds-frontend;
sudo chmod -R 755 /var/www/pfpheds-frontend;

echo '[DEPLOY] Mise à jour du conteneur Caddy...';
sudo docker exec supabase-caddy-1 rm -rf /var/www/pfpheds-frontend 2>/dev/null || true;
sudo docker exec supabase-caddy-1 mkdir -p /var/www/pfpheds-frontend;
sudo docker cp /var/www/pfpheds-frontend/. supabase-caddy-1:/var/www/pfpheds-frontend/;

echo '[DEPLOY] Rechargement de Caddy...';
sudo docker exec supabase-caddy-1 caddy reload --config /etc/caddy/Caddyfile;

echo '[DEPLOY] Nettoyage...';
rm -f /tmp/$archiveName;

echo '[SUCCESS] Déploiement terminé - Version $Version active sur https://hedsvs.ch';
"@

ssh -i "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt" ubuntu@83.228.204.5 $deployCommands

if ($LASTEXITCODE -eq 0) {
    Write-Success "Déploiement réussi !"
    Write-Info "Votre application est maintenant disponible sur: https://hedsvs.ch"
    Write-Info "Version déployée: $Version"
    
    # Nettoyage local
    Remove-Item $archiveName -Force
    Write-Info "Archive locale supprimée"
} else {
    Write-Error "Échec du déploiement"
}

Write-Host "`n=== DÉPLOIEMENT TERMINÉ ===" -ForegroundColor Green
Write-Host "Testez votre application sur https://hedsvs.ch" -ForegroundColor Yellow
