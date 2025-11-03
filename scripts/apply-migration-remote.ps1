$SSH_KEY = "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt"
$SSH_HOST = "ubuntu@83.228.204.5"
$MIGRATION_FILE = ".\supabase\migrations\FIX_auth_signup.sql"
$REMOTE_TEMP = "/tmp/FIX_auth_signup.sql"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   APPLICATION MIGRATION SUPABASE" -ForegroundColor Cyan
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
Write-Host "Etes-vous sur de vouloir appliquer cette migration? (o/n)" -ForegroundColor Yellow
$confirm = Read-Host

if ($confirm -ne 'o') {
    Write-Host "Migration annulee" -ForegroundColor Yellow
    ssh -i $SSH_KEY $SSH_HOST "rm -f $REMOTE_TEMP"
    exit 0
}

# Executer la migration via docker exec avec cat
Write-Host "Execution de la migration..." -ForegroundColor Yellow
$migrationResult = ssh -i $SSH_KEY $SSH_HOST "cat $REMOTE_TEMP | docker exec -i supabase-db psql -U postgres -d postgres" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Migration appliquee avec succes!" -ForegroundColor Green
} else {
    Write-Host "ERREUR lors de l'application de la migration" -ForegroundColor Red
    Write-Host "Details: $migrationResult" -ForegroundColor Yellow
    exit 1
}

# Verifications post-migration
Write-Host "`nVerifications post-migration..." -ForegroundColor Yellow

# Verifier la table user_profiles
Write-Host "Verification table user_profiles..." -ForegroundColor Yellow
$tableCheck = ssh -i $SSH_KEY $SSH_HOST "docker exec supabase-db psql -U postgres -d postgres -t -c `"SELECT COUNT(*) FROM information_schema.tables WHERE table_name='user_profiles';`""

if ([int]$tableCheck -gt 0) {
    Write-Host "Table user_profiles existe" -ForegroundColor Green
} else {
    Write-Host "ATTENTION: Table user_profiles non trouvee" -ForegroundColor Yellow
}

# Verifier les politiques RLS
Write-Host "Verification politiques RLS..." -ForegroundColor Yellow
$policiesCheck = ssh -i $SSH_KEY $SSH_HOST "docker exec supabase-db psql -U postgres -d postgres -t -c `"SELECT COUNT(*) FROM pg_policies WHERE tablename='user_profiles';`""

if ([int]$policiesCheck -gt 0) {
    Write-Host "Politiques RLS configurees: $policiesCheck" -ForegroundColor Green
} else {
    Write-Host "ATTENTION: Aucune politique RLS trouvee" -ForegroundColor Yellow
}

# Verifier le trigger
Write-Host "Verification trigger..." -ForegroundColor Yellow
$triggerCheck = ssh -i $SSH_KEY $SSH_HOST "docker exec supabase-db psql -U postgres -d postgres -t -c `"SELECT COUNT(*) FROM pg_trigger WHERE tgname='on_auth_user_created';`""

if ([int]$triggerCheck -gt 0) {
    Write-Host "Trigger on_auth_user_created configure" -ForegroundColor Green
} else {
    Write-Host "ATTENTION: Trigger non trouve" -ForegroundColor Yellow
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
Write-Host "1. Tester l'inscription depuis votre application" -ForegroundColor White
Write-Host "2. Verifier les logs: docker logs supabase-auth" -ForegroundColor White
Write-Host "3. Utiliser l'interface de diagnostic" -ForegroundColor White

Write-Host "`nTermine!" -ForegroundColor Green
