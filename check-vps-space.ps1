# Script de diagnostic pour vérifier l'espace disque sur le VPS
# Vérifie /tmp et autres partitions critiques

param([switch]$Clean)

$SSH_KEY = "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt"
$SSH_HOST = "ubuntu@83.228.204.5"

Write-Host "=== DIAGNOSTIC ESPACE DISQUE VPS ===" -ForegroundColor Yellow
Write-Host ""

# Script de diagnostic à exécuter sur le VPS
$diagScript = @'
#!/bin/bash

echo "========================================="
echo "DIAGNOSTIC ESPACE DISQUE - $(date)"
echo "========================================="
echo ""

echo "1. ESPACE DISQUE GLOBAL:"
echo "-------------------------"
df -h

echo ""
echo "2. ESPACE DISQUE /tmp:"
echo "----------------------"
df -h /tmp

echo ""
echo "3. TAILLE DU DOSSIER /tmp:"
echo "-------------------------"
sudo du -sh /tmp 2>/dev/null || du -sh /tmp

echo ""
echo "4. FICHIERS DANS /tmp (top 10):"
echo "--------------------------------"
sudo du -sh /tmp/* 2>/dev/null | sort -rh | head -10

echo ""
echo "5. ESPACE DISQUE /var/www:"
echo "-------------------------"
df -h /var/www

echo ""
echo "6. INODES DISPONIBLES:"
echo "----------------------"
df -i

echo ""
echo "7. ANCIENS BACKUPS:"
echo "-------------------"
ls -lh /var/www/pfpheds-frontend.backup-* 2>/dev/null | head -5 || echo "Aucun backup trouvé"

'@

if ($Clean) {
    Write-Host "[INFO] Mode nettoyage activé" -ForegroundColor Cyan
    
    $cleanScript = @'
#!/bin/bash
set -e

echo ""
echo "========================================="
echo "NETTOYAGE /tmp ET ANCIENS BACKUPS"
echo "========================================="
echo ""

echo "Avant nettoyage:"
df -h /tmp

echo ""
echo "Suppression des fichiers temporaires anciens (>7 jours)..."
sudo find /tmp -type f -mtime +7 -delete 2>/dev/null || echo "Aucun fichier ancien trouvé"

echo ""
echo "Suppression des archives de déploiement..."
sudo rm -f /tmp/pfpheds-frontend-*.tar.gz 2>/dev/null || echo "Aucune archive trouvée"
sudo rm -f /tmp/pfpheds-frontend-*.zip 2>/dev/null || echo "Aucun ZIP trouvé"

echo ""
echo "Suppression des anciens backups (garde les 3 derniers)..."
ls -t /var/www/pfpheds-frontend.backup-* 2>/dev/null | tail -n +4 | xargs sudo rm -rf 2>/dev/null || echo "Pas de vieux backups à supprimer"

echo ""
echo "Après nettoyage:"
df -h /tmp

echo ""
echo "[SUCCESS] Nettoyage terminé"
'@

    $diagScript += $cleanScript
}

# Exécution du script sur le VPS
Write-Host "[INFO] Connexion au VPS pour diagnostic..." -ForegroundColor Cyan
$diagScript | ssh -i $SSH_KEY $SSH_HOST "bash -s"

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[SUCCESS] Diagnostic terminé" -ForegroundColor Green
    
    if ($Clean) {
        Write-Host "`n[INFO] Vous pouvez maintenant relancer le déploiement" -ForegroundColor Cyan
    } else {
        Write-Host "`n[TIP] Si /tmp est plein, relancez avec: .\check-vps-space.ps1 -Clean" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n[ERROR] Échec du diagnostic" -ForegroundColor Red
}

Write-Host ""
