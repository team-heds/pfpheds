# 📊 Migration Institutions vers Supabase - État d'avancement

## ✅ Fichiers créés et migrés

### 1. **Migration SQL Supabase**
- ✅ `supabase_migrations/20251028_create_institutions.sql`
  - Création de la table `institutions` avec tous les champs Firebase
  - Colonnes : `InstitutionId` (text), `Name`, `Category`, `Address`, `Locality`, `Canton`, `NPA`, `Language`, `Description`, `URL`, `CyberleanURL`, `MailChef`, `NomChef`, `PhoneChef`, `IdResponsablePhysio`, dates, coordonnées, images
  - Trigger `UpdatedAt` automatique
  - Politiques RLS configurées (lecture publique, écriture service_role)

### 2. **Script d'import Firebase → Supabase**
- ✅ `backend/supabase/importInstitutions.js`
  - Lecture du fichier `backend/firebasedata/pfpheds-default-rtdb-export.json`
  - Conversion des dates au format ISO (`YYYY-MM-DD`)
  - Normalisation des images en tableau JSON
  - Cast des coordonnées en `numeric`
  - Upsert via PostgREST avec `onConflict: 'InstitutionId'`

### 3. **Store Supabase (déjà existant)**
- ✅ `src/stores/institutionsStore.js`
  - Déjà configuré pour Supabase REST API
  - Actions disponibles : `fetchInstitutions()`, `fetchInstitutionById()`, `createInstitution()`, `updateInstitution()`, `deleteInstitution()`
  - Utilise `VITE_SUPABASE_REST_URL` et `VITE_SUPABASE_KEY`

### 4. **Vues migrées (versions Supabase créées)**

#### ✅ `InstitutionView_SUPABASE.vue`
- **Avant** : Lecture directe Firebase (`firebaseRef`, `onValue`)
- **Après** : Utilise `institutionsStore.fetchInstitutionById()`
- **Conservé Firebase** : Listeners pour `Places` (fichiers PDF) et rôles utilisateurs (BA22)
- **Améliorations** :
  - Script setup avec Composition API
  - Computed `primaryImage` pour gérer les images (array/string)
  - Nettoyage propre des listeners Firebase (`off()`)
  - Gestion carte Leaflet avec destruction propre
  - Watch sur `institutionId` pour recharger

#### ✅ `InstitutionListView_SUPABASE.vue`
- **Avant** : `onValue(ref(db, 'Institutions/'))` Firebase
- **Après** : `institutionsStore.fetchInstitutions()`
- **Script setup** : Conversion complète en Composition API
- **Fonctionnalités** :
  - Liste paginée (10/page) depuis Supabase
  - Recherche temps réel (filtre local)
  - Suppression via `institutionsStore.deleteInstitution()`
  - Toast notifications (PrimeVue)
  - Navigation vers détails/formulaires
  - Formatage dates français

#### ✅ `GlobalSearch.vue`
- **Avant** : `get(firebaseRef(db, 'institutions'))` Firebase
- **Après** : `institutionsStore.fetchInstitutions()` Supabase
- **Fonctionnalités** :
  - Recherche multi-critères (nom, ville, canton, adresse)
  - Score de pertinence amélioré avec adresse
  - Recherche en parallèle : Users (Firebase), Institutions (Supabase), Modules (Firebase)
  - Limite 10 résultats institutions triés par pertinence
  - Liens directs vers `/institution/:id`

## 📂 Fichiers à migrer (prochaines étapes)

### 🔄 Priorité 1 - Formulaires CRUD
- ⏳ `src/components/admin/forms/InstitutionForm.vue`
  - Actuellement : Création via `institutionsStore.createInstitution()` (✅ déjà Supabase)
  - Upload image : Firebase Storage (à conserver temporairement)
  
- ⏳ `src/components/admin/forms/InstitutionFormModif.vue`
  - Actuellement : Récupération depuis `institutionsStore.fetchInstitutions()` (✅ déjà Supabase)
  - Update via `institutionsStore.updateInstitution()` (✅ déjà Supabase)
  - Upload image : Firebase Storage (à conserver)

### 🔄 Priorité 2 - Admin
- ⏳ `src/views/admin/institutions/InstitutionDetailsView.vue`
  - Actuellement : Lecture directe Firebase
  - Migrer vers : `institutionsStore.fetchInstitutionById()`

- ⏳ `src/views/admin/institutions/InstitutionListView.vue`
  - Actuellement : Firebase
  - Migrer vers : `institutionsStore.fetchInstitutions()` + suppression

### 🔄 Priorité 3 - Autres pages
- ✅ `src/views/institutions/Institution.vue` (page listing public)
  - Utilise `institutionsStore` (✅ déjà Supabase)
  - ✅ Testé et validé

- ✅ `src/components/common/utils/GlobalSearch.vue`
  - ✅ Migré vers Supabase pour les institutions
  - Recherche hybride : Institutions (Supabase) + Users/Modules (Firebase)

## 🔧 Actions nécessaires avant déploiement

### 1. **Créer la table Supabase**
```bash
cd C:\Users\antoine.quarroz\Desktop\LabDev\pfpheds
supabase db push
```

### 2. **Importer les données**
```bash
# Vérifier que VITE_SUPABASE_URL et VITE_SUPABASE_KEY sont définis dans .env
node backend/supabase/importInstitutions.js
```

### 3. **Vérifier les données**
- Console Supabase : `select * from institutions limit 5`
- Comparer le nombre total avec Firebase

### 4. **Remplacer les fichiers originaux**
```bash
# Une fois validé, remplacer les fichiers :
cp src/views/institutions/InstitutionView_SUPABASE.vue src/views/institutions/InstitutionView.vue
cp src/views/institutions/InstitutionListView_SUPABASE.vue src/views/institutions/InstitutionListView.vue
```

### 5. **Tester l'application**
```bash
npm run dev
# Tester :
# - /institutions (liste publique)
# - /institution/:id (détails)
# - /institution_list (admin)
# - Création/modification/suppression
```

## 📝 Notes importantes

### Données conservées dans Firebase
- **Places** : Fichiers PDF liés aux institutions (table `Places`)
- **Users/Roles** : Rôles utilisateurs (ex: BA22)
- **Images** : Upload via Firebase Storage (pour l'instant)

### Variables d'environnement requises
```env
# Supabase
VITE_SUPABASE_REST_URL=https://api2.hedsvs.ch/rest/v1
VITE_SUPABASE_KEY=eyJhbGci...

# Firebase (pour Places et Storage)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_DATABASE_URL=...
VITE_FIREBASE_STORAGE_BUCKET=...
```

### Compatibilité
- ✅ Les formulaires `InstitutionForm.vue` et `InstitutionFormModif.vue` utilisent déjà le store Supabase
- ✅ Le store normalise automatiquement `ImageURL` (array vs string)
- ✅ Les dates sont au format `YYYY-MM-DD` dans Supabase
- ✅ Les coordonnées sont `numeric` dans Supabase

## 🚀 Prochaines migrations recommandées

1. **Posts** : Migrer la table `posts` pour `GlobalSearch.vue`
2. **Places** : Migrer la table `Places` (fichiers PDF)
3. **Users** : Migrer progressivement les données utilisateurs
4. **Storage** : Envisager Supabase Storage pour les images

## 📚 Documentation de référence
- `MIGRATION_INSTITUTIONS_SUPABASE.md` : Guide de migration détaillé
- `src/stores/institutionsStore.js` : API Supabase disponible
- `supabase_migrations/20251028_create_institutions.sql` : Schéma complet
