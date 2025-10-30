# 🔐 Instructions pour activer le système de permissions

## 📋 Ce qui a été fait

J'ai créé une solution complète pour gérer les permissions des utilisateurs dans Supabase :

1. ✅ **Migration SQL** : Ajoute la colonne `permissions` à la table `user_profiles`
2. ✅ **Fonctions RPC** : 
   - `update_user_permissions()` : Met à jour les permissions dans `user_profiles` ET `auth.users`
   - `get_user_permissions()` : Récupère les permissions d'un utilisateur
   - `user_has_permission()` : Vérifie si un utilisateur a une permission spécifique
3. ✅ **Politique RLS** : Permet aux admins de modifier tous les profils
4. ✅ **Composant Vue mis à jour** : Appelle automatiquement la RPC lors de la sauvegarde

## 🚀 Étapes pour activer le système

### 1. Exécuter la migration SQL

Connectez-vous à votre projet Supabase et exécutez le fichier de migration :

```bash
# Option A : Via l'interface Supabase
# 1. Allez sur https://supabase.com/dashboard
# 2. Sélectionnez votre projet
# 3. Allez dans "SQL Editor"
# 4. Copiez-collez le contenu du fichier : 
#    supabase_migrations/add_permissions_to_user_profiles.sql
# 5. Cliquez sur "Run"

# Option B : Via CLI Supabase (si installé)
supabase db push
```

### 2. Vérifier que la migration a fonctionné

Vous devriez voir ces messages dans la console SQL :
- ✅ Colonne permissions ajoutée à user_profiles
- ✅ Fonctions RPC créées
- ✅ Politiques RLS activées

### 3. Tester le système

1. Rechargez votre application Vue
2. Connectez-vous avec un compte admin
3. Allez sur la page "Gestion des rôles utilisateurs"
4. Éditez un utilisateur
5. Modifiez ses permissions en cochant/décochant les cases
6. Cliquez sur "Sauvegarder"
7. Vérifiez dans la console du navigateur que vous voyez :
   ```
   ✅ Permissions mises à jour avec succès dans user_profiles et auth.users
   ✅ Utilisateur mis à jour avec succès
   ```

## 🔍 Comment ça marche

### Structure des permissions

Les permissions sont stockées comme un tableau de texte (`TEXT[]`) :

```javascript
permissions: [
  'page1.access',
  'page2.access',
  'super.all',
  'admin',
  'AdminSoins',
  'AdminPhysio',
  'EnseignantSoins',
  'EnseignantPhysio',
  'EtudiantSoins',
  'EtudiantPhysio',
  'RMSoins'
]
```

### Sauvegarde des permissions

Lorsque vous sauvegardez les permissions d'un utilisateur :

1. **user_profiles** : Les permissions sont sauvegardées dans la colonne `permissions`
2. **auth.users** : Les permissions sont également sauvegardées dans `raw_app_meta_data.permissions`

Cela permet de :
- Accéder rapidement aux permissions via les requêtes sur `user_profiles`
- Avoir les permissions disponibles dans le JWT token (via `auth.users`)

### Sécurité

- ✅ Seuls les utilisateurs avec le rôle `admin`, `AdminSoins` ou `AdminPhysio` peuvent modifier les permissions
- ✅ Les fonctions RPC utilisent `SECURITY DEFINER` pour accéder à `auth.users`
- ✅ Les politiques RLS protègent l'accès aux données

## 🐛 Résolution de problèmes

### Erreur : "column permissions does not exist"

➡️ **Solution** : Vous devez exécuter la migration SQL en premier

### Erreur : "function update_user_permissions does not exist"

➡️ **Solution** : La migration SQL n'a pas été exécutée correctement. Vérifiez les logs Supabase

### Les permissions ne se sauvegardent pas

1. Vérifiez que vous êtes connecté avec un compte admin
2. Ouvrez la console du navigateur (F12) pour voir les erreurs
3. Vérifiez que la colonne `permissions` existe dans `user_profiles` :
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'user_profiles' AND column_name = 'permissions';
   ```

### Comment recharger le schéma cache de PostgREST

Si vous avez exécuté la migration mais que l'API ne reconnaît pas encore la colonne :

```sql
-- Dans l'éditeur SQL Supabase
NOTIFY pgrst, 'reload schema';
```

Ou simplement attendez quelques minutes que le cache se rafraîchisse automatiquement.

## 📚 Utilisation des fonctions RPC

### Récupérer les permissions d'un utilisateur

```javascript
const { data, error } = await supabase.rpc('get_user_permissions', {
  uid: 'user-id-here'
})
// data = ['admin', 'page1.access', ...]
```

### Mettre à jour les permissions

```javascript
const { data, error } = await supabase.rpc('update_user_permissions', {
  target_user_id: 'user-id-here',
  new_permissions: ['admin', 'page1.access', 'page2.access']
})
// data = { success: true, message: '...' }
```

### Vérifier une permission

```javascript
const { data, error } = await supabase.rpc('user_has_permission', {
  user_uid: 'user-id-here',
  required_permission: 'admin'
})
// data = true/false
```

## ✅ Checklist de déploiement

- [ ] Migration SQL exécutée sur Supabase
- [ ] Vérification que les fonctions RPC sont créées
- [ ] Test de modification des permissions d'un utilisateur
- [ ] Vérification que les permissions sont bien sauvegardées
- [ ] Vérification des logs de la console (pas d'erreurs)
- [ ] Test avec différents rôles d'utilisateurs

## 📞 Support

Si vous rencontrez des problèmes, vérifiez :
1. Les logs de la console du navigateur
2. Les logs SQL dans Supabase
3. Que votre utilisateur a bien le rôle admin

---

**Note** : Cette solution est complète et prête à être déployée. Une fois la migration exécutée, le système de permissions fonctionnera automatiquement ! 🎉
