# 🐛 DEBUG - ERREUR PLANNING ACADÉMIQUE

## ❌ ERREUR OBSERVÉE

```
[PlanningService] Erreur savePlanningCell: {}
[PlanningAdmin] Erreur saveCell: {}
```

---

## 🔧 LOGGING AMÉLIORÉ

J'ai ajouté des logs détaillés dans :
- ✅ `planningService.js` → `savePlanningCell()`
- ✅ `planningService.js` → `generateTimeSlotsFromCell()`
- ✅ `PlanningAdminView.vue` → `saveCell()`

---

## 🧪 ÉTAPES DE DÉBOGAGE

### **1. Rechargez la page** (Ctrl+R)

### **2. Ouvrez la console** (F12)

### **3. Réessayez d'ajouter une cellule**

### **4. Lisez les nouveaux logs**

Vous devriez maintenant voir :
```
[PlanningService] savePlanningCell appelé: { classCode: "bac25", weekNumber: 38, day: "lu", moduleCode: "ia1" }
[PlanningService] Payload UPSERT: { ... }
```

**Puis l'une de ces erreurs :**

#### **A. "relation planning_cells does not exist"**
➡️ **Cause** : La table n'a pas été créée dans Supabase
➡️ **Solution** : Exécutez `supabase_planning_cells.sql` dans Supabase SQL Editor

#### **B. "permission denied for table planning_cells"**
➡️ **Cause** : RLS (Row Level Security) bloque l'insertion
➡️ **Solution** : Vérifiez les policies dans le SQL (elles devraient autoriser les utilisateurs authentifiés)

#### **C. "null value in column ... violates not-null constraint"**
➡️ **Cause** : Une colonne obligatoire est manquante
➡️ **Solution** : Vérifiez la structure de la table

#### **D. "duplicate key value violates unique constraint"**
➡️ **Cause** : La cellule existe déjà (ne devrait pas arriver avec upsert)
➡️ **Solution** : Vérifiez la contrainte UNIQUE dans le SQL

---

## 📊 VÉRIFICATIONS SUPABASE

### **1. Table existe ?**
**Supabase Dashboard** → **Table Editor** → Cherchez `planning_cells`

### **2. Structure correcte ?**
Colonnes attendues :
- `id` (BIGSERIAL PRIMARY KEY)
- `class_code` (VARCHAR)
- `week_number` (INTEGER)
- `day` (VARCHAR)
- `module_code` (VARCHAR)
- `created_at` (TIMESTAMPTZ)
- `updated_at` (TIMESTAMPTZ)

### **3. RLS activé ?**
**Table Editor** → `planning_cells` → **RLS** devrait être **ON**

### **4. Policies configurées ?**
**Authentication** → **Policies** → Vérifiez :
- ✅ "Planning cells lisibles par tous" (SELECT)
- ✅ "Planning cells modifiables par admins" (ALL)

---

## 🚀 ACTIONS IMMÉDIATES

### **Si la table n'existe pas :**
```sql
-- Dans Supabase SQL Editor
-- Copiez/collez supabase_planning_cells.sql
-- Run (F5)
```

### **Si les policies bloquent :**
```sql
-- Vérifier les policies existantes
SELECT * FROM pg_policies WHERE tablename = 'planning_cells';

-- Si nécessaire, recréer les policies (déjà dans le SQL)
```

---

## 📝 PARTAGEZ LES LOGS

Réessayez et **copiez/collez** les nouveaux messages de la console, ils contiendront maintenant :
- Le message d'erreur complet
- Le code d'erreur
- Les données envoyées

**Exemple attendu :**
```
[PlanningService] savePlanningCell appelé: { classCode: "bac25", weekNumber: 38, day: "lu", moduleCode: "ia1" }
[PlanningService] Payload UPSERT: { class_code: "bac25", week_number: 38, day: "lu", module_code: "ia1" }
[PlanningService] Erreur UPSERT: { code: "42P01", message: "relation planning_cells does not exist" }
```

---

**Rechargez la page et réessayez ! Les vrais détails de l'erreur apparaîtront maintenant.** 🔍
