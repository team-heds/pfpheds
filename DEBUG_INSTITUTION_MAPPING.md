# 🔍 Debug: Mapping Institutions

## 🐛 Problème Actuel

Affichage de "N/A" au lieu du nom de l'institution.

---

## 📊 Structure des Tables

### Table `institutions`
```javascript
{
  "InstitutionId": "-Neh_Ttrz8anl_WDKqed",  // ← Format Firebase
  "Name": "Cabinet des Vergers Raval Sàrl",
  "Address": "Route de Sierre 14",
  "Locality": "Miège",
  ...
}
```

### Table `places`
```javascript
{
  "PlaceId": "???",
  "NomPlace": "Gériatrie",
  "InstitutionId": "-Neh_Ttrz8anl_WDKqed",  // ← Doit correspondre
  "Institution": "Cabinet des Vergers Raval Sàrl",  // ← Ancien champ texte
  ...
}
```

### Table `student_result_vote`
```javascript
{
  "id": "result123",
  "assigned_place_id": "place456",
  "assigned_place_name": "Gériatrie",
  "assigned_institution_name": "Cabinet des Vergers Raval Sàrl",  // ← Copié lors de l'assignation
  ...
}
```

---

## 🔍 Diagnostic

### Étape 1: Vérifier les Données SQL

```sql
-- 1. Vérifier que les institutions sont bien dans la table
SELECT "InstitutionId", "Name", "Locality" 
FROM institutions 
LIMIT 5;

-- 2. Vérifier les places et leurs InstitutionId
SELECT "PlaceId", "NomPlace", "InstitutionId", "Institution"
FROM places 
LIMIT 10;

-- 3. Vérifier le JOIN
SELECT 
  p."PlaceId",
  p."NomPlace",
  p."InstitutionId",
  p."Institution" as old_institution_name,
  i."Name" as new_institution_name
FROM places p
LEFT JOIN institutions i ON p."InstitutionId" = i."InstitutionId"
LIMIT 10;

-- 4. Vérifier les assignations publiées
SELECT 
  user_id,
  assigned_place_id,
  assigned_place_name,
  assigned_institution_name,
  status
FROM student_result_vote
WHERE status = 'published'
LIMIT 5;
```

---

## 🔍 Logs Console à Vérifier

### 1. Dans PlacesStore (au chargement)

```
📊 Institutions map: { 
  "-Neh_Ttrz8anl_WDKqed": { Name: "Cabinet des Vergers...", ... },
  ...
}

📍 Place: Gériatrie → Institution: ??? (InstitutionId: ???)
📍 Place: Ortho → Institution: ??? (InstitutionId: ???)

✅ Places chargées: 32
✅ Institutions chargées: 15
✅ Exemple de place: { 
  PlaceId: "...",
  NomPlace: "...",
  InstitutionId: "...",
  Institution_name: "???"  ← VÉRIFIER CE CHAMP
}
```

### 2. Dans VotationResultProfil (enrichissement)

```
[ENRICH] Traitement assignation: {
  assigned_place_id: "place123",
  assigned_place_name: "Gériatrie",
  assigned_institution_name: "???"  ← VÉRIFIER
}

[ENRICH] Place trouvée: {
  PlaceId: "place123",
  NomPlace: "Gériatrie",
  InstitutionId: "???"  ← VÉRIFIER
  Institution: "???",
  Institution_name: "???"  ← VÉRIFIER
}

[ENRICH] Résultat enrichi - Institution_name: ???  ← PROBLÈME ICI
```

---

## 🎯 Cas Possibles

### Cas 1: InstitutionId Vide dans Places
**Problème**: `place.InstitutionId` est `null` ou vide

**Solution**:
```sql
-- Vérifier combien de places n'ont pas d'InstitutionId
SELECT COUNT(*) 
FROM places 
WHERE "InstitutionId" IS NULL OR "InstitutionId" = '';

-- Si beaucoup, vérifier le champ Institution (ancien système)
SELECT "PlaceId", "NomPlace", "Institution"
FROM places
WHERE "InstitutionId" IS NULL
LIMIT 10;
```

**Fix Temporaire dans le Code**:
```javascript
// Dans assignedPlacesFromPublished
Institution_name: place.Institution_name || 
                  place.Institution ||  // ← Fallback sur ancien champ
                  assignment.assigned_institution_name || 
                  'Institution inconnue'
```

### Cas 2: InstitutionId Ne Correspond Pas
**Problème**: Le InstitutionId dans places ne match pas celui dans institutions

**Vérification**:
```sql
-- Trouver les places avec InstitutionId invalide
SELECT p."PlaceId", p."NomPlace", p."InstitutionId"
FROM places p
LEFT JOIN institutions i ON p."InstitutionId" = i."InstitutionId"
WHERE p."InstitutionId" IS NOT NULL 
  AND i."InstitutionId" IS NULL;
```

### Cas 3: assigned_institution_name Vide dans student_result_vote
**Problème**: Lors de l'attribution, le nom n'a pas été copié

**Vérification**:
```sql
SELECT 
  id,
  assigned_place_name,
  assigned_institution_name,
  status
FROM student_result_vote
WHERE status = 'published'
  AND (assigned_institution_name IS NULL OR assigned_institution_name = '');
```

**Fix**: Ré-exécuter l'algorithme ou mettre à jour manuellement:
```sql
UPDATE student_result_vote srv
SET assigned_institution_name = (
  SELECT COALESCE(i."Name", p."Institution", 'N/A')
  FROM places p
  LEFT JOIN institutions i ON p."InstitutionId" = i."InstitutionId"
  WHERE p."PlaceId" = srv.assigned_place_id
)
WHERE assigned_institution_name IS NULL OR assigned_institution_name = '';
```

---

## 🔧 Solutions

### Solution 1: Utiliser assigned_institution_name d'Abord

Dans `VotationResultProfil.vue`, prioriser le champ de `student_result_vote` :

```javascript
Institution_name: assignment.assigned_institution_name ||  // ← EN PREMIER
                  place.Institution_name || 
                  place.Institution || 
                  'Institution inconnue'
```

### Solution 2: Vérifier le Champ Institution dans Places

Si `InstitutionId` est vide mais `Institution` (ancien champ texte) existe :

```javascript
const institutionName = institution?.Name ||  // Depuis JOIN
                       place.Institution ||   // Ancien champ texte
                       assignment.assigned_institution_name ||  // Depuis assignation
                       'Institution inconnue';
```

### Solution 3: Fix dans PlacesStore

```javascript
// Accepter aussi le champ Institution comme fallback
const institutionName = institution?.Name || 
                       place.Institution || 
                       place.InstitutionName ||  // Si existe
                       'Institution non renseignée';
```

---

## 📝 Actions Immédiates

### 1. Ouvrir la Console (F12)

Chercher les logs :
```
📊 Institutions map: ...
📍 Place: ... → Institution: ...
[ENRICH] Place trouvée: ...
[ENRICH] Résultat enrichi - Institution_name: ...
```

### 2. Partager les Logs

Pour que je puisse diagnostiquer, partagez :
- Le contenu de "Institutions map"
- Un exemple de "Place trouvée"
- La valeur de "Institution_name" finale

### 3. Exécuter les Requêtes SQL

Dans Supabase SQL Editor, exécuter :
```sql
-- Vérifier le mapping
SELECT 
  p."PlaceId",
  p."NomPlace",
  p."InstitutionId",
  p."Institution",
  i."Name" as InstitutionName
FROM places p
LEFT JOIN institutions i ON p."InstitutionId" = i."InstitutionId"
WHERE p."PlaceId" IN (
  SELECT assigned_place_id 
  FROM student_result_vote 
  WHERE status = 'published'
  LIMIT 5
);
```

---

## ✅ Checklist de Vérification

- [ ] Institutions chargées dans institutionsStore
- [ ] Places chargées avec Institution_name enrichi
- [ ] InstitutionId dans places correspond à celui dans institutions
- [ ] assigned_institution_name rempli dans student_result_vote
- [ ] Console logs montrent les bonnes valeurs
- [ ] Template affiche le bon nom

---

## 🎯 Test Rapide

### Dans la Console du Navigateur

```javascript
// Vérifier le store des institutions
const institutionsStore = useInstitutionsStore()
console.log('Institutions:', institutionsStore.institutions)

// Vérifier le store des places
const placesStore = usePlacesStore()
console.log('Places:', placesStore.places[0])

// Vérifier les assignations publiées
// (dans VotationResultProfil.vue)
console.log('Published assignments:', publishedAssignments.value)
console.log('Enriched assignments:', assignedPlacesFromPublished.value)
```

---

**Date**: 11 décembre 2025  
**Statut**: 🔍 En Diagnostic  
**Auteur**: Cascade AI
