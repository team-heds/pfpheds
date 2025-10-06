# 🔧 Guide de Dépannage - Déploiement hedsvs.ch

## 🚨 Erreur SCP "write remote: Failure"

### Symptômes
```
C:\windows\System32\OpenSSH\scp.exe: write remote "/tmp/pfpheds-frontend-...tar.gz": Failure
C:\windows\System32\OpenSSH\scp.exe: failed to upload file
```

### Causes possibles
1. **Manque d'espace disque** sur `/tmp` (partition temporaire souvent limitée)
2. **Quota utilisateur dépassé**
3. **Permissions insuffisantes** sur `/tmp`
4. **Filesystem en lecture seule**

---

## ✅ Solutions Rapides

### Solution 1: Diagnostic et Nettoyage (RECOMMANDÉ)

1. **Vérifier l'espace disque sur le VPS:**
   ```powershell
   .\check-vps-space.ps1
   ```

2. **Si `/tmp` est plein, nettoyer:**
   ```powershell
   .\check-vps-space.ps1 -Clean
   ```

3. **Redéployer avec le script V2 (utilise ~/deploy au lieu de /tmp):**
   ```powershell
   .\deploy-hedsvs-v2.ps1
   ```

### Solution 2: Utiliser le nouveau script optimisé

Le nouveau script `deploy-hedsvs-v2.ps1` utilise `~/deploy/` au lieu de `/tmp/`, ce qui évite les problèmes d'espace:

```powershell
# Déploiement complet avec build
.\deploy-hedsvs-v2.ps1

# Déploiement sans rebuild (plus rapide)
.\deploy-hedsvs-v2.ps1 -SkipBuild

# Avec nettoyage forcé des dépendances
.\deploy-hedsvs-v2.ps1 -Force
```

### Solution 3: Nettoyage manuel du VPS

Si les scripts automatiques échouent, nettoyer manuellement:

```bash
# Se connecter au VPS
ssh -i "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt" ubuntu@83.228.204.5

# Vérifier l'espace disque
df -h

# Nettoyer /tmp
sudo find /tmp -type f -mtime +7 -delete
sudo rm -f /tmp/pfpheds-frontend-*.tar.gz
sudo rm -f /tmp/pfpheds-frontend-*.zip

# Nettoyer les anciens backups (garder les 3 derniers)
ls -t /var/www/pfpheds-frontend.backup-* 2>/dev/null | tail -n +4 | xargs sudo rm -rf

# Vérifier l'espace après nettoyage
df -h
```

### Solution 4: Utiliser un autre répertoire de transfert

Modifier temporairement le script pour utiliser le répertoire home:

```powershell
# Éditer deploy-hedsvs.ps1 ligne 97
# AVANT:
$scpResult = scp -i "..." $archiveName ubuntu@83.228.204.5:/tmp/

# APRÈS:
$scpResult = scp -i "..." $archiveName ubuntu@83.228.204.5:~/deploy/

# Puis ajuster le script de déploiement (ligne 123) pour utiliser ~/deploy/
```

**OU** utiliser directement le nouveau script `deploy-hedsvs-v2.ps1` qui fait déjà cela.

---

## 📊 Diagnostic Détaillé

### Vérifier l'espace disque complet

```powershell
.\check-vps-space.ps1
```

Ce script affiche:
- Espace disque global
- Espace disque de `/tmp`
- Taille des fichiers dans `/tmp`
- Espace disque de `/var/www`
- Inodes disponibles
- Liste des anciens backups

### Commandes SSH manuelles

```bash
# Connexion SSH
ssh -i "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt" ubuntu@83.228.204.5

# Vérifier l'espace disque de toutes les partitions
df -h

# Vérifier spécifiquement /tmp
df -h /tmp

# Voir les plus gros fichiers dans /tmp
sudo du -sh /tmp/* | sort -rh | head -10

# Vérifier les inodes (parfois le problème n'est pas l'espace mais le nombre de fichiers)
df -i

# Vérifier les quotas utilisateur
quota -v
```

---

## 🚀 Comparaison des Scripts

### Script Original (`deploy-hedsvs.ps1`)
- ✅ Fonctionne bien si `/tmp` a assez d'espace
- ❌ Échoue si `/tmp` est plein (partition souvent limitée à 1-2 GB)
- 📁 Utilise `/tmp/` pour les archives

### Nouveau Script V2 (`deploy-hedsvs-v2.ps1`)
- ✅ Utilise `~/deploy/` au lieu de `/tmp/`
- ✅ Vérifie l'espace disque avant transfert
- ✅ Nettoie automatiquement les anciennes archives
- ✅ Gestion intelligente des backups (garde les 3 derniers)
- ✅ Meilleurs messages d'erreur
- 📁 Utilise `~/deploy/` (partition principale avec plus d'espace)

---

## ⚙️ Options des Scripts

### deploy-hedsvs-v2.ps1

```powershell
# Déploiement normal
.\deploy-hedsvs-v2.ps1

# Sans rebuild (utilise le dist existant)
.\deploy-hedsvs-v2.ps1 -SkipBuild

# Avec nettoyage forcé des node_modules
.\deploy-hedsvs-v2.ps1 -Force

# Conserver les archives (pour debugging)
.\deploy-hedsvs-v2.ps1 -SkipCleanup

# Spécifier une version
.\deploy-hedsvs-v2.ps1 -Version "0.1.0.34"
```

### check-vps-space.ps1

```powershell
# Diagnostic seul
.\check-vps-space.ps1

# Diagnostic + Nettoyage automatique
.\check-vps-space.ps1 -Clean
```

---

## 📝 Workflow Recommandé

1. **Avant le déploiement** (première fois ou en cas de problème):
   ```powershell
   .\check-vps-space.ps1
   ```

2. **Si espace insuffisant**:
   ```powershell
   .\check-vps-space.ps1 -Clean
   ```

3. **Déployer avec le script V2**:
   ```powershell
   .\deploy-hedsvs-v2.ps1
   ```

4. **En cas d'échec, déployer sans rebuild**:
   ```powershell
   .\deploy-hedsvs-v2.ps1 -SkipBuild
   ```

---

## 🆘 Autres Erreurs Courantes

### Erreur: "Permission denied"
```powershell
# Vérifier les permissions de la clé SSH
icacls "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt"

# Doit être accessible seulement par votre utilisateur
# Si nécessaire, corriger:
icacls "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt" /inheritance:r /grant:r "$env:USERNAME:R"
```

### Erreur: "Connection refused"
```powershell
# Vérifier que le VPS est accessible
ping 83.228.204.5

# Vérifier SSH
ssh -i "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt" ubuntu@83.228.204.5 "echo 'OK'"
```

### Erreur: "tar: command not found"
```powershell
# Installer Git Bash (inclut tar) ou WSL
# Ou utiliser 7-Zip (le script détecte automatiquement)
```

---

## 📞 Support

Si les problèmes persistent après avoir essayé ces solutions:

1. **Examiner les logs détaillés** du script de déploiement
2. **Vérifier l'espace disque** avec `check-vps-space.ps1`
3. **Se connecter manuellement** au VPS pour investiguer
4. **Vérifier les logs Caddy** sur le VPS:
   ```bash
   sudo docker logs supabase-caddy-1
   ```

---

## 🎯 Résumé des Fichiers

| Fichier | Usage | Description |
|---------|-------|-------------|
| `deploy-hedsvs.ps1` | Ancien script | Utilise `/tmp/` (peut échouer si plein) |
| `deploy-hedsvs-v2.ps1` | **RECOMMANDÉ** | Utilise `~/deploy/` (plus d'espace) |
| `check-vps-space.ps1` | Diagnostic | Vérifie l'espace et nettoie si besoin |
| `DEPLOY-TROUBLESHOOTING.md` | Ce guide | Documentation de dépannage |

**Utilisez toujours `deploy-hedsvs-v2.ps1` pour éviter les problèmes d'espace disque.**
