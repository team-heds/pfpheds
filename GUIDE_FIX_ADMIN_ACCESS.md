# 🔧 Guide de Correction des Accès Admin

## 🎯 Problème Identifié

Dylan Ortlieb et Axelle Sauthier ont le rôle `admin` dans leur base de données mais ne peuvent pas se connecter ou accéder aux fonctionnalités admin.

## 🔍 Cause Racine

1. **Fonction RPC `api_my_permissions()` manquante** - Le système essaie d'appeler cette fonction qui n'existe pas
2. **Permissions non synchronisées** - Le rôle `admin` n'est pas correctement converti en permissions utilisables
3. **Fallback incomplet** - Le système de fallback ne charge pas correctement les permissions depuis `user_profiles`

## ✅ Solution Complète en 4 Étapes

### Étape 1 : Diagnostic Initial 🔍

Exécutez ce script pour voir l'état actuel :

```bash
# Depuis votre terminal Supabase ou interface SQL
psql -h [YOUR_HOST] -U postgres -d postgres -f supabase_migrations/diagnostic_specific_users.sql
```

**Ou via l'interface Supabase :**
1. Allez dans **SQL Editor**
2. Ouvrez le fichier `diagnostic_specific_users.sql`
3. Exécutez-le
4. Analysez les résultats

### Étape 2 : Créer la Fonction RPC Manquante 🛠️

```bash
psql -h [YOUR_HOST] -U postgres -d postgres -f supabase_migrations/create_api_my_permissions_function.sql
```

**Cette fonction :**
- ✅ Récupère les permissions de l'utilisateur connecté
- ✅ Combine le rôle ET les permissions explicites
- ✅ Est accessible par tous les utilisateurs authentifiés

### Étape 3 : Corriger les Permissions 🔧

```bash
psql -h [YOUR_HOST] -U postgres -d postgres -f supabase_migrations/fix_admin_access.sql
```

**Ce script :**
- ✅ Ajoute les permissions manquantes à tous les admins
- ✅ Active tous les comptes admin
- ✅ Standardise les permissions : `['admin', 'page1.access', 'page2.access', 'super.all']`

### Étape 4 : Test et Vérification ✨

1. **Demander à Dylan et Axelle de :**
   - Se déconnecter complètement
   - Vider le cache du navigateur (Ctrl+Shift+Delete)
   - Se reconnecter

2. **Vérifier dans la console du navigateur (F12) :**
   ```javascript
   // Devrait afficher les permissions
   console.log('Permissions:', roleStore.perms)
   console.log('Est super:', roleStore.isSuper)
   console.log('Peut accéder à admin:', roleStore.can('admin'))
   ```

3. **Logs attendus dans la console :**
   ```
   ✅ Permissions consolidées (RPC + user_profiles): ["admin", "page1.access", "page2.access", "super.all"]
   ✅ Accès autorisé pour admin
   ```

## 📊 Vérification Manuelle dans Supabase

### Via Table Editor

1. Allez dans **Table Editor** > `user_profiles`
2. Filtrez par `role = 'admin'`
3. Vérifiez pour Dylan et Axelle :
   - ✅ `is_active` = `true`
   - ✅ `permissions` contient : `{admin, page1.access, page2.access, super.all}`
   - ✅ `role` = `admin`

### Via SQL Editor

```sql
-- Vérifier Dylan
SELECT * FROM user_profiles 
WHERE email ILIKE '%dylan%ortlieb%';

-- Vérifier Axelle
SELECT * FROM user_profiles 
WHERE email ILIKE '%axelle%sauthier%';

-- Tester la fonction RPC
SELECT * FROM api_my_permissions();
```

## 🚨 Dépannage

### Problème : "api_my_permissions does not exist"

**Solution :**
```sql
-- Vérifier si la fonction existe
SELECT proname FROM pg_proc WHERE proname = 'api_my_permissions';

-- Si vide, réexécuter
\i supabase_migrations/create_api_my_permissions_function.sql
```

### Problème : "Permissions toujours vides"

**Solution :**
```sql
-- Forcer la mise à jour
UPDATE user_profiles
SET permissions = ARRAY['admin', 'page1.access', 'page2.access', 'super.all']::TEXT[]
WHERE email IN (
  'dylan.ortlieb@...',  -- Remplacer par email exact
  'axelle.sauthier@...' -- Remplacer par email exact
);
```

### Problème : "Access denied même après correction"

**Vérifications :**
1. ✅ Fonction `api_my_permissions()` existe
2. ✅ Permissions dans `user_profiles` sont correctes
3. ✅ Utilisateur s'est déconnecté/reconnecté
4. ✅ Cache navigateur vidé

## 📝 Structure des Permissions

### Permissions Recommandées par Rôle

**Admin Complet :**
```json
["admin", "page1.access", "page2.access", "super.all"]
```

**Admin Soins :**
```json
["AdminSoins", "page1.access", "EnseignantSoins.access"]
```

**Admin Physio :**
```json
["AdminPhysio", "page1.access", "EnseignantPhysio.access"]
```

**Enseignant :**
```json
["EnseignantSoins.access"]
```

**Étudiant :**
```json
["authenticated"]
```

## 🔗 Routes Protégées

Les routes suivantes nécessitent les permissions admin :

- `/admin` - Besoin : `['super.all', 'admin', 'AdminPhysio', 'EnseignantPhysio']`
- `/admin/dashboard-general` - Besoin : `admin`
- `/admin/modules` - Besoin : `['admin', 'editor']`
- `/admin/formation-pratique/*` - Besoin : `page1.access`

## ✅ Checklist Finale

- [ ] Script `diagnostic_specific_users.sql` exécuté
- [ ] Fonction `api_my_permissions()` créée
- [ ] Script `fix_admin_access.sql` exécuté
- [ ] Dylan et Axelle ont les bonnes permissions dans `user_profiles`
- [ ] Dylan et Axelle se sont déconnectés/reconnectés
- [ ] Cache navigateur vidé
- [ ] Logs de la console vérifiés
- [ ] Accès aux pages admin testé

## 📞 Support

Si le problème persiste après toutes ces étapes :

1. **Capturer les logs :**
   ```javascript
   // Dans la console du navigateur
   console.log('Auth State:', authStore.user)
   console.log('Role Store:', roleStore)
   console.log('Permissions:', roleStore.perms)
   ```

2. **Vérifier le réseau :**
   - Ouvrir l'onglet Network (F12)
   - Filtrer par "supabase"
   - Vérifier les appels API et leurs réponses

3. **Partager les informations :**
   - Captures d'écran des logs
   - État de `user_profiles` pour l'utilisateur
   - Messages d'erreur exacts
