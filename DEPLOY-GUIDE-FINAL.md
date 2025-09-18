# Guide de Déploiement Final - hedsvs.ch

## 🎯 Script de Déploiement Optimisé

Après résolution des conflits Nginx/Caddy, utilisez uniquement le script **`deploy-hedsvs.ps1`** pour toutes les mises à jour.

## 🚀 Utilisation

### Déploiement Standard
```powershell
.\deploy-hedsvs.ps1
```

### Options Avancées
```powershell
# Déploiement avec version spécifique
.\deploy-hedsvs.ps1 -Version "0.1.0.23"

# Ignorer le build (si déjà fait)
.\deploy-hedsvs.ps1 -SkipBuild

# Forcer la réinstallation des dépendances
.\deploy-hedsvs.ps1 -Force
```

## 📋 Ce que fait le script

1. **Build** : Compile le frontend Vue.js
2. **Archive** : Crée un ZIP avec timestamp
3. **Transfert** : Envoie vers le VPS via SCP
4. **Déploiement** : 
   - Sauvegarde l'ancienne version
   - Extrait la nouvelle version
   - Met à jour le conteneur Caddy
   - Recharge la configuration
5. **Nettoyage** : Supprime les fichiers temporaires

## ✅ Architecture Finale

- **Caddy (Docker)** : Seul gestionnaire des ports 80/443
- **SSL automatique** : Let's Encrypt via Caddy
- **Frontend** : Servi depuis `/var/www/pfpheds-frontend`
- **API Supabase** : Routage via Caddy

## 🔧 Résolution des Conflits (Déjà Fait)

Les problèmes suivants ont été résolus définitivement :
- ✅ Nginx désactivé (plus de conflit de ports)
- ✅ Configuration `hedsvs.ch` ajoutée dans Caddy
- ✅ Volume `/var/www/pfpheds-frontend` configuré
- ✅ Certificats SSL automatiques

## 🌐 Accès Final

- **Site principal** : https://hedsvs.ch
- **Studio Supabase** : https://studio2.hedsvs.ch
- **API Supabase** : https://api2.hedsvs.ch

## 📝 Notes Importantes

1. **Un seul script** : `deploy-hedsvs.ps1` pour tous les déploiements
2. **Pas de Nginx** : Caddy gère tout automatiquement
3. **SSL automatique** : Certificats renouvelés par Caddy
4. **Sauvegarde auto** : Chaque déploiement sauvegarde la version précédente

## 🚨 En cas de problème

Si le site ne se met pas à jour :
1. Vérifiez que Caddy est actif : `sudo docker ps | grep caddy`
2. Rechargez Caddy : `sudo docker exec supabase-caddy-1 caddy reload`
3. Vérifiez les logs : `sudo docker logs supabase-caddy-1 --tail 20`

## 🎉 Succès !

Votre infrastructure est maintenant optimisée et prête pour la production !
