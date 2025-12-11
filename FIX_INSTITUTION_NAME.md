# 🔧 Fix: Affichage du Nom d'Institution

## 🐛 Problème Identifié

### Symptôme
```
Institution inconnueee
```

### Cause Racine
Dans `VotationResultProfil.vue`, le code appelait :
```vue
{{ getInstitutionNameById(place.IDPlace) }}
```

**Problème** : `place.IDPlace` est un **PlaceId**, pas un **InstitutionId** !

La fonction `getInstitutionNameById` cherche dans la table `institutions` avec cet ID, mais ne trouve rien car elle cherche avec un ID de place.

---

## ✅ Solution Appliquée

### 1. **Enrichir les Données**

Dans `assignedPlacesFromPublished`, j'ai ajouté :

```javascript
return {
  ...place,
  IDPlace: place.PlaceId,
  InstitutionId: place.InstitutionId,  // ✅ Ajouté
  Institution: place.Institution_name || place.Institution || 'N/A',  // ✅ Ajouté
  Institution_name: place.Institution_name || place.Institution || 'N/A',  // ✅ Ajouté
  pfpLevel: assignment.pfp_type,
  assigned_rank: assignment.assigned_rank,
  _key: assignment.id
}
```

### 2. **Modifier le Template**

Avant :
```vue
{{ getInstitutionNameById(place.IDPlace) }}  ❌ place.IDPlace est un PlaceId !
```

Après :
```vue
{{ place.Institution_name || place.Institution || getInstitutionNameById(place.InstitutionId) }}
```

**Priorité** :
1. `place.Institution_name` (déjà enrichi depuis placesStore)
2. `place.Institution` (fallback)
3. `getInstitutionNameById(place.InstitutionId)` (dernier recours avec le BON ID)

### 3. **Corriger le Bouton "Voir les Détails"**

Avant :
```vue
@click="navigateToInstitution(place.IDPlace)"  ❌
```

Après :
```vue
@click="navigateToInstitution(place.InstitutionId || place.IDPlace)"  ✅
```

---

## 🔍 Structure des Données

### Table `places`
```javascript
{
  PlaceId: "place123",          // ← ID de la place
  NomPlace: "Gériatrie",
  InstitutionId: "inst456",     // ← ID de l'institution
  Institution: "HVS",           // Ancien champ
  Institution_name: "Hôpital du Valais (HVS)"  // Enrichi depuis institutions
}
```

### Table `student_result_vote`
```javascript
{
  id: "result789",
  user_id: "user123",
  assigned_place_id: "place123",           // ← PlaceId
  assigned_place_name: "Gériatrie",
  assigned_institution_name: "HVS"         // Nom direct (pas besoin de lookup)
}
```

### Table `institutions`
```javascript
{
  InstitutionId: "inst456",     // ← Clé pour chercher
  Name: "Hôpital du Valais (HVS)"
}
```

---

## 🎯 Flux de Données

### Nouveau Système (student_result_vote)

```
1. Étudiant se connecte
   ↓
2. fetchPublishedAssignments()
   SELECT * FROM student_result_vote
   WHERE user_id = ... AND status = 'published'
   ↓
3. Résultat contient déjà assigned_institution_name
   ↓
4. assignedPlacesFromPublished enrichit avec place complète
   - Cherche dans supabasePlaces
   - Ajoute Institution_name depuis place.Institution_name
   ↓
5. Template affiche place.Institution_name
   ✅ "Hôpital du Valais (HVS)"
```

### Ancien Système (JSONB dans places)

```
1. fetchPlacesFromSupabase()
   ↓
2. Parcours des assignations JSONB
   ↓
3. place.InstitutionId existe
   ↓
4. getInstitutionNameById(place.InstitutionId)
   ↓
5. Cherche dans institutionsStore
   ✅ Nom trouvé
```

---

## 📊 Comparaison Avant/Après

### Avant (Bugué)
| Champ | Valeur |
|-------|--------|
| `place.IDPlace` | `"place123"` |
| `getInstitutionNameById("place123")` | ❌ "Institution inconnueee" |

### Après (Corrigé)
| Champ | Valeur |
|-------|--------|
| `place.InstitutionId` | `"inst456"` |
| `place.Institution_name` | ✅ "Hôpital du Valais (HVS)" |
| Template | ✅ Affiche directement Institution_name |

---

## 🔧 Logs de Debug

### Console Logs Ajoutés

```javascript
console.log('[DEBUG] Première assignation enrichie:', enrichedAssignments[0])
console.log('[DEBUG] InstitutionId:', enrichedAssignments[0].InstitutionId)
console.log('[DEBUG] Institution_name:', enrichedAssignments[0].Institution_name)
```

### Attendu
```
[DEBUG] Première assignation enrichie: {
  IDPlace: "place123",
  InstitutionId: "inst456",
  Institution_name: "Hôpital du Valais (HVS)",
  NomPlace: "Gériatrie",
  ...
}
[DEBUG] InstitutionId: inst456
[DEBUG] Institution_name: Hôpital du Valais (HVS)
```

---

## 🧪 Tests

### Test 1: Vérifier l'Affichage
```
1. Se connecter en tant qu'étudiant avec assignation publiée
2. Aller sur le profil
3. Vérifier que le nom de l'institution s'affiche correctement
4. Ne devrait PLUS afficher "Institution inconnueee"
```

### Test 2: Vérifier les Logs
```
1. Ouvrir la console (F12)
2. Recharger la page
3. Chercher les logs [DEBUG]
4. Vérifier que Institution_name est rempli
```

### Test 3: Bouton "Voir les Détails"
```
1. Cliquer sur "Voir les détails"
2. Vérifier que la page de l'institution s'ouvre
3. Vérifier que c'est la BONNE institution
```

---

## ⚠️ Points d'Attention

### Si Institution_name est Vide

L'enrichissement des places depuis `placesStore.js` doit fonctionner :

```javascript
// Dans placesStore.js
const institution = institutionsMap[place.InstitutionId];
place.Institution_name = institution?.Name || place.Institution || 'N/A';
```

### Vérifier que :
1. ✅ `institutions` sont chargées dans le store
2. ✅ `placesStore.fetchPlaces()` fait le JOIN avec institutions
3. ✅ Le champ `Name` existe dans la table `institutions`

---

## 🔍 Diagnostic

### Si le Problème Persiste

1. **Vérifier les logs console** :
   ```
   [DEBUG] Institution_name: ???
   ```

2. **Vérifier que institutions sont chargées** :
   ```javascript
   console.log('Institutions:', institutionsStore.institutions)
   ```

3. **Vérifier le mapping** :
   ```sql
   SELECT 
     p.PlaceId,
     p.NomPlace,
     p.InstitutionId,
     i.Name as InstitutionName
   FROM places p
   LEFT JOIN institutions i ON p.InstitutionId = i.InstitutionId;
   ```

---

## 📝 Checklist de Validation

- [x] Enrichir assignations avec InstitutionId
- [x] Enrichir assignations avec Institution_name
- [x] Modifier template pour utiliser Institution_name
- [x] Fallback sur getInstitutionNameById avec bon ID
- [x] Corriger bouton "Voir les détails"
- [x] Ajouter logs de debug
- [x] Documentation complète

---

## 🎯 Résumé

### Problème
❌ `getInstitutionNameById(place.IDPlace)` cherchait avec un PlaceId au lieu d'un InstitutionId

### Solution
✅ Utiliser directement `place.Institution_name` qui est enrichi lors du chargement des places

### Fallback
✅ Si Institution_name vide, utiliser `getInstitutionNameById(place.InstitutionId)` avec le BON ID

---

**Date**: 11 décembre 2025  
**Statut**: ✅ Corrigé  
**Auteur**: Cascade AI
