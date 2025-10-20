# 🚀 MIGRATION PLANNING FIREBASE → SUPABASE

## 📋 Vue d'ensemble

Migration complète du système de planning de Firebase Realtime Database vers Supabase PostgreSQL pour unifier les deux systèmes existants (minibrick + weekly planning).

---

## ✅ CE QUI A ÉTÉ FAIT

### **1. Nouveau service unifié : `planningService.js`**
- ✅ Remplace `weeklyPlanningService.js` (Firebase)
- ✅ Remplace `academicPlanningService.js` (Firebase)  
- ✅ Un seul service pour toutes les opérations de planning
- ✅ Toutes les fonctions migrées vers Supabase

### **2. Structure de données Supabase créée**
- ✅ Table `course_modules` - Modules de cours avec codes et couleurs
- ✅ Table `planning_time_slots` - Créneaux horaires détaillés
- ✅ Relations entre tables (foreign keys)
- ✅ Index pour performances
- ✅ Row Level Security (RLS) configuré
- ✅ Triggers pour `updated_at` automatique

### **3. WeeklyPlanningAdminView.vue adapté**
- ✅ Import du nouveau `planningService`
- ✅ Suppression des imports Firebase
- ✅ Toutes les fonctions migrées :
  - `loadWeekPlanning()` - Charge une semaine depuis Supabase
  - `loadSemesterPlanning()` - Charge un semestre
  - `saveSlot()` - Sauvegarde un créneau
  - `deleteSlot()` - Supprime un créneau
  - `performDuplicate()` - Duplique une semaine
- ✅ Conversion automatique snake_case ↔ camelCase
- ✅ Logs de debug retirés

---

## 🔧 ÉTAPES À SUIVRE POUR FINALISER

### **ÉTAPE 1 : Créer la table planning_time_slots**

1. **Ouvrir Supabase Dashboard**
   - Aller sur https://supabase.com/dashboard
   - Sélectionner votre projet

2. **Exécuter le script SQL**
   - Aller dans **SQL Editor** (menu de gauche)
   - Copier tout le contenu de `supabase_planning_tables.sql`
   - Coller dans l'éditeur
   - Cliquer **Run** (F5)

3. **Vérifier la création**
   - Aller dans **Table Editor**
   - Vous devriez voir :
     - ✅ `modules` (existe déjà - vos modules actuels)
     - ✅ `planning_time_slots` (nouvelle table créée, vide pour l'instant)

---

### **ÉTAPE 2 : Migrer les données existantes (OPTIONNEL)**

Si vous avez des données dans Firebase que vous voulez conserver :

#### **Option A : Migration manuelle**
1. Exporter les données Firebase en JSON
2. Créer un script de migration pour les insérer dans Supabase

#### **Option B : Repartir à zéro**
1. Utiliser les modules de démo déjà insérés
2. Créer les créneaux horaires via l'interface admin

---

### **ÉTAPE 3 : Tester le système**

1. **Lancer l'application**
   ```bash
   npm run dev
   ```

2. **Accéder à la page**
   - Aller sur `/admin/planning/weekly`

3. **Tester les fonctionnalités**
   - ✅ Sélection d'une classe (B26, B26-PT, etc.)
   - ✅ Sélection d'une semaine
   - ✅ Création d'un créneau (bouton "Nouveau Créneau")
   - ✅ Édition d'un créneau
   - ✅ Suppression d'un créneau
   - ✅ Duplication de semaine
   - ✅ Vue semestre (printemps/automne)
   - ✅ Export Excel

4. **Vérifier dans Supabase**
   - Aller dans **Table Editor** → `planning_time_slots`
   - Vous devriez voir vos créneaux créés

---

## 📊 STRUCTURE DES TABLES

### **Table `modules` (EXISTANTE)**
Vous avez déjà une table `modules` dans Supabase avec :
```sql
id              -- ID
code            -- Code du module (ex: "ia1", "mod1")
number          -- Numéro du module (ex: "M1012")
title           -- Titre du module
color           -- Couleur hex pour l'affichage
year            -- Année d'étude (1, 2, 3)
... autres colonnes ...
```

**Le service fait automatiquement le mapping :**
- `number` → `module_number` (pour compatibilité)
- `title` → `label` (pour compatibilité)
- `year` → `year_level` (pour compatibilité)

### **Table `planning_time_slots`**
```sql
id              BIGSERIAL PRIMARY KEY
class_code      VARCHAR(20)           -- Ex: "bac26", "bac26-pt"
week_number     INTEGER               -- 1-52
day             VARCHAR(10)           -- "lundi", "mardi", etc.
day_index       INTEGER               -- 0-4 (pour tri)
date            VARCHAR(10)           -- "DD.MM.YYYY"
start_time      VARCHAR(5)            -- "HH:MM"
end_time        VARCHAR(5)            -- "HH:MM"
module_code     VARCHAR(50)           -- FK vers course_modules
course_title    TEXT                  -- Titre spécifique
activity        TEXT                  -- Détails
teachers        TEXT[]                -- Array de noms
room            VARCHAR(50)           -- Salle
notes           TEXT                  -- Notes
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

---

## 🔄 CONVERSION DES FORMATS

Le service gère automatiquement la conversion entre :

### **Supabase (snake_case) → Vue (camelCase)**
```javascript
// Depuis Supabase
{
  class_code: "bac26",
  week_number: 38,
  start_time: "09:00",
  end_time: "11:00",
  module_code: "ia1"
}

// Converti pour Vue
{
  classCode: "bac26",
  weekNumber: 38,
  startTime: "09:00",
  endTime: "11:00",
  moduleCode: "ia1"
}
```

---

## 🎯 FONCTIONNALITÉS DISPONIBLES

### **API planningService.js**

#### **Créneaux horaires**
```javascript
// Récupérer une semaine
await planningService.getWeekTimeSlots(classCode, weekNumber)

// Récupérer un semestre
await planningService.getSemesterTimeSlots(classCode, 'spring' | 'autumn')

// Sauvegarder un créneau
await planningService.saveTimeSlot(slotData)

// Supprimer un créneau
await planningService.deleteTimeSlot(slotId)

// Dupliquer une semaine
await planningService.duplicateWeek(classCode, fromWeek, toWeek)
```

#### **Modules de cours**
```javascript
// Récupérer tous les modules
await planningService.getAllCourseModules()

// Récupérer un module
await planningService.getCourseModule(moduleCode)

// Sauvegarder un module
await planningService.saveCourseModule(moduleData)

// Supprimer un module
await planningService.deleteCourseModule(moduleId)
```

---

## 🗑️ NETTOYAGE (APRÈS MIGRATION RÉUSSIE)

Une fois que tout fonctionne, vous pouvez supprimer :

### **Fichiers obsolètes**
```
src/service/weeklyPlanningService.js
src/service/academicPlanningService.js
```

### **Imports Firebase dans les autres vues**
- Chercher et remplacer les imports dans `PlanningAdminView.vue`
- Adapter les autres pages qui utilisent le planning

---

## ⚠️ POINTS D'ATTENTION

### **1. Politiques RLS**
Les politiques actuelles permettent à tous les utilisateurs authentifiés de lire et modifier.  
**À personnaliser** selon vos besoins :

```sql
-- Exemple : Seuls les admins peuvent modifier
CREATE POLICY "Modules modifiables par admins" 
  ON course_modules FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
```

### **2. Codes de classe**
Le format des codes doit être cohérent :
- Temps plein : `bac26` (pas `B26`)
- Temps partiel : `bac26-pt` (minuscules)
- En emploi : `bac26-ee` (minuscules)

### **3. Numéros de semaine**
- Printemps : S8-S37
- Automne : S38-S52 puis S1-S7

---

## 🐛 DÉPANNAGE

### **Erreur : "relation does not exist"**
➡️ Les tables n'ont pas été créées. Exécutez `supabase_planning_tables.sql`

### **Erreur : "permission denied"**
➡️ Vérifiez les politiques RLS dans Supabase

### **Données vides après chargement**
➡️ Vérifiez le code de classe (doit être `bac26` pas `B26`)
➡️ Regardez dans Supabase Table Editor si les données existent

### **Erreur de conversion**
➡️ Le service gère automatiquement snake_case ↔ camelCase
➡️ Vérifiez les noms de champs dans la table

---

## ✨ AVANTAGES DE LA MIGRATION

### **Performance**
- ✅ Requêtes SQL optimisées avec index
- ✅ Moins de lectures qu'avec Firebase
- ✅ Pagination native

### **Maintenance**
- ✅ Un seul service au lieu de deux
- ✅ Structure de données claire
- ✅ Validation au niveau base de données

### **Fonctionnalités**
- ✅ Relations entre tables (foreign keys)
- ✅ Requêtes complexes possibles
- ✅ Triggers automatiques
- ✅ Row Level Security intégré

### **Coût**
- ✅ PostgreSQL gratuit jusqu'à 500MB
- ✅ Moins cher que Firebase pour données volumineuses

---

## 📞 SUPPORT

En cas de problème :
1. Vérifier les logs console du navigateur
2. Vérifier les logs Supabase (Dashboard → Logs)
3. Vérifier le contenu des tables dans Table Editor

---

**Date de migration** : 15 octobre 2025  
**Statut** : ✅ Code adapté, en attente de création des tables Supabase
