# 🔍 CHECKLIST DE VÉRIFICATION SUPABASE

## ✅ Corrections appliquées

### **1. Service planningService.js**
- ✅ `course_modules` → `modules` (lignes 23 et 50)
- ✅ Requêtes SQL corrigées

### **2. WeeklyPlanningAdminView.vue**
- ✅ Mapping colonnes corrigé : `module_number` → `number` 
- ✅ Mapping colonnes corrigé : `label` → `title`
- ✅ Appliqué sur `loadWeekPlanning()` et `loadSemesterPlanning()`

---

## 🧪 TESTS À FAIRE

### **Test 1 : Console navigateur (F12)**

Ouvrir la console et vérifier s'il y a des erreurs :

```
❌ "relation course_modules does not exist" → SERVICE CORRIGÉ ✅
❌ "column module_number does not exist" → MAPPING CORRIGÉ ✅
```

### **Test 2 : Vérifier la structure Supabase**

Dans **Supabase Dashboard** → **Table Editor** :

#### **Table `modules`** (doit exister)
```
✓ id
✓ code
✓ number        ← utilisé dans le planning
✓ title         ← utilisé dans le planning  
✓ color         ← utilisé dans le planning
✓ year          ← utilisé dans le planning
```

#### **Table `planning_time_slots`** (doit exister)
```
✓ id
✓ class_code
✓ week_number
✓ day
✓ day_index
✓ date
✓ start_time
✓ end_time
✓ module_code   ← FK vers modules.code
✓ course_title
✓ activity
✓ teachers      ← type: text[]
✓ room
✓ notes
✓ created_at
✓ updated_at
```

### **Test 3 : Requête SQL manuelle**

Dans **Supabase Dashboard** → **SQL Editor**, exécuter :

```sql
-- Test 1: Vérifier les modules
SELECT * FROM modules LIMIT 5;

-- Test 2: Vérifier le JOIN
SELECT 
  pts.*,
  m.code,
  m.number,
  m.title,
  m.color
FROM planning_time_slots pts
LEFT JOIN modules m ON pts.module_code = m.code
LIMIT 5;
```

---

## 🐛 PROBLÈMES POSSIBLES

### **Erreur: "relation modules does not exist"**

**Solution** : Votre table a un nom différent
1. Aller dans Supabase → Table Editor
2. Noter le nom EXACT de la table des modules
3. Me le donner pour que je corrige le code

### **Erreur: "permission denied for table"**

**Solution** : Problème de RLS (Row Level Security)
```sql
-- Désactiver temporairement RLS pour tester
ALTER TABLE planning_time_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE modules DISABLE ROW LEVEL SECURITY;
```

### **Erreur: "column does not exist"**

**Solution** : Vérifier les noms des colonnes
```sql
-- Lister les colonnes de la table modules
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'modules';
```

---

## 🎯 WORKFLOW DE TEST

### **Étape 1 : Ouvrir l'application**
```bash
npm run dev
```

### **Étape 2 : Aller sur le planning**
```
http://localhost:5173/admin/planning/weekly
```

### **Étape 3 : Ouvrir la console (F12)**
- Onglet **Console** pour voir les erreurs JavaScript
- Onglet **Network** pour voir les requêtes Supabase

### **Étape 4 : Sélectionner une classe et semaine**
- Classe : `bac26`
- Semaine : `38` (ou n'importe quelle semaine)

### **Étape 5 : Observer les logs**

**Console doit afficher** :
```
[PlanningService] getWeekTimeSlots: bac26, 38
Données reçues: []  (ou un tableau si des créneaux existent)
```

**Si erreur** :
```
[PlanningService] Erreur getWeekTimeSlots: {error message}
```

→ **Me copier le message d'erreur complet !**

---

## 📊 STRUCTURE ATTENDUE

### **Quand vous faites `planningService.getWeekTimeSlots()`**

**Requête Supabase** :
```javascript
supabase
  .from('planning_time_slots')
  .select('*, course_module:modules(*)')
  .eq('class_code', 'bac26')
  .eq('week_number', 38)
```

**Réponse attendue** :
```json
[
  {
    "id": 1,
    "class_code": "bac26",
    "week_number": 38,
    "day": "lundi",
    "day_index": 0,
    "start_time": "09:00",
    "end_time": "11:00",
    "module_code": "ia1",
    "course_module": {
      "id": 1,
      "code": "ia1",
      "number": "M1012",
      "title": "Raisonnement clinique",
      "color": "#FF6B6B",
      "year": 1
    }
  }
]
```

---

## 💡 SI ÇA NE MARCHE TOUJOURS PAS

**Donnez-moi** :
1. **Le message d'erreur exact** de la console (F12)
2. **Capture d'écran** de votre table `modules` dans Supabase
3. **Le résultat** de la requête SQL de test ci-dessus

**Je vais debug avec vous !** 🚀
