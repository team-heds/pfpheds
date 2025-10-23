# Deployer MAINTENANT - Guide Rapide

## Probleme Resolu
Les scripts PowerShell avaient des caracteres accentues mal encodes.
**C'est corrige maintenant !**

---

## 1. Nettoyer le VPS (2 minutes)

```powershell
.\clean-vps.ps1
```

**Ce script :**
- Supprime les anciennes archives
- Nettoie /tmp
- Nettoie les logs systeme
- Libere de l'espace

---

## 2. Deployer (5-10 minutes)

```powershell
.\deploy-safe.ps1
```

**Ce script :**
- Verifie l'espace disque AVANT le transfert
- Nettoie automatiquement si necessaire
- Transfert l'archive vers le VPS
- Verifie que le transfert a reussi
- Decompresse automatiquement

---

## 3. Si Echec -> Script d'Urgence

```powershell
.\deploy-emergency.ps1
```

**Ce script :**
- Version minimaliste
- Nettoyage brutal
- Transfert direct

---

## Commandes a Executer MAINTENANT

### Methode 1 : Complete (Recommandee)

```powershell
# Etape 1 : Nettoyer
.\clean-vps.ps1

# Etape 2 : Deployer
.\deploy-safe.ps1
```

### Methode 2 : Urgence (Si erreur)

```powershell
.\deploy-emergency.ps1
```

---

## Ce que Vous Verrez

```
Deploiement PFP Frontend
================================

ETAPE 1: Build de l'application...
   Build reussi

ETAPE 2: Verification connexion SSH...
   Connexion SSH OK

ETAPE 3: Verification espace disque...
   Espace libre: 1024 MB
   Espace disque suffisant

ETAPE 4: Preparation du serveur...
   Repertoire cree: /home/ubuntu/deploys

ETAPE 5: Transfert vers le VPS...
   [Progress bar...]
   Transfert reussi!

ETAPE 6: Verification du transfert...
   Tailles identiques

ETAPE 7: Decompression sur le serveur...
   Decompression reussie

================================
DEPLOIEMENT REUSSI!
================================
```

---

## En Cas d'Erreur

### "Espace disque insuffisant"

```powershell
# Verifier l'espace
ssh ubuntu@83.228.204.5 "df -h"

# Nettoyer manuellement
ssh ubuntu@83.228.204.5 "sudo rm -rf /tmp/* && sudo journalctl --vacuum-time=3d"

# Reessayer
.\deploy-safe.ps1
```

### "Permission denied"

```powershell
# Creer le repertoire avec les bonnes permissions
ssh ubuntu@83.228.204.5 "mkdir -p /home/ubuntu/deploys && chmod 755 /home/ubuntu/deploys"

# Reessayer
.\deploy-safe.ps1
```

### "Connection refused"

```powershell
# Tester la connexion SSH
ssh ubuntu@83.228.204.5 "echo OK"

# Si ca marche, reessayer le deploiement
.\deploy-safe.ps1
```

---

## Apres le Deploiement Reussi

```bash
# Se connecter au VPS
ssh ubuntu@83.228.204.5

# Aller dans le repertoire
cd /home/ubuntu/deploys

# Lister les fichiers
ls -lh

# L'archive est decompresse dans dist/
cd dist
ls -lh
```

---

## FAQ Rapide

**Q: Combien d'espace faut-il ?**
A: Minimum 500 MB libres recommandes

**Q: Combien de temps ca prend ?**
A: 5-10 minutes selon la taille de l'archive et la connexion

**Q: Que faire si ca bloque a 85% ?**
A: Lancez `.\clean-vps.ps1` puis reessayez

**Q: Les emojis ne s'affichent pas ?**
A: Normal, ils sont supprimes pour eviter les problemes d'encodage

---

## Checklist Avant de Lancer

- [ ] PowerShell ouvert dans le dossier du projet
- [ ] Archive presente (pfp-frontend-*.tar.gz)
- [ ] Connexion SSH testee : `ssh ubuntu@83.228.204.5 "echo OK"`
- [ ] Cles SSH configurees

---

## LANCEZ MAINTENANT !

```powershell
.\clean-vps.ps1
.\deploy-safe.ps1
```

**C'est tout ! Le script fait tout automatiquement.**

---

## Support

Si probleme persistant :
1. Copiez l'erreur complete
2. Verifiez l'espace : `ssh ubuntu@83.228.204.5 "df -h"`
3. Essayez le script d'urgence : `.\deploy-emergency.ps1`
