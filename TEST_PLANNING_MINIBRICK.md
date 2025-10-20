# ✅ TEST DU PLANNING MINIBRICK

## 🔧 CORRECTIONS APPLIQUÉES

### 1. **Mapping des jours corrigé** ✅
- Le service accepte maintenant `lu`, `ma`, `me`, `je`, `ve`
- Compatible aussi avec `lundi`, `mardi`, `mercredi`, `jeudi`, `vendredi`

### 2. **Génération des semaines corrigée** ✅
- Retourne maintenant `[1, 2, 3, ..., 52]` au lieu d'objets
- Compatible avec le template Vue

---

## 📋 ÉTAPES DE TEST

### **Étape 1 : Créer la table dans Supabase** (5 min)

1. Ouvrir **Supabase Dashboard**
2. Aller dans **SQL Editor**
3. Copier/coller le contenu de `supabase_planning_cells.sql`
4. Cliquer **Run** (ou F5)
5. Vérifier que la table `planning_cells` apparaît dans **Table Editor**

### **Étape 2 : Lancer l'application** (2 min)

```powershell
npm run dev
```

### **Étape 3 : Tester l'ajout d'une cellule** (3 min)

1. Aller sur `/admin/planning/manage`
2. Sélectionner **bac25** (ou autre classe)
3. Cliquer sur **Lundi Semaine 38** (ou n'importe quelle cellule)
4. Une popup devrait s'ouvrir ✅
5. Sélectionner un module dans le dropdown
6. Cliquer **Enregistrer**

### **Étape 4 : Vérifier dans Supabase** (2 min)

1. Aller dans **Supabase Table Editor**
2. Ouvrir la table **`planning_cells`**
3. Vous devriez voir la cellule créée ✅
4. Ouvrir la table **`planning_time_slots`**
5. Vous devriez voir **2 créneaux générés automatiquement** ✅

### **Étape 5 : Vérifier dans le planning hebdo** (2 min)

1. Aller sur `/admin/planning/weekly`
2. Sélectionner la même classe + semaine
3. Les créneaux devraient être visibles ✅

---

## 🚨 EN CAS D'ERREUR

### **Erreur : "relation planning_cells does not exist"**
➡️ Exécutez le SQL dans Supabase

### **Erreur : "permission denied"**
➡️ Vérifiez les RLS policies dans Supabase

### **Popup ne s'ouvre pas**
➡️ Ouvrez la console (F12) et partagez l'erreur

### **Modules ne s'affichent pas dans le dropdown**
➡️ Vérifiez que vous avez des modules dans Supabase (`modules` table)

---

## 📊 RÉSULTAT ATTENDU

### **Dans planning_cells**
```
class_code | week_number | day  | module_code
-----------|-------------|------|-------------
bac25      | 38          | lu   | ia1
```

### **Dans planning_time_slots**
```
class_code | week_number | day  | start_time | end_time | module_code
-----------|-------------|------|------------|----------|-------------
bac25      | 38          | lu   | 09:00      | 11:00    | ia1
bac25      | 38          | lu   | 13:00      | 15:00    | ia1
```

---

## 🎯 PROCHAINES ÉTAPES

Une fois que tout fonctionne :
1. ✅ Remplir le planning annuel
2. ✅ Les créneaux hebdo se génèrent automatiquement
3. ✅ Plus besoin de tout saisir manuellement !

---

**Bon test ! 🚀**
