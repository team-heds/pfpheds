# Script pour tester l'application en local avec Docker
# Simule exactement l'environnement de production

param(
    [switch]$Rebuild,
    [switch]$Clean,
    [switch]$Logs
)

Write-Host "Test Docker Local - Environnement de Production" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Fonction pour nettoyer
function Clean-LocalDocker {
    Write-Host "Nettoyage des conteneurs existants..." -ForegroundColor Yellow
    docker-compose -f docker-compose.dev.yml down --remove-orphans
    docker system prune -f
}

# Fonction pour construire et lancer
function Start-LocalTest {
    Write-Host "Construction du frontend..." -ForegroundColor Green
    
    # Build du frontend
    Write-Host "   -> npm run build" -ForegroundColor Gray
    npm run build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERREUR lors du build du frontend" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Lancement des conteneurs Docker..." -ForegroundColor Green
    
    if ($Rebuild) {
        Write-Host "   -> Reconstruction forcee des images" -ForegroundColor Gray
        docker-compose -f docker-compose.dev.yml up --build --force-recreate -d
    } else {
        docker-compose -f docker-compose.dev.yml up --build -d
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERREUR lors du lancement des conteneurs" -ForegroundColor Red
        exit 1
    }
    
    # Attendre que les services soient prêts
    Write-Host "Attente du demarrage des services..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    # Vérifier le statut
    Write-Host "Statut des conteneurs:" -ForegroundColor Green
    docker-compose -f docker-compose.dev.yml ps
    
    Write-Host ""
    Write-Host "Application disponible sur:" -ForegroundColor Green
    Write-Host "   Frontend: http://localhost:3002" -ForegroundColor Cyan
    Write-Host "   Backend:  http://localhost:3001" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Commandes utiles:" -ForegroundColor Yellow
    Write-Host "   • Voir les logs:     .\test-local.ps1 -Logs" -ForegroundColor Gray
    Write-Host "   • Arreter:          docker-compose -f docker-compose.dev.yml down" -ForegroundColor Gray
    Write-Host "   • Reconstruire:     .\test-local.ps1 -Rebuild" -ForegroundColor Gray
    Write-Host "   • Nettoyer:         .\test-local.ps1 -Clean" -ForegroundColor Gray
}

# Fonction pour afficher les logs
function Show-Logs {
    Write-Host "Logs des conteneurs:" -ForegroundColor Green
    docker-compose -f docker-compose.dev.yml logs -f --tail=50
}

# Exécution selon les paramètres
try {
    if ($Clean) {
        Clean-LocalDocker
        Write-Host "Nettoyage termine" -ForegroundColor Green
    }
    elseif ($Logs) {
        Show-Logs
    }
    else {
        Start-LocalTest
    }
}
catch {
    Write-Host "ERREUR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
