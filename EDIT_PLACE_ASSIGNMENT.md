# 🔧 Édition des Places Assignées

## 🎯 Nouvelle Fonctionnalité

Permet de **modifier manuellement la place assignée** à un étudiant après l'exécution de l'algorithme d'attribution.

---

## ✨ Fonctionnalités

### 1. **Bouton Éditer**
Chaque ligne du tableau de résultats a un bouton d'édition (icône crayon).

### 2. **Dialog de Sélection**
Un dialog s'ouvre avec :
- **Informations de l'étudiant**
- **Place actuelle** assignée
- **Liste des places disponibles** pour le PFP sélectionné
- **Barre de recherche** pour filtrer les places

### 3. **Sélection d'une Nouvelle Place**
- Cliquer sur une place pour la sélectionner
- La place sélectionnée est **mise en surbrillance**
- Icône de validation ✓ sur la place sélectionnée

### 4. **Sauvegarde**
- Bouton "Enregistrer" pour valider le changement
- Mise à jour dans `student_result_vote`
- Mise à jour immédiate du tableau
- Toast de confirmation

---

## 🎨 Interface du Dialog

### Structure
```
┌─────────────────────────────────────────┐
│ Modifier la place assignée              │
├─────────────────────────────────────────┤
│ Étudiant                                │
│ DUPONT Alice                            │
│                                         │
│ Place actuelle                          │
│ ┌───────────────────────────────────┐   │
│ │ Ortho                             │   │
│ │ HFR Fribourg                      │   │
│ └───────────────────────────────────┘   │
│                                         │
│ ─────────────────────────────────────   │
│                                         │
│ Nouvelle place                          │
│ [Rechercher...]                         │
│                                         │
│ ┌───────────────────────────────────┐   │
│ │ Neuro ✓                           │   │ <- Sélectionnée
│ │ HVS Sion                          │   │
│ │ PFP1A Gériatrie                   │   │
│ └───────────────────────────────────┘   │
│ ┌───────────────────────────────────┐   │
│ │ Cardio                            │   │
│ │ HFR Fribourg                      │   │
│ │ PFP1A                             │   │
│ └───────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│            [Annuler] [Enregistrer]      │
└─────────────────────────────────────────┘
```

---

## 🔄 Workflow

### 1. Utilisateur Clique sur "Éditer"
```
Clic sur icône crayon
↓
openEditDialog(assignment)
↓
Chargement des places depuis placesStore
↓
Filtrage par PFP (PFP1A ou PFP1B)
↓
Affichage du dialog
```

### 2. Utilisateur Recherche une Place
```
Saisie dans la barre de recherche
↓
filterPlaces()
↓
filteredAvailablePlaces (computed) se met à jour
↓
Affichage des places filtrées
```

### 3. Utilisateur Sélectionne une Place
```
Clic sur une place
↓
selectNewPlace(place)
↓
selectedNewPlace = place
↓
Mise en surbrillance (classe CSS selected-place)
```

### 4. Utilisateur Enregistre
```
Clic sur "Enregistrer"
↓
saveNewPlace()
↓
UPDATE student_result_vote
  SET assigned_place_id = ...
      assigned_place_name = ...
      assigned_institution_name = ...
      updated_at = NOW()
  WHERE id = assignment.id
↓
Mise à jour locale du tableau
↓
Toast de succès
↓
Fermeture du dialog
```

---

## 💾 Base de Données

### Table Modifiée : `student_result_vote`

#### Champs Mis à Jour
```sql
UPDATE student_result_vote SET
  assigned_place_id = 'nouveau_id',
  assigned_place_name = 'nouveau_nom',
  assigned_institution_name = 'nouvelle_institution',
  updated_at = NOW()
WHERE id = 'assignment_id';
```

#### Champs Non Modifiés
- `user_id` : L'étudiant reste le même
- `pfp_type` : Le type de PFP ne change pas
- `year` : L'année ne change pas
- `assigned_rank` : Le rang du choix reste inchangé
- `status` : Le statut reste "assigned"

---

## 🔍 Filtrage des Places

### Par PFP
Les places sont **automatiquement filtrées** selon le PFP sélectionné :
- Si PFP1A → Affiche uniquement les places où `PFP1A = true`
- Si PFP1B → Affiche uniquement les places où `PFP1B = true`

### Par Recherche
La recherche filtre sur :
- **Nom de la place** (`NomPlace`)
- **Nom de l'institution** (`Institution_name` ou `Institution`)

Exemple :
```
Recherche : "ortho"
Résultats :
  - Ortho (HFR)
  - Orthopédie (HVS)
  - Traumato-Orthopédie (CHUV)
```

---

## 🎯 Cas d'Usage

### Cas 1 : Étudiant Veut Changer de Place
```
Raison : L'étudiant a trouvé une meilleure opportunité
Action : Admin clique sur Edit et sélectionne la nouvelle place
Résultat : Place mise à jour dans la BD et le tableau
```

### Cas 2 : Erreur de l'Algorithme
```
Raison : L'algorithme a assigné une place incompatible
Action : Admin corrige manuellement via le dialog
Résultat : Assignation corrigée
```

### Cas 3 : Désistement d'une Place
```
Raison : Une place n'est plus disponible
Action : Admin réassigne l'étudiant à une autre place
Résultat : Nouvelle place assignée
```

---

## 📊 Affichage des Places

### Informations Affichées pour Chaque Place
```
┌──────────────────────────────────┐
│ Neuro                            │ <- NomPlace
│ HVS Sion                         │ <- Institution
│ PFP1A Gériatrie                  │ <- Tags (PFP + Spécialités)
└──────────────────────────────────┘
```

### Tags Affichés
- **PFP** : PFP1A, PFP1B
- **Spécialités** : Pédiatrie, Gériatrie, etc.

---

## 🔒 Sécurité

### Permissions RLS
Assurez-vous que les RLS de `student_result_vote` autorisent :
- **UPDATE** pour les admins
- **SELECT** pour lire les places

### Validation
- ✅ Vérification que l'assignment existe
- ✅ Vérification que la nouvelle place existe
- ✅ Vérification que la nouvelle place est pour le bon PFP
- ✅ Vérification que l'utilisateur est admin

---

## 📝 Logs Console

### Lors de l'Ouverture du Dialog
```
[EDIT] Ouverture dialog pour: {student_name, assigned_place_name, ...}
[1/2] Chargement des places depuis placesStore...
[OK] 32 places PFP1A disponibles
```

### Lors de la Recherche
```
[FILTER] Recherche: ortho
```

### Lors de la Sélection
```
[SELECT] Place sélectionnée: Neuro
```

### Lors de la Sauvegarde
```
[SAVE] Mise à jour de student_result_vote...
Assignment ID: abc123
Nouvelle place: Neuro
[SUCCESS] Place mise à jour avec succès
```

---

## ⚠️ Gestion d'Erreurs

### Erreur de Chargement des Places
```
Toast: "Erreur - Impossible de charger les places"
Log: [ERROR] Erreur chargement places: ...
```

### Erreur de Sauvegarde
```
Toast: "Erreur - Impossible de modifier la place: ..."
Log: [ERROR] Erreur sauvegarde: ...
```

### Aucune Place Disponible
```
Message: "Aucune place trouvée"
```

---

## 🧪 Tests

### Test 1 : Ouverture du Dialog
```
1. Aller sur PlacesAssignmentView
2. Sélectionner PFP1A + 2026
3. Cliquer sur l'icône crayon d'un étudiant
4. Vérifier que le dialog s'ouvre
5. Vérifier que les places sont chargées
```

### Test 2 : Recherche de Place
```
1. Ouvrir le dialog
2. Taper "ortho" dans la recherche
3. Vérifier que seules les places contenant "ortho" apparaissent
```

### Test 3 : Sélection de Place
```
1. Cliquer sur une place
2. Vérifier qu'elle est mise en surbrillance
3. Vérifier que l'icône ✓ apparaît
```

### Test 4 : Sauvegarde
```
1. Sélectionner une nouvelle place
2. Cliquer sur "Enregistrer"
3. Vérifier le toast de succès
4. Vérifier que le tableau est mis à jour
5. Vérifier dans Supabase que la BD est mise à jour
```

### Test 5 : Annulation
```
1. Sélectionner une nouvelle place
2. Cliquer sur "Annuler"
3. Vérifier que le dialog se ferme
4. Vérifier qu'aucun changement n'est fait
```

---

## 📦 Dépendances

### Store Pinia
```javascript
import { usePlacesStore } from '@/stores/placesStore'
```

### Méthodes Utilisées
- `placesStore.fetchPlaces()` : Charge toutes les places
- `placesStore.places` : Accède aux places chargées

### Composants PrimeVue
- `Dialog` : Modal de sélection
- `Divider` : Séparateur visuel
- `Button` : Bouton d'édition
- `InputText` : Barre de recherche

---

## ✅ Checklist de Validation

- [x] Bouton Edit visible sur chaque ligne
- [x] Dialog s'ouvre correctement
- [x] Places chargées depuis placesStore
- [x] Filtrage par PFP fonctionnel
- [x] Recherche fonctionne
- [x] Sélection de place fonctionne
- [x] Mise en surbrillance de la place sélectionnée
- [x] Sauvegarde dans student_result_vote
- [x] Mise à jour locale du tableau
- [x] Toast de confirmation
- [x] Gestion des erreurs
- [x] Logs console détaillés

---

## 🚀 Utilisation

### Pour un Admin

1. **Accéder** à la page PlacesAssignmentView
2. **Sélectionner** PFP et Année
3. **Trouver** l'étudiant à modifier
4. **Cliquer** sur l'icône crayon (Edit)
5. **Rechercher** la nouvelle place (optionnel)
6. **Cliquer** sur la place désirée
7. **Cliquer** sur "Enregistrer"
8. **Confirmer** le toast de succès

---

**Date** : 11 décembre 2025  
**Version** : 1.0  
**Statut** : ✅ Production Ready  
**Auteur** : Cascade AI
