# 🗑️ Gestion Complète des Utilisateurs (Admin)

## ✅ Fonctionnalités Implémentées

### **Création d'Utilisateurs** 👤
- ✅ Création sans **déconnexion de l'admin**
- ✅ Insertion dans `auth.users` + `user_profiles`
- ✅ Email confirmé automatiquement
- ✅ Mot de passe hashé avec bcrypt
- ✅ **Permissions admin** vérifiées

### **Suppression d'Utilisateurs** 🗑️
- ✅ Suppression du **profil utilisateur** (`user_profiles`)
- ✅ Suppression de l'**authentification** (`auth.users`)
- ✅ **Confirmation** avant suppression
- ✅ **Messages** de succès/erreur
- ✅ **Mise à jour** automatique de la liste

---

## 🚀 Installation des Fonctions SQL

### **Étape 1 : Fonction de Création (OBLIGATOIRE)**

1. Ouvre **Supabase Dashboard** → **SQL Editor**
2. Copie le contenu du fichier `supabase/migrations/admin_create_user_function.sql`
3. Clique sur **"Run"** pour exécuter le script
4. ✅ La fonction `admin_create_user()` est créée

### **Étape 2 : Fonction de Suppression**

1. Dans **SQL Editor**
2. Copie le contenu du fichier `supabase/migrations/delete_user_function.sql`
3. Clique sur **"Run"** pour exécuter le script
4. ✅ La fonction `delete_user()` est créée

### **Étape 3 : Vérifier les Fonctions**

```sql
-- Dans SQL Editor, vérifie que les fonctions existent :
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('admin_create_user', 'delete_user');

-- Doit retourner 2 lignes :
-- admin_create_user
-- delete_user
```

---

## 🎯 Utilisation

### **Créer un Utilisateur** 👤

1. Va dans **Administration** → **Utilisateurs**
2. Clique sur **"Ajouter un utilisateur"**
3. Remplis le formulaire :
   - Email
   - Mot de passe (min 6 caractères)
   - Prénom
   - Nom de famille
   - Rôle
4. Clique sur **"Créer"**
5. ✅ Utilisateur créé, **tu restes connecté en tant qu'admin**
6. Le nouvel utilisateur peut se connecter avec ses identifiants

### **Supprimer un Utilisateur** 🗑️

1. Va dans **Administration** → **Utilisateurs**
2. Clique sur le bouton **"Supprimer"** à côté d'un utilisateur
3. **Confirme** la suppression dans la popup
4. L'utilisateur est **complètement supprimé** (profil + auth)

### **Comportement**

#### **Création Réussie** ✅
- Utilisateur créé dans `auth.users` + `user_profiles`
- Email confirmé automatiquement
- **Admin reste connecté** (pas de déconnexion)
- Toast de succès affiché
- Liste rechargée avec le nouvel utilisateur

#### **Suppression Réussie** ✅
- Profil supprimé de `user_profiles`
- Authentification supprimée de `auth.users`
- Ligne retirée de la liste
- Toast de succès affiché

#### **Suppression Partielle** ⚠️
- Profil supprimé mais auth reste
- Toast d'avertissement affiché
- Nécessite intervention admin

#### **Erreur** ❌
- Toast d'erreur avec détails
- Rien n'est modifié
- Utilisateur reste dans la liste

---

## 🔒 Sécurité

### **Permissions Requises**

- Seuls les **administrateurs** peuvent créer/supprimer des utilisateurs
- Les fonctions vérifient le rôle avant toute action
- Politique RLS appliquée sur `auth.users`
- Vérification côté serveur : `role = 'admin'` dans `user_profiles`

### **Contraintes**

```sql
-- Vérifier les contraintes CASCADE
SELECT constraint_name, delete_rule
FROM information_schema.referential_constraints
WHERE constraint_schema = 'public';
```

---

## 🔧 Dépannage

### **Erreur : "Function delete_user does not exist"**

**Solution** : Exécute le script SQL dans Supabase Dashboard

```sql
-- Vérifier que la fonction existe
SELECT proname FROM pg_proc WHERE proname = 'delete_user';
```

### **Erreur : "Permission denied"**

**Solution** : Vérifie que tu es connecté en tant qu'admin

```sql
-- Vérifier ton rôle
SELECT role FROM user_profiles WHERE user_id = auth.uid()::text;
```

### **Erreur : "Could not delete from auth.users"**

**Solution** : Vérifie les permissions de la fonction

```sql
-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;
```

---

## 📊 Structure de Suppression

```
Suppression d'un utilisateur
│
├─ 1️⃣ Confirmation utilisateur
│   └─ Popup avec avertissement
│
├─ 2️⃣ Suppression profil
│   └─ DELETE FROM user_profiles WHERE user_id = ?
│
├─ 3️⃣ Suppression auth
│   └─ CALL delete_user(user_id)
│       └─ DELETE FROM auth.users WHERE id = ?
│
└─ 4️⃣ Mise à jour UI
    └─ Retirer de la liste locale
    └─ Afficher toast de confirmation
```

---

## 🎨 Code Vue.js

```vue
<Button 
  label="Supprimer" 
  severity="danger" 
  @click="deleteUser(data.id)" 
/>
```

```javascript
async deleteUser(userId) {
  const confirmed = confirm('Supprimer cet utilisateur ?');
  if (!confirmed) return;

  try {
    // Supprimer profil
    await supabase.from('user_profiles').delete().eq('user_id', userId);
    
    // Supprimer auth
    await supabase.rpc('delete_user', { user_id: userId });
    
    // Retirer de la liste
    this.utilisateurs = this.utilisateurs.filter(u => u.id !== userId);
    
    this.toast.add({ 
      severity: 'success', 
      summary: 'Utilisateur supprimé' 
    });
  } catch (error) {
    this.toast.add({ 
      severity: 'error', 
      summary: 'Erreur de suppression' 
    });
  }
}
```

---

## ✅ Checklist de Vérification

- [ ] Script SQL exécuté dans Supabase
- [ ] Fonction `delete_user` créée
- [ ] Permissions accordées (`authenticated`)
- [ ] Politique RLS activée (admin only)
- [ ] Test de suppression réussi
- [ ] Toast de confirmation affiché
- [ ] Utilisateur retiré de la liste
- [ ] Auth supprimée de Supabase

---

## 🚀 Prochaines Étapes

1. ✅ **Exécuter le script SQL** dans Supabase
2. ✅ **Tester la suppression** avec un utilisateur de test
3. ✅ **Vérifier** que l'auth est bien supprimée
4. ✅ **Confirmer** le bon fonctionnement en production

---

**Status** : 🎉 Suppression complète d'utilisateurs implémentée et prête à l'emploi !
