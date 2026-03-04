param(
    [switch]$SkipMigrations,
    [switch]$SkipBuild,
    [switch]$ForceMigrations,
    [switch]$Down,
    [string]$ComposeFile = "docker-compose.prod.yml",
    [string]$SSHKey = "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt",
    [string]$SSHHost = "ubuntu@83.228.204.5"
)

$ErrorActionPreference = "Stop"

function Write-Info($message) { Write-Host "[INFO] $message" -ForegroundColor Cyan }
function Write-Success($message) { Write-Host "[SUCCESS] $message" -ForegroundColor Green }
function Write-Warning($message) { Write-Host "[WARNING] $message" -ForegroundColor Yellow }
function Write-Fail($message) { Write-Host "[ERROR] $message" -ForegroundColor Red; exit 1 }

$repoRoot = Split-Path -Parent $PSScriptRoot
$composePath = Join-Path $repoRoot $ComposeFile
$migrationScript = Join-Path $PSScriptRoot "apply-careconvers-migrations-remote.ps1"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "   DÉPLOIEMENT PROD (DOCKER + CARECONVERS)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

if (-not (Test-Path $composePath)) {
    Write-Fail "Fichier compose introuvable: $composePath"
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Fail "Docker n'est pas installé ou non disponible dans le PATH"
}

if ($Down) {
    Write-Info "Arrêt de la stack production..."
    Push-Location $repoRoot
    try {
        docker compose -f $ComposeFile down
        if ($LASTEXITCODE -ne 0) {
            Write-Fail "Échec de l'arrêt docker compose"
        }
    }
    finally {
        Pop-Location
    }
    Write-Success "Stack arrêtée"
    exit 0
}

if (-not $SkipMigrations) {
    if (-not (Test-Path $migrationScript)) {
        Write-Fail "Script migration introuvable: $migrationScript"
    }

    Write-Info "Application des migrations CareConvers sur Supabase distant..."
    $migrationArgs = @("-SSHKey", $SSHKey, "-SSHHost", $SSHHost)
    if ($ForceMigrations) {
        $migrationArgs += "-Force"
    }

    & $migrationScript @migrationArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Échec de l'application des migrations CareConvers"
    }
    Write-Success "Migrations CareConvers appliquées"
}
else {
    Write-Warning "Migrations ignorées (--SkipMigrations)"
}

Push-Location $repoRoot
try {
    if ($SkipBuild) {
        Write-Info "Démarrage sans rebuild (--SkipBuild)..."
        docker compose -f $ComposeFile up -d
    }
    else {
        Write-Info "Build et démarrage de la stack production..."
        docker compose -f $ComposeFile up -d --build
    }

    if ($LASTEXITCODE -ne 0) {
        Write-Fail "Échec du démarrage docker compose"
    }

    Write-Info "État des services:"
    docker compose -f $ComposeFile ps

    Write-Success "Déploiement terminé"
    Write-Host "Commandes utiles:" -ForegroundColor Yellow
    Write-Host "  docker compose -f $ComposeFile logs -f" -ForegroundColor White
    Write-Host "  docker compose -f $ComposeFile down" -ForegroundColor White
}
finally {
    Pop-Location
}
