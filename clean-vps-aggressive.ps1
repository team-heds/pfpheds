# Script de nettoyage agressif du VPS
# ATTENTION: Ce script supprime beaucoup de fichiers
# Usage: .\clean-vps-aggressive.ps1

$SSH_KEY = "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt"
$REMOTE_USER = "ubuntu"
$REMOTE_HOST = "83.228.204.5"

Write-Host "NETTOYAGE AGRESSIF DU VPS" -ForegroundColor Red
Write-Host "===================================`n" -ForegroundColor Red
Write-Host "ATTENTION: Ce script va supprimer beaucoup de fichiers!" -ForegroundColor Yellow
Write-Host "Appuyez sur Entree pour continuer ou CTRL+C pour annuler..." -ForegroundColor Yellow
Read-Host

# 1. Espace disque AVANT
Write-Host "`n1. ESPACE DISQUE AVANT:" -ForegroundColor Cyan
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "df -h | grep -E '(Filesystem|/dev/)'"

# 2. Nettoyer les logs systemd (garder 1 jour seulement)
Write-Host "`n2. NETTOYAGE LOGS SYSTEMD (garder 1 jour)..." -ForegroundColor Yellow
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "sudo journalctl --vacuum-time=1d"

# 3. Supprimer tous les fichiers de /tmp
Write-Host "`n3. SUPPRESSION COMPLETE DE /tmp..." -ForegroundColor Yellow
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "sudo rm -rf /tmp/* 2>/dev/null; echo 'tmp nettoyé'"

# 4. Nettoyer les logs anciens
Write-Host "`n4. SUPPRESSION DES LOGS ANCIENS..." -ForegroundColor Yellow
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" @"
sudo find /var/log -type f -name '*.log.*' -delete 2>/dev/null
sudo find /var/log -type f -name '*.gz' -delete 2>/dev/null
sudo find /var/log -type f -name '*.1' -delete 2>/dev/null
sudo truncate -s 0 /var/log/*.log 2>/dev/null
echo 'Logs anciens supprimes'
"@

# 5. Nettoyer le cache APT
Write-Host "`n5. NETTOYAGE CACHE APT..." -ForegroundColor Yellow
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" @"
sudo apt-get clean
sudo apt-get autoclean
sudo rm -rf /var/cache/apt/archives/*
echo 'Cache APT nettoye'
"@

# 6. Supprimer les anciens kernels (ATTENTION)
Write-Host "`n6. SUPPRESSION DES ANCIENS KERNELS..." -ForegroundColor Yellow
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" @"
CURRENT_KERNEL=\$(uname -r)
OLD_KERNELS=\$(dpkg --list | grep linux-image | awk '{print \$2}' | grep -v \$CURRENT_KERNEL | grep -v generic)
if [ -n "\$OLD_KERNELS" ]; then
    sudo apt-get remove --purge -y \$OLD_KERNELS 2>/dev/null
    echo 'Anciens kernels supprimes'
else
    echo 'Pas d anciens kernels a supprimer'
fi
"@

# 7. Nettoyer Docker (si installé)
Write-Host "`n7. NETTOYAGE DOCKER..." -ForegroundColor Yellow
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" @"
if command -v docker &> /dev/null; then
    sudo docker system prune -af --volumes
    echo 'Docker nettoye'
else
    echo 'Docker non installe'
fi
"@

# 8. Supprimer les backups anciens
Write-Host "`n8. SUPPRESSION DES BACKUPS ANCIENS (>7 jours)..." -ForegroundColor Yellow
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" @"
sudo find / -name '*.backup*' -mtime +7 -delete 2>/dev/null
sudo find / -name '*.old' -mtime +7 -delete 2>/dev/null
echo 'Backups anciens supprimes'
"@

# 9. Nettoyer les archives de déploiement
Write-Host "`n9. SUPPRESSION DES ARCHIVES DE DEPLOIEMENT..." -ForegroundColor Yellow
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" @"
find /home/ubuntu -name '*.tar.gz' -delete 2>/dev/null
find /home/ubuntu -name '*.zip' -delete 2>/dev/null
find /home/ubuntu -name '*.tar' -delete 2>/dev/null
echo 'Archives de deploiement supprimees'
"@

# 10. Nettoyer les thumbnails et cache utilisateur
Write-Host "`n10. NETTOYAGE CACHE UTILISATEUR..." -ForegroundColor Yellow
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" @"
rm -rf ~/.cache/* 2>/dev/null
rm -rf ~/.thumbnails/* 2>/dev/null
echo 'Cache utilisateur nettoye'
"@

# 11. Réparer les paquets cassés
Write-Host "`n11. REPARATION DES PAQUETS..." -ForegroundColor Yellow
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" @"
sudo apt-get --fix-broken install -y
sudo apt-get autoremove -y
sudo apt-get autoclean
echo 'Paquets repares'
"@

# 12. Espace disque APRES
Write-Host "`n12. ESPACE DISQUE APRES:" -ForegroundColor Cyan
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "df -h | grep -E '(Filesystem|/dev/)'"

Write-Host "`n===================================`n" -ForegroundColor Yellow
Write-Host "NETTOYAGE AGRESSIF TERMINE" -ForegroundColor Green
Write-Host "`nVerifiez l'espace libere ci-dessus" -ForegroundColor White
