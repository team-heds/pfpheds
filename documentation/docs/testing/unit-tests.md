# Tests unitaires (Vue + Vitest)

## Installation

```bash
npm install
```

## Lancer les tests

```bash
npm run test:unit
```

Mode watch :

```bash
npm run test:unit:watch
```

## Emplacement des tests

- Tests: `tests/unit/**/*.spec.js`
- Setup global: `tests/setup.js`

## Exemple déjà en place

`tests/unit/weeklyPlanningAdminView.spec.js` couvre :
- `splitTeachers` (chunks de 6)
- `getSelectedYearLabel`
- validation `saveSlot` (horaires obligatoires)
- defaults pour le jour `distance`

## Propositions de tests à ajouter

### WeeklyPlanningAdminView.vue
1. **Chargement initial**
   - `loadYearOptions` fixe `selectedYear` si invalide.
   - `loadPlanningForCurrentView` appelle la bonne fonction selon `viewMode`.

2. **Formulaire créneau**
   - `saveSlot` normalise `teachers` (objets → nom).
   - `deleteSlot` appelle `planningService.deleteTimeSlot` et recharge.
   - `performDuplicate` appelle `planningService.duplicateWeek` et recharge si nécessaire.

3. **Affichage enseignants (UI)**
   - si `teachers.length > 6`, badge `+X` affiché et seuls 6 chips visibles.

4. **Export Excel (helpers)**
   - `getCourseRowHeight` s’adapte au texte long.
   - `getTeachersRowHeight` utilise le nom le plus long.

## Ajouter un nouveau test

1. Créer un fichier dans `tests/unit/` (ex: `myComponent.spec.js`).
2. Importer le composant :

```js
import { mount } from '@vue/test-utils'
import Component from '@/views/.../Component.vue'
```

3. Mocker les services externes avec `vi.mock()`.

## Notes

- Les composants PrimeVue sont stubés dans `tests/setup.js`.
- Les tests unitaires sont rapides et évitent d’appeler Supabase/HTTP.
