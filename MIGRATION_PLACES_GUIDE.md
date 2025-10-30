# 🚀 Migration Places vers Supabase - Guide Complet

## ✅ Ce qui a été migré

### Infrastructure créée
- ✅ **Schéma SQL** : `supabase_migrations/20251028_create_places.sql`
  - Table `places` avec 30+ colonnes
  - Spécialités (MSQ, SYSINT, AIGU, etc.)
  - Langues (FR, DE, IT, ENG)
  - PFP par année en JSONB
  - Remarques par année en JSONB
  - RLS configuré

- ✅ **Script d'import** : `backend/supabase/importPlaces.js`
  - Migration Firebase → Supabase
  - Conversion PFP-2026 vers JSONB
  - Normalisation booléens
  - Jointure avec institutions

- ✅ **Store Pinia** : `src/stores/placesStore.js`
  - CRUD complet
  - Filtres par institution, spécialités, langues
  - Recherche par nom/remarques
  - Gestion fichiers PDF

### Fichiers migrés
- ✅ **`InstitutionView.vue`** : Affichage fichiers PDF depuis Supabase

### Fichiers à migrer
- ⏳ **`PlaceManagementView.vue`** : Gestion admin places (DataTable complexe)
- ⏳ **`PlaceAssignmentView.vue`** : Attribution places étudiants
- ⏳ **Autres composants votations/PFP** (~20 fichiers)

---

## 🎯 Activation de la migration (3 étapes)

### 1️⃣ Créer la table Supabase
```bash
cd C:\Users\antoine.quarroz\Desktop\LabDev\pfpheds
supabase db push
```

Ou exécute `supabase_migrations/20251028_create_places.sql` dans le SQL Editor.

### 2️⃣ Importer les données
```bash
node backend/supabase/importPlaces.js
```

**Sortie attendue :**
```
✅ 85 places trouvées dans Firebase
✅ 42 institutions trouvées pour jointure
✅ Batch 1/1 importé (85 places)
✅ Nombre de places dans Supabase: 85
```

### 3️⃣ Tester
```bash
npm run dev
# Va sur /institution/:id
# Vérifie que les fichiers PDF s'affichent
```

---

## 📊 Structure de données

### Champs principaux
```javascript
{
  PlaceId: "-NzBxYZ...",
  NomPlace: "Cabinet de Physiothérapie Exemple",
  InstitutionId: "Institution123",
  fileURL: "https://firebase.storage.../place.pdf",
  
  // Spécialités (boolean)
  MSQ: true,
  SYSINT: false,
  AIGU: true,
  
  // Langues (boolean)
  FR: true,
  DE: false,
  
  // PFP par année (JSONB)
  PFP1A: { "2025": "2", "2026": "3" },
  PFP2: { "2025": "1", "2026": "2" },
  
  // Remarques par année (JSONB)
  Remarques: {
    "2025": "Disponible été uniquement",
    "2026": "Toute l'année"
  },
  
  // Praticiens (array)
  praticiensFormateurs: ["prat1", "prat2"],
  
  // Données dupliquées institution
  InstitutionName: "HES-SO Valais-Wallis",
  Canton: "VS",
  Lieu: "Sion"
}
```

---

## 🔧 Utilisation du store

### Charger toutes les places
```javascript
import { usePlacesStore } from '@/stores/placesStore'

const placesStore = usePlacesStore()
await placesStore.fetchPlaces()
console.log(placesStore.places) // Array de toutes les places
```

### Charger les places d'une institution
```javascript
const places = await placesStore.fetchPlacesByInstitution('Institution123')
// Retourne uniquement les places de cette institution
```

### Filtrer par spécialités
```javascript
const placesStore = usePlacesStore()
await placesStore.fetchPlaces()

// Filtrer localement
const placesAigu = placesStore.getPlacesBySpecialties(['AIGU', 'REA'])
```

### Créer une place
```javascript
await placesStore.createPlace({
  PlaceId: '-NewId123',
  NomPlace: 'Nouvelle place',
  InstitutionId: 'Inst123',
  MSQ: true,
  FR: true,
  PFP2: { "2025": "2", "2026": "3" }
})
```

### Mettre à jour une place
```javascript
await placesStore.updatePlace('-PlaceId123', {
  PFP2: { "2025": "3", "2026": "4" },
  Remarques: { "2025": "Modifié" }
})
```

---

## 🚨 Points d'attention

### Format JSONB pour PFP et Remarques
**Firebase (avant) :**
```javascript
{
  PFP2: "2",
  "PFP2-2026": "3"
}
```

**Supabase (après) :**
```javascript
{
  PFP2: { "2025": "2", "2026": "3" }
}
```

**Accès dans le code :**
```javascript
// Année sélectionnée
const year = '2025'
const nbPlaces = place.PFP2[year] || '0'
```

### Booléens normalisés
**Firebase** : `"true"` (string) ou `true` (boolean)  
**Supabase** : Toujours `true` ou `false` (boolean)

### Fichiers PDF
- Toujours sur **Firebase Storage** (pas migré)
- URL stockée dans `fileURL` (Supabase)
- Accès direct via l'URL

---

## 🧪 Tests recommandés

### Test 1 : Affichage fichiers PDF
1. Va sur `/institution/:id`
2. Clique sur l'onglet "Encadrement étudiant"
3. **Attendu** : Liste des fichiers PDF affichée
4. Clique sur un fichier
5. **Attendu** : PDF s'ouvre dans un nouvel onglet

### Test 2 : Gestion admin places
1. Connecte-toi en admin
2. Va sur `/management_places`
3. **Attendu** : DataTable avec toutes les places
4. Modifie un champ (ex: PFP2)
5. **Attendu** : Modification sauvegardée dans Supabase

### Test 3 : Filtres et recherche
1. Utilise la recherche par nom
2. **Attendu** : Filtrage temps réel
3. Filtre par spécialité (MSQ, AIGU)
4. **Attendu** : Places filtrées correctement

---

## 📝 Prochaines étapes

### Priorité 1 : Finir la migration
- [ ] Créer `PlaceManagementView_SUPABASE.vue` (gestion admin)
- [ ] Tester CRUD complet
- [ ] Remplacer le fichier original

### Priorité 2 : Autres composants
- [ ] `PlaceAssignmentView.vue` (attribution places)
- [ ] Composants votations qui utilisent Places
- [ ] Composants OffreDePlace*.vue

### Priorité 3 : Storage
- [ ] Migrer les PDFs vers Supabase Storage (optionnel)
- [ ] Mettre à jour les URLs

---

## 🎉 Avantages de la migration

- ✅ **Performance** : Requêtes SQL rapides vs Firebase listeners
- ✅ **Filtres** : SQL WHERE puissant vs filtrage client
- ✅ **Jointures** : Relations avec institutions automatiques
- ✅ **Format** : JSONB pour PFP/Remarques = plus flexible
- ✅ **Recherche** : Full-text search PostgreSQL (à venir)

---

## 📚 Ressources

- **Store** : `src/stores/placesStore.js`
- **Schéma** : `supabase_migrations/20251028_create_places.sql`
- **Import** : `backend/supabase/importPlaces.js`
- **Exemple** : `src/views/institutions/InstitutionView.vue` (lignes 214-235)

---

**Migration Places en cours ! Continue avec PlaceManagementView.vue 🚀**
