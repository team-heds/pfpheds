# Script de nettoyage d'urgence du VPS
# À utiliser quand "No space left on device"

$SSH_KEY = "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt"
$SSH_HOST = "ubuntu@83.228.204.5"

Write-Host "=== NETTOYAGE D'URGENCE VPS ===" -ForegroundColor Red
Write-Host "ATTENTION: Ce script va supprimer des fichiers pour libérer de l'espace" -ForegroundColor Yellow
Write-Host ""

$cleanupScript = @'
#!/bin/bash
set -e

echo "========================================="
echo "NETTOYAGE D'URGENCE - $(date)"
echo "========================================="
echo ""

echo "AVANT NETTOYAGE:"
echo "----------------"
df -h / | grep -v Filesystem

echo ""
echo "1. Nettoyage de /tmp..."
sudo find /tmp -type f -delete 2>/dev/null || true
sudo rm -rf /tmp/* 2>/dev/null || true
echo "✓ /tmp nettoyé"

echo ""
echo "2. Suppression des anciens backups (garde le dernier)..."
ls -t /var/www/pfpheds-frontend.backup-* 2>/dev/null | tail -n +2 | xargs sudo rm -rf 2>/dev/null || echo "Aucun backup à supprimer"

echo ""
echo "3. Nettoyage des logs Docker..."
sudo docker system prune -a -f --volumes 2>/dev/null || echo "Pas de volumes Docker à nettoyer"

echo ""
echo "4. Nettoyage des logs système..."
sudo journalctl --vacuum-time=7d 2>/dev/null || echo "journalctl non disponible"
sudo find /var/log -type f -name "*.log" -mtime +7 -delete 2>/dev/null || echo "Aucun vieux log trouvé"
sudo find /var/log -type f -name "*.gz" -delete 2>/dev/null || echo "Aucune archive de log trouvée"

echo ""
echo "5. Nettoyage APT cache..."
sudo apt-get clean 2>/dev/null || true
sudo apt-get autoclean 2>/dev/null || true
sudo apt-get autoremove -y 2>/dev/null || true

echo ""
echo "6. Suppression des archives de déploiement..."
rm -rf ~/deploy/*.tar.gz 2>/dev/null || echo "Aucune archive dans ~/deploy"
rm -rf ~/deploy/*.zip 2>/dev/null || echo "Aucun ZIP dans ~/deploy"
rm -rf ~/*.tar.gz 2>/dev/null || echo "Aucune archive dans ~"
rm -rf ~/*.zip 2>/dev/null || echo "Aucun ZIP dans ~"

echo ""
echo "7. Nettoyage des fichiers temporaires utilisateur..."
rm -rf ~/.cache/* 2>/dev/null || true
rm -rf ~/.npm/_cacache 2>/dev/null || true

echo ""
echo "APRÈS NETTOYAGE:"
echo "----------------"
df -h / | grep -v Filesystem

echo ""
echo "DÉTAILS PAR PARTITION:"
df -h

echo ""
echo "TOP 10 RÉPERTOIRES LES PLUS VOLUMINEUX:"
sudo du -h --max-depth=2 /var 2>/dev/null | sort -rh | head -10

echo ""
echo "========================================="
echo "✓ NETTOYAGE TERMINÉ"
echo "========================================="
'@

Write-Host "[INFO] Connexion au VPS pour nettoyage d'urgence..." -ForegroundColor Cyan
$cleanupScript | ssh -i $SSH_KEY $SSH_HOST "bash -s"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[SUCCESS] Nettoyage terminé!" -ForegroundColor Green
    Write-Host ""
    Write-Host "PROCHAINES ÉTAPES:" -ForegroundColor Cyan
    Write-Host "1. Vérifier l'espace disponible: .\check-vps-space.ps1" -ForegroundColor Yellow
    Write-Host "2. Redéployer: .\deploy-hedsvs-v2.ps1 -SkipBuild" -ForegroundColor Yellow
} else {
    Write-Host ""
    Write-Host "[ERROR] Échec du nettoyage" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUTION MANUELLE:" -ForegroundColor Yellow
    Write-Host "ssh -i '$SSH_KEY' $SSH_HOST" -ForegroundColor Gray
    Write-Host "sudo rm -rf /tmp/*" -ForegroundColor Gray
    Write-Host "sudo docker system prune -a -f --volumes" -ForegroundColor Gray
}
