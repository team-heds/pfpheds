param(
    [string]$SSHKey = "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt",
    [string]$SSHHost = "ubuntu@83.228.204.5",
    [string]$DbContainer = "supabase-db",
    [switch]$Force,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Write-Info($message) { Write-Host "[INFO] $message" -ForegroundColor Cyan }
function Write-Success($message) { Write-Host "[SUCCESS] $message" -ForegroundColor Green }
function Write-Warning($message) { Write-Host "[WARNING] $message" -ForegroundColor Yellow }
function Write-Fail($message) { Write-Host "[ERROR] $message" -ForegroundColor Red; exit 1 }

$repoRoot = Split-Path -Parent $PSScriptRoot

function Get-SortedSqlFiles([string]$relativeDir) {
    $fullDir = Join-Path $repoRoot $relativeDir
    if (-not (Test-Path $fullDir)) { return @() }
    return Get-ChildItem -Path $fullDir -Filter *.sql -File | Sort-Object Name | ForEach-Object {
        Join-Path $relativeDir $_.Name
    }
}

$orderedFiles = @()

# 1) Core backend migrations
$orderedFiles += Get-SortedSqlFiles "backend\supabase\migrations"

# 2) Base votation table required by some later migrations
$orderedFiles += @("sql\create_votation_sessions.sql")

# 3) Project supabase feature migrations
$orderedFiles += Get-SortedSqlFiles "supabase\migrations"

# 4) CareConvers persistence/logging tables
$orderedFiles += @(
    "sql\create_careconvers_sessions.sql",
    "sql\create_careconvers_interactions.sql"
)

# Dedupe while preserving order
$seen = @{}
$migrationFiles = @()
foreach ($f in $orderedFiles) {
    if (-not $seen.ContainsKey($f)) {
        $seen[$f] = $true
        $migrationFiles += $f
    }
}

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   BOOTSTRAP SUPABASE TEST ENV (REMOTE)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

if ($migrationFiles.Count -eq 0) {
    Write-Fail "Aucune migration SQL trouvée"
}

Write-Info "Validation des fichiers de migration..."
$resolvedFiles = @()
foreach ($relative in $migrationFiles) {
    $full = Join-Path $repoRoot $relative
    if (-not (Test-Path $full)) {
        Write-Warning "Fichier manquant, ignoré: $relative"
        continue
    }
    $resolvedFiles += [PSCustomObject]@{
        Relative = $relative
        FullPath = $full
    }
}

if ($resolvedFiles.Count -eq 0) {
    Write-Fail "Aucun fichier de migration valide après vérification"
}

Write-Info "Migrations planifiées ($($resolvedFiles.Count)) :"
for ($i = 0; $i -lt $resolvedFiles.Count; $i++) {
    Write-Host ("  {0,2}. {1}" -f ($i + 1), $resolvedFiles[$i].Relative) -ForegroundColor Gray
}

if ($DryRun) {
    Write-Success "Dry run terminé (aucune migration appliquée)."
    exit 0
}

Write-Info "Test de connexion SSH..."
$sshTest = ssh -i $SSHKey $SSHHost "echo OK" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Connexion SSH impossible: $sshTest"
}
Write-Success "Connexion SSH OK"

Write-Info "Vérification du conteneur DB '$DbContainer'..."
$containerCheck = ssh -i $SSHKey $SSHHost "docker ps --filter name=$DbContainer --format '{{.Names}}'" 2>&1
if ($LASTEXITCODE -ne 0 -or -not $containerCheck) {
    Write-Fail "Conteneur '$DbContainer' introuvable ou inaccessible"
}
Write-Success "Conteneur DB détecté: $containerCheck"

if (-not $Force) {
    Write-Host "`nConfirmer l'application des migrations sur $SSHHost ? (o/n)" -ForegroundColor Yellow
    $confirm = Read-Host
    if ($confirm -ne "o") {
        Write-Warning "Bootstrap annulé"
        exit 0
    }
}

$remoteTempFiles = @()
$okCount = 0

try {
    for ($i = 0; $i -lt $resolvedFiles.Count; $i++) {
        $entry = $resolvedFiles[$i]
        $index = "{0:D2}" -f ($i + 1)
        $fileName = Split-Path $entry.FullPath -Leaf
        $remoteFile = "/tmp/${index}_$fileName"

        Write-Info "[$($i + 1)/$($resolvedFiles.Count)] Copie: $($entry.Relative)"
        scp -i $SSHKey $entry.FullPath "${SSHHost}:${remoteFile}"
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "Échec de copie: $($entry.Relative)"
        }
        $remoteTempFiles += $remoteFile

        Write-Info "[$($i + 1)/$($resolvedFiles.Count)] Application SQL..."
        $applyResult = ssh -i $SSHKey $SSHHost "cat $remoteFile | docker exec -i $DbContainer psql -v ON_ERROR_STOP=1 -U postgres -d postgres" 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "Échec migration $($entry.Relative): $applyResult"
        }
        $okCount++
        Write-Success "Migration appliquée: $($entry.Relative)"
    }

    Write-Info "Vérification des tables critiques..."
    $verifySql = "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('institutions','votation_sessions','careconvers_sessions','careconvers_interactions') ORDER BY tablename;"
    $verifyResult = ssh -i $SSHKey $SSHHost "docker exec $DbContainer psql -U postgres -d postgres -t -c \"$verifySql\"" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Échec vérification finale: $verifyResult"
    }

    foreach ($table in @('institutions','votation_sessions','careconvers_sessions','careconvers_interactions')) {
        if ($verifyResult -notmatch $table) {
            Write-Warning "Table critique non détectée: $table"
        }
    }

    Write-Success "Bootstrap terminé: $okCount migration(s) appliquée(s)."
}
finally {
    if ($remoteTempFiles.Count -gt 0) {
        $joined = ($remoteTempFiles -join " ")
        ssh -i $SSHKey $SSHHost "rm -f $joined" | Out-Null
        Write-Info "Fichiers temporaires nettoyés sur serveur"
    }
}

Write-Host "`n=============================================" -ForegroundColor Green
Write-Host "   ENVIRONNEMENT TEST SUPABASE PRÊT" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "Pensez à pointer backend/.env vers ce Supabase test." -ForegroundColor Yellow
