# 🎓 MIGRATION DU PLANNING ACADÉMIQUE (MINIBRICK) - STATUS

## 🎯 VOTRE BESOIN

```
Planning Académique (Minibrick)
       ↓
   Ajouter case "ia1"
       ↓
   Lundi Semaine 38
       ↓
   [GÉNÉRATION AUTO]
       ↓
Planning Hebdomadaire
   09:00-11:00 ia1
   13:00-15:00 ia1
```

---

## ✅ CE QUI EST FAIT

### **1. Table SQL créée**
- ✅ `supabase_planning_cells.sql`
- Table `planning_cells` pour stocker les cellules du minibrick
- Index, triggers, RLS configurés

### **2. Service étendu**
- ✅ `planningService.js` enrichi avec :
  - `getPlanningCells()` - Récupère les cellules d'un semestre
  - `savePlanningCell()` - Sauvegarde une cellule
  - `deletePlanningCell()` - Supprime une cellule
  - `generateTimeSlotsFromCell()` - Génère les créneaux hebdo auto

---

## ⏳ CE QUI RESTE À FAIRE

### **1. Créer la table dans Supabase**

**Action** : Exécuter le SQL dans Supabase

```bash
# 1. Aller sur Supabase Dashboard
# 2. SQL Editor
# 3. Copier tout supabase_planning_cells.sql
# 4. Run (F5)
```

### **2. Migrer PlanningAdminView.vue**

**Fichier** : `src/views/admin/planning/PlanningAdminView.vue`

**Changements à faire** :

#### **A. Remplacer l'import**
```javascript
// AVANT (Firebase)
import academicPlanningService from '@/service/academicPlanningService'

// APRÈS (Supabase)
import planningService from '@/service/planningService'
```

#### **B. Adapter loadPlanning()**
```javascript
// AVANT
const autumnCells = await academicPlanningService.getPlanningCells(
  selectedYear.value, 
  'autumn'
)

// APRÈS
const autumnCells = await planningService.getPlanningCells(
  selectedYear.value, 
  'autumn'
)
```

#### **C. Adapter saveCell()**
```javascript
// AVANT
await academicPlanningService.savePlanningCell(
  selectedYear.value,
  semester,
  day,
  week,
  courseCodeForm.value.id
)

// APRÈS
await planningService.savePlanningCell(
  selectedYear.value,
  week,
  day,
  courseCodeForm.value.id
)

// BONUS : Générer auto les créneaux hebdo
await planningService.generateTimeSlotsFromCell({
  class_code: selectedYear.value,
  week_number: week,
  day: day,
  module_code: courseCodeForm.value.id
})
```

#### **D. Adapter deleteCell()**
```javascript
// AVANT
await academicPlanningService.deletePlanningCell(
  selectedYear.value,
  semester,
  editingCell.value.day,
  editingCell.value.week
)

// APRÈS
await planningService.deletePlanningCell(
  selectedYear.value,
  editingCell.value.week,
  editingCell.value.day
)
```

---

## 🔄 WORKFLOW COMPLET APRÈS MIGRATION

### **Ajout d'une cellule**

1. **Utilisateur** : Clique sur Lundi S38 dans le minibrick
2. **Interface** : Dialogue de sélection de module
3. **Utilisateur** : Sélectionne "ia1"
4. **Code** :
   ```javascript
   // 1. Sauver dans planning_cells
   await planningService.savePlanningCell('bac26', 38, 'lundi', 'ia1')
   
   // 2. Générer auto les créneaux détaillés
   await planningService.generateTimeSlotsFromCell({
     class_code: 'bac26',
     week_number: 38,
     day: 'lundi',
     module_code: 'ia1'
   })
   ```
5. **Résultat** :
   - ✅ Cellule sauvée dans `planning_cells`
   - ✅ 2 créneaux créés dans `planning_time_slots` (09:00-11:00 et 13:00-15:00)
   - ✅ Visible dans le planning hebdomadaire immédiatement

### **Modification d'une cellule**

1. **Utilisateur** : Clique sur la cellule existante
2. **Interface** : Change "ia1" → "pfp1"
3. **Code** :
   ```javascript
   // 1. Mettre à jour planning_cells
   await planningService.savePlanningCell('bac26', 38, 'lundi', 'pfp1')
   
   // 2. Régénérer les créneaux hebdo
   await planningService.generateTimeSlotsFromCell({
     class_code: 'bac26',
     week_number: 38,
     day: 'lundi',
     module_code: 'pfp1'
   })
   ```
4. **Résultat** :
   - ✅ Cellule mise à jour
   - ✅ Anciens créneaux supprimés
   - ✅ Nouveaux créneaux avec "pfp1" créés
   - ✅ Planning hebdo synchronisé

### **Suppression d'une cellule**

1. **Utilisateur** : Clique sur la cellule et supprime
2. **Code** :
   ```javascript
   // Supprimer et régénérer (vide)
   await planningService.savePlanningCell('bac26', 38, 'lundi', null)
   await planningService.generateTimeSlotsFromCell({
     class_code: 'bac26',
     week_number: 38,
     day: 'lundi',
     module_code: null
   })
   ```
3. **Résultat** :
   - ✅ Cellule supprimée de `planning_cells`
   - ✅ Créneaux hebdo supprimés
   - ✅ Planning vide pour ce jour

---

## 📊 AVANTAGES DU NOUVEAU SYSTÈME

### **Avant (Firebase)**
- ❌ Données éparpillées
- ❌ Pas de synchronisation
- ❌ Génération manuelle
- ❌ 2 bases de données séparées

### **Après (Supabase)**
- ✅ Tout centralisé dans Supabase
- ✅ Synchronisation automatique
- ✅ Génération auto des créneaux
- ✅ 1 seule base de données
- ✅ Performance SQL améliorée

---

## 🚀 PROCHAINES ÉTAPES

### **Maintenant (15 min)**
1. ✅ Exécuter `supabase_planning_cells.sql` dans Supabase

### **Ensuite (30-45 min)**
2. ✅ Adapter `PlanningAdminView.vue` pour utiliser `planningService`
3. ✅ Tester l'ajout d'une cellule
4. ✅ Vérifier dans Supabase que ça s'enregistre
5. ✅ Vérifier dans le weekly que les créneaux sont générés

### **Optionnel (plus tard)**
6. ⏳ Migrer les autres vues (AnnualPlanningView, SemesterPlanningAdminView)
7. ⏳ Nettoyer Firebase (script cleanFirebasePlanning.js)

---

## 💡 BESOIN D'AIDE ?

### **Pour exécuter le SQL**
1. Ouvrir Supabase Dashboard
2. SQL Editor (menu gauche)
3. Copier tout le contenu de `supabase_planning_cells.sql`
4. Coller et Run (F5)
5. Vérifier dans Table Editor que `planning_cells` existe

### **Pour adapter PlanningAdminView**
Je peux le faire pour vous si vous voulez ! Dites-moi juste et je fais les modifications nécessaires.

---

## 📝 RÉSUMÉ

**Fichiers créés** :
- ✅ `supabase_planning_cells.sql`
- ✅ `planningService.js` (étendu)
- ✅ Ce document

**Actions requises** :
1. Exécuter le SQL dans Supabase
2. Adapter PlanningAdminView.vue

**Temps estimé** : 45-60 minutes

**Résultat** : Planning académique et hebdomadaire complètement synchronisés ! 🎉
