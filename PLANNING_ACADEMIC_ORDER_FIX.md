# ✅ ORDRE ACADÉMIQUE DES SEMAINES - CORRIGÉ !

## 🎯 PROBLÈME RÉSOLU

Les semaines étaient affichées dans l'ordre **numérique** (S1 → S52) au lieu de l'ordre **académique** (S38 → S37).

---

## 🔧 MODIFICATIONS APPORTÉES

### **1. PlanningAdminView.vue - Tableau Minibrick**

**Fichier** : `src/views/admin/planning/PlanningAdminView.vue`

**Fonction modifiée** : `currentWeeks` (computed)

```javascript
const currentWeeks = computed(() => {
  // Ordre académique : Automne (S38-S52, S1-S7) puis Printemps (S8-S37)
  const weeks = []
  
  // Semestre d'Automne : S38 → S52
  for (let w = 38; w <= 52; w++) {
    weeks.push(w)
  }
  
  // Semestre d'Automne (suite) : S1 → S7
  for (let w = 1; w <= 7; w++) {
    weeks.push(w)
  }
  
  // Semestre de Printemps : S8 → S37
  for (let w = 8; w <= 37; w++) {
    weeks.push(w)
  }
  
  return weeks
})
```

**Résultat** :
- ✅ Les colonnes du tableau sont maintenant dans l'ordre : **S38 → S52 → S1 → S7 → S8 → S37**
- ✅ Les semaines d'automne (orange) apparaissent en premier
- ✅ Les semaines de printemps (bleu) apparaissent ensuite

---

### **2. WeeklyPlanningAdminView.vue - Planning Hebdomadaire**

**Fichier** : `src/views/admin/planning/WeeklyPlanningAdminView.vue`

**Fonctions modifiées** :

#### **A. Ordre des semaines dans le dropdown**

```javascript
const weekOptions = computed(() => {
  const weeks = []
  
  // Année académique : S38 → S52, puis S1 → S37
  for (let w = 38; w <= 52; w++) {
    weeks.push({ label: `Semaine ${w}`, value: w })
  }
  
  for (let w = 1; w <= 37; w++) {
    weeks.push({ label: `Semaine ${w}`, value: w })
  }
  
  return weeks
})
```

#### **B. Ordre des semestres**

```javascript
const viewModeOptions = [
  { label: 'Semaine unique', value: 'week' },
  { label: 'Semestre d\'Automne (S38-S7)', value: 'semester2' },  // ← Automne en 1er
  { label: 'Semestre de Printemps (S8-S37)', value: 'semester1' } // ← Printemps en 2e
]
```

#### **C. Tri des créneaux par ordre académique**

```javascript
const sortedTimeSlots = computed(() => {
  // Fonction pour obtenir l'ordre académique d'une semaine
  const getAcademicWeekOrder = (week) => {
    // Ordre académique : S38-S52 (0-14), S1-S7 (15-21), S8-S37 (22-51)
    if (week >= 38 && week <= 52) {
      return week - 38 // 0 à 14
    } else if (week >= 1 && week <= 7) {
      return week + 14 // 15 à 21
    } else if (week >= 8 && week <= 37) {
      return week + 14 // 22 à 51
    }
    return 999
  }
  
  return [...timeSlots.value].sort((a, b) => {
    const weekA = a.weekNumber || 0
    const weekB = b.weekNumber || 0
    
    const orderA = getAcademicWeekOrder(weekA)
    const orderB = getAcademicWeekOrder(weekB)
    
    if (orderA !== orderB) return orderA - orderB
    // ... puis tri par jour et heure
  })
})
```

**Résultat** :
- ✅ Le dropdown des semaines affiche : **S38, S39... S52, S1, S2... S37**
- ✅ Le dropdown des semestres affiche **Automne** puis **Printemps**
- ✅ Les créneaux sont triés dans l'ordre académique

---

### **3. planningService.js - Calcul des dates**

**Fichier** : `src/service/planningService.js`

**Fonction modifiée** : `getDateForWeekAndDay()`

```javascript
getDateForWeekAndDay(weekNumber, dayIndex) {
  // Déterminer l'année de référence selon la semaine
  let year
  if (weekNumber >= 38) {
    year = 2024 // S38-S52 → Automne 2024
  } else {
    year = 2025 // S1-S37 → 2025
  }
  
  // Calcul ISO 8601 correct
  const jan4 = new Date(year, 0, 4)
  const jan4Day = jan4.getDay() || 7
  const week1Monday = new Date(jan4)
  week1Monday.setDate(jan4.getDate() - jan4Day + 1)
  
  const targetMonday = new Date(week1Monday)
  targetMonday.setDate(week1Monday.getDate() + (weekNumber - 1) * 7)
  
  const targetDate = new Date(targetMonday)
  targetDate.setDate(targetMonday.getDate() + dayIndex)
  
  // Format DD.MM.YYYY
  const day = String(targetDate.getDate()).padStart(2, '0')
  const month = String(targetDate.getMonth() + 1).padStart(2, '0')
  const fullYear = targetDate.getFullYear()
  
  return `${day}.${month}.${fullYear}`
}
```

**Résultat** :
- ✅ Les dates sont calculées correctement selon l'année académique
- ✅ **S38-S52** utilisent **2024** comme année de référence
- ✅ **S1-S37** utilisent **2025** comme année de référence

---

## 📅 ANNÉE ACADÉMIQUE 2024-2025

### **Semestre d'Automne**
- **S38-S52** : Septembre - Décembre 2024 (15 semaines)
- **S1-S7** : Janvier - Février 2025 (7 semaines)
- **Total** : 22 semaines

### **Semestre de Printemps**
- **S8-S37** : Mars - Septembre 2025 (30 semaines)

### **Total année académique**
- **52 semaines** dans l'ordre : S38 → S37

---

## 🧪 EXEMPLES DE DATES

**Vérification** :
- **S38 (2024)** → Lundi 16.09.2024
- **S39 (2024)** → Lundi 23.09.2024
- **S52 (2024)** → Lundi 23.12.2024
- **S1 (2025)** → Lundi 30.12.2024
- **S7 (2025)** → Lundi 10.02.2025
- **S8 (2025)** → Lundi 17.02.2025
- **S37 (2025)** → Lundi 08.09.2025

---

## ✅ RÉSUMÉ DES CORRECTIONS

| Fichier | Modification | Statut |
|---------|-------------|--------|
| `PlanningAdminView.vue` | Ordre des colonnes du tableau (S38→S37) | ✅ |
| `WeeklyPlanningAdminView.vue` | Ordre dropdown semaines | ✅ |
| `WeeklyPlanningAdminView.vue` | Ordre dropdown semestres | ✅ |
| `WeeklyPlanningAdminView.vue` | Tri créneaux par ordre académique | ✅ |
| `planningService.js` | Calcul dates selon année académique | ✅ |

---

## 🎓 WORKFLOW UTILISATEUR

### **Planning Minibrick**
1. Ouvrir `/admin/planning/manage`
2. Le tableau affiche les semaines dans l'ordre : **S38... S52, S1... S7, S8... S37**
3. Les semaines d'automne (orange) sont à gauche
4. Les semaines de printemps (bleu) sont à droite

### **Planning Hebdomadaire**
1. Ouvrir `/admin/planning/weekly`
2. Le dropdown "Semaine" affiche : **S38, S39... S1, S2... S37**
3. Le dropdown "Mode" affiche : **Automne** puis **Printemps**
4. Les créneaux s'affichent dans l'ordre académique

### **Export Excel**
1. Exporter le planning
2. Les semaines sont dans l'ordre académique : **S38 → S37**
3. Les dates correspondent aux bonnes années (2024/2025)

---

## 🎉 TOUT EST MAINTENANT COHÉRENT !

**Ordre académique partout** :
- ✅ Tableau minibrick
- ✅ Dropdown semaines
- ✅ Dropdown semestres
- ✅ Tri des créneaux
- ✅ Calcul des dates
- ✅ Export Excel

**L'année académique 2024-2025 est maintenant correctement configurée ! 🎓**
