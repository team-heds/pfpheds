# Algorithme d'Attribution des Places de Stages

## Vue d'ensemble

Ce système permet d'attribuer automatiquement les places de stages aux étudiants BA25 pour les PFP1A et PFP1B, en fonction de leurs choix de votation.

## Architecture

### 1. Base de données (`student_result_vote`)

**Fichier**: `supabase_migrations/20251211_create_student_result_vote.sql`

Table stockant les résultats de l'algorithme d'attribution:
- `user_id`: ID de l'étudiant
- `pfp_type`: Type de PFP (PFP1A, PFP1B)
- `year`: Année de l'attribution
- `assigned_place_id`: ID de la place attribuée
- `assigned_place_name`: Nom de la place
- `assigned_institution_name`: Nom de l'institution
- `assigned_rank`: Rang du choix attribué (1 = premier choix, 2 = deuxième, etc.)
- `algorithm_run_id`: ID unique de l'exécution de l'algorithme
- `priority_score`: Score de priorité calculé
- `status`: Statut de l'attribution (assigned, pending, rejected, confirmed)

#### Row Level Security (RLS)

- **Étudiants**: Peuvent voir uniquement leurs propres résultats
- **Administrateurs**: Ont accès complet à tous les résultats

#### Fonctions RPC disponibles

1. **`upsert_student_result`**: Enregistre ou met à jour un résultat (admin uniquement)
2. **`get_student_result`**: Récupère le résultat d'un étudiant
3. **`get_algorithm_results`**: Récupère tous les résultats d'une attribution

### 2. Backend API

**Fichier**: `backend/supabase/resultatVotationStoreBackend.js`

Routes disponibles:

#### POST `/api/resultat-votation/run-algorithm`
Lance l'algorithme d'attribution des places.

**Body**:
```json
{
  "pfpType": "PFP1A",
  "year": "2026",
  "students": [
    {
      "userId": "uuid",
      "nom": "Dupont",
      "prenom": "Jean",
      "classe": "BA25",
      "choices": [
        { "placeId": "place-1", "rank": 1 },
        { "placeId": "place-2", "rank": 2 }
      ],
      "priorityScore": 85.5
    }
  ],
  "places": [
    {
      "PlaceId": "place-1",
      "NomPlace": "HUG - Soins intensifs",
      "InstitutionName": "HUG",
      "Capacity": 2
    }
  ]
}
```

**Réponse**:
```json
{
  "ok": true,
  "algorithmRunId": "uuid",
  "results": [...],
  "errors": [...],
  "stats": {
    "totalStudents": 50,
    "successfulAssignments": 48,
    "failedAssignments": 2,
    "firstChoiceCount": 35,
    "secondChoiceCount": 10,
    "thirdChoiceCount": 3
  }
}
```

#### GET `/api/resultat-votation/results/:pfpType/:year`
Récupère tous les résultats pour un PFP et une année.

#### GET `/api/resultat-votation/student/:userId/:pfpType/:year`
Récupère le résultat d'un étudiant spécifique.

#### GET `/api/resultat-votation/statistics/:pfpType/:year`
Récupère les statistiques des résultats.

#### PUT `/api/resultat-votation/status/:resultId`
Met à jour le statut d'un résultat.

#### DELETE `/api/resultat-votation/:resultId`
Supprime un résultat d'attribution.

#### DELETE `/api/resultat-votation/algorithm-run/:algorithmRunId`
Supprime tous les résultats d'une exécution d'algorithme.

### 3. Frontend Service

**Fichier**: `src/stores/resultatVotationService.js`

Service JavaScript pour interagir avec l'API backend:

```javascript
import resultatVotationService from '@/stores/resultatVotationService'

// Lancer l'algorithme
const result = await resultatVotationService.runAlgorithm(pfpType, year, students, places)

// Récupérer les résultats
const results = await resultatVotationService.getResults(pfpType, year)

// Récupérer le résultat d'un étudiant
const myResult = await resultatVotationService.getMyResult(pfpType, year)

// Récupérer les statistiques
const stats = await resultatVotationService.getStatistics(pfpType, year)
```

### 4. Interface utilisateur

**Fichier**: `src/views/admin/formation-pratique/VotationPFPViewPHYFP.vue`

Vue administrative pour gérer les votations et lancer l'algorithme:

#### Fonctionnalités:

1. **Sélection obligatoire**: Année + PFP doivent être sélectionnés
2. **Affichage filtré**: Seuls les étudiants BA25 avec des choix sont affichés
3. **Statistiques en temps réel**: Total, votes complets, en attente, incomplets
4. **Deux onglets**:
   - Vue par étudiants (avec tous les choix)
   - Vue par places (statistiques d'agrégation)
5. **Bouton "Démarrer l'algorithme"**: Lance l'attribution automatique

## Algorithme d'attribution

### Logique (version 1.0)

1. **Préparation des données**:
   - Récupérer tous les étudiants BA25 avec leurs choix
   - Récupérer toutes les places disponibles avec leur capacité

2. **Tri des étudiants**:
   - Par score de priorité (si fourni)
   - Sinon aléatoirement

3. **Attribution**:
   - Pour chaque étudiant (dans l'ordre de priorité):
     - Parcourir ses choix dans l'ordre (1, 2, 3, 4, 5)
     - Attribuer la première place disponible
     - Décrémenter la capacité de la place
     - Enregistrer le résultat dans `student_result_vote`

4. **Gestion des erreurs**:
   - Si aucune place n'est disponible: enregistrer l'erreur
   - Continuer avec l'étudiant suivant

5. **Statistiques finales**:
   - Nombre d'attributions réussies
   - Répartition par rang de choix
   - Nombre de places utilisées

## Installation et déploiement

### 1. Appliquer la migration SQL

```bash
# Se connecter à Supabase et exécuter:
psql -h db.xxx.supabase.co -U postgres -d postgres < supabase_migrations/20251211_create_student_result_vote.sql
```

Ou via l'interface Supabase SQL Editor:
- Copier le contenu de `20251211_create_student_result_vote.sql`
- L'exécuter dans le SQL Editor

### 2. Vérifier que le backend démarre

```bash
cd backend
npm install
npm start
```

Vérifier que la route est montée:
```bash
curl http://localhost:3000/api/resultat-votation/results/PFP1A/2026 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Configurer le frontend

Le frontend utilise la variable d'environnement `VITE_BACKEND_URL`:

**.env.local**:
```env
VITE_BACKEND_URL=http://localhost:3000
```

**.env.production**:
```env
VITE_BACKEND_URL=https://api2.hedsvs.ch
```

## Utilisation

### Pour les administrateurs

1. Aller sur la page "Votation Formation Pratique - BA25"
2. Sélectionner:
   - **Année**: 2026 (par exemple)
   - **PFP**: PFP1A ou PFP1B
3. Vérifier les votes des étudiants dans l'onglet "Vue par Étudiants"
4. Cliquer sur **"Démarrer l'algorithme"**
5. Consulter les résultats et statistiques

### Pour les étudiants

Les étudiants peuvent consulter leur résultat d'attribution:

```javascript
const result = await resultatVotationService.getMyResult('PFP1A', '2026')
console.log('Place attribuée:', result.assigned_place_name)
console.log('Rang du choix:', result.assigned_rank)
```

## Sécurité

### Permissions

- **Lecture des résultats**:
  - Étudiants: Uniquement leurs propres résultats
  - Admins: Tous les résultats

- **Écriture/Modification**:
  - Admins uniquement

### Authentification

Toutes les requêtes API nécessitent un token JWT valide:

```javascript
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Évolutions futures

### Version 1.1
- [ ] Algorithme de priorité plus sophistiqué basé sur les notes
- [ ] Prise en compte des contraintes de places (genre, spécialisation, etc.)
- [ ] Système de swap entre étudiants

### Version 1.2
- [ ] Machine learning pour optimiser les attributions
- [ ] Prédiction des besoins en places
- [ ] Notifications automatiques aux étudiants

### Version 1.3
- [ ] Interface pour les étudiants pour confirmer/refuser leur attribution
- [ ] Système de liste d'attente automatique
- [ ] Export des résultats en PDF/Excel

## Support et debugging

### Logs importants

Backend:
```bash
# Logs de l'algorithme
🚀 Démarrage algorithme d'attribution: PFP1A - 2026
   Étudiants à traiter: 50
   Places disponibles: 45
✅ Algorithme terminé: {...stats}
```

Frontend:
```bash
# Console navigateur
📊 Données préparées: { students: 50, places: 45 }
✅ Résultat de l'algorithme: {...}
```

### Problèmes courants

1. **"Permission denied"**: Vérifier les RLS policies
2. **"No available place"**: Augmenter la capacité des places
3. **"Authentication required"**: Vérifier le token JWT

## Contact

Pour toute question ou amélioration:
- Documentation technique: Ce fichier
- Code source: `/backend/supabase/resultatVotationStoreBackend.js` et `/src/stores/resultatVotationService.js`
