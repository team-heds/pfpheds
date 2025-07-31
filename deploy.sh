#!/bin/bash

# Script de déploiement avec fallback

echo "🚀 Script de déploiement PFP HEDS"
echo "================================="

# Arrêter les conteneurs existants
echo "🛑 Arrêt des conteneurs existants..."
sudo docker-compose down 2>/dev/null || true

# Nettoyer les images
echo "🧹 Nettoyage des images Docker..."
sudo docker system prune -f

# Tentative 1: Build avec Alpine (version corrigée)
echo "🔄 Tentative 1: Build avec Alpine (version corrigée)..."
if sudo docker-compose up -d --build; then
    echo "✅ Build Alpine réussi!"
    exit 0
else
    echo "❌ Build Alpine échoué, tentative avec Ubuntu..."
    sudo docker-compose down 2>/dev/null || true
fi

# Tentative 2: Build avec Ubuntu
echo "🔄 Tentative 2: Build avec Ubuntu..."
if sudo docker-compose -f docker-compose.ubuntu.yml up -d --build; then
    echo "✅ Build Ubuntu réussi!"
    exit 0
else
    echo "❌ Build Ubuntu échoué également"
    sudo docker-compose -f docker-compose.ubuntu.yml down 2>/dev/null || true
fi

# Tentative 3: Build local puis copie
echo "🔄 Tentative 3: Build local puis conteneurisation..."
echo "Veuillez exécuter manuellement :"
echo "1. npm install --force --legacy-peer-deps"
echo "2. npm run build"
echo "3. sudo docker-compose up -d (sans --build)"

echo "❌ Toutes les tentatives automatiques ont échoué"
echo "📋 Logs disponibles avec: sudo docker logs frontend"
exit 1
