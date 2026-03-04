# 🛠️ Scripts de Gestion Supabase Distant

## 📚 Scripts Disponibles

### 1. `check-supabase-remote.ps1`
**Diagnostic rapide du serveur Supabase**

```powershell
.\scripts\check-supabase-remote.ps1
```

**Ce qu'il fait:**
- ✅ Teste la connexion SSH
- ✅ Vérifie Docker
- ✅ Liste les conteneurs Supabase actifs
- ✅ Vérifie Supabase CLI
- ✅ Vérifie les ports ouverts

---

### 2. `apply-migration-remote.ps1` ⭐ **RECOMMANDÉ**
**Application automatique de la migration SQL**

```powershell
# Application interactive (avec confirmation)
.\scripts\apply-migration-remote.ps1

# Application forcée (sans confirmation)
.\scripts\apply-migration-remote.ps1 -Force

# Mode verbeux (affiche les détails)
.\scripts\apply-migration-remote.ps1 -Verbose
```

**Ce qu'il fait:**
- ✅ Vérifie que Supabase est lancé (le démarre si nécessaire)
- ✅ Copie la migration SQL sur le serveur
- ✅ Applique la migration automatiquement
- ✅ Vérifie que tout est bien configuré
- ✅ Affiche un résumé complet

---

### 3. `deploy-supabase-fix.ps1`
**Menu interactif pour gérer Supabase**

```powershell
.\scripts\deploy-supabase-fix.ps1
```

**Options du menu:**
1. Se connecter au serveur (SSH)
2. Voir les conteneurs Docker Supabase
3. Voir les logs Supabase Auth
4. Voir les logs Supabase DB
5. Redémarrer Supabase
6. Appliquer la migration SQL
7. Quitter

---

### 4. `apply-careconvers-migrations-remote.ps1` ⭐ **CARECONVERS**
**Application des migrations CareConvers (sessions + interactions)**

```powershell
# Exécution interactive (demande confirmation)
.\scripts\apply-careconvers-migrations-remote.ps1

# Exécution forcée
.\scripts\apply-careconvers-migrations-remote.ps1 -Force

# Personnaliser la clé SSH / host
.\scripts\apply-careconvers-migrations-remote.ps1 `
   -SSHKey "C:\Users\you\path\private_key" `
   -SSHHost "ubuntu@your-server"
```

**Ce qu'il fait:**
- ✅ Vérifie la connexion SSH
- ✅ Vérifie que le conteneur `supabase-db` est actif
- ✅ Copie `create_careconvers_sessions.sql` et `create_careconvers_interactions.sql`
- ✅ Applique les migrations avec `ON_ERROR_STOP=1`
- ✅ Vérifie que les 2 tables existent
- ✅ Nettoie les fichiers temporaires sur le serveur

---

### 5. `deploy-prod.ps1` ⭐ **ONE COMMAND**
**Déploie la stack Docker production + migrations CareConvers**

```powershell
# Déploiement complet (migrations + docker compose up --build)
.\scripts\deploy-prod.ps1

# Déploiement sans migrations
.\scripts\deploy-prod.ps1 -SkipMigrations

# Déploiement sans rebuild docker
.\scripts\deploy-prod.ps1 -SkipBuild

# Arrêt de la stack production
.\scripts\deploy-prod.ps1 -Down
```

**Ce qu'il fait:**
- ✅ (Optionnel) lance `apply-careconvers-migrations-remote.ps1`
- ✅ exécute `docker compose -f docker-compose.prod.yml up -d --build`
- ✅ affiche l'état des conteneurs en fin de run

---

### 6. `bootstrap-supabase-test-remote.ps1` ⭐ **TEST ENV**
**Initialise un environnement Supabase de test (migrations + tables CareConvers)**

```powershell
# Voir les migrations qui seront appliquées (sans exécution)
.\scripts\bootstrap-supabase-test-remote.ps1 -DryRun

# Bootstrap interactif
.\scripts\bootstrap-supabase-test-remote.ps1

# Bootstrap sans confirmation
.\scripts\bootstrap-supabase-test-remote.ps1 -Force

# Paramètres personnalisés
.\scripts\bootstrap-supabase-test-remote.ps1 `
   -SSHKey "C:\Users\you\path\private_key" `
   -SSHHost "ubuntu@your-server" `
   -DbContainer "supabase-db"
```

**Ce qu'il fait:**
- ✅ applique les migrations `backend/supabase/migrations/*.sql`
- ✅ applique `sql/create_votation_sessions.sql`
- ✅ applique les migrations `supabase/migrations/*.sql`
- ✅ applique `sql/create_careconvers_sessions.sql` et `sql/create_careconvers_interactions.sql`
- ✅ vérifie les tables critiques en fin d'exécution

---

## 🚀 Workflow Recommandé

### Première Utilisation

#### Étape 1: Diagnostic
```powershell
.\scripts\check-supabase-remote.ps1
```

#### Étape 2: Application de la migration
```powershell
.\scripts\apply-migration-remote.ps1
```

#### Étape 3: Vérification
L'interface vous montrera automatiquement si tout est OK.

---

## 🔧 Commandes Manuelles (Alternative)

Si vous préférez faire les choses manuellement:

### 1. Connexion SSH
```powershell
ssh -i "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt" ubuntu@83.228.204.5
```

### 2. Une fois connecté au serveur
```bash
# Vérifier Supabase
docker ps | grep supabase

# Démarrer Supabase si nécessaire
npx supabase start

# Appliquer la migration (après l'avoir copiée)
docker exec -i supabase-db psql -U postgres -d postgres < /tmp/FIX_auth_signup.sql

# Vérifier les logs
docker logs supabase-auth --tail 50
```

---

## 📊 Que Fait la Migration?

Le fichier `FIX_auth_signup.sql` configure:

1. **Table user_profiles**
   - Stocke les informations de profil utilisateur
   - Liée automatiquement à auth.users

2. **Politiques RLS (Row Level Security)**
   - Autorise la lecture publique des profils
   - Autorise les utilisateurs à créer leur propre profil
   - Autorise les utilisateurs à modifier leur propre profil

3. **Trigger Automatique**
   - Crée automatiquement un profil lors de l'inscription
   - Copie les métadonnées (nom, email, rôle)

---

## 🔍 Vérifications Post-Migration

### Depuis votre PC Windows
```powershell
# Vérifier la table
ssh -i "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt" ubuntu@83.228.204.5 `
  "docker exec supabase-db psql -U postgres -d postgres -c '\dt public.user_profiles'"

# Vérifier les politiques
ssh -i "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt" ubuntu@83.228.204.5 `
  "docker exec supabase-db psql -U postgres -d postgres -c 'SELECT * FROM pg_policies WHERE tablename = \'user_profiles\';'"
```

---

## 🆘 Résolution de Problèmes

### Problème: "Permission denied" sur SSH
**Solution:**
```powershell
# Vérifier les permissions de la clé
icacls "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt"

# Si nécessaire, réinitialiser les permissions
icacls "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt" /inheritance:r
icacls "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt" /grant:r "$env:USERNAME:R"
```

### Problème: "No such file or directory" pour la migration
**Solution:**
Vérifiez que vous êtes dans le bon dossier:
```powershell
cd C:\Users\antoine.quarroz\Desktop\LabDev\pfpheds
.\scripts\apply-migration-remote.ps1
```

### Problème: Supabase ne démarre pas
**Solution:**
```powershell
# Se connecter au serveur
ssh -i "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt" ubuntu@83.228.204.5

# Vérifier les logs
docker logs supabase-db
docker logs supabase-auth

# Redémarrer complètement
npx supabase stop
npx supabase start
```

---

## 📝 Notes Importantes

1. **Sauvegarde**: Les scripts ne font PAS de sauvegarde automatique. Si vous avez des données importantes, faites une sauvegarde manuelle avant.

2. **Permissions**: Vous devez avoir les droits admin sur le serveur pour exécuter ces scripts.

3. **Variables d'environnement**: N'oubliez pas de configurer votre `.env` local:
   ```env
   VITE_SUPABASE_URL=http://83.228.204.5:54321
   VITE_SUPABASE_KEY=votre_anon_key
   ```

4. **Firewall**: Si vous accédez depuis l'extérieur, assurez-vous que les ports 54321 (API) et 54323 (Studio) sont ouverts.

---

## 📚 Documentation Complète

Pour plus de détails, consultez:
- `SUPABASE_SIGNUP_FIX.md` - Guide complet de résolution
- `SUPABASE_REMOTE_SETUP.md` - Configuration serveur distant

---

## ✅ Checklist Rapide

Avant d'exécuter les scripts:
- [ ] Clé SSH accessible
- [ ] Connexion internet stable
- [ ] Docker installé sur le serveur
- [ ] Droits admin sur le serveur

Après avoir exécuté la migration:
- [ ] Table user_profiles créée
- [ ] Politiques RLS configurées
- [ ] Trigger actif
- [ ] Test d'inscription réussi
