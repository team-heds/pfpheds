# 🧪 GUIDE TEST SQL SUPABASE

## 📝 ÉTAPES POUR TESTER

### **ÉTAPE 1 : Ouvrir l'éditeur SQL Supabase**

1. Va sur https://supabase.com
2. Ouvre ton projet
3. Dans le menu gauche, clique sur **"SQL Editor"**
4. Clique sur **"+ New query"**

---

### **ÉTAPE 2 : Tester ce que tu as déjà**

**Copie et exécute** : `test_simple.sql`

Cela va te montrer :
- ✅ Tes tables existantes
- ✅ Nombre de lignes dans chaque table
- ✅ Aperçu de tes données

**Résultat attendu** :
```
badges: X lignes
challenges: X lignes
quests: X lignes
user_badges: X lignes
...
```

---

### **ÉTAPE 3 : Ajouter des données de test (si vide)**

**SI tu n'as PAS de badges/défis/quêtes** :

1. Ouvre une nouvelle query
2. Copie le contenu de `supabase_gamification_seed.sql`
3. Clique **"Run"**

**Résultat attendu** :
```
✅ 24 badges créés
✅ 13 défis créés
✅ 5 quêtes créées
```

---

### **ÉTAPE 4 : Vérifier que tout fonctionne**

Exécute cette requête :

```sql
-- Vérifie que les données sont bien là
SELECT 
  'Badges' as type, COUNT(*) as count FROM badges
UNION ALL
SELECT 'Challenges', COUNT(*) FROM challenges
UNION ALL
SELECT 'Quests', COUNT(*) FROM quests;
```

**Résultat attendu** :
```
Badges     | 24
Challenges | 13
Quests     | 5
```

---

## 🐛 ERREURS POSSIBLES

### **Erreur : "relation does not exist"**
➡️ La table n'existe pas encore
➡️ **Solution** : Exécute `supabase_gamification_schema_safe.sql` d'abord

### **Erreur : "duplicate key value"**
➡️ Les données existent déjà
➡️ **Solution** : C'est normal ! Ignore cette erreur

### **Erreur : "permission denied"**
➡️ Problème RLS (Row Level Security)
➡️ **Solution** : Utilise l'éditeur SQL (il bypass RLS)

---

## ✅ CHECKLIST

Après avoir exécuté les scripts :

- [ ] `badges` a au moins 10 lignes
- [ ] `challenges` a au moins 5 lignes
- [ ] `quests` a au moins 3 lignes
- [ ] `houses` a 4 lignes (Harmonis, Elaris, Doloris, Solencia)
- [ ] `gamification_data` existe et a tes utilisateurs
- [ ] Pas d'erreurs rouges dans Supabase

---

## 🚀 ORDRE D'EXÉCUTION RECOMMANDÉ

1. **test_simple.sql** - Voir ce que tu as
2. **supabase_gamification_seed.sql** - Ajouter données de test (si vide)
3. **test_simple.sql** - Vérifier que ça marche

**NE PAS exécuter `supabase_gamification_schema_safe.sql`** car tu as déjà les tables !

---

## 📊 REQUÊTES UTILES

### Voir tous les badges :
```sql
SELECT name, rarity, xp_reward FROM badges ORDER BY rarity;
```

### Voir tous les défis actifs :
```sql
SELECT title, difficulty, xp_reward FROM challenges WHERE active = true;
```

### Voir toutes les quêtes :
```sql
SELECT title, total_steps, xp_reward FROM quests WHERE active = true;
```

### Voir tes stats utilisateur :
```sql
SELECT * FROM gamification_data LIMIT 5;
```

---

**🎯 Prêt à tester ? Dis-moi ce que tu vois !**
