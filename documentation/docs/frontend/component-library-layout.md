---
title: Bibliothèque de composants - layout global
---

## Répertoire principal

- `src/layout/`

## Composants observés

- `AppLayout.vue`
- `AppSidebar.vue`
- `AppTopbar.vue`
- `AppMenu.vue`
- `AppMenuItem.vue`
- `AppSubMenu.vue`
- `AppBreadcrumb.vue`
- `AppProfileSidebar.vue`
- `AppConfig.vue`
- `AppDarkAndLightMode.vue`

## Rôle global

Ces composants portent la structure de navigation principale :

- shell de l'application ;
- sidebar ;
- topbar ;
- menus ;
- configuration visuelle ;
- navigation secondaire.

## Composants structurants

### `AppLayout.vue`

Point d'ancrage du layout principal. À auditer en premier quand un problème touche :

- structure générale ;
- overlays ;
- comportement responsive ;
- injection de slot/page.

### `AppSidebar.vue`

Responsable de la navigation latérale, directement liée au menu applicatif.

### `AppTopbar.vue`

Responsable des actions hautes, accès utilisateur, recherche ou raccourcis selon la configuration courante.

### `AppMenu.vue` / `AppMenuItem.vue` / `AppSubMenu.vue`

Portent la logique de rendu du menu et de ses sous-niveaux.

## Réflexes de maintenance

Quand un bug touche la navigation :

1. vérifier la route active ;
2. vérifier le layout ;
3. vérifier la sidebar ;
4. vérifier les composants de menu ;
5. vérifier ensuite les permissions ou le masquage de certaines entrées.
