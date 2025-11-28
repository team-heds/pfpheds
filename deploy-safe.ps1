# Script de deploiement securise avec gestion d'espace
# Usage: .\deploy-safe.ps1

param(
    [string]$BuildArchive = "",
    [switch]$SkipBuild = $false
)

$REMOTE_USER = "ubuntu"
$REMOTE_HOST = "83.228.204.5"
$REMOTE_DIR = "/home/ubuntu/deploys"
$MIN_FREE_SPACE_MB = 500
$SSH_KEY = "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt"

Write-Host "Deploiement PFP Frontend" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Fonction pour verifier l'espace disque
function Test-RemoteDiskSpace {
    Write-Host "Verification de l'espace disque..." -ForegroundColor Yellow
    $diskInfo = ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "df -m / | tail -1 | awk '{print `$4}'"
    $freeMB = [int]$diskInfo
    
    Write-Host "   Espace libre: $freeMB MB" -ForegroundColor White
    
    if ($freeMB -lt $MIN_FREE_SPACE_MB) {
        Write-Host "ATTENTION: Espace disque faible!" -ForegroundColor Red
        return $false
    }
    return $true
}

# Fonction de nettoyage
function Invoke-RemoteCleanup {
    Write-Host "`nNettoyage du serveur..." -ForegroundColor Yellow
    
    # Supprimer anciennes archives (>7 jours)
    ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "find $REMOTE_DIR -name 'pfp-frontend-*.tar.gz' -mtime +7 -delete 2>/dev/null" | Out-Null
    
    # Nettoyer /tmp
    ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "sudo find /tmp -name 'pfp-frontend-*.tar.gz' -delete 2>/dev/null" | Out-Null
    
    Write-Host "   Nettoyage effectue" -ForegroundColor Green
}

# Etape 1: Build (si necessaire)
if (-not $SkipBuild) {
    Write-Host "ETAPE 1: Build de l'application..." -ForegroundColor Cyan
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Build echoue!" -ForegroundColor Red
        exit 1
    }
    Write-Host "   Build reussi`n" -ForegroundColor Green
}

# Trouver ou creer l'archive
if ($BuildArchive -eq "") {
    $archives = Get-ChildItem -Path . -Filter "pfp-frontend-*.tar.gz" | Sort-Object LastWriteTime -Descending
    if ($archives.Count -eq 0) {
        Write-Host "Aucune archive trouvee! Lancez d'abord le build." -ForegroundColor Red
        exit 1
    }
    $BuildArchive = $archives[0].Name
}

if (-not (Test-Path $BuildArchive)) {
    Write-Host "Archive non trouvee: $BuildArchive" -ForegroundColor Red
    exit 1
}

$archiveSize = (Get-Item $BuildArchive).Length / 1MB
Write-Host "Archive a deployer: $BuildArchive" -ForegroundColor White
Write-Host "   Taille: $([math]::Round($archiveSize, 2)) MB`n" -ForegroundColor White

# Etape 2: Verification connexion SSH
Write-Host "ETAPE 2: Verification connexion SSH..." -ForegroundColor Cyan
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "echo 'Connexion OK'" | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Impossible de se connecter au serveur!" -ForegroundColor Red
    exit 1
}
Write-Host "   Connexion SSH OK`n" -ForegroundColor Green

# Etape 3: Verification espace disque
Write-Host "ETAPE 3: Verification espace disque..." -ForegroundColor Cyan
if (-not (Test-RemoteDiskSpace)) {
    Write-Host "`nLancement du nettoyage automatique..." -ForegroundColor Yellow
    Invoke-RemoteCleanup
    
    # Reverifier
    if (-not (Test-RemoteDiskSpace)) {
        Write-Host "`nEspace disque insuffisant meme apres nettoyage!" -ForegroundColor Red
        Write-Host "   Solutions:" -ForegroundColor Yellow
        Write-Host "   1. Connectez-vous au serveur et supprimez des fichiers manuellement" -ForegroundColor White
        Write-Host "   2. Augmentez la taille du disque du VPS" -ForegroundColor White
        exit 1
    }
}
Write-Host "   Espace disque suffisant`n" -ForegroundColor Green

# Etape 4: Creation du repertoire de deploiement
Write-Host "ETAPE 4: Preparation du serveur..." -ForegroundColor Cyan
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "mkdir -p $REMOTE_DIR"
Write-Host "   Repertoire cree: $REMOTE_DIR`n" -ForegroundColor Green

# Etape 5: Transfert SCP avec compression
Write-Host "ETAPE 5: Transfert vers le VPS..." -ForegroundColor Cyan
Write-Host "   Source: $BuildArchive" -ForegroundColor White
Write-Host "   Destination: $REMOTE_USER@$REMOTE_HOST`:$REMOTE_DIR/" -ForegroundColor White
Write-Host "   Transfert en cours...`n" -ForegroundColor Yellow

$remotePath = "$REMOTE_USER@$REMOTE_HOST`:$REMOTE_DIR/$BuildArchive"
scp -i $SSH_KEY -C $BuildArchive $remotePath

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nEchec du transfert SCP!" -ForegroundColor Red
    Write-Host "`nVerifiez:" -ForegroundColor Yellow
    Write-Host "   - L'espace disque disponible" -ForegroundColor White
    Write-Host "   - Les permissions du repertoire $REMOTE_DIR" -ForegroundColor White
    Write-Host "   - Votre connexion reseau" -ForegroundColor White
    exit 1
}

Write-Host "`n   Transfert reussi!`n" -ForegroundColor Green

# Etape 6: Verification du fichier transfere
Write-Host "ETAPE 6: Verification du transfert..." -ForegroundColor Cyan
$remoteSize = ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "stat -c%s $REMOTE_DIR/$BuildArchive 2>/dev/null || echo 0"
$localSize = (Get-Item $BuildArchive).Length

if ($remoteSize -eq $localSize) {
    Write-Host "   Tailles identiques ($localSize octets)`n" -ForegroundColor Green
} else {
    Write-Host "   ATTENTION: Tailles differentes!" -ForegroundColor Red
    Write-Host "   Local: $localSize octets" -ForegroundColor White
    Write-Host "   Remote: $remoteSize octets" -ForegroundColor White
    Write-Host "   Le fichier pourrait etre corrompu!`n" -ForegroundColor Yellow
}

# Etape 7: Decompression sur le serveur
Write-Host "ETAPE 7: Decompression sur le serveur..." -ForegroundColor Cyan
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" @"
cd $REMOTE_DIR
tar -xzf $BuildArchive
echo 'Archive decompresse avec succes'
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "   Decompression reussie`n" -ForegroundColor Green
} else {
    Write-Host "   Echec de la decompression`n" -ForegroundColor Red
    exit 1
}

# Resume final
Write-Host "================================" -ForegroundColor Cyan
Write-Host "DEPLOIEMENT REUSSI!" -ForegroundColor Green
Write-Host "================================`n" -ForegroundColor Cyan

Write-Host "Resume:" -ForegroundColor Yellow
Write-Host "   Archive: $BuildArchive" -ForegroundColor White
Write-Host "   Taille: $([math]::Round($archiveSize, 2)) MB" -ForegroundColor White
Write-Host "   Destination: $REMOTE_HOST`:$REMOTE_DIR/" -ForegroundColor White

Write-Host "`nEspace disque final:" -ForegroundColor Yellow
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "df -h / | grep -E '(Filesystem|/$)'"

Write-Host "`nProchaines etapes:" -ForegroundColor Yellow
Write-Host "   1. Connectez-vous au serveur: ssh $REMOTE_USER@$REMOTE_HOST" -ForegroundColor White
Write-Host "   2. Allez dans le repertoire: cd $REMOTE_DIR" -ForegroundColor White
Write-Host "   3. Deployez l'application selon votre configuration" -ForegroundColor White

Write-Host "`nDeploiement termine avec succes!`n" -ForegroundColor Green
