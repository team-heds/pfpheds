# 🚀 Guide d'initialisation Supabase - Fix "Database error querying schema"

## ❌ Problème rencontré
```
POST https://api2.hedsvs.ch/auth/v1/token?grant_type=password 500 (Internal Server Error)
AuthApiError: Database error querying schema
```

## ✅ Solution : Initialiser le schéma de base de données

### **Étape 1 : Accéder au SQL Editor Supabase**

1. Connectez-vous à votre dashboard Supabase : https://supabase.com/dashboard
2. Sélectionnez votre projet `pfpheds` ou celui configuré pour `api2.hedsvs.ch`
3. Cliquez sur **SQL Editor** dans le menu de gauche
4. Cliquez sur **New Query**

### **Étape 2 : Exécuter le script d'initialisation**

1. Ouvrez le fichier : `supabase_migrations/00_init_schema.sql`
2. Copiez tout le contenu du fichier
3. Collez-le dans le SQL Editor
4. Cliquez sur **Run** (ou appuyez sur `Ctrl+Enter`)

**Résultat attendu :**
```
✅ Schéma de base Supabase créé avec succès
Tables créées:
  - user_profiles (profils utilisateurs)
  - gamification_data (données de gamification)
```

### **Étape 3 : Vérifier les tables créées**

Dans le SQL Editor, exécutez cette requête :

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'gamification_data')
ORDER BY table_name;
```

**Résultat attendu :**
```
table_name
-----------------
gamification_data
user_profiles
```

### **Étape 4 : Créer un utilisateur de test**

#### **Option A : Via l'interface Supabase**
1. Allez dans **Authentication** → **Users**
2. Cliquez sur **Add user** → **Create new user**
3. Email : `test@hedsvs.ch`
4. Password : `Test123456!`
5. Cochez **Auto Confirm User**
6. Cliquez sur **Create user**

#### **Option B : Via SQL**
```sql
-- Créer un utilisateur de test
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@hedsvs.ch',
  crypt('Test123456!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"forname":"Test","family_name":"User"}',
  false,
  '',
  '',
  ''
);
```

### **Étape 5 : Tester la connexion**

1. Retournez sur votre application : https://hedsvs.ch
2. Allez sur la page de connexion Supabase (`/login-supabase` ou `/login2`)
3. Connectez-vous avec :
   - **Email** : `test@hedsvs.ch`
   - **Password** : `Test123456!`

**Si ça fonctionne :** ✅ Vous devriez être redirigé vers le dashboard

**Si ça ne fonctionne pas :** Passez à l'étape 6

---

## 🔍 Étape 6 : Diagnostic avancé (si erreur persiste)

### **Vérifier la configuration Supabase**

1. **Vérifier les variables d'environnement** dans votre VPS :

```bash
ssh -i "C:\Users\antoine.quarroz\Desktop\LabDev\PrivateKey\HEdSLinux.txt" ubuntu@83.228.204.5
cat /path/to/your/app/.env | grep SUPABASE
```

Résultat attendu :
```
VITE_SUPABASE_URL=https://api2.hedsvs.ch
VITE_SUPABASE_KEY=votre_anon_key
```

2. **Vérifier que Supabase répond** :

```bash
curl https://api2.hedsvs.ch/rest/v1/
```

Si erreur 401 (Unauthorized) : ✅ C'est normal, l'API fonctionne
Si timeout ou erreur réseau : ❌ Problème de configuration serveur

### **Vérifier les politiques RLS**

Dans le SQL Editor :

```sql
-- Vérifier que RLS est activé
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'gamification_data');
```

**Résultat attendu :**
```
tablename          | rowsecurity
-------------------+-------------
user_profiles      | t (true)
gamification_data  | t (true)
```

### **Vérifier les politiques existantes**

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename IN ('user_profiles', 'gamification_data');
```

**Vous devriez voir au moins 3 politiques pour chaque table :**
- Public read access
- Users can update own profile/data
- Users can insert own profile/data

---

## 🛠️ Étape 7 : Scripts de migration supplémentaires

Si vous avez besoin des fonctionnalités complètes (événements, gamification, etc.), exécutez ces scripts dans l'ordre :

1. ✅ `00_init_schema.sql` (déjà fait)
2. `supabase_migration_events.sql` - Système d'événements
3. `add_role_to_profiles.sql` - Gestion des rôles
4. `add_house_to_profiles.sql` - Système des maisons HES
5. `create_house_coaches.sql` - Coaches des maisons
6. `initialize_storage.sql` - Stockage de fichiers

**Commande pour tout exécuter d'un coup :**

```bash
# Depuis votre machine locale
cd C:\Users\antoine.quarroz\Desktop\LabDev\pfpheds\supabase_migrations
# Concaténer tous les scripts
Get-Content 00_init_schema.sql, supabase_migration_events.sql, add_role_to_profiles.sql | Set-Content full_migration.sql
```

Puis exécutez `full_migration.sql` dans le SQL Editor.

---

## 📊 Étape 8 : Vérification finale

### **Test complet de l'authentification**

```sql
-- Vérifier qu'un profil a été créé automatiquement
SELECT 
  au.email,
  up.forname,
  up.family_name,
  up.role,
  gd.points
FROM auth.users au
LEFT JOIN user_profiles up ON au.id::text = up.user_id
LEFT JOIN gamification_data gd ON au.id::text = gd.user_id
WHERE au.email = 'test@hedsvs.ch';
```

**Résultat attendu :**
```
email            | forname | family_name | role | points
-----------------+---------+-------------+------+--------
test@hedsvs.ch   | Test    | User        | user | 0
```

Si le profil n'est pas créé automatiquement, exécutez manuellement :

```sql
-- Récupérer l'ID de l'utilisateur
SELECT id, email FROM auth.users WHERE email = 'test@hedsvs.ch';

-- Créer le profil manuellement (remplacez USER_ID_ICI)
INSERT INTO user_profiles (user_id, email, forname, family_name)
VALUES ('USER_ID_ICI', 'test@hedsvs.ch', 'Test', 'User');

INSERT INTO gamification_data (user_id, email)
VALUES ('USER_ID_ICI', 'test@hedsvs.ch');
```

---

## ✅ Checklist finale

- [ ] Script `00_init_schema.sql` exécuté sans erreur
- [ ] Tables `user_profiles` et `gamification_data` créées
- [ ] RLS activé sur les deux tables
- [ ] Politiques RLS créées (lecture publique, modification personnelle)
- [ ] Trigger de création automatique de profil actif
- [ ] Utilisateur de test créé
- [ ] Connexion Supabase fonctionne depuis l'application
- [ ] Profil utilisateur créé automatiquement lors de l'inscription

---

## 🆘 Problèmes courants

### Erreur : "relation 'user_profiles' does not exist"
→ Le script SQL n'a pas été exécuté. Retour à l'étape 2.

### Erreur : "permission denied for schema public"
→ Votre utilisateur Supabase n'a pas les droits. Contactez l'administrateur du projet.

### Erreur : "duplicate key value violates unique constraint"
→ Le profil existe déjà. Utilisez `ON CONFLICT` dans vos INSERT.

### L'utilisateur de test ne peut pas se connecter
→ Vérifiez que `email_confirmed_at` est bien défini dans `auth.users`

### Le profil utilisateur n'est pas créé automatiquement
→ Vérifiez que le trigger `on_auth_user_created` existe :
```sql
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

---

## 📞 Support

Si le problème persiste après avoir suivi ce guide :

1. Exportez les logs d'erreur depuis la console navigateur
2. Exportez le résultat de toutes les requêtes SQL de vérification
3. Vérifiez les logs Supabase : Dashboard → Logs → Postgres

**Commande pour tester la connexion directe :**

```javascript
// Depuis la console du navigateur sur hedsvs.ch
const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
const supabase = createClient(
  'https://api2.hedsvs.ch',
  'votre_anon_key'
);

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@hedsvs.ch',
  password: 'Test123456!'
});

console.log('Data:', data);
console.log('Error:', error);
```

---

**Après avoir suivi ce guide, votre authentification Supabase devrait fonctionner ! 🎉**
