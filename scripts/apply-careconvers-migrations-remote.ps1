param(
    [string]$SSHKey = "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt",
    [string]$SSHHost = "ubuntu@83.228.204.5",
    [switch]$Force
)

$ErrorActionPreference = "Stop"

function Write-Info($message) { Write-Host "[INFO] $message" -ForegroundColor Cyan }
function Write-Success($message) { Write-Host "[SUCCESS] $message" -ForegroundColor Green }
function Write-Warning($message) { Write-Host "[WARNING] $message" -ForegroundColor Yellow }
function Write-Fail($message) { Write-Host "[ERROR] $message" -ForegroundColor Red; exit 1 }

$repoRoot = Split-Path -Parent $PSScriptRoot
$migrationFiles = @(
    (Join-Path $repoRoot "sql\create_careconvers_sessions.sql"),
    (Join-Path $repoRoot "sql\create_careconvers_interactions.sql")
)

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   MIGRATIONS CARECONVERS (REMOTE SUPABASE)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

Write-Info "Vérification des fichiers de migration..."
foreach ($file in $migrationFiles) {
    if (-not (Test-Path $file)) {
        Write-Fail "Fichier introuvable: $file"
    }
    Write-Success "Trouvé: $file"
}

Write-Info "Test de connexion SSH..."
$sshTest = ssh -i $SSHKey $SSHHost "echo OK" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Connexion SSH impossible: $sshTest"
}
Write-Success "Connexion SSH OK"

Write-Info "Vérification du conteneur Supabase DB..."
$containerCheck = ssh -i $SSHKey $SSHHost "docker ps --filter name=supabase-db --format '{{.Names}}'" 2>&1
if ($LASTEXITCODE -ne 0 -or -not $containerCheck) {
    Write-Fail "Conteneur supabase-db introuvable ou inaccessible"
}
Write-Success "Conteneur DB détecté: $containerCheck"

if (-not $Force) {
    Write-Host "`nConfirmer l'application des migrations CareConvers sur $SSHHost ? (o/n)" -ForegroundColor Yellow
    $confirm = Read-Host
    if ($confirm -ne "o") {
        Write-Warning "Migration annulée par l'utilisateur"
        exit 0
    }
}

$remoteTempFiles = @()

try {
    foreach ($file in $migrationFiles) {
        $fileName = Split-Path $file -Leaf
        $remoteFile = "/tmp/$fileName"
        Write-Info "Copie de $fileName vers $SSHHost:$remoteFile"
        scp -i $SSHKey $file "${SSHHost}:${remoteFile}"
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "Échec de la copie de $fileName"
        }
        $remoteTempFiles += $remoteFile

        Write-Info "Application SQL: $fileName"
        $applyResult = ssh -i $SSHKey $SSHHost "cat $remoteFile | docker exec -i supabase-db psql -v ON_ERROR_STOP=1 -U postgres -d postgres" 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "Échec migration $fileName : $applyResult"
        }
        Write-Success "Migration appliquée: $fileName"
    }

    Write-Info "Vérification post-migration des tables CareConvers..."
    $verifySql = "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('careconvers_sessions','careconvers_interactions') ORDER BY tablename;"
    $verifyResult = ssh -i $SSHKey $SSHHost "docker exec supabase-db psql -U postgres -d postgres -t -c \"$verifySql\"" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Échec vérification des tables: $verifyResult"
    }

    if ($verifyResult -notmatch "careconvers_sessions" -or $verifyResult -notmatch "careconvers_interactions") {
        Write-Fail "Tables CareConvers non confirmées après migration"
    }

    Write-Success "Tables vérifiées: careconvers_sessions + careconvers_interactions"
}
finally {
    if ($remoteTempFiles.Count -gt 0) {
        $joined = ($remoteTempFiles -join " ")
        ssh -i $SSHKey $SSHHost "rm -f $joined" | Out-Null
        Write-Info "Fichiers temporaires supprimés sur le serveur"
    }
}

Write-Host "`n=============================================" -ForegroundColor Green
Write-Host "   CARECONVERS DÉPLOYÉ CÔTÉ BASE DE DONNÉES" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "Prochaine étape: redémarrer le backend pour activer les écritures persistantes." -ForegroundColor Yellow
