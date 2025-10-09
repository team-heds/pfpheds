#!/bin/bash
# Script de nettoyage automatique du serveur hedsvs.ch
# À exécuter régulièrement pour éviter que le disque se remplisse

echo "🧹 NETTOYAGE AUTOMATIQUE DU SERVEUR"
echo "===================================="
echo ""

# 1. Nettoyer les vieux backups (garder les 5 derniers)
echo "📦 Nettoyage des backups frontend..."
cd /var/www
BACKUP_COUNT=$(find . -maxdepth 1 -type d -name 'pfpheds-frontend.backup-*' | wc -l)
echo "   Backups trouvés: $BACKUP_COUNT"

if [ $BACKUP_COUNT -gt 5 ]; then
  TO_DELETE=$((BACKUP_COUNT - 5))
  echo "   Suppression de $TO_DELETE vieux backups..."
  find . -maxdepth 1 -type d -name 'pfpheds-frontend.backup-*' | sort | head -n $TO_DELETE | xargs -r sudo rm -rf
  echo "   ✅ Backups nettoyés"
else
  echo "   ℹ️  Pas de nettoyage nécessaire"
fi
echo ""

# 2. Nettoyer les logs Docker
echo "📝 Nettoyage des logs Docker..."
LOG_SIZE_BEFORE=$(sudo du -sh /var/lib/docker/containers 2>/dev/null | cut -f1)
echo "   Taille avant: $LOG_SIZE_BEFORE"
sudo find /var/lib/docker/containers -type f -name "*.log" -exec truncate -s 100M {} \; 2>/dev/null
LOG_SIZE_AFTER=$(sudo du -sh /var/lib/docker/containers 2>/dev/null | cut -f1)
echo "   Taille après: $LOG_SIZE_AFTER"
echo "   ✅ Logs Docker nettoyés"
echo ""

# 3. Nettoyer les images Docker inutilisées
echo "🐳 Nettoyage des images Docker..."
sudo docker system prune -f --volumes 2>&1 | grep "Total reclaimed space"
echo "   ✅ Images Docker nettoyées"
echo ""

# 4. Nettoyer les logs système anciens
echo "📋 Nettoyage des logs système..."
sudo journalctl --vacuum-time=7d 2>&1 | grep "Vacuuming done"
echo "   ✅ Logs système nettoyés"
echo ""

# 5. Nettoyer le cache APT
echo "📦 Nettoyage du cache APT..."
sudo apt-get clean
sudo apt-get autoclean
sudo apt-get autoremove -y
echo "   ✅ Cache APT nettoyé"
echo ""

# 6. Afficher l'espace disque final
echo "💾 ESPACE DISQUE FINAL"
echo "======================"
df -h / | grep -v "Filesystem"
echo ""

# 7. Vérifier l'état des conteneurs Supabase
echo "🔍 ÉTAT DES SERVICES SUPABASE"
echo "=============================="
sudo docker ps --filter name=supabase --format 'table {{.Names}}\t{{.Status}}' | grep -E "(NAMES|healthy|unhealthy)"
echo ""

echo "✅ NETTOYAGE TERMINÉ"
echo ""
echo "💡 Pour automatiser ce script:"
echo "   1. Copiez-le sur le serveur: scp cleanup-server.sh ubuntu@83.228.204.5:/home/ubuntu/"
echo "   2. Ajoutez-le au cron: sudo crontab -e"
echo "   3. Ajoutez: 0 2 * * * /home/ubuntu/cleanup-server.sh >> /var/log/cleanup.log 2>&1"
echo "      (Exécution tous les jours à 2h du matin)"
