# Script d'urgence - Deploiement minimal
# Usage: .\deploy-emergency.ps1

$SSH_KEY = "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt"

Write-Host "DEPLOIEMENT D'URGENCE" -ForegroundColor Red
Write-Host "========================`n" -ForegroundColor Red

# Trouver l'archive la plus recente
$archive = Get-ChildItem -Path . -Filter "pfp-frontend-*.tar.gz" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $archive) {
    Write-Host "Aucune archive trouvee!" -ForegroundColor Red
    exit 1
}

Write-Host "Archive: $($archive.Name)" -ForegroundColor Yellow

# Nettoyage brutal du VPS
Write-Host "`nNettoyage du VPS..." -ForegroundColor Yellow
ssh -i $SSH_KEY ubuntu@83.228.204.5 @"
sudo rm -rf /tmp/pfp-frontend-*.tar.gz
sudo rm -f /home/ubuntu/pfp-frontend-*.tar.gz
sudo journalctl --vacuum-time=3d
sudo apt-get clean
"@

# Attendre un peu
Start-Sleep -Seconds 2

# Transfert direct vers /home/ubuntu
Write-Host "`nTransfert vers /home/ubuntu..." -ForegroundColor Yellow
scp -i $SSH_KEY -C $archive.Name ubuntu@83.228.204.5:/home/ubuntu/

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nTRANSFERT REUSSI!" -ForegroundColor Green
    Write-Host "`nFichier depose dans: /home/ubuntu/$($archive.Name)" -ForegroundColor White
    
    Write-Host "`nProchaines etapes:" -ForegroundColor Yellow
    Write-Host "   ssh ubuntu@83.228.204.5" -ForegroundColor White
    Write-Host "   cd /home/ubuntu" -ForegroundColor White
    Write-Host "   tar -xzf $($archive.Name)" -ForegroundColor White
} else {
    Write-Host "`nECHEC DU TRANSFERT" -ForegroundColor Red
    Write-Host "`nEssayez:" -ForegroundColor Yellow
    Write-Host "   1. Verifier l'espace disque: ssh ubuntu@83.228.204.5 'df -h'" -ForegroundColor White
    Write-Host "   2. Supprimer des fichiers manuellement sur le VPS" -ForegroundColor White
}
