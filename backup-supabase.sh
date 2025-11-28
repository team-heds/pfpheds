#!/bin/bash

###############################################################################
# 🔒 SCRIPT DE BACKUP SUPABASE (VPS)
###############################################################################

# Configuration
DB_NAME="postgres"          # Nom de ta base (postgres, supabase, etc.)
DB_USER="postgres"          # Utilisateur PostgreSQL
DB_HOST="localhost"         # Host
BACKUP_DIR="/home/backups"  # Dossier de destination

# Créer le dossier de backup s'il n'existe pas
mkdir -p $BACKUP_DIR

# Nom du fichier avec timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/supabase_backup_$TIMESTAMP.sql"

echo "🔄 Démarrage du backup..."
echo "📁 Base de données: $DB_NAME"
echo "📁 Fichier: $BACKUP_FILE"
echo ""

# Backup complet
if pg_dump -U $DB_USER -h $DB_HOST $DB_NAME > $BACKUP_FILE 2>&1; then
    echo "✅ Backup réussi!"
    
    # Taille du fichier
    SIZE=$(du -h $BACKUP_FILE | cut -f1)
    echo "📦 Taille: $SIZE"
    
    # Compresser le backup
    echo "🗜️  Compression..."
    gzip $BACKUP_FILE
    COMPRESSED_SIZE=$(du -h $BACKUP_FILE.gz | cut -f1)
    echo "✅ Fichier compressé: $BACKUP_FILE.gz ($COMPRESSED_SIZE)"
    
    # Garder seulement les 5 derniers backups
    echo "🧹 Nettoyage des anciens backups..."
    ls -t $BACKUP_DIR/supabase_backup_*.sql.gz | tail -n +6 | xargs -r rm
    
    echo ""
    echo "🎉 Backup terminé avec succès!"
    echo "📍 Fichier: $BACKUP_FILE.gz"
    
else
    echo "❌ Erreur pendant le backup!"
    exit 1
fi

# Liste des backups disponibles
echo ""
echo "📋 Backups disponibles:"
ls -lh $BACKUP_DIR/supabase_backup_*.sql.gz 2>/dev/null || echo "Aucun backup trouvé"
