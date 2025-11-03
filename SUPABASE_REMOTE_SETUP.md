# 🚀 Configuration Supabase sur Serveur Distant

## 📍 Informations Serveur
- **IP**: 83.228.204.5
- **User**: ubuntu
- **Clé SSH**: `C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt`

---

## 🎯 MÉTHODE RAPIDE (Recommandée)

### 1. Diagnostic automatique
```powershell
.\scripts\check-supabase-remote.ps1
```

### 2. Déploiement du fix
```powershell
.\scripts\deploy-supabase-fix.ps1
```

---

## 🔧 MÉTHODE MANUELLE

### 1. Connexion au serveur
```powershell
ssh -i "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt" ubuntu@83.228.204.5
```

### 2. Une fois connecté, vérifier l'état de Supabase

#### a) Vérifier les conteneurs Docker
```bash
docker ps | grep supabase
```

**Vous devriez voir:**
- `supabase-db` (PostgreSQL)
- `supabase-auth` (GoTrue)
- `supabase-rest` (PostgREST)
- `supabase-storage`
- `supabase-realtime`
- `supabase-studio`

#### b) Si Supabase n'est pas lancé
```bash
# Trouver le dossier du projet
find /home/ubuntu -name "docker-compose*.yml" -path "*/supabase/*" 2>/dev/null

# Aller dans le dossier Supabase
cd /chemin/vers/le/dossier/supabase

# Démarrer Supabase
npx supabase start

# OU avec docker-compose
docker-compose up -d
```

---

## 📝 APPLIQUER LA MIGRATION SQL

### Option 1: Via Supabase CLI (Recommandé)
```bash
# Copier la migration depuis votre machine locale
# (Exécuter sur votre PC Windows)
scp -i "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt" `
    .\supabase\migrations\FIX_auth_signup.sql `
    ubuntu@83.228.204.5:/tmp/

# Sur le serveur distant
cd /chemin/vers/projet/supabase
npx supabase db push
```

### Option 2: Directement avec PostgreSQL
```bash
# Sur le serveur distant (après avoir copié le fichier)
docker exec -i supabase-db psql -U postgres -d postgres < /tmp/FIX_auth_signup.sql
```

### Option 3: Via Supabase Studio (Interface Web)
```bash
# 1. Accédez à Supabase Studio
http://83.228.204.5:54323

# 2. Allez dans "SQL Editor"
# 3. Collez le contenu de FIX_auth_signup.sql
# 4. Cliquez sur "Run"
```

---

## 🔍 VÉRIFICATIONS POST-INSTALLATION

### 1. Vérifier que la table user_profiles existe
```bash
docker exec supabase-db psql -U postgres -d postgres -c "\dt public.user_profiles"
```

### 2. Vérifier les politiques RLS
```bash
docker exec supabase-db psql -U postgres -d postgres -c "SELECT * FROM pg_policies WHERE tablename = 'user_profiles';"
```

### 3. Vérifier le trigger
```bash
docker exec supabase-db psql -U postgres -d postgres -c "SELECT * FROM pg_trigger WHERE tgname LIKE '%user%';"
```

### 4. Tester l'API Supabase
```bash
# Vérifier que l'API répond
curl http://localhost:54321/rest/v1/

# Vérifier les tables accessibles
curl http://localhost:54321/rest/v1/user_profiles \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## 📊 LOGS ET DÉBOGAGE

### Voir les logs d'authentification
```bash
docker logs supabase-auth --tail 100 -f
```

### Voir les logs de la base de données
```bash
docker logs supabase-db --tail 100 -f
```

### Voir tous les logs Supabase
```bash
docker-compose logs -f
# OU
npx supabase logs
```

---

## 🔐 CONFIGURATION DES VARIABLES D'ENVIRONNEMENT

### 1. Trouver votre fichier .env
```bash
find /home/ubuntu -name ".env" -path "*/pfpheds/*" 2>/dev/null
```

### 2. Vérifier les variables Supabase
```bash
cat /chemin/vers/.env | grep SUPABASE
```

### 3. Variables requises pour le frontend
```env
# Pour Supabase distant (sur le serveur)
VITE_SUPABASE_URL=http://83.228.204.5:54321
VITE_SUPABASE_KEY=votre_anon_key

# OU pour Supabase local
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_KEY=votre_anon_key
```

### 4. Obtenir l'anon key
```bash
# Depuis le serveur
npx supabase status

# La clé anon est affichée dans la sortie
# Cherchez "anon key: ..."
```

---

## 🚨 RÉSOLUTION DE PROBLÈMES

### Problème: "Failed to create user: API error happened"

#### Vérification 1: Supabase est lancé?
```bash
docker ps | grep supabase
```
**Solution**: Si aucun conteneur, lancer Supabase

#### Vérification 2: Port 54321 accessible?
```bash
netstat -tulpn | grep 54321
```
**Solution**: Vérifier firewall et docker-compose

#### Vérification 3: Migration appliquée?
```bash
docker exec supabase-db psql -U postgres -d postgres -c "SELECT COUNT(*) FROM pg_policies WHERE tablename = 'user_profiles';"
```
**Solution**: Si 0, appliquer la migration

#### Vérification 4: Inscriptions activées?
```bash
# Vérifier la config Supabase
cat /chemin/vers/supabase/config.toml | grep -A5 "\[auth\]"
```
**Solution**: Mettre `enable_signup = true`

---

## 🔄 REDÉMARRER SUPABASE

### Redémarrage simple
```bash
docker restart $(docker ps -q --filter name=supabase)
```

### Redémarrage complet
```bash
# Arrêter
npx supabase stop

# Démarrer
npx supabase start

# OU avec docker-compose
docker-compose down
docker-compose up -d
```

### Reset complet (⚠️ EFFACE LES DONNÉES)
```bash
npx supabase db reset
```

---

## 📡 ACCÈS DEPUIS VOTRE MACHINE LOCALE

### Option 1: Tunnel SSH (Recommandé pour tests)
```powershell
# Sur votre PC Windows, créer un tunnel
ssh -i "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt" `
    -L 54321:localhost:54321 `
    -L 54323:localhost:54323 `
    ubuntu@83.228.204.5 -N
```

Ensuite, dans votre `.env` local:
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_KEY=votre_anon_key
```

### Option 2: Accès direct (Nécessite firewall ouvert)
Dans votre `.env` local:
```env
VITE_SUPABASE_URL=http://83.228.204.5:54321
VITE_SUPABASE_KEY=votre_anon_key
```

**⚠️ ATTENTION**: Nécessite d'ouvrir les ports 54321 et 54323 sur le serveur

---

## ✅ CHECKLIST COMPLÈTE

- [ ] Connexion SSH au serveur réussie
- [ ] Docker installé et fonctionnel
- [ ] Supabase démarré (conteneurs actifs)
- [ ] Migration SQL appliquée
- [ ] Table `user_profiles` créée
- [ ] Politiques RLS configurées
- [ ] Trigger `on_auth_user_created` actif
- [ ] Variables d'environnement configurées (.env)
- [ ] API Supabase accessible (port 54321)
- [ ] Supabase Studio accessible (port 54323)
- [ ] Test d'inscription réussi

---

## 🆘 COMMANDES RAPIDES

```bash
# Diagnostic rapide
docker ps | grep supabase && docker logs supabase-auth --tail 20

# Appliquer migration
docker exec -i supabase-db psql -U postgres -d postgres < /tmp/FIX_auth_signup.sql

# Vérifier user_profiles
docker exec supabase-db psql -U postgres -d postgres -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='user_profiles';"

# Obtenir anon key
npx supabase status | grep "anon key"

# Redémarrer tout
docker restart $(docker ps -q --filter name=supabase)
```

---

## 📞 SUPPORT

Si problème persiste après toutes ces étapes:
1. Vérifier les logs: `docker logs supabase-auth`
2. Vérifier la DB: `docker logs supabase-db`
3. Tester manuellement l'inscription depuis Supabase Studio
4. Consulter: https://supabase.com/docs/guides/auth
