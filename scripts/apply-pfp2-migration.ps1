$SSH_KEY = "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt"
$SSH_HOST = "ubuntu@83.228.204.5"
$MIGRATION_FILE = ".\supabase\migrations\20251210_add_pfp_columns_to_students.sql"
$REMOTE_TEMP = "/tmp/20251210_add_pfp_columns_to_students.sql"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   APPLICATION MIGRATION PFP2 COLUMNS" -ForegroundColor Cyan
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

# Verification des conteneurs Supabase
Write-Host "`nVerification des conteneurs Supabase..." -ForegroundColor Yellow
$containerCount = ssh -i $SSH_KEY $SSH_HOST "docker ps --filter name=supabase --format '{{.Names}}' | wc -l"
Write-Host "Conteneurs Supabase actifs: $containerCount" -ForegroundColor Cyan

if ([int]$containerCount -eq 0) {
    Write-Host "ATTENTION: Aucun conteneur Supabase actif!" -ForegroundColor Yellow
    Write-Host "Veuillez demarrer Supabase avant de continuer." -ForegroundColor Yellow
    exit 1
}

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

# Executer la migration via docker exec avec cat
Write-Host "Execution de la migration..." -ForegroundColor Yellow
$migrationResult = ssh -i $SSH_KEY $SSH_HOST "cat $REMOTE_TEMP | docker exec -i supabase-db-1 psql -U postgres -d postgres" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Migration appliquee avec succes!" -ForegroundColor Green
} else {
    Write-Host "ERREUR lors de l'application de la migration" -ForegroundColor Red
    Write-Host "Details: $migrationResult" -ForegroundColor Yellow
    exit 1
}

# Verifications post-migration
Write-Host "`nVerifications post-migration..." -ForegroundColor Yellow

# Verifier les colonnes ajoutees
Write-Host "Verification colonnes pfp2_place_id et pfp2_data..." -ForegroundColor Yellow
$pfp2PlaceIdCheck = ssh -i $SSH_KEY $SSH_HOST "docker exec supabase-db-1 psql -U postgres -d postgres -t -c `"SELECT COUNT(*) FROM information_schema.columns WHERE table_name='StudentsPhysio' AND column_name='pfp2_place_id';`""
$pfp2DataCheck = ssh -i $SSH_KEY $SSH_HOST "docker exec supabase-db-1 psql -U postgres -d postgres -t -c `"SELECT COUNT(*) FROM information_schema.columns WHERE table_name='StudentsPhysio' AND column_name='pfp2_data';`""

if ([int]$pfp2PlaceIdCheck -gt 0) {
    Write-Host "Colonne pfp2_place_id existe" -ForegroundColor Green
} else {
    Write-Host "ERREUR: Colonne pfp2_place_id non trouvee" -ForegroundColor Red
}

if ([int]$pfp2DataCheck -gt 0) {
    Write-Host "Colonne pfp2_data existe" -ForegroundColor Green
} else {
    Write-Host "ERREUR: Colonne pfp2_data non trouvee" -ForegroundColor Red
}

# Nettoyage
Write-Host "`nNettoyage..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SSH_HOST "rm -f $REMOTE_TEMP"
Write-Host "Fichier temporaire supprime" -ForegroundColor Green

# Resultat final
Write-Host "`n=============================================" -ForegroundColor Green
Write-Host "   MIGRATION TERMINEE AVEC SUCCES" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

Write-Host "`nProchaines etapes:" -ForegroundColor Yellow
Write-Host "1. Tester l'affectation PFP2 depuis votre application" -ForegroundColor White
Write-Host "2. Verifier la synchro Supabase dans la console" -ForegroundColor White

Write-Host "`nTermine!" -ForegroundColor Green
