# 📅 Système de Planning Académique

## 📋 **Vue d'ensemble**

Le système de planning académique permet de gérer et visualiser la structure du programme Bachelor of Science in Nursing pour 3 années académiques (Bac 25, 24, 23). Il remplace le système Excel existant par une interface web interactive et modifiable.

---

## 🏗️ **Architecture**

### **1. Service (`academicPlanningService.js`)**

Service centralisé pour la gestion des données du planning dans Firebase Realtime Database.

#### **Structure Firebase :**
```
academic_planning/
├── years/
│   ├── bac25/
│   │   ├── label: "1ère année 2025-2026 / Bac 25"
│   │   ├── academicYear: "2025-2026"
│   │   └── semesters/
│   │       ├── autumn/
│   │       │   ├── startWeek: 38
│   │       │   ├── endWeek: 51
│   │       │   └── planning/
│   │       │       └── {day}_{week}/
│   │       │           ├── courseCode: "pfp1"
│   │       │           ├── displayLabel: "PFP1"
│   │       │           └── notes: "..."
│   │       └── spring/
│   │           └── ...
│   ├── bac24/
│   └── bac23/
└── course_codes/
    ├── pfp1/
    │   ├── label: "PFP1 - Pratique Formation Professionnelle 1"
    │   ├── color: "#3498db"
    │   └── year: 1
    ├── ia1a/
    └── ...
```

#### **Fonctions principales :**

##### **Gestion des années académiques**
- `getAllAcademicYears()` : Récupère toutes les années
- `getAcademicYear(yearId)` : Récupère une année spécifique
- `saveAcademicYear(yearId, yearData)` : Sauvegarde une année

##### **Gestion des cellules de planning**
- `getPlanningCells(yearId, semester)` : Récupère toutes les cellules d'un semestre
- `savePlanningCell(yearId, semester, day, week, cellData)` : Sauvegarde une cellule
- `deletePlanningCell(yearId, semester, day, week)` : Supprime une cellule

##### **Gestion des codes de cours**
- `getAllCourseCodes()` : Récupère tous les codes de cours (légende)
- `saveCourseCode(codeId, codeData)` : Sauvegarde un code de cours
- `deleteCourseCode(codeId)` : Supprime un code de cours

##### **Utilitaires**
- `generateWeekGrid(semester)` : Génère la grille de semaines (38-51 automne, 8-25 printemps)
- `initializeDefaultPlanning()` : Initialise la structure par défaut
- `exportPlanningToJSON(yearId)` : Exporte le planning en JSON
- `importPlanningFromJSON(jsonData, yearId)` : Importe le planning depuis JSON
- `clonePlanning(fromYearId, toYearId)` : Clone le planning d'une année vers une autre

---

### **2. Vue d'affichage (`PlanningView.vue`)**

Interface publique pour visualiser le planning académique.

#### **Fonctionnalités :**
- ✅ Sélection de l'année académique (Bac 25, 24, 23)
- ✅ Affichage du planning en grille interactive
- ✅ Semestre d'automne (semaines 38-51)
- ✅ Semestre de printemps (semaines 8-25)
- ✅ Légende des codes de cours avec couleurs
- ✅ Cellules colorées selon le code de cours
- ✅ Tooltips avec descriptions des cours
- ✅ Bouton pour accéder au mode admin
- ✅ Design responsive (mobile/tablet/desktop)

#### **Composants utilisés :**
- **Navbar** : Barre de navigation
- **Dropdown** (PrimeVue) : Sélection d'année
- **Button** (PrimeVue) : Navigation vers admin
- **ProgressSpinner** (PrimeVue) : Indicateur de chargement

#### **Routes :**
- `/admin/planning` : Vue d'affichage du planning
- **Permissions** : Admin, Editor

---

### **3. Vue d'administration (`PlanningAdminView.vue`)**

Interface d'administration pour modifier le planning académique.

#### **Fonctionnalités principales :**

##### **📊 Gestion du planning**
- ✅ Sélection année académique + semestre
- ✅ Grille interactive éditable
- ✅ Mode édition cellule unique
- ✅ Clic sur cellule pour éditer
- ✅ Dialog d'édition avec formulaire complet
- ✅ Sauvegarde/suppression de cellules

##### **🎨 Gestion des codes de cours**
- ✅ DataTable avec liste des codes
- ✅ Création de nouveaux codes
- ✅ Édition des codes existants
- ✅ Suppression de codes
- ✅ Choix de couleur (ColorPicker)
- ✅ Attribution à une année (1, 2, 3)

##### **🔧 Outils avancés**
- ✅ Initialisation planning par défaut
- ✅ Export du planning en JSON
- ✅ Bouton retour vers vue publique
- ✅ Toast notifications pour feedback

#### **Composants PrimeVue utilisés :**
- **Dropdown** : Sélection année/semestre
- **SelectButton** : Choix du mode édition
- **Dialog** : Modales d'édition
- **InputText** : Champs de saisie
- **Textarea** : Notes
- **ColorPicker** : Sélection couleur
- **DataTable** : Liste des codes de cours
- **Button** : Actions
- **Toast** : Notifications

#### **Routes :**
- `/admin/planning/manage` : Interface d'administration
- **Permissions** : Admin, Editor

---

## 📅 **Structure des semestres**

### **Semestre d'automne**
- **Semaines** : 38 à 51 (14 semaines)
- **Période** : Septembre à décembre

### **Semestre de printemps**
- **Semaines** : 8 à 25 (18 semaines)
- **Période** : Février à juin

### **Jours de la semaine**
- **Lundi** (lu)
- **Mardi** (ma)
- **Mercredi** (me)
- **Jeudi** (je)
- **Vendredi** (ve)

---

## 🎨 **Codes de cours par défaut**

Le système est initialisé avec les codes suivants :

| Code | Description | Couleur | Année |
|------|-------------|---------|-------|
| **pfp1** | PFP1 - Pratique Formation Professionnelle 1 | #3498db | 1 |
| **pfp2** | PFP2 - Pratique Formation Professionnelle 2 | #2ecc71 | 1 |
| **pfp3** | PFP3 - Pratique Formation Professionnelle 3 | #e74c3c | 2 |
| **pfp4** | PFP4 - Pratique Formation Professionnelle 4 | #f39c12 | 2 |
| **pfp5** | PFP5 - Pratique Formation Professionnelle 5 | #9b59b6 | 3 |
| **pfp6** | PFP6 - Pratique Formation Professionnelle 6 | #1abc9c | 3 |
| **ia1a** | IA1a - Accompagnement Soins Palliatifs | #e67e22 | 1 |
| **ia1b** | IA1b - Accompagnement Santé Mentale | #34495e | 1 |
| **ia2a** | IA2a - Accompagnement Personnes Âgées | #16a085 | 2 |
| **ia2b** | IA2b - Accompagnement Pédiatrie | #d35400 | 2 |
| **ia3a** | IA3a - Accompagnement Urgences | #c0392b | 3 |
| **ia3b** | IA3b - Accompagnement Complexité | #8e44ad | 3 |
| **vacances** | Vacances | #95a5a6 | 0 |
| **examens** | Examens | #e74c3c | 0 |
| **rattrapage** | Rattrapages | #f39c12 | 0 |

---

## 🔐 **Permissions et sécurité**

### **Rôles autorisés :**
- **Admin** : Accès complet (lecture + modification)
- **Editor** : Accès complet (lecture + modification)

### **Routes protégées :**
```javascript
{
  path: '/admin/planning',
  component: PlanningView,
  meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] }
},
{
  path: '/admin/planning/manage',
  component: PlanningAdminView,
  meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] }
}
```

---

## 🚀 **Utilisation**

### **Pour les administrateurs :**

#### **1. Initialiser le planning**
1. Aller sur `/admin/planning/manage`
2. Cliquer sur "Initialiser Planning"
3. La structure par défaut est créée dans Firebase

#### **2. Créer un code de cours**
1. Dans la section "Gestion des Codes de Cours"
2. Cliquer sur "Nouveau Code"
3. Remplir le formulaire :
   - **Code** : Identifiant unique (ex: `pfp1`)
   - **Description** : Nom du cours
   - **Couleur** : Choisir avec ColorPicker
   - **Année** : 1, 2 ou 3
4. Enregistrer

#### **3. Éditer une cellule du planning**
1. Sélectionner l'année et le semestre
2. Cliquer sur une cellule de la grille
3. Dans le dialog :
   - Choisir le code de cours
   - Ajouter un label d'affichage (optionnel)
   - Ajouter des notes (optionnelles)
4. Enregistrer ou Supprimer

#### **4. Exporter le planning**
1. Cliquer sur "Exporter"
2. Un fichier JSON est téléchargé : `planning_bac25_2025-01-13.json`
3. Contient toutes les données de l'année sélectionnée

### **Pour les utilisateurs (consultation) :**

1. Aller sur `/admin/planning`
2. Sélectionner l'année académique
3. Visualiser le planning avec légende
4. Survoler les cellules pour voir les descriptions

---

## 🎯 **Workflow typique**

```
1. Admin initialise le planning (une seule fois)
   ↓
2. Admin crée les codes de cours nécessaires
   ↓
3. Admin remplit le planning semaine par semaine
   ↓
4. Étudiants/Enseignants consultent le planning
   ↓
5. Admin exporte régulièrement pour sauvegarde
```

---

## 📱 **Responsive Design**

### **Desktop (> 992px)**
- Grille complète avec toutes les semaines
- Cellules 50x50px
- Navigation complète

### **Tablet (768px - 992px)**
- Grille adaptée
- Cellules 40x40px
- Menu déroulant pour sélection

### **Mobile (< 768px)**
- Grille scrollable horizontale
- Cellules 35x35px
- Interface simplifiée

---

## 🔧 **Maintenance et évolution**

### **Ajouter un nouveau code de cours**
Utiliser l'interface admin ou ajouter directement dans Firebase :
```javascript
await academicPlanningService.saveCourseCode('nouveau_code', {
  label: 'Description du cours',
  color: '#hexcolor',
  year: 1
})
```

### **Cloner une année**
```javascript
await academicPlanningService.clonePlanning('bac25', 'bac26')
```

### **Importer depuis JSON**
```javascript
const jsonData = '{"years": {...}, "course_codes": {...}}'
await academicPlanningService.importPlanningFromJSON(jsonData, 'bac25')
```

---

## 🐛 **Troubleshooting**

### **Le planning ne s'affiche pas**
- Vérifier la connexion Firebase
- Vérifier que l'année existe dans Firebase
- Consulter la console navigateur pour les erreurs

### **Les cellules n'ont pas de couleur**
- Vérifier que le code de cours existe
- Vérifier que la couleur est définie
- Vérifier le format hexadécimal (#RRGGBB)

### **Impossible d'éditer une cellule**
- Vérifier les permissions (admin/editor)
- Vérifier que l'utilisateur est authentifié
- Consulter les logs de la console

---

## 📚 **Ressources**

### **Fichiers du système :**
- `src/service/academicPlanningService.js` : Service Firebase
- `src/views/admin/planning/PlanningView.vue` : Vue publique
- `src/views/admin/planning/PlanningAdminView.vue` : Vue admin
- `src/router.js` : Configuration des routes

### **Documentation PrimeVue :**
- [DataTable](https://primevue.org/datatable/)
- [ColorPicker](https://primevue.org/colorpicker/)
- [Dialog](https://primevue.org/dialog/)
- [Toast](https://primevue.org/toast/)

### **Documentation Firebase :**
- [Realtime Database](https://firebase.google.com/docs/database)
- [Structure des données](https://firebase.google.com/docs/database/web/structure-data)

---

## ✅ **Checklist de déploiement**

- [x] Service academicPlanningService créé
- [x] Vue PlanningView créée
- [x] Vue PlanningAdminView créée
- [x] Routes ajoutées dans router.js
- [x] Intégration dans AdminSidebar
- [x] Documentation README.md
- [ ] Initialiser le planning dans Firebase
- [ ] Tester toutes les fonctionnalités
- [ ] Former les utilisateurs

---

## 📞 **Support**

Pour toute question ou problème :
1. Consulter cette documentation
2. Vérifier les logs de la console
3. Contacter l'équipe de développement

---

**Version** : 1.0.0  
**Dernière mise à jour** : 13 janvier 2025  
**Auteur** : Système d'administration HEdS
