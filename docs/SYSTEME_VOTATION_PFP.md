# Système de Votation PFP — Documentation complète

> **Dernière mise à jour** : 23 février 2026

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture technique](#2-architecture-technique)
3. [Tables Supabase](#3-tables-supabase)
4. [Configuration PFP dynamique](#4-configuration-pfp-dynamique)
5. [Flux complet — Votation normale](#5-flux-complet--votation-normale)
6. [Flux complet — Votation prioritaire](#6-flux-complet--votation-prioritaire)
7. [Algorithme d'attribution](#7-algorithme-dattribution)
8. [Validation des stages](#8-validation-des-stages)
9. [Vues admin](#9-vues-admin)
10. [Vue étudiant](#10-vue-étudiant)
11. [Services et stores](#11-services-et-stores)
12. [Cycle de vie d'un stage](#12-cycle-de-vie-dun-stage)
13. [Points d'attention et TODO](#13-points-dattention-et-todo)

---

## 1. Vue d'ensemble

Le système de votation PFP (Période de Formation Pratique) permet d'attribuer des **places de stage** aux étudiants en physiothérapie. Le processus se déroule en plusieurs étapes :

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROCESSUS GLOBAL                             │
│                                                                 │
│  1. Admin configure les places (capacités par PFP/année)        │
│  2. Admin identifie les étudiants prioritaires (optionnel)      │
│  3. Admin ouvre une session de votation (prioritaire ou normale) │
│  4. Les étudiants votent (classent 5 places par préférence)     │
│  5. Admin ferme la session                                      │
│  6. Admin lance l'algorithme d'attribution                      │
│  7. Admin publie les résultats                                  │
│  8. Admin valide les stages (réussi / échec / arrêt)            │
└─────────────────────────────────────────────────────────────────┘
```

### Types de PFP

| PFP   | Année d'étude | Classe (2025-2026) |
|-------|---------------|---------------------|
| PFP1A | 1ère année    | BA25                |
| PFP1B | 1ère année    | BA25                |
| PFP2  | 2ème année    | BA24                |
| PFP3  | 3ème année    | BA23                |
| PFP4  | 3ème année    | BA23                |

### Deux types de votation

| Type | Description | Qui vote ? |
|------|-------------|------------|
| **Normale** | Votation ouverte à toute la classe | Tous les étudiants de la classe |
| **Prioritaire** | Votation privée avant la normale | Uniquement les étudiants identifiés comme prioritaires |

---

## 2. Architecture technique

### Frontend (Vue 3 + PrimeVue)

```
src/
├── views/admin/
│   ├── pfp/
│   │   ├── ManagementVotationPrioritaireView.vue   ← Gestion des prioritaires
│   │   ├── ValidationPFP.vue                        ← Validation stages (réussi/échec/arrêt)
│   │   ├── PlacesAssignmentView.vue                 ← Gestion des attributions
│   │   └── PlacesAssignedView.vue                   ← Vue des places assignées
│   ├── formation-pratique/
│   │   ├── VotationPFPViewPHYFP.vue                 ← Suivi votation normale (admin)
│   │   ├── VotationPrioritaireViewPHYFP.vue         ← Suivi votation prioritaire (admin)
│   │   ├── ResultatVotationPrioritaireViewPHYFP.vue  ← Résultats prioritaires
│   │   └── secretariat/
│   │       ├── VueDEnsembleFP.vue                   ← Vue d'ensemble (tous stages)
│   │       └── VerificationCriteresEtudiants.vue    ← Vérification critères
│   └── votations/
│       └── VotationGenericView.vue                  ← Page de vote étudiant
├── service/
│   └── votationSessionService.js                    ← Gestion sessions
├── stores/
│   ├── votesStore.js                                ← Store Pinia votes étudiants
│   ├── votesBackendService.js                       ← RPC backend pour votes
│   └── resultatVotationService.js                   ← Service résultats/algorithme
└── components/user/details/
    ├── VotationResultProfil.vue                     ← Profil: stages en cours
    └── ResumStageUserProfile.vue                    ← Profil: stages validés
```

### Backend (Express.js)

```
backend/
└── supabase/
    └── resultatVotationStoreBackend.js              ← API algorithme + CRUD résultats
```

### Base de données (Supabase/PostgreSQL)

```
Tables principales :
  ├── votation_sessions      ← Sessions de votation (ouvertes/fermées)
  ├── student_votes          ← Votes des étudiants (5 choix)
  ├── student_result_vote    ← Résultats de l'algorithme + validation
  ├── StudentsPhysio         ← Profil physio (critères, pfp_valided)
  ├── user_profiles          ← Profils utilisateurs
  ├── places                 ← Places de stage
  └── institutions           ← Institutions partenaires
```

---

## 3. Tables Supabase

### `votation_sessions`

Gère l'ouverture/fermeture des sessions de votation.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | Identifiant unique |
| `pfp_type` | text | `PFP1A`, `PFP1B`, `PFP2`, `PFP3`, `PFP4` |
| `year` | text | Année (ex: `2026`) |
| `target_class` | text | Classe cible (ex: `BA25`) |
| `status` | text | `open` ou `closed` |
| `opened_at` | timestamptz | Date d'ouverture |
| `closed_at` | timestamptz | Date de fermeture (null si ouverte) |
| `opened_by` | uuid | user_id de l'admin |
| `is_priority` | boolean | `true` = session prioritaire |
| `priority_user_ids` | jsonb | Array de user_id autorisés (si prioritaire) |

**Règles :**
- Une seule session `open` par `pfp_type` + `year` à la fois
- Si `is_priority = true`, seuls les étudiants dans `priority_user_ids` voient la session
- La session prioritaire doit être fermée AVANT d'ouvrir la session normale

### `student_votes`

Stocke les votes (choix) des étudiants.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | Identifiant unique |
| `user_id` | uuid | ID de l'étudiant |
| `pfp_type` | text | Type de PFP |
| `year` | text | Année |
| `choices` | jsonb | Array de 5 choix ordonnés |
| `updated_at` | timestamptz | Dernière modification |

**Format de `choices` :**
```json
[
  { "rank": 1, "placeId": "abc-123", "seatIndex": 0, "placeName": "Hôpital X", "InstitutionName": "CHUV" },
  { "rank": 2, "placeId": "def-456", "seatIndex": 0, "placeName": "Cabinet Y", "InstitutionName": "Clinique Z" },
  ...
]
```

- L'étudiant doit classer **5 places** par ordre de préférence
- `seatIndex` = index du siège si la place a une capacité > 1
- Un seul vote par `user_id` + `pfp_type` + `year` (upsert)

### `student_result_vote`

Résultats de l'algorithme d'attribution + suivi de validation.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | uuid (PK) | Identifiant unique |
| `user_id` | uuid | ID de l'étudiant |
| `pfp_type` | text | Type de PFP |
| `year` | text | Année |
| `assigned_place_id` | text | ID de la place attribuée |
| `assigned_place_name` | text | Nom de la place |
| `assigned_institution_name` | text | Nom de l'institution |
| `assigned_rank` | integer | Rang du choix obtenu (1-5) ou **99 = aléatoire** |
| `algorithm_run_id` | uuid | ID de l'exécution de l'algorithme |
| `original_choices` | jsonb | Copie des choix de l'étudiant |
| `priority_score` | float | Score de priorité utilisé |
| `status` | text | `assigned`, `pending`, `rejected`, `confirmed`, `published`, `draft` |
| `pfp_validee` | boolean | Stage validé (réussi) |
| `pfp_echec` | boolean | Stage en échec |
| `pfp_arret` | boolean | Stage arrêté |
| `commentaire_arret` | text | Commentaire si arrêt |
| `assigned_praticien_id` | text | ID du praticien formateur |
| `notes` | text | Notes de l'algorithme |

**Valeurs de `assigned_rank` :**
- `1` à `5` : l'étudiant a obtenu son choix n°1 à n°5
- `99` : attribution **aléatoire** (aucun de ses choix n'était disponible)

### `StudentsPhysio`

Profil physiothérapie de l'étudiant — critères validés et historique.

| Colonne | Type | Description |
|---------|------|-------------|
| `user_id` | uuid | ID de l'étudiant |
| `class` | text | Classe (BA25, BA24, BA23) |
| `sae` | boolean | Étudiant en SAE (Semestre Académique à l'Étranger) |
| `cas_particulier` | boolean/text | Cas particulier signalé |
| `pfp_valided` | jsonb | Array de stages validés (historique complet) |
| `msq`, `sysint`, `neuroger`, `aigu`, `rehab`, `ambu` | boolean | Critères cliniques |
| `fr`, `de` | boolean | Critères linguistiques |
| `canton` | text | Canton de domicile |

**Format de `pfp_valided` :**
```json
[
  {
    "PlaceId": "abc-123",
    "NomPlace": "Hôpital X",
    "Institution": "CHUV",
    "pfp_type": "PFP1A",
    "year": "2025",
    "status": "validee",
    "MSQ": true, "SYSINT": false, "NEUROGER": true,
    "AIGU": false, "REHAB": true, "AMBU": false,
    "FR": true, "DE": false,
    "validated_at": "2025-06-15T..."
  },
  ...
]
```

---

## 4. Configuration PFP dynamique

La configuration des PFP est calculée dynamiquement selon l'année académique :

```javascript
// Année académique = année civile si mois >= septembre, sinon année - 1
const currentAcademicYear = new Date().getMonth() >= 8
  ? new Date().getFullYear()      // Sept-Déc → année en cours
  : new Date().getFullYear() - 1  // Jan-Août → année précédente

// Exemple pour 2025-2026 (currentAcademicYear = 2025) :
// BA25 (1ère année) → PFP1A, PFP1B → année 2026
// BA24 (2ème année) → PFP2         → année 2026
// BA23 (3ème année) → PFP3, PFP4   → année 2026
```

Les places ont des capacités par PFP et par année :
```json
{
  "PlaceId": "abc-123",
  "NomPlace": "Hôpital X",
  "PFP1A": { "2026": 2 },   // 2 places pour PFP1A en 2026
  "PFP2": { "2026": 1 },    // 1 place pour PFP2 en 2026
  "PFP3": { "2026": 0 }     // pas de place pour PFP3
}
```

---

## 5. Flux complet — Votation normale

### Étape 1 : Ouverture de session (Admin)

**Vue :** `VotationPFPViewPHYFP.vue`

1. L'admin sélectionne **Classe → PFP → Année**
2. Clique sur **"Ouvrir la votation"**
3. → Appelle `votationSessionService.openSession(pfpType, year, targetClass, userId)`
4. → Crée une ligne dans `votation_sessions` avec `status: 'open'`
5. → Ferme automatiquement toute session précédente pour ce PFP/année

### Étape 2 : Vote des étudiants

**Vue :** `VotationGenericView.vue` (route `/votation/:pfpType`)

1. L'étudiant accède à la page de votation
2. `loadSession()` cherche une session `open` correspondant à son PFP
   - Si `is_priority = true` → vérifie que l'étudiant est dans `priority_user_ids`
   - Si non prioritaire → session invisible pour cet étudiant
3. L'étudiant voit les **places disponibles** (filtrées par capacité PFP/année)
4. Il **classe 5 places** par ordre de préférence (drag & drop)
5. Clique sur **"Voter"**
6. → Appelle `votesStore.saveVote(pfpType, year, choices)`
7. → Upsert dans `student_votes`

**Contraintes :**
- L'étudiant **doit** choisir exactement 5 places
- Il peut **modifier** son vote tant que la session est ouverte
- Il peut **supprimer** son vote (annuler)

### Étape 3 : Suivi en temps réel (Admin)

**Vue :** `VotationPFPViewPHYFP.vue`

L'admin voit en temps réel :
- Nombre d'étudiants ayant voté vs total
- Détail des votes par étudiant (choix 1 à 5)
- Statistiques de popularité des places
- Agrégation des votes par place

### Étape 4 : Fermeture de session (Admin)

1. L'admin clique sur **"Fermer la votation"**
2. → Appelle `votationSessionService.closeSession(pfpType, year)`
3. → Met `status: 'closed'` et `closed_at` dans `votation_sessions`
4. Les étudiants ne peuvent plus voter

### Étape 5 : Lancement de l'algorithme (Admin)

1. L'admin clique sur **"Lancer l'algorithme"**
2. → Appelle `resultatVotationService.runAlgorithm(pfpType, year, students, places)`
3. → Envoie une requête POST au backend `/api/resultat-votation/run-algorithm`
4. L'algorithme tourne (voir section 7)
5. Les résultats sont insérés dans `student_result_vote`
6. L'admin voit les statistiques : choix 1, choix 2, choix 3, aléatoire

### Étape 6 : Publication (Admin)

**Vue :** `PlacesAssignmentView.vue`

1. L'admin peut modifier les attributions manuellement
2. Assigner un praticien formateur
3. Publier les résultats → les étudiants voient leur attribution sur leur profil

---

## 6. Flux complet — Votation prioritaire

### Qui est prioritaire ?

Un étudiant est considéré comme **prioritaire** s'il remplit un ou plusieurs critères :

| Critère | Source | Description |
|---------|--------|-------------|
| **SAE** | `StudentsPhysio.sae = true` | Étudiant en Semestre Académique à l'Étranger |
| **Cas particulier** | `StudentsPhysio.cas_particulier ≠ null/false` | Situation spéciale signalée |
| **Ancien aléatoire** | `student_result_vote.assigned_rank = 99` | A été attribué aléatoirement lors d'une votation précédente (lésé) |
| **Manuel** | Ajouté par l'admin | L'admin peut ajouter manuellement un étudiant avec une raison |

### Flux

```
┌──────────────────────────────────────────────────────────────────┐
│  1. ManagementVotationPrioritaireView.vue                        │
│     ├── Sélection Classe → PFP → Année                          │
│     ├── Clic "Détecter automatiquement" → identifie SAE,        │
│     │   cas_particulier, anciens aléatoires                      │
│     ├── Ajout/retrait manuel d'étudiants                         │
│     └── Clic "Lancer la votation prioritaire"                    │
│         → openPrioritySession(pfpType, year, class, userId, ids) │
│                                                                  │
│  2. Les étudiants prioritaires votent                            │
│     └── VotationGenericView.vue filtre : seuls les étudiants     │
│         dans priority_user_ids voient la session                 │
│                                                                  │
│  3. VotationPrioritaireViewPHYFP.vue (admin)                     │
│     ├── Suivi des votes prioritaires en temps réel               │
│     ├── Fermeture de la session prioritaire                      │
│     └── Lancement de l'algorithme (prioritaires uniquement)      │
│                                                                  │
│  4. Ouverture de la votation NORMALE pour les autres étudiants   │
│     └── Les places déjà attribuées aux prioritaires sont         │
│         retirées de la capacité disponible                       │
└──────────────────────────────────────────────────────────────────┘
```

### Détail de la détection automatique

```javascript
// 1. SAE
if (physioData.sae === true) → prioritaire (raison: "SAE")

// 2. Cas particulier
if (physioData.cas_particulier && physioData.cas_particulier !== false)
  → prioritaire (raison: "Cas particulier")

// 3. Ancien aléatoire (lésé)
// Cherche dans student_result_vote les PFP précédents
// Si assigned_rank === 99 → l'étudiant a été lésé
if (previousResult.assigned_rank === 99)
  → prioritaire (raison: "Ancien aléatoire PFPxx")
```

---

## 7. Algorithme d'attribution

**Fichier :** `backend/supabase/resultatVotationStoreBackend.js`

### Entrées

- `students[]` : liste des étudiants avec leurs `choices` et `priorityScore`
- `places[]` : liste des places avec `PlaceId`, `Capacity`, `NomPlace`, `InstitutionName`

### Étapes de l'algorithme (v3.0)

```
ÉTAPE 1 — Calcul de popularité
  Pour chaque place, compter combien de fois elle apparaît dans les votes.

ÉTAPE 2 — Attribution par places (moins populaires → plus populaires)
  Pour chaque place (triée par popularité croissante) :
    1. Trouver tous les étudiants non-assignés qui ont choisi cette place
    2. Les trier par :
       a. Rang du choix (choix 1 > choix 2 > ...)
       b. Score de priorité (plus élevé = plus prioritaire)
       c. Aléatoire (si égalité)
    3. Assigner jusqu'à la capacité de la place

ÉTAPE 3 — Attribution aléatoire des restants
  Pour chaque étudiant non-assigné :
    Trouver une place avec capacité restante → assigner (rank = 99)
```

### Pourquoi traiter les places moins populaires en premier ?

C'est une **optimisation** : les places peu demandées ont peu de candidats, donc les attributions sont quasi-certaines. Cela libère les étudiants pour les places populaires, réduisant la compétition sur celles-ci.

### Score de priorité (`priorityScore`)

Actuellement :
- **Votation normale** : `Math.random() * 100` (aléatoire) — **TODO : implémenter des critères**
- **Votation prioritaire** : `100` (score max, tous les prioritaires sont égaux)

**TODO futur :** Le `priorityScore` devrait être calculé selon les critères manquants de l'étudiant (MSQ, SYSINT, NEUROGER, etc.) pour prioriser ceux qui ont le plus de besoins.

### Résultat

Pour chaque étudiant, l'algorithme produit :

| Champ | Valeur |
|-------|--------|
| `assigned_rank` | 1-5 = choix obtenu, **99 = aléatoire** |
| `assigned_place_id` | ID de la place attribuée |
| `algorithm_run_id` | UUID unique de cette exécution |
| `priority_score` | Score utilisé pour le tri |

### Statistiques retournées

```json
{
  "totalStudents": 60,
  "successfulAssignments": 58,
  "failedAssignments": 2,
  "firstChoiceCount": 25,
  "secondChoiceCount": 15,
  "thirdChoiceCount": 10,
  "randomAssignmentCount": 8,
  "averageRank": 2.1
}
```

---

## 8. Validation des stages

**Vue :** `ValidationPFP.vue`

Après l'attribution, l'admin valide chaque stage individuellement :

```
                    Attribution par l'algorithme
                           │
                    student_result_vote créé
                    (pfp_validee=false, pfp_echec=false, pfp_arret=false)
                           │
                    Statut = "En cours" (par défaut)
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
     ☑ pfp_validee    ☑ pfp_echec    ☑ pfp_arret
     Statut="Réussi"  Statut="Échec" Statut="Arrêt"
            │              │              │
            ▼              ▼              ▼
     syncWithStudentsPhysio() → met à jour pfp_valided[]
```

### Logique de synchronisation avec `StudentsPhysio.pfp_valided`

Quand l'admin coche une case dans `ValidationPFP.vue` :

| Action | Critères transmis à `pfp_valided` |
|--------|-----------------------------------|
| **Validé** (`pfp_validee`) | Tous les critères de la place (MSQ, SYSINT, NEUROGER, AIGU, REHAB, AMBU, FR, DE) |
| **Échec** (`pfp_echec`) | Seulement FR et DE (la langue est acquise même en cas d'échec) |
| **Arrêt** (`pfp_arret`) | Aucun critère (le stage n'a pas été complété) |

### Impact sur le profil étudiant

- **`VotationResultProfil.vue`** : affiche les stages **en cours** (= dans `student_result_vote` avec `pfp_validee = false`)
  - Quand `pfp_validee = true` → le stage **disparaît** de cette section
- **`ResumStageUserProfile.vue`** : affiche les stages **validés** (= dans `StudentsPhysio.pfp_valided`)
  - Quand `pfp_validee = true` → le stage **apparaît** dans cette section
- **`VerificationCriteresEtudiants.vue`** : agrège les critères de tous les stages validés pour montrer la progression

---

## 9. Vues admin

### `VotationPFPViewPHYFP.vue` — Suivi votation normale

| Fonctionnalité | Description |
|----------------|-------------|
| Sélection Classe/PFP/Année | Dropdowns dynamiques |
| Ouvrir/Fermer session | Boutons avec confirmation |
| Tableau des votes | Nom, prénom, choix 1-5, statut (Complet/Incomplet/Non voté) |
| Statistiques | Nb votants, places dispo, agrégation par place |
| Lancer l'algorithme | Bouton + affichage résultats |
| Supprimer un run | Supprimer tous les résultats d'une exécution |

### `ManagementVotationPrioritaireView.vue` — Gestion prioritaires

| Fonctionnalité | Description |
|----------------|-------------|
| Détection automatique | Bouton qui identifie SAE, cas particulier, anciens aléatoires |
| Ajout manuel | Dialog pour ajouter un étudiant avec raison |
| Retrait | Bouton pour retirer un étudiant de la liste |
| Tableau prioritaires | Nom, raisons (tags colorés), vote en cours |
| Tableau non-prioritaires | Avec indicateurs SAE/cas part./ancien aléatoire et bouton "Ajouter" |
| Lancer session prioritaire | Dialog de confirmation → ouvre la session |

### `VotationPrioritaireViewPHYFP.vue` — Suivi votation prioritaire

| Fonctionnalité | Description |
|----------------|-------------|
| Session status | Ouverte/fermée avec nb prioritaires |
| Stats | Prioritaires, ont voté, en attente, places dispo |
| Tableau votes | Choix 1-3, nb choix, statut |
| Fermer session | Bouton |
| Lancer algorithme | Pour prioritaires uniquement (priorityScore=100) |
| Lien vers gestion | Bouton "Gérer les prioritaires" |

### `VueDEnsembleFP.vue` — Vue d'ensemble

| Fonctionnalité | Description |
|----------------|-------------|
| Tableau global | Tous les étudiants × tous les PFP |
| Colonnes | Nom, PFP, Place, Institution, Note, Statut, Cas part., Attribution, **Prio.**, CPT, Eval |
| Colonne Prio. | ⭐ si l'étudiant est dans une session prioritaire |
| Filtres | Recherche, classe, PFP, statut, type |
| Export Excel | Multi-feuilles (Base données, Répartition PDS, Vérif. par classe) |

### `VerificationCriteresEtudiants.vue` — Vérification critères

| Fonctionnalité | Description |
|----------------|-------------|
| Tableau | Nom (lien vers profil), scores par critère, nb stages, progression |
| Expansion | Détail des stages validés et en cours par étudiant |
| Stats | Total, complets, partiels, aucun critère |
| Barres de progression | Taux de validation par critère (MSQ, SYSINT, etc.) |

### `ValidationPFP.vue` — Validation stages

| Fonctionnalité | Description |
|----------------|-------------|
| Tableau | Étudiants assignés avec checkboxes Validé/Échec/Arrêt |
| Checkboxes exclusives | Cocher une décoche les autres |
| Commentaire arrêt | Dialog pour saisir le motif d'arrêt |
| Synchro auto | Met à jour `StudentsPhysio.pfp_valided` automatiquement |

---

## 10. Vue étudiant

### `VotationGenericView.vue` — Page de vote

**Routes :**
- `/votation/:pfpType` (générique)
- `/votation` (legacy PFP1A)
- `/votation_pfp1b` (legacy PFP1B)

**Comportement :**

1. `loadSession()` cherche une session ouverte :
   - Route générique → filtre par `pfpType` de l'URL
   - Route legacy → déduit le PFP depuis le nom de route
   - Fallback → cherche par classe de l'étudiant

2. **Filtre prioritaire** (`filterSessionForUser()`) :
   - Si `session.is_priority = true` → vérifie que `user.id` est dans `priority_user_ids`
   - Si l'étudiant n'est pas prioritaire → session invisible, il voit "Aucune session"
   - Si session normale (`is_priority = false/null`) → visible par tous

3. L'étudiant voit les places disponibles avec :
   - Nom de la place et institution
   - Critères (MSQ, SYSINT, etc.)
   - Catégorie d'institution

4. Il classe 5 places par préférence → sauvegarde dans `student_votes`

### Profil étudiant

- **`VotationResultProfil.vue`** : "Formation pratique en cours"
  - Affiche les attributions depuis `student_result_vote` où `pfp_validee = false`
  - Montre : institution, domaine, critères, praticien formateur, type d'attribution
  - Bouton "Voir les détails" → page institution
  - Admin peut supprimer une attribution ou en ajouter une

- **`ResumStageUserProfile.vue`** : Historique des stages validés
  - Affiche les stages depuis `StudentsPhysio.pfp_valided`

- **`RadarProfil.vue`** : Radar des critères validés
  - Visualisation graphique des 8 critères (MSQ, SYSINT, etc.)

---

## 11. Services et stores

### `votationSessionService.js`

| Méthode | Description |
|---------|-------------|
| `fetchAll()` | Toutes les sessions (triées par date) |
| `getActiveSession(pfpType, year)` | Session ouverte pour un PFP/année |
| `getAllActiveSessions()` | Toutes les sessions ouvertes |
| `openSession(pfpType, year, targetClass, userId)` | Ouvrir une session normale |
| `closeSession(pfpType, year)` | Fermer une session normale |
| `isVotationOpen(pfpType, year)` | Vérifier si une votation est ouverte |
| `getOpenSessionForClass(targetClass)` | Session ouverte pour une classe |
| `openPrioritySession(pfpType, year, targetClass, userId, priorityUserIds)` | Ouvrir une session prioritaire |
| `closePrioritySession(pfpType, year)` | Fermer une session prioritaire |
| `getActivePrioritySession(pfpType, year)` | Session prioritaire ouverte |

### `votesStore.js` (Pinia)

| Action | Description |
|--------|-------------|
| `fetchUserVotes()` | Récupère tous les votes de l'utilisateur connecté |
| `fetchVote(pfpType, year)` | Récupère un vote spécifique |
| `saveVote(pfpType, year, choices)` | Crée ou met à jour un vote (via RPC ou direct) |
| `deleteVote(pfpType, year)` | Supprime un vote |

### `resultatVotationService.js`

| Méthode | Description |
|---------|-------------|
| `runAlgorithm(pfpType, year, students, places)` | Lance l'algorithme (POST backend) |
| `getResults(pfpType, year, algorithmRunId?)` | Résultats d'un PFP/année |
| `getStudentResult(userId, pfpType, year)` | Résultat d'un étudiant |
| `getMyResult(pfpType, year)` | Résultat de l'étudiant connecté (RPC) |
| `getStatistics(pfpType, year)` | Statistiques |
| `updateStatus(resultId, status, notes?)` | Mettre à jour le statut |
| `deleteResult(resultId)` | Supprimer un résultat |
| `deleteAlgorithmRun(algorithmRunId)` | Supprimer tous les résultats d'un run |
| `getResultsDirect(pfpType, year)` | Lecture directe Supabase (sans backend) |

### Backend API (`/api/resultat-votation/`)

| Route | Méthode | Description | Auth |
|-------|---------|-------------|------|
| `/run-algorithm` | POST | Lancer l'algorithme | Admin |
| `/results/:pfpType/:year` | GET | Résultats | Admin |
| `/student/:userId/:pfpType/:year` | GET | Résultat étudiant | Admin ou propriétaire |
| `/statistics/:pfpType/:year` | GET | Statistiques | Admin |
| `/status/:resultId` | PUT | Mettre à jour statut | Admin |
| `/:resultId` | DELETE | Supprimer résultat | Admin |
| `/algorithm-run/:algorithmRunId` | DELETE | Supprimer un run complet | Admin |

---

## 12. Cycle de vie d'un stage

```
                        ┌─────────────────┐
                        │  Places config.  │
                        │  (capacités PFP) │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │ Session ouverte  │  ← votation_sessions (status: open)
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │ Étudiants votent │  ← student_votes (5 choix)
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │ Session fermée   │  ← votation_sessions (status: closed)
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │ Algorithme       │  ← backend /run-algorithm
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │ Attribution      │  ← student_result_vote
                        │ (En cours)       │     assigned_rank: 1-5 ou 99
                        └────────┬────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
     ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
     │   Validé ✅     │ │   Échec ❌      │ │   Arrêt ⛔     │
     │ pfp_validee     │ │ pfp_echec      │ │ pfp_arret      │
     │ = true          │ │ = true         │ │ = true         │
     └────────┬───────┘ └────────┬───────┘ └────────┬───────┘
              │                  │                  │
              ▼                  ▼                  ▼
     ┌──────────────────────────────────────────────────┐
     │ Synchro → StudentsPhysio.pfp_valided[]           │
     │                                                  │
     │ Validé : tous les critères de la place           │
     │ Échec  : seulement FR/DE                         │
     │ Arrêt  : aucun critère                           │
     └──────────────────────────────────────────────────┘
              │
              ▼
     ┌──────────────────────────────────────────────────┐
     │ Visible sur le profil étudiant                   │
     │ + comptabilisé dans VerificationCriteresEtudiants│
     │ + affiché dans VueDEnsembleFP                    │
     └──────────────────────────────────────────────────┘
```

---

## 13. Points d'attention et TODO

### ⚠️ Migration SQL requise

Le fichier `supabase/migrations/20260223_add_priority_to_votation_sessions.sql` doit être exécuté sur Supabase pour ajouter les colonnes `is_priority` et `priority_user_ids` à `votation_sessions`.

### ⚠️ Variable d'environnement

Ajouter `VITE_SUPABASE_SERVICE_ROLE_KEY` dans le fichier `.env` pour les opérations admin.

### 🔧 TODO

| Priorité | Tâche |
|----------|-------|
| **Haute** | Implémenter le `priorityScore` basé sur les critères manquants (pas aléatoire) |
| **Haute** | Exécuter la migration SQL pour les colonnes prioritaires |
| **Moyenne** | Différencier "Attribué" (algo tourné, pas commencé) vs "En cours" (stage démarré) dans les stats |
| **Moyenne** | Ajouter des notifications temps réel (Supabase Realtime) pour les votes |
| **Basse** | Historique des exécutions d'algorithme avec comparaison |

### 🔒 Sécurité

- Les routes backend sont protégées par JWT + vérification du rôle admin
- Les étudiants ne peuvent voir que leur propre résultat
- Les votes utilisent RPC backend pour contourner les restrictions RLS
- Les sessions prioritaires filtrent côté client ET côté serveur (via `priority_user_ids`)
