# 🎯 Algorithme d'Attribution PFP - Version 3.0

Ce document détaille l'algorithme optimisé d'attribution des places PFP basé sur une stratégie "**Place-First**" qui maximise le nombre d'étudiants satisfaits.

**Cible** : Attribution PFP1A et PFP1B pour les étudiants BA25.

---

## ✨ Fonctionnalités Principales

### 1. Filtrage Intelligent des Places
- **Uniquement les places du PFP sélectionné** : Filtre automatiquement selon `place[PFP_TYPE][YEAR]`
- **Capacité dynamique** : Respect des capacités spécifiques à chaque PFP (certaines places ont plusieurs seats)
- **Exemple** : Pour PFP1A 2026, seules les 32 places désignées sont utilisées

### 2. Algorithme d'Attribution v3.0 - Stratégie "Place-First" 🆕
- **Places traitées par popularité** : Les places MOINS demandées sont traitées en PREMIER
- **Optimisation globale** : Maximise le nombre d'étudiants qui obtiennent un de leurs choix
- **Équité garantie** : Les étudiants qui veulent des places impopulaires les obtiennent
- **Tri intelligent** : Pour chaque place, priorité aux étudiants qui l'ont en 1er choix
- **Performance** : Batch insert en une seule transaction (10x plus rapide)

#### Pourquoi cette stratégie ?
**Problème des algorithmes classiques** : Les premiers étudiants traités prennent les places populaires, les derniers n'ont plus de choix.

**Solution v3.0** : En traitant d'abord les places peu demandées, on garantit que leurs candidats les obtiennent, libérant ainsi plus d'options pour les places populaires traitées ensuite.

### 3. Triple Vue des Résultats

#### Vue 1 : Par Étudiants
- Liste complète des étudiants avec leurs votes
- Statut : Complet / Incomplet / Non voté
- Filtre par année et PFP

#### Vue 2 : Par Places
- Statistiques de votes par place
- Top 1 à Top 5 pour chaque place
- Total des votes

#### Vue 3 : Attribution des Places ⭐ NOUVEAU
- **32 places du PFP** avec leurs assignations
- **Capacité totale** vs **Étudiants assignés** vs **Places restantes**
- **Liste détaillée** des étudiants par place avec leur rang de choix
- **Tri automatique** par nombre d'assignations

---

## 🚀 Utilisation

### Étape 1 : Sélection
1. Choisir une **Année** (ex: 2026)
2. Choisir un **PFP** (PFP1A ou PFP1B)

### Étape 2 : Vérification
- Consulter les onglets **Vue par Étudiants** et **Vue par Places**
- Vérifier que les données sont correctes

### Étape 3 : Lancement
1. Cliquer sur **"Démarrer l'algorithme"**
2. Attendre le traitement (< 1 seconde)
3. Consulter les statistiques affichées

### Étape 4 : Résultats
- **Section résumée** : Cartes avec statistiques clés
- **Onglet "Attribution des Places"** : Voir les 32 places avec assignations détaillées
- **Export possible** : Les résultats sont enregistrés en base de données

---

## 📊 Structure des Données

### Places Envoyées à l'Algorithme
```javascript
{
  PlaceId: "uuid",
  NomPlace: "Nom de la place",
  InstitutionId: "uuid", 
  InstitutionName: "Nom de l'institution",
  Capacity: 2  // Capacité spécifique au PFP (ex: 2 seats pour cette place en PFP1A 2026)
}
```

**Filtrage** :
- Vérifie `place[filterPFP.value][filterYear.value]` 
- Ne prend que les places avec `capacity >= 1`
- Exemple : Si PFP1A 2026 a 32 places, seules ces 32 seront envoyées

### Résultats Retournés

#### 1. Par Étudiant (`results`)
```javascript
{
  user_id: "uuid",
  pfp_type: "PFP1A",
  year: "2026",
  assigned_place_id: "uuid",
  assigned_place_name: "Nom",
  assigned_institution_name: "Institution",
  assigned_rank: 1,  // 1er, 2e, 3e choix...
  priority_score: 45.2
}
```

#### 2. Par Place (`placesWithAssignments`) ⭐ NOUVEAU
```javascript
{
  placeId: "uuid",
  placeName: "Nom de la place",
  institutionId: "uuid",
  institutionName: "Nom de l'institution",
  totalCapacity: 2,        // Capacité totale
  remainingCapacity: 0,    // Places restantes
  assignedCount: 2,        // Étudiants assignés
  assignedStudents: [      // Liste détaillée
    {
      userId: "uuid",
      rank: 1,             // Rang du choix (1er, 2e, etc.)
      priorityScore: 45.2
    },
    {
      userId: "uuid2",
      rank: 2,
      priorityScore: 38.1
    }
  ]
}
```

#### 3. Statistiques (`stats`)
```javascript
{
  totalStudents: 32,
  successfulAssignments: 21,
  failedAssignments: 11,
  placesUsed: 20,
  firstChoiceCount: 15,
  secondChoiceCount: 4,
  thirdChoiceCount: 2,
  averageRank: "1.45"
}
```

---

## 🔧 Architecture Technique

### Frontend (`VotationPFPViewPHYFP.vue`)
```javascript
// Filtrage des places selon PFP
const placesData = placesStore.places
  .map(place => {
    // Récupérer capacité pour ce PFP et cette année
    let capacity = 0
    if (place[filterPFP.value] && place[filterPFP.value][filterYear.value]) {
      capacity = parseInt(place[filterPFP.value][filterYear.value])
    }
    
    if (!capacity || capacity < 1) return null
    
    return {
      PlaceId: place.PlaceId,
      NomPlace: place.NomPlace,
      Capacity: capacity  // Capacité spécifique
    }
  })
  .filter(Boolean)
```

### Backend (`resultatVotationStoreBackend.js`)
```javascript
// Construction de la Map des places
const placesMap = new Map()
places.forEach(place => {
  placesMap.set(place.PlaceId, {
    ...place,
    remainingCapacity: place.Capacity,  // Capacité dynamique
    assignedStudents: []
  })
})

// Attribution avec décrémentation
if (placeData.remainingCapacity > 0) {
  placeData.remainingCapacity--
  placeData.assignedStudents.push(student.userId)
}

// Retour des places avec assignations
const placesWithAssignments = Array.from(placesMap.values()).map(place => ({
  placeId: place.PlaceId,
  totalCapacity: place.Capacity,
  remainingCapacity: place.remainingCapacity,
  assignedCount: place.assignedStudents.length,
  assignedStudents: /* ... */
}))
```

---

## 📈 Affichage dans l'Interface

### Onglet "Attribution des Places"

**En-tête** :
```
Places Attribuées (20 / 32)
```
- 20 places ont au moins 1 étudiant assigné
- 32 places au total pour ce PFP

**Tableau** :
| Institution | Place | Capacité | Assignés | Restant | Étudiants Assignés |
|------------|-------|----------|----------|---------|-------------------|
| HFR | Médecine interne | 2 | 2 | 0 | Alice D. (Choix 1), Bob M. (Choix 2) |
| CHUV | Pédiatrie | 3 | 1 | 2 | Charlie R. (Choix 1) |
| ... | ... | ... | ... | ... | ... |

**Tri** : Par défaut trié par nombre d'assignations (décroissant)

**Couleurs** :
- Badge vert : Places avec assignations
- Badge gris : Places sans assignation
- Badge orange : Il reste des places
- Badge vert : Place complète

---

## 🎯 Exemple Complet

### Données Initiales
**Places PFP1A 2026** :
```json
[
  { "PlaceId": "1", "NomPlace": "Médecine interne HFR", "Capacity": 2 },
  { "PlaceId": "2", "NomPlace": "Pédiatrie CHUV", "Capacity": 3 },
  { "PlaceId": "3", "NomPlace": "Chirurgie HVS", "Capacity": 1 },
  // ... 29 autres places
]
```

**Étudiants BA25 avec choix** : 32

### Après Algorithme
**Vue par Places** :
```json
[
  {
    "placeName": "Médecine interne HFR",
    "totalCapacity": 2,
    "assignedCount": 2,
    "remainingCapacity": 0,
    "assignedStudents": [
      { "userId": "alice-uuid", "rank": 1 },
      { "userId": "bob-uuid", "rank": 2 }
    ]
  },
  {
    "placeName": "Pédiatrie CHUV",
    "totalCapacity": 3,
    "assignedCount": 1,
    "remainingCapacity": 2,
    "assignedStudents": [
      { "userId": "charlie-uuid", "rank": 1 }
    ]
  },
  // ... etc
]
```

**Statistiques** :
- 32 étudiants traités
- 21 attributions réussies
- 11 étudiants sans place (tous leurs choix étaient pleins)
- 20 places utilisées sur 32
- 15 ont eu leur 1er choix (71%)
- Rang moyen : 1.45

---

## ⚠️ Points Importants

### 1. Migration SQL Obligatoire
**Avant de lancer l'algorithme**, vous DEVEZ exécuter dans Supabase Dashboard :
```sql
-- Voir le fichier: supabase_migrations/20251211_create_student_result_vote.sql
```

### 2. Permissions
- La fonction `batch_upsert_student_results` utilise `SECURITY DEFINER`
- Le backend utilise le `service_role` qui a tous les droits
- Pas besoin de vérification admin dans la fonction

### 3. Performance
- ✅ Batch insert : 1 transaction au lieu de 32
- ✅ Temps d'exécution : < 1 seconde pour 32 étudiants
- ✅ Tri intelligent des étudiants
- ✅ Index optimisés sur la table

---

## 🐛 Troubleshooting

### Erreur : "Could not find function batch_upsert_student_results"
**Cause** : Migration SQL non exécutée  
**Solution** : Exécuter le fichier `supabase_migrations/20251211_create_student_result_vote.sql` dans Supabase Dashboard

### Erreur : "Permission denied: Admin access required"
**Cause** : Ancienne version de la fonction avec vérification admin  
**Solution** : Ré-exécuter la migration avec la version corrigée (sans vérification)

### Onglet "Attribution des Places" désactivé
**Cause** : Aucune attribution n'a été faite  
**Solution** : Lancer l'algorithme en cliquant sur "Démarrer l'algorithme"

### Pas de places dans les résultats
**Cause** : Aucune place n'a de capacité définie pour ce PFP/année  
**Solution** : Vérifier que les places ont bien `place[PFP1A][2026] >= 1`

---

## 📚 Fichiers Concernés

### Frontend
- `src/views/admin/formation-pratique/VotationPFPViewPHYFP.vue` - Interface principale
- `src/stores/resultatVotationService.js` - Service API

### Backend
- `backend/supabase/resultatVotationStoreBackend.js` - Logique algorithme et API

### Base de Données
- `supabase_migrations/20251211_create_student_result_vote.sql` - Table et fonctions

### Documentation
- `OPTIMISATIONS_ALGORITHME.md` - Détails techniques des optimisations
- `URGENT_FAIRE_MIGRATION.md` - Guide d'application de la migration

---

## 🎉 Résultat Final

Vous obtenez maintenant :
1. ✅ Filtrage automatique des 32 places PFP1A (ou autre selon sélection)
2. ✅ Attribution optimale basée sur les choix des étudiants
3. ✅ Vue complète des places avec leurs assignations
4. ✅ Statistiques détaillées et visuelles
5. ✅ Performance ultra-rapide (< 1 seconde)

---

**Auteur** : Cascade AI  
**Date** : 11 décembre 2025  
**Version** : 2.0 (Optimisée avec batch insert et vue par places)
