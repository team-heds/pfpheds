# 🚀 Guide de Déploiement - Application Vue.js sur VPS avec Docker

## 📋 Prérequis

- VPS avec Docker et Docker Compose installés
- Domaine configuré (hedsvs.ch)
- Certificats SSL Let's Encrypt configurés
- Accès SSH au serveur


## 🔧 1. Configuration des Variables d'Environnement

### Créer le fichier .env.production
```bash
# Copiez .env.production.example vers .env.production
cp .env.production.example .env.production
```

### Remplir les variables obligatoires :
```env
# Firebase (OBLIGATOIRE)
VITE_FIREBASE_API_KEY=votre_api_key_firebase
VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre-projet-id
VITE_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_DATABASE_URL=https://votre-projet-default-rtdb.europe-west1.firebasedatabase.app

# Vimeo (optionnel)
VITE_VIMEO_ACCESS_TOKEN=votre_token_vimeo

# Supabase (si utilisé)
VITE_SUPABASE_URL=votre_url_supabase
VITE_SUPABASE_ANON_KEY=votre_cle_supabase
```

## 🏗️ 2. Build Local (Optionnel - pour tester)

```bash
# Installer les dépendances
npm install --force --legacy-peer-deps

# Build de production
npm run build

# Tester le build localement
npm run preview
```

## 🐳 3. Déploiement avec Docker

### Option A : Build et déploiement direct sur le serveur

```bash
# 1. Transférer le code sur le serveur
rsync -avz --exclude node_modules --exclude dist ./ user@hedsvs.ch:/path/to/app/

# 2. Se connecter au serveur
ssh user@hedsvs.ch

# 3. Aller dans le dossier de l'application
cd /path/to/app

# 4. Arrêter les conteneurs existants
docker-compose down

# 5. Reconstruire et démarrer
docker-compose up --build -d
```

### Option B : Build local et push d'images

```bash
# 1. Build l'image localement
docker build -t pfpheds-frontend .

# 2. Tag pour votre registry (si vous en avez un)
docker tag pfpheds-frontend your-registry/pfpheds-frontend:latest

# 3. Push vers le registry
docker push your-registry/pfpheds-frontend:latest
```

## 📝 4. Scripts de Déploiement Automatisés

### Script de déploiement complet (deploy.sh)
```bash
#!/bin/bash

echo "🚀 Déploiement de l'application PFP HEDS"

# Variables
SERVER="user@hedsvs.ch"
APP_PATH="/path/to/app"
BACKUP_PATH="/path/to/backups"

# 1. Créer une sauvegarde
echo "📦 Création d'une sauvegarde..."
ssh $SERVER "cd $APP_PATH && docker-compose down && tar -czf $BACKUP_PATH/backup-$(date +%Y%m%d-%H%M%S).tar.gz ."

# 2. Synchroniser le code
echo "📤 Synchronisation du code..."
rsync -avz --exclude node_modules --exclude dist --exclude .git ./ $SERVER:$APP_PATH/

# 3. Déployer
echo "🐳 Déploiement Docker..."
ssh $SERVER "cd $APP_PATH && docker-compose down && docker-compose up --build -d"

# 4. Vérifier le statut
echo "✅ Vérification du déploiement..."
ssh $SERVER "docker-compose ps"

echo "🎉 Déploiement terminé !"
```

## 🔍 5. Vérifications Post-Déploiement

### Vérifier les conteneurs
```bash
# Statut des conteneurs
docker-compose ps

# Logs du frontend
docker-compose logs frontend

# Logs du backend
docker-compose logs backend

# Logs du proxy
docker-compose logs proxy
```

### Vérifier l'application
```bash
# Test de connectivité
curl -I https://hedsvs.ch

# Vérifier les certificats SSL
openssl s_client -connect hedsvs.ch:443 -servername hedsvs.ch
```

## 🛠️ 6. Dépannage

### Problèmes courants

#### Build qui échoue
```bash
# Nettoyer le cache npm
docker-compose exec frontend npm cache clean --force

# Reconstruire complètement
docker-compose down
docker system prune -f
docker-compose up --build -d
```

#### Problèmes de permissions
```bash
# Vérifier les permissions des fichiers
ls -la nginx/
chmod 644 nginx/*.conf
```

#### Variables d'environnement non chargées
```bash
# Vérifier que .env.production existe
ls -la .env*

# Vérifier le contenu (sans afficher les secrets)
grep -v "=" .env.production | head -5
```

## 📊 7. Monitoring

### Logs en temps réel
```bash
# Tous les services
docker-compose logs -f

# Service spécifique
docker-compose logs -f frontend
```

### Métriques des conteneurs
```bash
# Utilisation des ressources
docker stats

# Espace disque
df -h
docker system df
```

## 🔄 8. Mise à Jour

### Mise à jour rapide (code seulement)
```bash
# Sur le serveur
cd /path/to/app
git pull origin main
docker-compose restart frontend
```

### Mise à jour complète (avec rebuild)
```bash
cd /path/to/app
git pull origin main
docker-compose down
docker-compose up --build -d
```

## 🔐 9. Sécurité

### Bonnes pratiques
- Gardez `.env.production` hors de Git
- Utilisez des secrets Docker pour les données sensibles
- Mettez à jour régulièrement les images de base
- Surveillez les logs pour les tentatives d'intrusion

### Sauvegarde automatique
```bash
# Crontab pour sauvegarde quotidienne
0 2 * * * cd /path/to/app && docker-compose exec -T frontend tar -czf /backups/daily-$(date +\%Y\%m\%d).tar.gz /usr/share/nginx/html
```

## 📞 Support

En cas de problème :
1. Vérifiez les logs : `docker-compose logs`
2. Vérifiez l'état des services : `docker-compose ps`
3. Redémarrez si nécessaire : `docker-compose restart`
4. Contactez l'équipe de développement avec les logs d'erreur
