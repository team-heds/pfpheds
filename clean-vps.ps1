# Script de nettoyage du VPS
# Usage: .\clean-vps.ps1

$REMOTE_USER = "ubuntu"
$REMOTE_HOST = "83.228.204.5"
$SSH_KEY = "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt"

Write-Host "Nettoyage du VPS..." -ForegroundColor Cyan

# 1. Verifier l'espace disque actuel
Write-Host "`nEspace disque AVANT nettoyage:" -ForegroundColor Yellow
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "df -h | grep -E '(Filesystem|/$)'"

# 2. Nettoyer /tmp
Write-Host "`nNettoyage de /tmp..." -ForegroundColor Yellow
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "sudo find /tmp -name 'pfp-frontend-*.tar.gz' -delete 2>/dev/null; sudo find /tmp -type f -atime +7 -delete 2>/dev/null"

# 3. Nettoyer les anciennes archives de deploiement
Write-Host "`nSuppression des anciennes archives (>7 jours)..." -ForegroundColor Yellow
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "find /home/ubuntu -name 'pfp-frontend-*.tar.gz' -mtime +7 -delete 2>/dev/null"

# 4. Nettoyer les logs
Write-Host "`nNettoyage des logs systeme..." -ForegroundColor Yellow
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "sudo journalctl --vacuum-time=7d 2>/dev/null"

# 5. Nettoyer les packages inutilises (si Ubuntu/Debian)
Write-Host "`nNettoyage des packages..." -ForegroundColor Yellow
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "sudo apt-get autoremove -y 2>/dev/null; sudo apt-get clean 2>/dev/null"

# 6. Verifier l'espace libere
Write-Host "`nEspace disque APRES nettoyage:" -ForegroundColor Green
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "df -h | grep -E '(Filesystem|/$)'"

Write-Host "`nNettoyage termine!" -ForegroundColor Green
