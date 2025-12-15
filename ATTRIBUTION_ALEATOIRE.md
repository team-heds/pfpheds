# 🎲 Attribution Aléatoire des Places Restantes

## 🎯 Fonctionnalité

Après l'attribution optimisée basée sur les choix des étudiants, l'algorithme assigne **automatiquement et aléatoirement** les étudiants restants aux places vides.

---

## 📋 Processus d'Attribution

### ÉTAPE 1 : Attribution Normale (Basée sur les Choix)
L'algorithme traite les places par popularité croissante et assigne les étudiants selon leurs choix.

### ÉTAPE 2 : Attribution Aléatoire (Places Restantes)
```
Pour chaque étudiant non assigné :
  1. Trouver une place avec capacité restante > 0
  2. Assigner l'étudiant aléatoirement
  3. Marquer avec un rang spécial (99)
  4. Ajouter une note explicative
```

---

## 🔧 Détails Techniques

### Code Backend
`backend/supabase/resultatVotationStoreBackend.js`

```javascript
// Après l'attribution normale...

// Trouver les places avec capacité restante
const placesAvecCapacite = Array.from(placesMap.values())
  .filter(p => p.remainingCapacity > 0)
  .sort(() => Math.random() - 0.5) // Mélange aléatoire

// Trouver les étudiants non assignés
const studentsNonAssignes = students
  .filter(s => !assignedStudents.has(s.userId))
  .sort(() => Math.random() - 0.5) // Mélange aléatoire

// Assigner
for (const student of studentsNonAssignes) {
  const placeDisponible = placesAvecCapacite.find(p => p.remainingCapacity > 0)
  
  if (placeDisponible) {
    resultsToInsert.push({
      user_id: student.userId,
      assigned_place_id: placeDisponible.PlaceId,
      assigned_rank: 99, // ⚠️ Rang spécial
      notes: '⚠️ ATTRIBUTION ALÉATOIRE (place non dans les choix)'
    })
  }
}
```

### Marqueur Spécial
```javascript
assigned_rank: 99  // Indique une attribution aléatoire
```

---

## 🎨 Affichage Visuel

### Badge Rouge "🎲 Aléatoire"

#### Dans la Liste des Étudiants
```
Étudiant | Place Attribuée | Choix         | Score
---------|-----------------|---------------|-------
Alice    | Ortho          | 🟢 1er choix  | 94.9
Bob      | Neuro          | 🎲 Aléatoire  | 91.1  ← Attribution aléatoire
Charlie  | Cardio         | 🔵 2e choix   | 88.3
```

#### Dans l'Onglet Attribution des Places
```
Place: Neuro HVS
Capacité: 1 | Assignés: 1 | Restant: 0

Étudiants Assignés:
  ✅ 1. Bob Martin  🎲 Aléatoire
```

**Couleurs** :
- 🟢 Vert = 1er choix
- 🔵 Bleu = 2e choix
- 🟠 Orange = 3e choix et +
- 🔴 **Rouge = Aléatoire** ⭐ NOUVEAU

---

## 📊 Statistiques

### Affichage Compact
```
✅ Résultats de l'Attribution
32 étudiants | 22 en 1er choix | 5 aléatoires | 30 places utilisées | Rang moyen: 1.22
```

### Stats Détaillées
```javascript
{
  totalStudents: 32,
  successfulAssignments: 27,
  failedAssignments: 5,
  firstChoiceCount: 22,
  secondChoiceCount: 3,
  thirdChoiceCount: 2,
  randomAssignmentCount: 5,  // 🆕 Attributions aléatoires
  averageRank: 1.22           // Calculé SANS les attributions aléatoires
}
```

**Important** : Le rang moyen exclut les attributions aléatoires pour refléter la vraie satisfaction des choix.

---

## 🔍 Logs Backend

### Console Serveur
```
🚀 Démarrage algorithme d'attribution: PFP1A - 2026
   Étudiants à traiter: 32
   Places disponibles: 32

📊 Popularité des places calculée:
   🟢 Top 5 places MOINS populaires:
      - Neuro HVS: 2 votes, capacité: 1
   🔴 Top 5 places PLUS populaires:
      - Ortho CHUV: 15 votes, capacité: 2

🔄 Attribution par places (moins populaires → plus populaires)...
   ✅ Neuro HVS: 1/2 candidats assignés (2 votes totaux)
   ✅ Ortho CHUV: 2/15 candidats assignés (15 votes totaux)

🎲 Attribution aléatoire des étudiants restants aux places vides...
   📊 8 places avec capacité restante
   📊 5 étudiants non assignés
   🎲 Attribution aléatoire: user-123 → Ambu Riviera
   🎲 Attribution aléatoire: user-456 → Cardio HFR
   ...
   ✅ 5 étudiants assignés aléatoirement

💾 Enregistrement de 27 résultats en batch...
✅ Batch insert: 27 succès, 0 erreurs
```

---

## 📋 Cas d'Usage

### Scénario 1 : Étudiant Sans Choix Disponibles
**Situation** :
- Alice a choisi : Ortho, Cardio, Neuro
- Toutes ces places sont pleines

**Résultat** :
- Alice est assignée à "Ambu Riviera" (place vide)
- Marquée comme attribution aléatoire 🎲

### Scénario 2 : Plus d'Étudiants que de Places
**Situation** :
- 35 étudiants, 32 places
- Après attribution normale : 27 étudiants assignés
- 8 étudiants restants, 5 places vides

**Résultat** :
- 5 étudiants assignés aléatoirement aux 5 places vides
- 3 étudiants restent sans place (vraiment aucune capacité)

---

## 💾 Base de Données

### Table `student_result_vote`
```sql
INSERT INTO student_result_vote (
  user_id,
  assigned_place_id,
  assigned_rank,           -- 99 pour aléatoire
  notes
) VALUES (
  'user-123',
  'place-abc',
  99,                      -- ⚠️ Rang spécial
  '⚠️ ATTRIBUTION ALÉATOIRE (place non dans les choix) - Algorithm v3.0 on 2025-12-11'
);
```

### Requête pour Filtrer
```sql
-- Attributions normales uniquement
SELECT * FROM student_result_vote WHERE assigned_rank < 99;

-- Attributions aléatoires uniquement
SELECT * FROM student_result_vote WHERE assigned_rank = 99;

-- Statistiques
SELECT 
  COUNT(CASE WHEN assigned_rank = 1 THEN 1 END) AS first_choice,
  COUNT(CASE WHEN assigned_rank = 99 THEN 1 END) AS random_assignments
FROM student_result_vote;
```

---

## 📤 Export CSV

### Format
```csv
Étudiant;Place Attribuée;Institution;Rang du Choix;Score de Priorité
Alice Dupont;Ortho;HFR;1er choix;94.9
Bob Martin;Neuro;HVS;Aléatoire;91.1
Charlie R.;Cardio;CHUV;2e choix;88.3
```

**Note** : "Aléatoire" au lieu de "99er choix" pour une meilleure lisibilité.

---

## ⚙️ Configuration

### Désactiver l'Attribution Aléatoire
Si vous souhaitez désactiver cette fonctionnalité :

```javascript
// Dans backend/supabase/resultatVotationStoreBackend.js
// Commenter ou supprimer l'ÉTAPE 3

/*
// 🎯 ÉTAPE 3: Assigner aléatoirement...
console.log('🎲 Attribution aléatoire...')
// ... code de l'attribution aléatoire
*/
```

---

## 🎯 Avantages

### ✅ Aucun Étudiant Ignoré
- Tous les étudiants obtiennent une place si possible
- Maximise l'utilisation des places disponibles

### ✅ Équité
- Attribution vraiment aléatoire (pas de favoritisme)
- Ordre aléatoire des étudiants ET des places

### ✅ Transparence
- Clairement marqué dans l'interface (badge rouge)
- Note explicative dans la base de données
- Logs détaillés

### ✅ Statistiques Justes
- Le rang moyen exclut les attributions aléatoires
- Compte séparé des attributions aléatoires

---

## 🧪 Tests

### Test 1 : Tous Assignés
```
Étudiants: 30
Places: 32 (capacité totale)
Résultat attendu: 30 étudiants assignés (dont X aléatoires)
```

### Test 2 : Pas Assez de Places
```
Étudiants: 35
Places: 32
Résultat attendu: 32 assignés, 3 sans place
```

### Test 3 : Places Impopulaires
```
Place A: 0 votes, capacité 2
Étudiants non assignés: 5
Résultat attendu: 2 étudiants assignés aléatoirement à la Place A
```

---

## 🔮 Améliorations Futures

### Critères d'Attribution Aléatoire
Au lieu de purement aléatoire, on pourrait :
- Favoriser les étudiants avec de meilleurs scores
- Considérer la distance géographique
- Respecter des contraintes (allergies, handicap...)

### Préférences Négatives
Permettre aux étudiants d'indiquer les places qu'ils NE veulent PAS, même en aléatoire.

---

## ✅ Checklist de Validation

- [x] Attribution aléatoire implémentée
- [x] Rang spécial (99) utilisé
- [x] Badge rouge "🎲 Aléatoire" affiché
- [x] Statistique `randomAssignmentCount` ajoutée
- [x] Export CSV gère "Aléatoire"
- [x] Logs détaillés
- [x] Note explicative dans la DB
- [x] Tooltip informatif
- [x] Rang moyen exclut les aléatoires

---

**Date** : 11 décembre 2025  
**Version** : 3.1  
**Statut** : ✅ Production Ready  
**Auteur** : Cascade AI
