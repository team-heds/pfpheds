# Script de déploiement optimisé V2 pour hedsvs.ch
# Résout le problème d'espace /tmp en utilisant ~/deploy/
# Version améliorée avec gestion intelligente de l'espace disque

param(
    [string]$Version = "auto",
    [switch]$SkipBuild,
    [switch]$Force,
    [switch]$SkipCleanup
)

function Write-Info($message) { Write-Host "[INFO] $message" -ForegroundColor Cyan }
function Write-Success($message) { Write-Host "[SUCCESS] $message" -ForegroundColor Green }
function Write-Warning($message) { Write-Host "[WARNING] $message" -ForegroundColor Yellow }
function Write-Error($message) { Write-Host "[ERROR] $message" -ForegroundColor Red; exit 1 }

$SSH_KEY = "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt"
$SSH_HOST = "ubuntu@83.228.204.5"

Write-Host "=== DÉPLOIEMENT HEDSVS.CH V2 - OPTIMISÉ ESPACE DISQUE ===" -ForegroundColor Yellow

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

# ÉTAPE 0: Vérification de l'espace disque sur le VPS
Write-Info "ÉTAPE 0: Vérification de l'espace disque sur le VPS..."
$spaceCheck = @'
df -h ~/deploy 2>/dev/null || df -h ~
'@

$availableSpace = $spaceCheck | ssh -i $SSH_KEY $SSH_HOST "bash -s" 2>$null
if ($availableSpace) {
    Write-Info "Espace disque disponible:"
    Write-Host $availableSpace -ForegroundColor Gray
}

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
$archiveName = "pfpheds-frontend-v$Version-$timestamp.tar.gz"

if (Test-Path "dist") {
    # Vérifier la taille du dossier dist
    $distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Info "Taille du dossier dist: $([math]::Round($distSize, 2)) MB"

    # Utilisation de tar pour créer une archive compatible Linux
    Write-Info "Création de l'archive tar.gz avec compression maximale..."

    $tarAvailable = $false
    try {
        $null = & tar --version 2>$null
        $tarAvailable = $true
    } catch {
        $tarAvailable = $false
    }

    if ($tarAvailable) {
        Push-Location "dist"
        & tar -czf "..\$archiveName" *
        Pop-Location
        
        $archiveSize = (Get-Item $archiveName).Length / 1MB
        Write-Success "Archive créée: $archiveName ($([math]::Round($archiveSize, 2)) MB)"
    } else {
        Write-Error "tar non disponible. Installez Git Bash ou WSL."
    }
} else {
    Write-Error "Répertoire dist non trouvé. Exécutez d'abord le build."
}

# ÉTAPE 3: Préparation du répertoire sur le VPS
Write-Info "ÉTAPE 3: Préparation du répertoire de déploiement sur le VPS..."
$prepScript = @'
#!/bin/bash
set -e

# Créer le répertoire ~/deploy s'il n'existe pas
mkdir -p ~/deploy

# Nettoyer les anciennes archives (garder les 2 dernières)
cd ~/deploy
ls -t pfpheds-frontend-*.tar.gz 2>/dev/null | tail -n +3 | xargs rm -f 2>/dev/null || true

# Afficher l'espace disponible
echo "Espace disponible dans ~/deploy:"
df -h ~/deploy | tail -1

echo "SUCCESS"
'@

$prepResult = $prepScript | ssh -i $SSH_KEY $SSH_HOST "bash -s"
if ($prepResult -match "SUCCESS") {
    Write-Success "Répertoire de déploiement prêt"
} else {
    Write-Warning "Impossible de préparer le répertoire de déploiement"
}

# ÉTAPE 4: Transfert vers le VPS (dans ~/deploy au lieu de /tmp)
Write-Info "ÉTAPE 4: Transfert vers le VPS (~/deploy)..."
$destPath = "~/deploy/$archiveName"

scp -i $SSH_KEY $archiveName "${SSH_HOST}:${destPath}"
if ($LASTEXITCODE -ne 0) { 
    Write-Error "Échec du transfert SCP. Vérifiez l'espace disque avec: .\check-vps-space.ps1"
}
Write-Success "Archive transférée vers le VPS"

# ÉTAPE 5: Déploiement sur le VPS
Write-Info "ÉTAPE 5: Déploiement sur le VPS..."

$archiveFileName = Split-Path $archiveName -Leaf

$deployScript = @"
#!/bin/bash
set -e

echo '[DEPLOY] Sauvegarde de l ancienne version...'
sudo cp -r /var/www/pfpheds-frontend /var/www/pfpheds-frontend.backup-$timestamp 2>/dev/null || echo 'Pas de version precedente'

# Nettoyage des vieux backups (garder les 3 derniers)
echo '[DEPLOY] Nettoyage des anciens backups...'
ls -t /var/www/pfpheds-frontend.backup-* 2>/dev/null | tail -n +4 | xargs sudo rm -rf 2>/dev/null || echo 'Pas de vieux backups'

echo '[DEPLOY] Extraction de la nouvelle version...'
sudo rm -rf /var/www/pfpheds-frontend
sudo mkdir -p /var/www/pfpheds-frontend

echo '[DEPLOY] Extraction archive tar.gz depuis ~/deploy...'
sudo tar -xzf ~/deploy/$archiveFileName -C /var/www/pfpheds-frontend/

echo '[DEPLOY] Configuration des permissions...'
sudo chown -R www-data:www-data /var/www/pfpheds-frontend
sudo chmod -R 755 /var/www/pfpheds-frontend

echo '[DEPLOY] Mise a jour du conteneur Caddy...'
sudo docker exec supabase-caddy-1 rm -rf /var/www/pfpheds-frontend 2>/dev/null || true
sudo docker exec supabase-caddy-1 mkdir -p /var/www/pfpheds-frontend
sudo docker cp /var/www/pfpheds-frontend/. supabase-caddy-1:/var/www/pfpheds-frontend/

echo '[DEPLOY] Rechargement de Caddy...'
sudo docker exec supabase-caddy-1 caddy reload --config /etc/caddy/Caddyfile

# Nettoyage de l'archive (sauf si SkipCleanup)
if [ "$SkipCleanup" != "true" ]; then
    echo '[DEPLOY] Nettoyage de l archive...'
    rm -f ~/deploy/$archiveFileName
fi

echo '[SUCCESS] Deploiement termine - Version $Version active sur https://hedsvs.ch'
echo '[INFO] Espace disque restant:'
df -h / | tail -1
"@

$tempScript = "/tmp/deploy-$timestamp.sh"
$skipCleanupVar = if ($SkipCleanup) { "true" } else { "false" }

$deployScript | ssh -i $SSH_KEY $SSH_HOST "cat > $tempScript && chmod +x $tempScript && archiveFileName='$archiveFileName' Version='$Version' timestamp='$timestamp' SkipCleanup='$skipCleanupVar' bash $tempScript && rm $tempScript"

if ($LASTEXITCODE -eq 0) {
    Write-Success "Déploiement réussi !"
    Write-Info "Votre application est maintenant disponible sur: https://hedsvs.ch"
    Write-Info "Version déployée: $Version"

    # Nettoyage local
    if (-not $SkipCleanup) {
        Remove-Item $archiveName -Force
        Write-Info "Archive locale supprimée"
    } else {
        Write-Warning "Archive locale conservée: $archiveName"
    }
} else {
    Write-Error "Échec du déploiement"
}

Write-Host "`n=== DÉPLOIEMENT TERMINÉ ===" -ForegroundColor Green
Write-Host "Testez votre application sur https://hedsvs.ch" -ForegroundColor Yellow
Write-Host ""
Write-Host "COMMANDES UTILES:" -ForegroundColor Cyan
Write-Host "  .\check-vps-space.ps1        - Vérifier l'espace disque" -ForegroundColor Gray
Write-Host "  .\check-vps-space.ps1 -Clean - Nettoyer le VPS" -ForegroundColor Gray
