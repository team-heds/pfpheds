# 🐳 Guide de Résolution des Problèmes Docker

## Problème Actuel: Erreur Rollup `@rollup/rollup-linux-x64-musl`

### 🔍 Diagnostic
L'erreur vient du fait que Rollup ne trouve pas le module natif pour Alpine Linux (musl). C'est un problème connu avec npm et les dépendances optionnelles.

### 🛠️ Solutions Disponibles

#### Solution 1: Dockerfile Corrigé (Alpine)
```bash
sudo docker-compose up -d --build
```
Le nouveau `Dockerfile` inclut:
- Installation des dépendances système (python3, make, g++, git)
- Nettoyage du cache npm
- Installation avec `--force --legacy-peer-deps`

#### Solution 2: Dockerfile Ubuntu
```bash
sudo docker-compose -f docker-compose.ubuntu.yml up -d --build
```
Utilise Ubuntu au lieu d'Alpine pour éviter les problèmes musl.

#### Solution 3: Script de Déploiement Automatique
```bash
chmod +x deploy.sh
./deploy.sh
```
Teste automatiquement les différentes approches.

#### Solution 4: Build Local + Conteneurisation
```bash
# Sur le serveur
npm install --force --legacy-peer-deps
npm run build

# Puis build Docker sans npm install
sudo docker-compose up -d
```

### 🔧 Commandes de Debug

#### Vérifier les logs
```bash
sudo docker logs frontend
sudo docker logs backend
```

#### Nettoyer complètement Docker
```bash
sudo docker system prune -a -f
sudo docker volume prune -f
```

#### Tester le build local
```bash
chmod +x build.sh
./build.sh
```

### 📋 Checklist de Vérification

- [ ] Node.js version 20+ installé
- [ ] npm cache nettoyé
- [ ] package-lock.json supprimé
- [ ] Dépendances système installées
- [ ] Espace disque suffisant
- [ ] Permissions Docker correctes

### 🚨 Solutions d'Urgence

#### Si tout échoue, build manuel:
```bash
# 1. Build local
npm install --force
npm run build

# 2. Copier dist/ vers le conteneur Nginx
sudo docker run -d --name frontend-manual \
  -v $(pwd)/dist:/usr/share/nginx/html \
  -p 80:80 nginx:stable-alpine
```

### 📞 Support
- Vérifier les logs détaillés: `sudo docker logs frontend --details`
- Tester sur une machine locale d'abord
- Considérer l'utilisation de Vite en mode legacy
