# ✅ PROBLÈME SERVEUR RÉSOLU

## 🔴 Problème identifié
**Disque 100% plein** → PostgreSQL ne pouvait pas écrire → Erreur "Database error querying schema"

```
/dev/sda1  20G  20G    0  100% /  ❌ AVANT
/dev/sda1  20G  15G  4.6G  77% /  ✅ APRÈS
```

## 🗑️ Actions effectuées

### **1. Nettoyage des backups**
- **Avant** : 22 backups du frontend (~5.5G)
- **Après** : 3 backups conservés (les plus récents)
- **Espace libéré** : ~4.6G

### **2. Redémarrage des services Supabase**
- ✅ PostgreSQL redémarré et **healthy**
- ✅ GoTrue (Auth) redémarré
- ✅ PostgREST (API) redémarré
- ✅ Postgres Meta redémarré et **healthy**

### **3. Vérification**
- ✅ PostgreSQL fonctionne
- ✅ Tables existantes confirmées (`gamification_data`, `events`, `institutions`, etc.)

---

## 🚀 Prochaines étapes

### **1. Tester l'authentification Supabase**

Maintenant que PostgreSQL fonctionne, testez la connexion :

1. **Allez sur** : https://hedsvs.ch/login2 (ou votre page de connexion Supabase)
2. **Essayez de vous connecter** avec un compte existant

**Si ça ne fonctionne toujours pas** :
- L'erreur "Database error querying schema" devrait avoir disparu
- Si vous avez une nouvelle erreur, notez-la et je vous aiderai

### **2. Vérifier que la table `user_profiles` existe**

Connectez-vous au dashboard Supabase ou exécutez :

```bash
ssh -i "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt" ubuntu@83.228.204.5 "sudo docker exec supabase-db-1 psql -U postgres -c '\dt public.user_profiles'"
```

**Si la table n'existe pas** :
→ Exécutez le script `supabase_migrations/00_init_schema.sql` via le SQL Editor du dashboard Supabase

### **3. Créer un utilisateur de test (si nécessaire)**

Si vous n'avez pas encore d'utilisateurs dans Supabase :

**Via le dashboard Supabase** :
```
Authentication → Users → Add user
- Email: test@hedsvs.ch
- Password: Test123456!
- ✓ Auto Confirm User
```

**Ou via SQL** :
```sql
-- Connectez-vous au SQL Editor Supabase et exécutez:
INSERT INTO auth.users (
  instance_id, id, aud, role, email,
  encrypted_password, email_confirmed_at,
  created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated', 'authenticated',
  'test@hedsvs.ch',
  crypt('Test123456!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"forname":"Test","family_name":"User"}'
);
```

---

## 🛡️ Prévention : Éviter que le problème se reproduise

### **Script de nettoyage automatique créé**

Le fichier `cleanup-server.sh` nettoie automatiquement :
- ✅ Vieux backups (garde les 5 derniers)
- ✅ Logs Docker volumineux
- ✅ Images Docker inutilisées
- ✅ Logs système anciens
- ✅ Cache APT

### **Installation du script sur le serveur**

```powershell
# Depuis Windows PowerShell
scp -i "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt" `
  cleanup-server.sh `
  ubuntu@83.228.204.5:/home/ubuntu/

# Rendre le script exécutable
ssh -i "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt" ubuntu@83.228.204.5 `
  "chmod +x /home/ubuntu/cleanup-server.sh"

# Tester le script
ssh -i "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt" ubuntu@83.228.204.5 `
  "sudo /home/ubuntu/cleanup-server.sh"
```

### **Automatisation avec Cron (exécution quotidienne)**

```bash
# Se connecter au serveur
ssh -i "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt" ubuntu@83.228.204.5

# Éditer le crontab
sudo crontab -e

# Ajouter cette ligne (exécution tous les jours à 2h du matin)
0 2 * * * /home/ubuntu/cleanup-server.sh >> /var/log/cleanup.log 2>&1
```

---

## 📊 Monitoring continu

### **Vérifier l'espace disque**

```bash
# Commande rapide
ssh -i "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt" ubuntu@83.228.204.5 "df -h /"
```

**Seuils à surveiller** :
- ⚠️ **80-90%** : Prévoir un nettoyage
- 🚨 **90-100%** : Nettoyage urgent nécessaire

### **Vérifier l'état des conteneurs**

```bash
ssh -i "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt" ubuntu@83.228.204.5 "docker ps --filter name=supabase"
```

**État attendu** :
- `supabase-db-1` : **healthy**
- `supabase-auth-1` : **running**
- `supabase-rest-1` : **running**
- `supabase-meta-1` : **healthy**

---

## 🔍 Commandes utiles

### **Espace disque par répertoire**
```bash
du -sh /var/www/* | sort -h
du -sh /var/lib/docker/* | sort -h
```

### **Logs PostgreSQL**
```bash
docker logs --tail 50 supabase-db-1
```

### **Tester la connexion PostgreSQL**
```bash
docker exec supabase-db-1 psql -U postgres -c 'SELECT version();'
```

### **Compter les backups**
```bash
ls -d /var/www/pfpheds-frontend.backup-* | wc -l
```

---

## ✅ Résumé

| Aspect | Avant | Après |
|--------|-------|-------|
| **Espace disque** | 100% (0 libre) | 77% (4.6G libre) |
| **PostgreSQL** | ❌ Unhealthy | ✅ Healthy |
| **Backups frontend** | 22 (~5.5G) | 3 (~750M) |
| **État Supabase** | ❌ Non fonctionnel | ✅ Opérationnel |

---

## 📞 Si vous avez encore des problèmes

1. **Vérifiez les logs** : `docker logs supabase-db-1`
2. **Testez la connexion** : Allez sur https://hedsvs.ch/login2
3. **Notez l'erreur exacte** dans la console navigateur (F12)
4. **Vérifiez l'espace disque** : Doit rester < 90%

**Le problème principal (disque plein) est résolu ! PostgreSQL fonctionne maintenant.** ✅
