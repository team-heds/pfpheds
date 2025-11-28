# Composant CreatePlaceDialog

## Description
Composant modal pour créer une nouvelle place de formation pratique (PFP).

## Utilisation

```vue
<template>
  <div>
    <Button label="Créer une place" @click="showDialog = true" />
    
    <CreatePlaceDialog
      v-model:visible="showDialog"
      :selected-year="2025"
      @created="onPlaceCreated"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CreatePlaceDialog from '@/components/admin/places/CreatePlaceDialog.vue'

const showDialog = ref(false)

function onPlaceCreated(place) {
  console.log('Nouvelle place créée:', place)
  // Faire quelque chose avec la place créée (ex: recharger la liste)
}
</script>
```

## Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `visible` | Boolean | - | Contrôle la visibilité du dialog (v-model) |
| `selectedYear` | String | '2025' | Année pour les valeurs PFP et remarques |

## Events

| Event | Payload | Description |
|-------|---------|-------------|
| `update:visible` | Boolean | Émis quand le dialog est fermé/ouvert |
| `created` | Object | Émis après la création réussie d'une place avec les données de la place créée |

## Champs du formulaire

### Informations de base (requis)
- **Nom de la place** * - Nom descriptif de la place
- **Institution** * - Institution associée (dropdown avec recherche)
  - Format d'affichage: `{Name} {Locality} ({Canton})`
  - Ex: "HUG Genève (GE)"
  - Chargement automatique depuis la table `institutions` de Supabase
  - Bouton de rechargement 🔄 disponible
- **Canton** - Canton de la place (hérité de l'institution si vide)
- **Localité** - Ville/localité (hérité de `Locality` de l'institution si vide)
- **Adresse** - Adresse complète (optionnel)
- **NPA** - Code postal (optionnel)

### Critères (checkboxes)
- MSQ
- SYSINT
- AIGU
- REHAB
- AMBU
- NEUROGER

### Langues (checkboxes)
- Français (FR)
- Allemand (DE)
- Italien (IT)
- Anglais (ENG)

### Nombre de places par module
Pour l'année sélectionnée:
- PFP1A
- PFP1B
- PFP2
- PFP3
- PFP4

### Autres
- **Praticiens formateurs** - Multi-sélection des praticiens
- **Remarques** - Texte libre pour l'année sélectionnée
- **Fichier PDF** - URL vers un fichier descriptif (optionnel)

## Validation

Seuls les champs **Nom de la place** et **Institution** sont obligatoires.

## Style

Le composant utilise le thème sombre (`fp-dark`) cohérent avec le reste de l'application Places.

## Dépendances

- PrimeVue (Dialog, InputText, Dropdown, Checkbox, MultiSelect, Textarea, Button)
- Stores Pinia:
  - `placesStore` - Pour créer la place
  - `institutionsStore` - Pour la liste des institutions
  - `praticiensFormateursStore` - Pour la liste des praticiens formateurs

## Notes

- L'ID de la place est généré automatiquement au format Firebase-like: `-NxxxYYYzzz...`
- Les champs de l'institution sont copiés automatiquement dans la place (voir Mapping ci-dessous)
- Le formulaire est réinitialisé automatiquement après la création
- Les données PFP et Remarques sont stockées en JSONB par année

## Mapping des champs institutions → places

Lors de la création, certains champs de l'institution sélectionnée sont **automatiquement copiés** dans la nouvelle place:

| Champ institutions | → | Champ places | Note |
|-------------------|---|--------------|------|
| `Name` | → | `InstitutionName` | Nom de l'institution |
| `Canton` | → | `Canton` | Canton (peut être modifié) |
| `Locality` | → | `Lieu` | ⚠️ Noms différents! |
| `Category` | → | `Categorie` | ⚠️ Noms différents! |
| `AccordCadreDate` | → | `AccordCadreDate` | Date accord cadre |
| `ConventionDate` | → | `ConventionDate` | Date convention |

**Note importante**: Les champs `Locality` et `Category` de la table `institutions` sont copiés vers `Lieu` et `Categorie` dans la table `places` (différence de nommage).

Pour plus de détails sur le mapping complet, voir le fichier `SCHEMA-MAPPING.md` à la racine du projet.
