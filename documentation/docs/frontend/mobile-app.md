---
title: Application mobile
---

# Application mobile (coque et onglets)

Sous 768 px de large et une fois connecté, `src/App.vue` affiche `MobileAppShell` à la place du `<router-view />` habituel. Au-dessus de cette largeur, ou sur les pages publiques (`meta.hideMobileNav`, `meta.immersive`), rien ne change.

## Partage des adresses

Mobile et ordinateur utilisent **les mêmes routes**. La coque regarde la route courante :

- si un écran mobile existe pour cette route, elle l'affiche : onglets gardés en mémoire (table `NATIVE_SCREENS` de `MobileAppShell.vue` : `FeedView` → `HomeTab`, `Institution` → `InstitutionsTab`) ou écrans empilés (table `NATIVE_PAGES` : `InstitutionView` → `InstitutionDetailScreen`) ;
- sinon elle affiche la page existante dans son cadre (`MobilePage`), avec titre et bouton retour.

Refaire un onglet pour le téléphone revient à écrire son écran dans `src/mobile/<onglet>/` et à l'ajouter à cette table.

## Onglets et état

- `src/mobile/shell/tabs.js` : les cinq onglets, pictogrammes seuls, dans l'ordre Carte, Institutions, Accueil, Recherche, Profil (photo de profil sur le dernier) et la règle qui range chaque adresse dans un onglet. Une adresse sans onglet attitré reste dans l'onglet courant.
- `src/mobile/shell/mobileShellStore.js` : onglet actif, pile d'écrans de chaque onglet, panneaux ouverts. Le magasin ne navigue pas : il indique où aller (`tabTarget`, `backTarget`) et se met à jour après chaque navigation (`syncRoute`).
- Les pages restent en mémoire (`KeepAlive`, 8 au maximum) ; l'accueil reste monté. Chaque écran a sa propre zone de défilement, dont la position est gardée (`useKeptScroll`).

## Écrans empilés et panneaux du bas

Les panneaux (`BottomSheet`) et écrans empilés (`MobileStackScreen`, avec une présentation `modal` plein écran pour la création de publication ou de story) sont déclarés dans `overlayRegistry.js` et ouverts avec `useMobileShell().open(nom, données)`. Leur nom est écrit dans l'ancre de l'adresse (`/feed#/commentaires`) : le bouton ou le geste retour du téléphone les ferme. Après un rechargement, seuls ceux marqués `restorable` se rouvrent.

## Règles d'interface

- Couleurs : variables `--m-*` définies sur `.m-shell`, dérivées du thème PrimeVue (clair et sombre).
- Cibles tactiles de 44 px au minimum (`.m-icon-button`), champs de saisie à 16 px, zones sûres respectées.
- Une page plein écran qui apporte son propre en-tête déclare `meta.mobileChrome: 'none'`.

## Onglet Institutions

`src/mobile/institutions/` : trois vues dans un même onglet (Institutions, Mes stages, Documents), chacune avec sa zone de défilement. La liste réutilise `institutionsStore`, `placesStore` et `institutionFiltersService` ; les filtres s'ouvrent dans un panneau du bas et sont gardés dans `mobileInstitutionsStore`. « Mes stages » reprend le calcul du profil (`utils/profileStages`), « Documents » le magasin `documentStore`. La fiche d'une institution est un écran empilé sur la route `/institution/:id`.

## Tests

`tests/unit/mobileShellStore.spec.js`, `mobileShellComponents.spec.js`, `mobileHomeHelpers.spec.js`, `mobileInstitutions.spec.js`, `responsiveNavigation.spec.js`.
