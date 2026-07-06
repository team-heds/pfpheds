---
title: Bibliothèque de composants - communs et UI
---

## Répertoires concernés

- `src/components/common/`
- `src/components/ui/`

## Familles communes observées

### Feedback / états

- `AppSkeleton.vue`
- `AppSpinner.vue`
- `EmptyState.vue`
- `ErrorInline.vue`

Usage :

- chargement ;
- absence de données ;
- erreur locale ;
- feedback visuel standard.

### Filtres

- `FilterSidebar.vue`
- `FilterInstitution.vue`
- `FiltreMap.vue`

Usage :

- filtrage transverse ;
- filtres institution/cartographie ;
- navigation contextuelle.

### Formulaires

- `AuthForm.vue`

Usage :

- auth et formulaires simples structurés.

### Utilitaires UI

- `Error404.vue`
- `Footer.vue`
- `GlobalSearch.vue`
- `HeaderIcons.vue`
- `Loader.vue`
- `MobileBottomNav.vue`
- `Navbar.vue`
- `PwaInstallPrompt.vue`
- `SearchResults.vue`
- `VersionningComponent.vue`

### UI générique

- `BlockViewer.vue`
- `QrCodeGenerator.vue`
- `ButtonNavbar.vue`
- `SearchButton.vue`
- `SwitchColor.vue`

## Réflexes de reprise

Quand un composant est purement réutilisable, documenter :

- props ;
- emits ;
- dépendances à PrimeVue / styles ;
- dépendances à des stores si elles existent ;
- usages principaux dans les vues.

## Piège courant

Des composants apparemment “UI” peuvent déjà embarquer une logique métier légère. Vérifier avant de les traiter comme purement présentatifs.
