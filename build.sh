#!/bin/bash

# Script de build alternatif pour contourner les problèmes Rollup

echo "🚀 Démarrage du build alternatif..."

# Nettoyer les anciens fichiers
echo "🧹 Nettoyage des anciens fichiers..."
rm -rf node_modules package-lock.json dist

# Installer les dépendances avec npm ci pour un build propre
echo "📦 Installation des dépendances..."
npm install --force --legacy-peer-deps

# Vérifier si le build fonctionne
echo "🔨 Tentative de build..."
if npm run build; then
    echo "✅ Build réussi!"
else
    echo "❌ Build échoué, tentative avec Vite en mode legacy..."
    npx vite build --mode production --legacy
fi

echo "🎉 Script terminé!"
