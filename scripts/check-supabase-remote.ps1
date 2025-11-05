# =====================================================
# Script de diagnostic Supabase sur serveur distant
# =====================================================

$SSH_KEY = "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt"
$SSH_HOST = "ubuntu@83.228.204.5"

Write-Host " DIAGNOSTIC SUPABASE DISTANT" -ForegroundColor Cyan
Write-Host "==============================`n" -ForegroundColor Cyan

# Test de connexion SSH
Write-Host "1.  Test de connexion SSH..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SSH_HOST "echo 'Connexion réussie'"

if ($LASTEXITCODE -eq 0) {
    Write-Host "   Connexion SSH OK`n" -ForegroundColor Green
} else {
    Write-Host "   Échec de connexion SSH`n" -ForegroundColor Red
    exit 1
}

# Vérifier Docker
Write-Host "2.  Vérification Docker..." -ForegroundColor Yellow
$dockerVersion = ssh -i $SSH_KEY $SSH_HOST "docker --version"
Write-Host "   $dockerVersion`n" -ForegroundColor White

# Lister les conteneurs Supabase
Write-Host "3.  Conteneurs Supabase actifs..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SSH_HOST "docker ps --filter name=supabase --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
Write-Host ""

# Vérifier si Supabase CLI est installé
Write-Host "4.  Supabase CLI..." -ForegroundColor Yellow
$cliCheck = ssh -i $SSH_KEY $SSH_HOST "which supabase"
if ($LASTEXITCODE -eq 0 -and $cliCheck) {
    Write-Host "   Supabase CLI trouvé: $cliCheck`n" -ForegroundColor Green
} else {
    Write-Host "   Supabase CLI non installé`n" -ForegroundColor Yellow
}

# Vérifier les ports ouverts
Write-Host "5.  Ports Supabase..." -ForegroundColor Yellow
Write-Host "   Vérification des ports 54321 (API), 54323 (Studio)..." -ForegroundColor White
$portsSs = ssh -i $SSH_KEY $SSH_HOST "ss -tulpn 2>/dev/null | grep -E '54321|54323'"
if ($LASTEXITCODE -ne 0 -or -not $portsSs) {
    $portsNetstat = ssh -i $SSH_KEY $SSH_HOST "netstat -tulpn 2>/dev/null | grep -E '54321|54323'"
    if ($LASTEXITCODE -ne 0 -or -not $portsNetstat) {
        Write-Host "   Ports non ouverts ou outils manquants`n" -ForegroundColor Yellow
    } else {
        Write-Host "   $portsNetstat`n" -ForegroundColor White
    }
} else {
    Write-Host "   $portsSs`n" -ForegroundColor White
}

Write-Host ""

# Vérifier le projet
Write-Host "6.  Recherche du projet..." -ForegroundColor Yellow
ssh -i $SSH_KEY $SSH_HOST "find /home/ubuntu -name 'supabase' -type d 2>/dev/null | head -5"
Write-Host ""

# Résumé
Write-Host "`n RÉSUMÉ" -ForegroundColor Cyan
Write-Host "=========" -ForegroundColor Cyan
Write-Host "Serveur: $SSH_HOST" -ForegroundColor White
Write-Host "Clé SSH: $SSH_KEY" -ForegroundColor White
Write-Host ""

# Recommandations
Write-Host " PROCHAINES ÉTAPES:" -ForegroundColor Yellow
Write-Host "1. Lancez: .\scripts\deploy-supabase-fix.ps1" -ForegroundColor White
Write-Host "2. Ou connectez-vous manuellement: ssh -i `"$SSH_KEY`" $SSH_HOST" -ForegroundColor White
Write-Host ""
