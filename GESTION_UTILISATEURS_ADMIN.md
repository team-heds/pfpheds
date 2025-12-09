# 👑 Gestion des Utilisateurs Admin - Guide Rapide

## 🚀 Installation (1 fois seulement)

### **Exécuter les 2 scripts SQL dans Supabase**

1. Ouvre **Supabase Dashboard** → **SQL Editor**

2. **Script 1** - Création d'utilisateurs :
   - Copie `supabase/migrations/admin_create_user_function.sql`
   - Colle dans SQL Editor
   - Clique **"Run"**

3. **Script 2** - Suppression d'utilisateurs :
   - Copie `supabase/migrations/delete_user_function.sql`
   - Colle dans SQL Editor
   - Clique **"Run"**

4. **Vérifier** :
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN ('admin_create_user', 'delete_user');
```

✅ Doit afficher 2 fonctions

---

## 📝 Utilisation

### **Créer un Utilisateur**

1. **Administration** → **Utilisateurs**
2. Clique **"Ajouter un utilisateur"**
3. Remplis le formulaire
4. Clique **"Créer"**
5. ✅ **Tu restes connecté** en tant qu'admin

### **Supprimer un Utilisateur**

1. **Administration** → **Utilisateurs**
2. Clique **"Supprimer"** sur un utilisateur
3. Confirme
4. ✅ **Suppression complète** (profil + auth)

---

## ✨ Avantages

### **Création d'Utilisateurs**
- ✅ **Pas de déconnexion** : Tu restes sur ton compte admin
- ✅ **Email confirmé** automatiquement
- ✅ **Mot de passe sécurisé** (bcrypt)
- ✅ **Profil créé** automatiquement

### **Suppression d'Utilisateurs**
- ✅ **Suppression totale** : Auth + profil + données
- ✅ **Confirmation** obligatoire
- ✅ **Permissions vérifiées** (admin only)

---

## 🔍 Dépannage

### Erreur "Function admin_create_user does not exist"
➡️ Exécute le script SQL `admin_create_user_function.sql`

### Erreur "Permission denied"
➡️ Connecte-toi avec un compte **admin**

### L'admin se déconnecte lors de la création
➡️ Vérifie que tu utilises bien `supabase.rpc('admin_create_user')` et pas `signUpSupabase`

---

## 📁 Fichiers Importants

- `supabase/migrations/admin_create_user_function.sql` - Fonction de création
- `supabase/migrations/delete_user_function.sql` - Fonction de suppression
- `src/views/admin/users/UserListView.vue` - Interface admin

---

## 🎯 Checklist

- [ ] Scripts SQL exécutés dans Supabase
- [ ] Fonctions vérifiées (2 fonctions présentes)
- [ ] Test de création d'utilisateur
- [ ] Admin reste connecté ✅
- [ ] Test de suppression d'utilisateur
- [ ] Utilisateur complètement supprimé ✅

---

**🎉 Système prêt à l'emploi !**
