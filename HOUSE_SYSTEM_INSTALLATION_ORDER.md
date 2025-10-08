# 🏠 Ordre d'Installation du Système de Gestion des Maisons

## ⚠️ IMPORTANT : Exécuter dans cet ordre EXACT

### 📝 Prérequis
- Accès à **Supabase Dashboard → SQL Editor**
- Droits administrateur sur la base de données
- Table `houses` déjà existante (✅ Vous l'avez)

---

## 🔢 Ordre d'Exécution des Migrations

### **1️⃣ Ajouter la colonne `house` à `profiles`**
📄 **Fichier** : `add_house_to_profiles.sql`

**Ce qu'elle fait** :
- Ajoute la colonne `house` dans la table `profiles`
- Crée un index pour les performances
- Fournit des fonctions pour répartir les utilisateurs

**Exécuter** :
```sql
-- Copier-coller tout le contenu de add_house_to_profiles.sql
```

**Vérification** :
```sql
-- Doit retourner 1 ligne avec la colonne 'house'
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'house';
```

**Optionnel - Répartir les utilisateurs** :
```sql
-- Répartir automatiquement les utilisateurs sans maison
SELECT * FROM distribute_users_to_houses();
```

---

### **2️⃣ Ajouter les rôles à `profiles`**
📄 **Fichier** : `add_role_to_profiles.sql`

**Ce qu'elle fait** :
- Ajoute la colonne `role` avec l'enum des rôles
- Crée des fonctions pour promouvoir des utilisateurs

**Exécuter** :
```sql
-- Copier-coller tout le contenu de add_role_to_profiles.sql
```

**Vérification** :
```sql
-- Doit retourner 1 ligne avec la colonne 'role'
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'role';
```

**Promouvoir votre compte en admin** :
```sql
-- ⚠️ Remplacer par votre email
SELECT promote_user_to_admin('votre.email@hevs.ch');
```

---

### **3️⃣ Créer la table `house_points_history`**
📄 **Fichier** : `create_house_points_history.sql`

**Ce qu'elle fait** :
- Crée la table pour l'historique des points
- Active RLS avec les bonnes politiques
- Insère des données de test

**Exécuter** :
```sql
-- Copier-coller tout le contenu de create_house_points_history.sql
```

**Vérification** :
```sql
-- Doit retourner au moins 6 lignes (données de test)
SELECT COUNT(*) FROM house_points_history;

-- Voir les données de test
SELECT * FROM house_points_history ORDER BY created_at DESC;
```

---

### **4️⃣ Créer les vues et fonctions de statistiques**
📄 **Fichier** : `create_house_stats_view.sql`

**Ce qu'elle fait** :
- Crée la vue `house_points_totals` pour les statistiques
- Crée la fonction `get_house_rankings()`
- Crée la fonction `get_house_recent_history()`

**Exécuter** :
```sql
-- Copier-coller tout le contenu de create_house_stats_view.sql
```

**Vérification** :
```sql
-- Doit retourner 4 lignes (les 4 maisons)
SELECT * FROM house_points_totals;

-- Tester la fonction de classement
SELECT * FROM get_house_rankings();

-- Tester l'historique d'une maison
SELECT * FROM get_house_recent_history('harmonis', 5);
```

---

## ✅ Vérifications Finales

### **Vérifier toutes les tables**
```sql
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('houses', 'profiles', 'house_points_history')
ORDER BY table_name;
```

**Résultat attendu** :
- `houses` : présent
- `house_points_history` : présent
- `profiles` : présent avec colonnes `house` et `role`

---

### **Vérifier les vues**
```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name = 'house_points_totals';
```

**Résultat attendu** : 1 ligne

---

### **Vérifier les fonctions**
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'get_house_rankings',
    'get_house_recent_history',
    'promote_user_to_admin',
    'assign_random_house',
    'distribute_users_to_houses'
  );
```

**Résultat attendu** : 5 lignes

---

## 🚀 Lancer l'Application

### **1. Rafraîchir le cache Supabase**
```sql
NOTIFY pgrst, 'reload schema';
```

### **2. Recharger l'application**
```
F5 dans le navigateur
```

### **3. Aller sur la page d'administration**
```
/admin/gamification/houses
```

---

## 🐛 En cas de problème

### **Erreur "table already exists"**
```sql
-- Supprimer et recréer
DROP TABLE IF EXISTS house_points_history CASCADE;
-- Puis réexécuter la migration 3
```

### **Erreur "column already exists"**
```sql
-- Vérifier si elle existe vraiment
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name IN ('house', 'role');

-- Si elle existe, passer à la migration suivante
```

### **Erreur "view depends on other objects"**
```sql
-- Supprimer la vue
DROP VIEW IF EXISTS house_points_totals CASCADE;
-- Puis réexécuter la migration 4
```

### **Aucune donnée n'apparaît**
```sql
-- Vérifier que vous êtes admin
SELECT id, email, role FROM profiles WHERE email = 'votre.email@hevs.ch';

-- Vérifier les données de test
SELECT * FROM house_points_history;

-- Vérifier la vue
SELECT * FROM house_points_totals;
```

---

## 📞 Support

Si tout est bien exécuté :
- ✅ Les 4 maisons s'affichent
- ✅ Les statistiques sont visibles
- ✅ L'historique se charge
- ✅ Vous pouvez attribuer des points

**Bravo ! Le système est opérationnel ! 🎉**
