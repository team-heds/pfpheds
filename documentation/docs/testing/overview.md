---
title: Tests et assurance qualité
---

## État réel de la suite de tests (mesuré le 2026-07-17)

```bash
npm run test:unit
```

**7 fichiers de test en échec sur 41, 54 tests individuels en échec sur 876** (~6%). Ce n'est pas une suite entièrement verte — une entreprise reprenant le projet ne doit pas supposer que `npm run test:unit` passe intégralement.

### Fichiers actuellement en échec

```
tests/unit/authStore.spec.js               — 24 tests, tous en échec
tests/unit/resultatVotationService.spec.js  — erreur de setup (fichier entier)
tests/unit/useVotationSession.spec.js       — 2 tests
tests/unit/userStore.spec.js                — 1 test
tests/unit/votationSessionService.spec.js   — 6 tests
tests/unit/votesStore.spec.js               — 5 tests
tests/unit/weeklyPlanningAdminView.spec.js  — 9 tests
```

### Cause racine identifiée pour plusieurs échecs

Le mock du client Supabase utilisé dans les tests ne reproduit pas toute la surface chaînable du vrai query builder — en particulier `.not()` :

```
TypeError: supabase.from(...).select(...).eq(...).eq(...).not is not a function
```

Le mock a été construit pour couvrir `.eq()`, `.select()`, `.order()` etc. mais pas systématiquement toutes les méthodes de filtrage utilisées dans le code réel (`VotationGenericView.vue`). **Deux solutions pour une reprise** : soit étendre le mock (`tests/setup.js` ou l'helper de mock Supabase local aux tests concernés) pour couvrir `.not()`, soit passer à une librairie de mock plus complète type `supabase-js` testing helpers officiels.

`authStore.spec.js` échoue en bloc (24/24) — probablement un problème de setup/import cassé plutôt que 24 bugs logiques distincts ; à investiguer en priorité car c'est le store qui couvre toute l'authentification (voir `auth/overview.md`).

## Structure de la suite

```
tests/
  unit/          — 41 fichiers .spec.js, Vitest
  e2e/           — 3 fichiers .spec.js, Playwright (accessibility, app, navigation)
  setup.js       — setup global Vitest
```

## Configuration Vitest réelle (`vite.config.js`)

```js
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./tests/setup.js'],
  include: ['tests/unit/**/*.spec.js'],
  css: true,
  coverage: {
    provider: 'v8',
    reporter: ['text', 'text-summary', 'html'],
    reportsDirectory: './coverage',
    include: ['src/stores/**', 'src/service/**', 'src/composables/**'],
    exclude: ['node_modules/', 'tests/', 'src/**/*.vue'],
  },
}
```

**Point important** : la couverture de code (`npm run test:coverage`) exclut explicitement tous les fichiers `.vue` (`src/**/*.vue`). Elle ne mesure que `src/stores/`, `src/service/`, `src/composables/` — soit une fraction du code (les 280 composants Vue et 223 vues ne sont jamais comptés dans le pourcentage de couverture affiché). Ne pas se fier au pourcentage de couverture global comme s'il représentait toute l'application.

## Configuration Playwright (e2e)

```js
testDir: './tests/e2e',
baseURL: 'http://localhost:5172',
webServer: { command: 'npm run dev', url: 'http://localhost:5172' }
```

Un seul navigateur testé (Chromium). Le serveur de dev (`npm run dev`) doit démarrer sur le port `5172` — si le port par défaut de Vite a changé ailleurs dans le projet, ce fichier doit être mis à jour en cohérence.

```bash
npm run test:e2e       # headless
npm run test:e2e:ui    # mode interactif Playwright
```

## Commandes

```bash
npm run test:unit          # vitest --run (une passe, CI-friendly)
npm run test:unit:watch    # vitest (mode watch, dev local)
npm run test:coverage      # vitest --run --coverage
npm run test:e2e           # playwright test
npm run test:e2e:ui        # playwright test --ui
```

## Ce que couvrent réellement les tests unitaires (échantillon des 41 fichiers)

Majoritairement des **stores Pinia** et **services métier** du domaine formation pratique/votation : `authStore`, `institutionsStore`, `placesStore`, `votesStore`, `eventStore`, `feedbackaStore`, `postsStore`, `praticiensStore`, `academicYearService`, `planningService`, `resultatVotationService`, `studentsService`, `ticketService`, `rolesService`, `gamificationServiceSupabase`, `computePriorityScore` (logique de l'algorithme d'attribution, voir `domains/votation-algorithm.md`), plus quelques composables (`useAcademicYear`, `useAutoRefresh`, `useDataRefresh`) et une poignée de vues complexes testées directement (`weeklyPlanningAdminView`, `studentListView`, `managementRepondantVotationPHYFP`).

**Aucun test ne couvre** : la couche `components/` (280 composants), la majorité des `views/` (223 vues, seules quelques-unes de complexité algorithmique sont testées), le backend Express (`backend/`), les policies RLS Supabase.

## Réflexe pour une reprise externe

1. Ne pas considérer `npm run test:unit` comme un vrai gate CI tant que les 7 fichiers listés plus haut ne sont pas corrigés — actuellement, un échec de ces tests spécifiques ne doit pas bloquer un déploiement (mais un NOUVEL échec ailleurs le devrait).
2. Ajouter des tests sur `backend/` et les policies RLS avant de considérer la couverture actuelle comme représentative.
3. Étendre le mock Supabase (cause racine ci-dessus) est probablement le correctif le plus rentable pour repasser plusieurs fichiers au vert rapidement.
