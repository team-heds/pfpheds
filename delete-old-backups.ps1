# Script ultra-simple : Supprimer les 5 backups d'octobre
# GAIN ESTIME: 5+ GB
# Usage: .\delete-old-backups.ps1

$SSH_KEY = "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt"

Write-Host "SUPPRESSION DES BACKUPS D'OCTOBRE" -ForegroundColor Red
Write-Host "===================================`n" -ForegroundColor Red

Write-Host "Espace AVANT:" -ForegroundColor Yellow
ssh -i $SSH_KEY ubuntu@83.228.204.5 "df -h / | grep /dev/sda1"

Write-Host "`nSuppression de 5 backups d'octobre..." -ForegroundColor Yellow
ssh -i $SSH_KEY ubuntu@83.228.204.5 @"
sudo rm -rf /var/www/pfpheds-frontend.backup-20251007-233710
sudo rm -rf /var/www/pfpheds-frontend.backup-20251009-172106
sudo rm -rf /var/www/pfpheds-frontend.backup-20251009-172033
sudo rm -rf /var/www/pfpheds-frontend.backup-20251009-180947
sudo rm -rf /var/www/pfpheds-frontend.backup-20251009-142056
echo 'Backups supprimes!'
"@

Write-Host "`nEspace APRES:" -ForegroundColor Green
ssh -i $SSH_KEY ubuntu@83.228.204.5 "df -h / | grep /dev/sda1"

Write-Host "`nTERMINE! Vous devriez avoir gagne 5+ GB" -ForegroundColor Green
