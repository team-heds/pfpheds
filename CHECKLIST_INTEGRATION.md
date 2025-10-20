# ✅ Checklist d'intégration Supabase Planning

## 🗄️ **Base de données**

### **Tables Supabase à créer**

- [ ] Exécuter `create_academic_years_cohorts.sql` dans Supabase SQL Editor
- [ ] Vérifier la création des tables :
  - [ ] `academic_years` (3 années créées par défaut)
  - [ ] `cohorts` (3 cohortes créées pour 2025-2026)
- [ ] Vérifier les index et RLS policies

### **Table modules existante**

- [ ] Vérifier que la table `modules` contient les colonnes :
  - [ ] `id`, `number`, `title`, `year`, `color`, `responsable`
  - [ ] `short_code`, `code`, `credits`, `description`
  - [ ] `created_at`, `updated_at`

---

## 🧪 **Tests fonctionnels**

### **1. Gestion des années académiques**

**URL :** `/admin/planning/years`

- [ ] Page accessible (connexion admin requise)
- [ ] Affichage de l'année active (2025-2026)
- [ ] Liste des années académiques visible
- [ ] **Créer une nouvelle année :**
  - [ ] Cliquer "Nouvelle Année Académique"
  - [ ] Saisir 2026
  - [ ] Vérifier création de "2026-2027"
- [ ] **Activer une année :**
  - [ ] Cliquer "Activer" sur une année
  - [ ] Vérifier que l'année devient active
  - [ ] Vérifier que les autres deviennent inactives
- [ ] **Générer les cohortes :**
  - [ ] Sélectionner une année
  - [ ] Cliquer "Générer Cohortes Automatiquement"
  - [ ] Saisir 2026
  - [ ] Vérifier création de B26, B25, B24
  - [ ] Vérifier les niveaux (1ère, 2ème, 3ème)

### **2. Planning Admin**

**URL :** `/admin/planning/manage`

- [ ] **Chargement initial :**
  - [ ] Année académique active affichée en haut
  - [ ] Dropdown "Année académique" contient les 3 cohortes
  - [ ] Format : "1ère année 2025-2026 / B25"
  - [ ] 31 modules chargés depuis Supabase
  - [ ] Section "Gestion des Codes de Cours" affiche tous les modules
  - [ ] Aucune erreur dans la console

- [ ] **Changement d'année :**
  - [ ] Changer de bac25 à bac24
  - [ ] Planning se recharge
  - [ ] Modules affichés correspondent à l'année

- [ ] **Bouton "Années Académiques" :**
  - [ ] Visible dans le header
  - [ ] Clic redirige vers `/admin/planning/years`

### **3. Planning View (public)**

**URL :** `/admin/planning`

- [ ] **Affichage :**
  - [ ] Dropdown années dynamique
  - [ ] 3 options basées sur les cohortes
  - [ ] Modules affichés dans le planning
  - [ ] Couleurs correctes

- [ ] **Navigation :**
  - [ ] Bouton "Admin" redirige vers `/admin/planning/manage`

### **4. Export Excel**

- [ ] **Depuis Planning Admin :**
  - [ ] Cliquer "Exporter Excel (cellules fusionnées)"
  - [ ] Fichier téléchargé : `Planning_BScN_2025-2026_YYYY-MM-DD.xlsx`
  - [ ] **Contenu du fichier :**
    - [ ] En-tête : "Bachelor of science in nursing" + "PROJET"
    - [ ] Année académique affichée : "2025-2026"
    - [ ] 3 sections : 1ère année / B25, 2ème année / B24, 3ème année / B23
    - [ ] Cellules avec couleurs des modules
    - [ ] Numéros de modules affichés
    - [ ] Fusion des cellules fonctionnelle

- [ ] **Test export cellules séparées :**
  - [ ] Cliquer "Exporter Excel (cellules séparées)"
  - [ ] Vérifier que chaque cellule contient le code du module

---

## 🔍 **Tests de validation**

### **Modules Supabase**

- [ ] Ouvrir la console du navigateur
- [ ] Filtrer par `[ModulesService]`
- [ ] Vérifier : "✅ Modules chargés: 31"
- [ ] Pas d'erreurs `column does not exist`

### **Années académiques**

- [ ] Console : `[PlanningAdmin] 📅 Année active: 2025-2026`
- [ ] Console : `[PlanningAdmin] 👥 Cohortes: 3`
- [ ] Pas d'erreurs de chargement

### **Codes de cours**

- [ ] Console : "✅ Codes de cours créés: 31"
- [ ] Tous les modules ont :
  - [ ] Un `id` (numéro du module)
  - [ ] Un `label` (titre)
  - [ ] Une `color` (couleur ou par défaut)
  - [ ] Un `year` (1, 2 ou 3)

---

## 🚨 **Problèmes potentiels**

### **Erreur : "column does not exist"**

**Cause :** Utilisation d'anciennes colonnes  
**Solution :** Vérifier que le code utilise `number`, `title`, `year` et non `numero_module`, `titre`, `annee`

### **Dropdown années vide**

**Cause :** Cohortes non chargées  
**Solution :**
1. Vérifier que la migration SQL a été exécutée
2. Vérifier dans Supabase Table Editor que `cohorts` contient des données
3. Console : vérifier `loadCohortsByYear` réussit

### **Modules non affichés**

**Cause :** Table `modules` vide ou colonnes incorrectes  
**Solution :**
1. Vérifier dans Supabase que la table `modules` a des données
2. Vérifier les colonnes : `number`, `title`, `year`

### **Export Excel sans couleurs**

**Cause :** `courseCodes` non passés correctement  
**Solution :** Vérifier que `exportData` contient bien `courseCodes`, `academicYear`, `cohorts`

---

## 📊 **Résultats attendus**

### **Console logs (normal)**

```
[PlanningAdmin] 📅 Année active: 2025-2026
[PlanningAdmin] 👥 Cohortes: 3
[PlanningAdmin] ⚠️ Aucun module Supabase trouvé!  (si table modules vide)
```

### **Pas d'erreurs attendues**

❌ `column modules.annee does not exist`  
❌ `column modules.numero_module does not exist`  
❌ `Cannot read properties of undefined (reading 'localeCompare')`

---

## 🎯 **Scénario de test complet**

### **Étape 1 : Configuration initiale**
1. Exécuter la migration SQL
2. Vérifier les données dans Supabase
3. Se connecter en tant qu'admin

### **Étape 2 : Test gestion années**
1. Aller sur `/admin/planning/years`
2. Créer l'année 2026-2027
3. Générer les cohortes (B26, B25, B24)
4. Activer l'année 2026-2027

### **Étape 3 : Vérifier mise à jour planning**
1. Aller sur `/admin/planning/manage`
2. Vérifier que le dropdown affiche les nouvelles cohortes
3. Format : "1ère année 2026-2027 / B26"

### **Étape 4 : Test export**
1. Exporter en Excel
2. Vérifier le nom de fichier : `Planning_BScN_2026-2027_...xlsx`
3. Ouvrir et vérifier le contenu

---

## ✅ **Critères de succès**

- [ ] Migration SQL exécutée sans erreur
- [ ] 3 années académiques créées
- [ ] 3 cohortes générées pour chaque année
- [ ] Dropdown années dynamique fonctionne
- [ ] 31 modules chargés depuis Supabase
- [ ] Export Excel avec année dynamique
- [ ] Couleurs des modules dans l'Excel
- [ ] Aucune erreur dans la console
- [ ] Navigation fluide entre les pages

---

## 📚 **Ressources**

- **Documentation :** `SYSTEME_ANNEES_ACADEMIQUES.md`
- **Migration SQL :** `supabase/migrations/create_academic_years_cohorts.sql`
- **Service :** `src/service/academicYearService.js`
- **Composable :** `src/composables/useAcademicYear.js`
- **Interface admin :** `src/views/admin/AcademicYearManagement.vue`

---

## 🆘 **Support**

En cas de problème :
1. Vérifier la console du navigateur
2. Vérifier les tables Supabase
3. Vérifier les logs du service
4. Consulter la documentation
