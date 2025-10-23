# 🚀 Guide de Déploiement PFP Frontend

## 📋 Prérequis

- **Node.js** installé localement
- **Accès SSH** au VPS (ubuntu@83.228.204.5)
- **PowerShell** sur Windows

---

## 🎯 Déploiement Rapide

### Option A : Déploiement Complet (Build + Transfer)

```powershell
# 1. Nettoyer le VPS (recommandé)
.\clean-vps.ps1

# 2. Déployer (build automatique)
.\deploy-safe.ps1
```

### Option B : Déploiement d'une Archive Existante

```powershell
# Utiliser une archive déjà créée
.\deploy-safe.ps1 -BuildArchive "pfp-frontend-v0.1.0.35-20251023-091940.tar.gz" -SkipBuild
```

---

## 🧹 Nettoyage du VPS

Si vous avez des problèmes d'espace disque :

```powershell
# Nettoyer le serveur
.\clean-vps.ps1
```

**Ce script supprime :**
- ✅ Archives de plus de 7 jours dans `/tmp`
- ✅ Archives de plus de 7 jours dans `/home/ubuntu`
- ✅ Logs système anciens
- ✅ Packages inutilisés

---

## 🔍 Diagnostics Manuels

### Vérifier l'espace disque

```powershell
ssh ubuntu@83.228.204.5 "df -h"
```

### Voir les gros fichiers

```powershell
ssh ubuntu@83.228.204.5 "du -sh /home/ubuntu/* | sort -rh | head -10"
```

### Supprimer manuellement les anciennes archives

```powershell
ssh ubuntu@83.228.204.5 "find /home/ubuntu -name 'pfp-frontend-*.tar.gz' -mtime +7 -delete"
```

---

## ⚙️ Configuration du Script

### Modifier le Chemin de Déploiement

Dans `deploy-safe.ps1`, ligne 10 :

```powershell
$REMOTE_DIR = "/home/ubuntu/deploys"  # Changez si nécessaire
```

### Modifier l'Espace Minimum Requis

Dans `deploy-safe.ps1`, ligne 11 :

```powershell
$MIN_FREE_SPACE_MB = 500  # 500 MB minimum recommandé
```

---

## 🐛 Résolution de Problèmes

### Erreur : "write remote: Failure"

**Cause :** Espace disque insuffisant sur le VPS

**Solutions :**
1. Lancez `.\clean-vps.ps1`
2. Vérifiez l'espace : `ssh ubuntu@83.228.204.5 "df -h"`
3. Supprimez manuellement des fichiers si nécessaire

### Erreur : "Connection refused"

**Cause :** Problème de connexion SSH

**Solutions :**
1. Vérifiez que le VPS est accessible : `ping 83.228.204.5`
2. Testez SSH : `ssh ubuntu@83.228.204.5 "echo OK"`
3. Vérifiez vos clés SSH

### Erreur : "Permission denied"

**Cause :** Problème de permissions

**Solutions :**
```powershell
# Créer le répertoire avec les bonnes permissions
ssh ubuntu@83.228.204.5 "mkdir -p /home/ubuntu/deploys && chmod 755 /home/ubuntu/deploys"
```

### Transfert Lent

**Solutions :**
1. Utilisez l'option de compression SCP (déjà dans le script : `-C`)
2. Vérifiez votre connexion internet
3. Essayez à un moment différent (réseau moins chargé)

---

## 📊 Optimisations

### Réduire la Taille de l'Archive

Dans `package.json`, vérifiez votre configuration Vite :

```json
{
  "build": {
    "minify": true,
    "sourcemap": false
  }
}
```

### Compression Alternative (Plus Efficace)

Si l'archive est trop grosse, utilisez xz :

```bash
# Au lieu de tar.gz
tar -cJf archive.tar.xz dist/
```

### Nettoyage Automatique

Ajoutez un cron job sur le VPS :

```bash
# Nettoyer automatiquement chaque semaine
0 3 * * 0 find /home/ubuntu/deploys -name "*.tar.gz" -mtime +7 -delete
```

---

## 🔄 Workflow Complet

```
1. Développement Local
   ↓
2. npm run build
   ↓
3. .\clean-vps.ps1 (si nécessaire)
   ↓
4. .\deploy-safe.ps1
   ↓
5. Connexion SSH au VPS
   ↓
6. Déploiement final (nginx, etc.)
```

---

## 📁 Structure sur le VPS

```
/home/ubuntu/
├── deploys/
│   ├── pfp-frontend-v0.1.0.35-20251023-091940.tar.gz
│   ├── dist/  (après extraction)
│   └── ... (anciennes versions)
```

---

## 🎯 Commandes Utiles

### Build Local

```bash
npm run build
```

### Test Build Local

```bash
npm run preview
```

### Connexion SSH

```bash
ssh ubuntu@83.228.204.5
```

### Voir les Logs du VPS

```bash
ssh ubuntu@83.228.204.5 "sudo journalctl -u nginx -f"
```

---

## 📞 Support

Si les problèmes persistent :

1. **Vérifiez les logs** : Regardez ce que retourne `deploy-safe.ps1`
2. **Augmentez l'espace** : Contactez votre hébergeur VPS
3. **Essayez un autre chemin** : Utilisez `/opt` ou `/var/www` si `/home/ubuntu` est plein

---

## ✅ Checklist de Déploiement

- [ ] Code committé et pushé sur Git
- [ ] Tests passent localement
- [ ] Build local réussi (`npm run build`)
- [ ] Espace disque VPS vérifié
- [ ] Backup de la version précédente fait
- [ ] Script `deploy-safe.ps1` lancé
- [ ] Transfert réussi
- [ ] Archive extraite sur le VPS
- [ ] Application déployée (nginx/apache)
- [ ] Tests de fumée sur l'URL de production

---

## 🎉 Déploiement Réussi !

Une fois le script terminé, votre application est prête à être déployée sur le serveur web !

**Prochaine étape :**
```bash
# Connectez-vous au VPS
ssh ubuntu@83.228.204.5

# Allez dans le répertoire
cd /home/ubuntu/deploys

# Suivez vos procédures de déploiement nginx/apache
```
