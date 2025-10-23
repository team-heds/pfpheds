# Script de nettoyage cible base sur le diagnostic
# Usage: .\clean-vps-targeted.ps1

$SSH_KEY = "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt"
$REMOTE_USER = "ubuntu"
$REMOTE_HOST = "83.228.204.5"

Write-Host "NETTOYAGE CIBLE DU VPS" -ForegroundColor Yellow
Write-Host "===================================`n" -ForegroundColor Yellow

# Espace disque AVANT
Write-Host "ESPACE DISQUE AVANT:" -ForegroundColor Cyan
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "df -h / | grep -E '(Filesystem|/dev/)'"

Write-Host "`nActions de nettoyage:" -ForegroundColor Yellow
Write-Host "1. Suppression des 5 backups d'octobre dans /var/www (~5 GB)" -ForegroundColor White
Write-Host "2. Nettoyage du cache npm (~971 MB)" -ForegroundColor White
Write-Host "3. Nettoyage de /home/ubuntu/deploys (~934 MB)" -ForegroundColor White
Write-Host "4. Nettoyage logs systemd (~344 MB)" -ForegroundColor White
Write-Host "5. Nettoyage du repertoire pfpheds (~1.8 GB si safe)" -ForegroundColor White
Write-Host "`nPRESSEZ ENTREE POUR CONTINUER OU CTRL+C POUR ANNULER..." -ForegroundColor Red
Read-Host

# 1. SUPPRIMER LES 5 BACKUPS D'OCTOBRE (GAIN ESTIME: 5+ GB)
Write-Host "`n1. SUPPRESSION DES BACKUPS D'OCTOBRE..." -ForegroundColor Yellow
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" @"
echo 'Backups avant suppression:'
sudo ls -lh /var/www/*.backup* 2>/dev/null | head -10
echo ''
echo 'Suppression en cours...'
sudo rm -rf /var/www/pfpheds-frontend.backup-20251007-233710
sudo rm -rf /var/www/pfpheds-frontend.backup-20251009-172106
sudo rm -rf /var/www/pfpheds-frontend.backup-20251009-172033
sudo rm -rf /var/www/pfpheds-frontend.backup-20251009-180947
sudo rm -rf /var/www/pfpheds-frontend.backup-20251009-142056
echo 'Backups d octobre supprimes!'
"@

Write-Host "Espace libere apres suppression backups:" -ForegroundColor Green
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "df -h / | grep -E '(Filesystem|/dev/)'"

# 2. NETTOYER LE CACHE NPM (GAIN: 971 MB)
Write-Host "`n2. NETTOYAGE CACHE NPM..." -ForegroundColor Yellow
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" @"
rm -rf ~/.npm
mkdir -p ~/.npm
echo 'Cache npm nettoye (971 MB)'
"@

# 3. NETTOYER LE REPERTOIRE DEPLOYS (GAIN: 934 MB)
Write-Host "`n3. NETTOYAGE DEPLOYS..." -ForegroundColor Yellow
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" @"
rm -rf ~/deploys/*
echo 'Repertoire deploys nettoye (934 MB)'
"@

# 4. NETTOYER LES LOGS SYSTEMD (GAIN: 344 MB)
Write-Host "`n4. NETTOYAGE LOGS SYSTEMD..." -ForegroundColor Yellow
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" @"
sudo journalctl --vacuum-time=1d
echo 'Logs systemd nettoyes'
"@

# 5. NETTOYER LE REPERTOIRE PFPHEDS (SI SAFE - GAIN: 1.8 GB)
Write-Host "`n5. ANALYSE DU REPERTOIRE PFPHEDS..." -ForegroundColor Yellow
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" @"
echo 'Contenu de ~/pfpheds:'
du -h --max-depth=1 ~/pfpheds 2>/dev/null | sort -rh | head -10
echo ''
echo 'Nettoyage node_modules et dist si presents...'
rm -rf ~/pfpheds/node_modules 2>/dev/null && echo 'node_modules supprime' || echo 'node_modules absent'
rm -rf ~/pfpheds/dist 2>/dev/null && echo 'dist supprime' || echo 'dist absent'
"@

# 6. AUTRES NETTOYAGES MINEURS
Write-Host "`n6. NETTOYAGES COMPLEMENTAIRES..." -ForegroundColor Yellow
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" @"
# Nettoyer /tmp
sudo rm -rf /tmp/* 2>/dev/null
echo 'tmp nettoye'

# Nettoyer les logs anciens
sudo find /var/log -type f -name '*.gz' -delete 2>/dev/null
sudo find /var/log -type f -name '*.1' -delete 2>/dev/null
echo 'Logs archives supprimes'

# Nettoyer le cache APT
sudo apt-get clean
echo 'Cache APT nettoye'
"@

# ESPACE DISQUE FINAL
Write-Host "`nESPACE DISQUE FINAL:" -ForegroundColor Cyan
ssh -i $SSH_KEY "$REMOTE_USER@$REMOTE_HOST" "df -h / | grep -E '(Filesystem|/dev/)'"

Write-Host "`n===================================`n" -ForegroundColor Yellow
Write-Host "NETTOYAGE TERMINE!" -ForegroundColor Green
Write-Host "`nGain estime: 7-8 GB" -ForegroundColor White
Write-Host "Vous devriez avoir au moins 7-8 GB libres maintenant" -ForegroundColor White
