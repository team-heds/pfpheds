# 📅 Système de Gestion des Années Académiques et Cohortes

## 🎯 **Vue d'ensemble**

Système dynamique permettant de gérer les années académiques (ex: 2025-2026, 2026-2027) et les cohortes d'étudiants (ex: B25, B26, B27) avec génération automatique des plannings.

---

## 📊 **Architecture**

### **Base de données Supabase**

#### **Table `academic_years`**
Gère les années académiques.

```sql
CREATE TABLE academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,        -- "2025-2026"
  start_date DATE NOT NULL,                -- 2025-09-01
  end_date DATE NOT NULL,                  -- 2026-08-31
  is_active BOOLEAN DEFAULT false,         -- Une seule année active
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **Table `cohorts`**
Gère les cohortes d'étudiants.

```sql
CREATE TABLE cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) NOT NULL UNIQUE,        -- "B25", "B26"
  name VARCHAR(100),                       -- "Bachelor 2025"
  year_level INTEGER NOT NULL,             -- 1, 2 ou 3
  academic_year_id UUID REFERENCES academic_years(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Logique de mapping**

Pour l'année 2025-2026 :
- **B25** → 1ère année (`bac25`)
- **B24** → 2ème année (`bac24`)
- **B23** → 3ème année (`bac23`)

Pour l'année 2026-2027 :
- **B26** → 1ère année (`bac26`)
- **B25** → 2ème année (`bac25`)
- **B24** → 3ème année (`bac24`)

---

## 🛠️ **Services**

### **`academicYearService.js`**

Service principal pour gérer les années et cohortes.

**Fonctions principales :**

```javascript
// Récupérer toutes les années
await academicYearService.getAllAcademicYears()

// Récupérer l'année active
await academicYearService.getActiveAcademicYear()

// Activer une année (désactive les autres automatiquement)
await academicYearService.setActiveAcademicYear(id)

// Récupérer les cohortes d'une année
await academicYearService.getCohortsByAcademicYear(academicYearId)

// Générer automatiquement les cohortes
await academicYearService.generateCohortsForYear(academicYearId, startYear)
// Ex: startYear=2026 génère B26 (1ère), B25 (2ème), B24 (3ème)

// Obtenir le mapping cohorte → année d'étude
await academicYearService.getCohortYearLevelMapping()
// Retourne: { 'bac25': 1, 'bac24': 2, 'bac23': 3 }
```

---

## 🧩 **Composables Vue**

### **`useAcademicYear.js`**

Composable réutilisable pour manipuler les années et cohortes dans les composants Vue.

**Utilisation :**

```javascript
import { useAcademicYear } from '@/composables/useAcademicYear'

const {
  // State
  academicYears,         // Toutes les années
  activeAcademicYear,    // Année active
  sortedCohorts,         // Cohortes triées par niveau
  loading,
  
  // Actions
  loadActiveAcademicYear,
  loadCohortsByYear,
  setActiveYear,
  generateCohorts
} = useAcademicYear()

// Charger l'année active
await loadActiveAcademicYear()

// Charger les cohortes pour l'année active
if (activeAcademicYear.value) {
  await loadCohortsByYear(activeAcademicYear.value.id)
}
```

---

## 📱 **Interface d'administration**

### **Page : `AcademicYearManagement.vue`**

**Route :** `/admin/planning/years`  
**Accès :** Admin uniquement

**Fonctionnalités :**

1. **Affichage de l'année active**
   - Nom de l'année (ex: "2025-2026")
   - Dates de début et fin
   - Badge "ACTIVE"

2. **Gestion des années académiques**
   - Liste de toutes les années
   - Créer une nouvelle année (saisir l'année de départ, ex: 2026 → génère "2026-2027")
   - Activer/désactiver une année

3. **Gestion des cohortes**
   - Afficher les cohortes d'une année sélectionnée
   - Génération automatique (saisir l'année de 1ère année, génère les 3 cohortes)
   - Affichage : Code, Nom, Année d'étude

**Exemple de workflow :**

```
1. Cliquer "Nouvelle Année Académique"
2. Saisir 2026 → Crée "2026-2027"
3. Cliquer "Activer" pour rendre cette année active
4. Cliquer "Cohortes" → "Générer Cohortes Automatiquement"
5. Saisir 2026 → Génère B26 (1ère), B25 (2ème), B24 (3ème)
```

---

## 🔄 **Intégration dans le Planning**

### **Modifications apportées**

#### **`PlanningAdminView.vue` et `PlanningView.vue`**

**Avant (statique) :**
```javascript
const yearOptions = ref([
  { label: '1ère année 2025-2026 / Bac 25', value: 'bac25' },
  { label: '2ème année 2025-2026 / Bac 24', value: 'bac24' },
  { label: '3ème année 2025-2026 / Bac 23', value: 'bac23' }
])
```

**Après (dynamique) :**
```javascript
const { activeAcademicYear, sortedCohorts, loadActiveAcademicYear, loadCohortsByYear } = useAcademicYear()

const yearOptions = computed(() => {
  if (!activeAcademicYear.value || sortedCohorts.value.length === 0) {
    // Fallback vers valeurs statiques
    return [...]
  }
  
  return sortedCohorts.value.map(cohort => {
    const yearLevel = cohort.year_level === 1 ? '1ère' : cohort.year_level === 2 ? '2ème' : '3ème'
    return {
      label: `${yearLevel} année ${activeAcademicYear.value.name} / ${cohort.code}`,
      value: 'bac' + cohort.code.substring(1) // B25 -> bac25
    }
  })
})

// Au montage
onMounted(async () => {
  await loadActiveAcademicYear()
  if (activeAcademicYear.value) {
    await loadCohortsByYear(activeAcademicYear.value.id)
  }
  await loadPlanning()
})
```

---

## 📝 **Migration SQL**

### **Fichier : `create_academic_years_cohorts.sql`**

**À exécuter dans Supabase SQL Editor :**

1. Aller dans **Supabase Dashboard** → **SQL Editor**
2. Copier le contenu du fichier `supabase/migrations/create_academic_years_cohorts.sql`
3. Exécuter la requête
4. Vérifier les tables créées dans **Table Editor**

**Données initiales créées :**

- **Années :** 2025-2026 (active), 2026-2027, 2027-2028
- **Cohortes pour 2025-2026 :** B25 (1ère), B24 (2ème), B23 (3ème)

---

## 🔐 **Sécurité (RLS)**

Les Row Level Security policies permettent :
- **Lecture publique** : Tous peuvent lire les années et cohortes
- **Modification** : Uniquement les admins (à configurer selon votre système)

**À adapter selon vos besoins :**

```sql
CREATE POLICY "Allow admin full access on academic_years"
  ON academic_years
  USING (auth.jwt() ->> 'role' = 'admin');
```

---

## 🚀 **Utilisation du système**

### **Scénario : Passage à l'année 2026-2027**

1. **Admin accède à** `/admin/planning/years`
2. **Crée l'année 2026-2027** (si pas déjà créée)
3. **Génère les cohortes :**
   - Saisir 2026
   - Génère : B26 (1ère), B25 (2ème), B24 (3ème)
4. **Active l'année 2026-2027**
5. **Les plannings se mettent à jour automatiquement** avec les nouvelles cohortes

### **Export Excel dynamique**

L'export Excel utilise automatiquement :
- Le nom de l'année active (ex: "2026-2027")
- Les cohortes définies (ex: B26, B25, B24)
- Les modules associés à chaque cohorte

---

## ✅ **Avantages du système**

### **Flexibilité**
- ✅ Support de toutes les années futures
- ✅ Cohortes configurables
- ✅ Migration simple d'une année à l'autre

### **Automatisation**
- ✅ Génération automatique des cohortes
- ✅ Désactivation automatique des années précédentes
- ✅ Mise à jour automatique des dropdowns

### **Traçabilité**
- ✅ Historique complet des années
- ✅ Timestamps de création/modification
- ✅ Audit trail

### **Scalabilité**
- ✅ Supporte un nombre illimité d'années
- ✅ Extensible à d'autres types de programmes
- ✅ API simple et réutilisable

---

## 📚 **Fichiers créés/modifiés**

### **Nouveau**
- `supabase/migrations/create_academic_years_cohorts.sql`
- `src/service/academicYearService.js`
- `src/composables/useAcademicYear.js`
- `src/views/admin/AcademicYearManagement.vue`

### **Modifié**
- `src/router.js` (ajout route `/admin/planning/years`)
- `src/views/admin/planning/PlanningAdminView.vue` (intégration années dynamiques)
- `src/views/admin/planning/PlanningView.vue` (intégration années dynamiques)

---

## 🎓 **Exemple de données**

### **Année 2025-2026 (Active)**

| Cohorte | Nom | Niveau | Code Planning |
|---------|-----|--------|---------------|
| B25 | Bachelor 2025 - 1ère année | 1 | bac25 |
| B24 | Bachelor 2024 - 2ème année | 2 | bac24 |
| B23 | Bachelor 2023 - 3ème année | 3 | bac23 |

### **Année 2026-2027 (Future)**

| Cohorte | Nom | Niveau | Code Planning |
|---------|-----|--------|---------------|
| B26 | Bachelor 2026 - 1ère année | 1 | bac26 |
| B25 | Bachelor 2025 - 2ème année | 2 | bac25 |
| B24 | Bachelor 2024 - 3ème année | 3 | bac24 |

---

## 🔮 **Évolutions futures possibles**

- Import/Export des configurations d'années
- Duplication automatique du planning d'une année à l'autre
- Gestion des périodes de vacances par année
- Statistiques par cohorte
- Notifications automatiques lors du changement d'année active
