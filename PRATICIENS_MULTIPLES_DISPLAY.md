# 👥 Affichage des Praticiens Formateurs Multiples

## 🎯 Nouvelle Fonctionnalité

Affichage de **TOUS les praticiens formateurs** configurés pour chaque place (configurés dans PlacesViewPHYFP.vue).

---

## ✨ Différence avec Avant

### Avant (Version 1.0)
```
❌ Affichait UN SEUL praticien (celui assigné à l'étudiant)
❌ Ne montrait pas tous les praticiens disponibles
```

### Après (Version 2.0)
```
✅ Affiche TOUS les praticiens configurés pour la place
✅ Badge indiquant le nombre si plusieurs praticiens
✅ Liste complète avec noms et emails cliquables
```

---

## 📊 Affichage dans le Tableau

### Cas 1: Un Seul Praticien
```
┌──────────────────────────┐
│ Praticiens Formateurs    │
├──────────────────────────┤
│ Jean Martin              │
│ ✉️ jean.martin@...       │
└──────────────────────────┘
```

### Cas 2: Plusieurs Praticiens
```
┌──────────────────────────┐
│ Praticiens Formateurs    │
├──────────────────────────┤
│ [2 praticiens] (badge)   │
│                          │
│ Jean Martin              │
│ ✉️ jean.martin@...       │
│                          │
│ Sophie Dubois            │
│ ✉️ s.dubois@...          │
└──────────────────────────┘
```

### Cas 3: Aucun Praticien
```
┌──────────────────────────┐
│ Praticiens Formateurs    │
├──────────────────────────┤
│ ⚠️ Non configuré         │
└──────────────────────────┘
```

---

## 🔗 Lien avec PlacesViewPHYFP.vue

### Configuration dans PlacesViewPHYFP

```vue
<MultiSelect 
  :modelValue="data.praticiensFormateurs || []" 
  @update:modelValue="v => onChangeArray(data, 'praticiensFormateurs', v)" 
  :options="praticiensOptions" 
  optionLabel="label" 
  optionValue="id" 
  display="chip" 
/>
```

### Résultat en Base de Données

```javascript
{
  "PlaceId": "place123",
  "NomPlace": "Gériatrie",
  "praticiensFormateurs": [
    "prat456",   // Jean Martin
    "prat789",   // Sophie Dubois
    "prat012"    // Pierre Dupont
  ]
}
```

---

## 🔄 Processus de Chargement

### Dans PlacesAssignmentView

```javascript
// 1. Charger toutes les places
const { data: placesData } = await supabase
  .from('places')
  .select('*')

// 2. Charger tous les praticiens
const { data: praticiensData } = await supabase
  .from('praticiens_formateurs')
  .select('*')

// 3. Pour chaque assignation
for (result of results) {
  // Trouver la place
  const place = places.find(p => p.PlaceId === result.assigned_place_id)
  
  // Récupérer les IDs des praticiens configurés
  const praticiensIds = place.praticiensFormateurs || []
  
  // Récupérer les infos complètes de chaque praticien
  const praticiensFormateurs = praticiensIds.map(id => {
    const praticien = praticiens.find(p => p.id === id)
    return {
      nom: `${praticien.prenom} ${praticien.nom}`,
      mail: praticien.mail,
      id: id
    }
  })
  
  // Ajouter au résultat
  result.praticiensFormateurs_list = praticiensFormateurs
  result.praticiens_count = praticiensFormateurs.length
}
```

---

## 🎨 Affichage UI

### Badge Nombre de Praticiens
```vue
<Tag 
  v-if="praticiensFormateurs_list.length > 1"
  :value="`${praticiensFormateurs_list.length} praticiens`" 
  severity="info" 
  size="small" 
/>
```

### Liste des Praticiens
```vue
<div v-for="praticien in praticiensFormateurs_list" :key="praticien.id">
  <div class="font-semibold">{{ praticien.nom }}</div>
  <small v-if="praticien.mail">
    <i class="pi pi-envelope"></i>
    <a :href="`mailto:${praticien.mail}`">
      {{ praticien.mail }}
    </a>
  </small>
</div>
```

### Si Pas de Praticien
```vue
<div class="text-400 italic">
  <i class="pi pi-exclamation-triangle"></i>
  Non configuré
</div>
```

---

## 📤 Export CSV Amélioré

### Colonnes Ajoutées

| Colonne | Description | Exemple |
|---------|-------------|---------|
| **Praticiens Formateurs** | Noms séparés par virgules | "Jean Martin, Sophie Dubois" |
| **Emails Praticiens** | Emails séparés par virgules | "jean@..., sophie@..." |
| **Nb Praticiens** | Nombre total | 2 |

### Format CSV
```csv
Nom,Prénom,Place,Institution,Praticiens Formateurs,Emails Praticiens,Nb Praticiens,Rang
DUPONT,Alice,Gériatrie,HVS,"Jean Martin, Sophie Dubois","jean@..., sophie@...",2,1er choix
MARTIN,Paul,Ortho,HFR,Pierre Dupont,pierre@...,1,2ème choix
BERNARD,Julie,Pédiatrie,CHUV,,,,1er choix
```

---

## 🔍 Variantes du Champ

Le système cherche le champ praticiens dans plusieurs variantes :

```javascript
const praticiensIds = place?.praticiensFormateurs ||   // Camel case
                     place?.praticiens_formateurs ||   // Snake case
                     place?.PraticiensFormateurs ||    // Pascal case
                     []
```

---

## 🐛 Debugging

### Logs Console

Lors du chargement de la première ligne :
```
[PRATICIEN DEBUG] Structure de la place: {
  PlaceId: "place123",
  NomPlace: "Gériatrie",
  praticiensFormateurs: ["prat456", "prat789"],
  keys: ["praticiensFormateurs"]
}
```

### Vérifier les Données

```sql
-- Dans Supabase SQL Editor
SELECT 
  "PlaceId",
  "NomPlace",
  "praticiensFormateurs"
FROM places
WHERE "praticiensFormateurs" IS NOT NULL
LIMIT 10;
```

---

## 🎯 Cas d'Usage

### Cas 1: Place avec Rotation de Praticiens
```
Une place a 3 praticiens qui alternent l'encadrement
→ Les 3 sont affichés
→ L'admin voit toutes les options
```

### Cas 2: Place sans Praticien Configuré
```
Une place n'a pas encore de praticien assigné
→ Affiche "⚠️ Non configuré"
→ Alerte visuelle pour l'admin
```

### Cas 3: Export pour Communication
```
Admin veut contacter tous les praticiens d'une place
→ Export CSV avec tous les emails
→ Copier-coller facile pour envoi groupé
```

---

## 📊 Structure des Données Enrichies

### Champs Ajoutés à Chaque Résultat

```javascript
{
  // ... autres champs ...
  
  // NOUVEAU: Liste complète des praticiens
  praticiensFormateurs_list: [
    {
      nom: "Jean Martin",
      mail: "jean.martin@example.com",
      id: "prat456"
    },
    {
      nom: "Sophie Dubois", 
      mail: "s.dubois@example.com",
      id: "prat789"
    }
  ],
  
  // NOUVEAU: Texte pour affichage simple
  praticien_formateur_nom: "Jean Martin, Sophie Dubois",
  
  // NOUVEAU: Emails pour affichage
  praticien_formateur_mail: "jean.martin@..., s.dubois@...",
  
  // NOUVEAU: Compteur
  praticiens_count: 2
}
```

---

## ✨ Améliorations par Rapport à V1

### 1. **Visibilité Complète**
- ✅ Tous les praticiens configurés visibles
- ✅ Pas seulement celui assigné à l'étudiant

### 2. **Information Contexte**
- ✅ Badge avec nombre total
- ✅ Emails cliquables
- ✅ Alerte si non configuré

### 3. **Export Amélioré**
- ✅ Tous les praticiens dans le CSV
- ✅ Colonne dédiée au nombre
- ✅ Facile à analyser

### 4. **Robustesse**
- ✅ Gère plusieurs variantes de nom de champ
- ✅ Fallback si praticien non trouvé
- ✅ Logs de debug intégrés

---

## 🔄 Compatibilité

### Avec PlacesViewPHYFP
✅ Lit directement le champ `praticiensFormateurs` configuré

### Avec Ancien Système
✅ Cherche aussi dans `praticiens_formateurs` (snake_case)

### Avec Données Manquantes
✅ Affiche "Non configuré" au lieu de crasher

---

## 🧪 Tests

### Test 1: Place avec 1 Praticien
```
1. Configurer 1 praticien dans PlacesViewPHYFP
2. Assigner la place à un étudiant
3. Voir PlacesAssignmentView
4. Vérifier affichage du praticien avec email
```

### Test 2: Place avec 3 Praticiens
```
1. Configurer 3 praticiens dans PlacesViewPHYFP
2. Assigner la place à un étudiant
3. Voir PlacesAssignmentView
4. Vérifier badge "3 praticiens"
5. Vérifier liste des 3 noms et emails
```

### Test 3: Place sans Praticien
```
1. Ne pas configurer de praticien
2. Assigner la place à un étudiant
3. Voir PlacesAssignmentView
4. Vérifier "⚠️ Non configuré"
```

### Test 4: Export CSV
```
1. Assigner plusieurs places avec praticiens
2. Exporter en CSV
3. Vérifier colonnes praticiens
4. Vérifier format des données
```

---

## 📝 Logs à Vérifier

### Chargement
```
[4/6] Chargement des places...
[OK] 32 places chargées

[3/6] Chargement des praticiens formateurs...
[OK] 45 praticiens chargés
```

### Debug Première Place
```
[PRATICIEN DEBUG] Structure de la place: {
  PlaceId: "...",
  NomPlace: "...",
  praticiensFormateurs: [...],
  keys: [...]
}
```

---

## 🎓 Résumé

### Pour les Admins
- ✅ Vue complète de tous les praticiens par place
- ✅ Identification facile des places sans praticien
- ✅ Export complet pour communication

### Pour l'Organisation
- ✅ Traçabilité complète de l'encadrement
- ✅ Planification facilitée
- ✅ Gestion des rotations de praticiens

---

**Date**: 11 décembre 2025  
**Version**: 2.0  
**Statut**: ✅ Fonctionnel  
**Auteur**: Cascade AI
