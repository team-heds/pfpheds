$SSH_KEY = "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt"
$SSH_HOST = "ubuntu@83.228.204.5"
# Utilisation du chemin absolu basé sur l'emplacement du script
$SCRIPT_DIR = $PSScriptRoot
$PROJECT_ROOT = Split-Path -Parent $SCRIPT_DIR
$MIGRATION_FILE = Join-Path $PROJECT_ROOT "supabase\migrations\20251210_update_day_index_constraint.sql"
$REMOTE_TEMP = "/tmp/20251210_update_day_index_constraint.sql"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   APPLICATION MIGRATION DAY INDEX" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Verification du fichier de migration
Write-Host "`nVerification du fichier de migration..." -ForegroundColor Yellow
if (-not (Test-Path $MIGRATION_FILE)) {
    Write-Host "ERREUR: Fichier de migration introuvable: $MIGRATION_FILE" -ForegroundColor Red
    exit 1
}
Write-Host "Fichier de migration trouve" -ForegroundColor Green

# Test de connexion SSH
Write-Host "`nTest de connexion SSH..." -ForegroundColor Yellow
$sshTest = ssh -i $SSH_KEY $SSH_HOST "echo OK" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: Impossible de se connecter au serveur" -ForegroundColor Red
    exit 1
}
Write-Host "Connexion SSH reussie" -ForegroundColor Green

# Copie de la migration sur le serveur
Write-Host "`nCopie de la migration sur le serveur..." -ForegroundColor Yellow
scp -i $SSH_KEY $MIGRATION_FILE "${SSH_HOST}:${REMOTE_TEMP}"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERREUR: Echec de la copie" -ForegroundColor Red
    exit 1
}
Write-Host "Migration copiee avec succes" -ForegroundColor Green

# Application de la migration
Write-Host "`nApplication de la migration SQL..." -ForegroundColor Yellow
Write-Host "Execution de la migration..." -ForegroundColor Yellow
# Note: Le conteneur s'appelle souvent supabase-db-1 ou supabase-db. On essaie supabase-db-1 d'abord.
$migrationResult = ssh -i $SSH_KEY $SSH_HOST "cat $REMOTE_TEMP | docker exec -i supabase-db-1 psql -U postgres -d postgres" 2>&1

if ($LASTEXITCODE -ne 0) {
    # Fallback pour supabase-db
    Write-Host "Tentative avec supabase-db..." -ForegroundColor Yellow
    $migrationResult = ssh -i $SSH_KEY $SSH_HOST "cat $REMOTE_TEMP | docker exec -i supabase-db psql -U postgres -d postgres" 2>&1
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "Migration appliquee avec succes!" -ForegroundColor Green
} else {
    Write-Host "ERREUR lors de l'application de la migration" -ForegroundColor Red
    Write-Host "Details: $migrationResult" -ForegroundColor Yellow
    exit 1
}

# Nettoyage
Write-Host "`nNettoyage..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SSH_HOST "rm -f $REMOTE_TEMP"
Write-Host "Fichier temporaire supprime" -ForegroundColor Green

Write-Host "`n=============================================" -ForegroundColor Green
Write-Host "   MIGRATION TERMINEE AVEC SUCCES" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
