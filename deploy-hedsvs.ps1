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

# Créer un dossier temporaire pour les archives (évite qu'elles soient commitées)
$tempDir = "temp-deploy"
if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir | Out-Null
}

$archiveName = "$tempDir/pfpheds-frontend-v$Version-$timestamp.tar.gz"

if (Test-Path "dist") {
    # Utilisation de tar pour créer une archive compatible Linux
    Write-Info "Création de l'archive tar.gz avec chemins Unix..."
    
    # Vérifier si tar est disponible (Git Bash ou WSL)
    $tarAvailable = $false
    try {
        $null = & tar --version 2>$null
        $tarAvailable = $true
    } catch {
        Write-Warning "tar non disponible, tentative avec PowerShell..."
    }
    
    if ($tarAvailable) {
        # Utiliser tar pour créer une archive avec chemins Unix
        Push-Location "dist"
        & tar -czf "..\$archiveName" *
        Pop-Location
        Write-Success "Archive tar.gz créée: $archiveName"
    } else {
        # Fallback: utiliser 7-Zip si disponible, sinon PowerShell
        $sevenZipPath = "${env:ProgramFiles}\7-Zip\7z.exe"
        if (Test-Path $sevenZipPath) {
            Write-Info "Utilisation de 7-Zip pour créer l'archive..."
            Push-Location "dist"
            & $sevenZipPath a -ttar -so * | & $sevenZipPath a -si -tgzip "..\$archiveName"
            Pop-Location
            Write-Success "Archive 7-Zip créée: $archiveName"
        } else {
            # Dernière option: PowerShell avec correction côté serveur
            Write-Warning "Utilisation de PowerShell Compress-Archive (nécessite correction côté serveur)"
            $archiveName = "$tempDir/pfpheds-frontend-v$Version-$timestamp.zip"
            Compress-Archive -Path "dist\*" -DestinationPath $archiveName -Force
            Write-Success "Archive ZIP créée: $archiveName (avec correction serveur)"
        }
    }
} else {
    Write-Error "Répertoire dist non trouvé. Exécutez d'abord le build."
}

# ÉTAPE 3: Transfert vers le VPS
Write-Info "ÉTAPE 3: Transfert vers le VPS..."

# Extraire seulement le nom du fichier pour le déploiement sur le serveur
$archiveFileName = Split-Path $archiveName -Leaf

$scpResult = scp -i "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt" $archiveName ubuntu@83.228.204.5:/tmp/
if ($LASTEXITCODE -ne 0) { Write-Error "Échec du transfert SCP" }
Write-Success "Archive transférée vers le VPS"

# ÉTAPE 4: Déploiement sur le VPS
Write-Info "ÉTAPE 4: Déploiement sur le VPS..."

# Commandes de déploiement avec échappement correct
$deployScript = @"
#!/bin/bash
set -e

echo '[DEPLOY] Sauvegarde de l ancienne version...'
sudo cp -r /var/www/pfpheds-frontend /var/www/pfpheds-frontend.backup-$timestamp 2>/dev/null || echo 'Pas de version precedente'

echo '[DEPLOY] Extraction de la nouvelle version...'
sudo rm -rf /var/www/pfpheds-frontend
sudo mkdir -p /var/www/pfpheds-frontend
cd /var/www/pfpheds-frontend

# Détecter le type d'archive et extraire en conséquence
if [[ "$archiveFileName" == *.tar.gz ]]; then
    echo '[DEPLOY] Extraction archive tar.gz...'
    sudo tar -xzf /tmp/$archiveFileName -C /var/www/pfpheds-frontend/
elif [[ "$archiveFileName" == *.zip ]]; then
    echo '[DEPLOY] Extraction archive ZIP...'
    cd /tmp && sudo unzip -q $archiveFileName -d /var/www/pfpheds-frontend/
    echo '[DEPLOY] Correction des chemins Windows si necessaire...'
    if [ -d "/var/www/pfpheds-frontend/dist" ]; then
        sudo mv /var/www/pfpheds-frontend/dist/* /var/www/pfpheds-frontend/ 2>/dev/null || true
        sudo rmdir /var/www/pfpheds-frontend/dist 2>/dev/null || true
    fi
else
    echo '[ERROR] Type d archive non reconnu: $archiveFileName'
    exit 1
fi

echo '[DEPLOY] Configuration des permissions...'
sudo chown -R www-data:www-data /var/www/pfpheds-frontend
sudo chmod -R 755 /var/www/pfpheds-frontend

echo '[DEPLOY] Mise a jour du conteneur Caddy...'
sudo docker exec supabase-caddy-1 rm -rf /var/www/pfpheds-frontend 2>/dev/null || true
sudo docker exec supabase-caddy-1 mkdir -p /var/www/pfpheds-frontend
sudo docker cp /var/www/pfpheds-frontend/. supabase-caddy-1:/var/www/pfpheds-frontend/

echo '[DEPLOY] Rechargement de Caddy...'
sudo docker exec supabase-caddy-1 caddy reload --config /etc/caddy/Caddyfile

echo '[DEPLOY] Nettoyage...'
rm -f /tmp/$archiveFileName

echo '[SUCCESS] Deploiement termine - Version $Version active sur https://hedsvs.ch'
"@

# Écriture du script temporaire et exécution
$tempScript = "/tmp/deploy-$timestamp.sh"
$deployScript | ssh -i "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt" ubuntu@83.228.204.5 "cat > $tempScript && chmod +x $tempScript && archiveFileName='$archiveFileName' Version='$Version' timestamp='$timestamp' bash $tempScript && rm $tempScript"

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