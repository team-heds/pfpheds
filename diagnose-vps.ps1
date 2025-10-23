# Script de diagnostic du VPS
# Usage: .\diagnose-vps.ps1

$SSH_KEY = "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt"
$REMOTE_USER = "ubuntu"
$REMOTE_HOST = "83.228.204.5"

Write-Host "DIAGNOSTIC DE L'ESPACE DISQUE VPS" -ForegroundColor Yellow
Write-Host "===================================`n" -ForegroundColor Yellow

# 1. Vue d'ensemble
Write-Host "1. ESPACE DISQUE GENERAL:" -ForegroundColor Cyan
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "df -h"

# 2. Top 10 des plus gros repertoires dans /
Write-Host "`n2. TOP 10 DES PLUS GROS REPERTOIRES (/):" -ForegroundColor Cyan
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "sudo du -h --max-depth=1 / 2>/dev/null | sort -rh | head -n 11"

# 3. Espace utilise dans /var
Write-Host "`n3. DETAILS DE /var:" -ForegroundColor Cyan
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "sudo du -h --max-depth=1 /var 2>/dev/null | sort -rh | head -n 10"

# 4. Logs volumineux
Write-Host "`n4. LOGS VOLUMINEUX (>100MB):" -ForegroundColor Cyan
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "sudo find /var/log -type f -size +100M -exec ls -lh {} \; 2>/dev/null"

# 5. Docker (si installe)
Write-Host "`n5. DOCKER (si installe):" -ForegroundColor Cyan
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "docker system df 2>/dev/null || echo 'Docker non installe ou non accessible'"

# 6. Fichiers temporaires volumineux
Write-Host "`n6. FICHIERS TEMPORAIRES VOLUMINEUX (>100MB):" -ForegroundColor Cyan
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "sudo find /tmp -type f -size +100M -exec ls -lh {} \; 2>/dev/null | head -n 10"

# 7. Home directory
Write-Host "`n7. CONTENU DE /home/ubuntu:" -ForegroundColor Cyan
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "du -h --max-depth=1 /home/ubuntu 2>/dev/null | sort -rh | head -n 10"

# 8. Snapshots et backups
Write-Host "`n8. BACKUPS ET SNAPSHOTS:" -ForegroundColor Cyan
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "sudo find / -name '*.backup*' -o -name '*.snap' -o -name '*.old' 2>/dev/null | head -n 20"

# 9. Journal systemd
Write-Host "`n9. TAILLE DES LOGS SYSTEMD:" -ForegroundColor Cyan
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "sudo journalctl --disk-usage 2>/dev/null"

# 10. Packages installes qui prennent de la place
Write-Host "`n10. PLUS GROS PACKAGES INSTALLES:" -ForegroundColor Cyan
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "dpkg-query -Wf '\${Installed-Size}\t\${Package}\n' 2>/dev/null | sort -rh | head -n 10 | awk '{print \$1/1024 \"MB\t\" \$2}'"

Write-Host "`n===================================`n" -ForegroundColor Yellow
Write-Host "DIAGNOSTIC TERMINE" -ForegroundColor Green
