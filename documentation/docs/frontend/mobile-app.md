---
title: Application mobile
---

# Application mobile (coque et onglets)

Sous 768 px de large et une fois connecté, `src/App.vue` affiche `MobileAppShell` à la place du `<router-view />` habituel. Au-dessus de cette largeur, ou sur les pages publiques (`meta.hideMobileNav`, `meta.immersive`), rien ne change.

## Partage des adresses

Mobile et ordinateur utilisent **les mêmes routes**. La coque regarde la route courante :

- si un écran mobile existe pour cette route, elle l'affiche : onglets gardés en mémoire (table `NATIVE_SCREENS` de `MobileAppShell.vue` : `FeedView` → `HomeTab`, `Institution` → `InstitutionsTab`, `Map` → `MapTab`, `MobileSearchView` → `SearchTab`, `Profile` → `ProfileTab` pour son propre profil uniquement) ou écrans empilés (table `NATIVE_PAGES` : `InstitutionView` → `InstitutionDetailScreen`) ;
- sinon elle affiche la page existante dans son cadre (`MobilePage`), avec titre et bouton retour.

Refaire un onglet pour le téléphone revient à écrire son écran dans `src/mobile/<onglet>/` et à l'ajouter à cette table.

## Onglets et état

- `src/mobile/shell/tabs.js` : les cinq onglets, pictogrammes seuls, dans l'ordre Carte, Institutions, Accueil, Recherche, Profil (photo de profil sur le dernier) et la règle qui range chaque adresse dans un onglet. Une adresse sans onglet attitré reste dans l'onglet courant.
- `src/mobile/shell/mobileShellStore.js` : onglet actif, pile d'écrans de chaque onglet, panneaux ouverts. Le magasin ne navigue pas : il indique où aller (`tabTarget`, `backTarget`) et se met à jour après chaque navigation (`syncRoute`).
- Les pages restent en mémoire (`KeepAlive`, 8 au maximum) ; l'accueil reste monté. Chaque écran a sa propre zone de défilement, dont la position est gardée (`useKeptScroll`).

## Barre d'onglets

La barre passe par-dessus le bas des écrans, ancrée au bord ; son fond couvre la zone de la barre d'accueil de l'iPhone (`--m-safe-bottom`). Chaque zone qui défile garde en bas la place de la barre (`--m-tabbar-space`), si bien que rien ne saute quand elle se cache. Elle se cache :

- en descendant de plus de 48 px dans les listes racines (fil, institutions, recherche : `useHideOnScroll`), et revient dès qu'on remonte ou en haut de la liste (`scrollHider.js`) ;
- pendant une tâche plein écran : route marquée `meta.mobileImmersive` (scanner, partie de quiz) ou écran qui appelle `useMobileImmersive` (duel en cours, mot de la semaine non terminé) ;
- quand le clavier est ouvert.

Elle reste visible sur la carte. Règles complètes : `mobile-app-rules.md`.

## Écrans empilés et panneaux du bas

Les panneaux (`BottomSheet`) et écrans empilés (`MobileStackScreen`, avec une présentation `modal` plein écran pour la création de publication ou de story) sont déclarés dans `overlayRegistry.js` et ouverts avec `useMobileShell().open(nom, données)`. Leur nom est écrit dans l'ancre de l'adresse (`/feed#/commentaires`) : le bouton ou le geste retour du téléphone les ferme. Après un rechargement, seuls ceux marqués `restorable` se rouvrent.

### Retour par glissement depuis le bord gauche

Dans l'application installée sur iPhone (`navigator.standalone`), qui n'a ni bouton retour du navigateur ni geste du système, glisser depuis les 24 px du bord gauche ramène à l'écran précédent (`useEdgeSwipeBack.js`, décision du geste dans `edgeSwipe.js`). L'écran suit le doigt ; au-delà d'un tiers de la largeur ou sur un lancer rapide, il part vers la droite, sinon il revient en place. Le geste vaut pour les écrans empilés et les écrans plein écran non modaux, jamais à la racine d'un onglet, sur un panneau du bas, sur la carte ni dans une zone qui défile de côté (`data-no-edge-swipe` pour en exclure une). Dans Safari et sur Android, le système gère déjà ce geste : il n'est pas doublé.

### Fenêtres des pages existantes

Les fenêtres PrimeVue (`Dialog`, `ConfirmDialog`) des pages affichées dans le cadre de la coque deviennent des panneaux du bas : pleine largeur, poignée, 90 % de l'écran au plus, zone sûre du bas (`mobileDialogs.css`). `useDialogsAsSheets.js` inscrit chaque fenêtre ouverte dans l'ancre (`#/fenetre`) : le retour du téléphone la ferme sans quitter la page, et on peut la tirer vers le bas par son en-tête.

### Messages

Les messages PrimeVue (`Toast`) s'affichent en bandeau compact juste au-dessus de la barre d'onglets, sur toute la largeur (`mobileToasts.css`), au lieu de couvrir le titre de l'écran.

## Application installée : portrait, démarrage, connexion

- **Portrait** : le manifeste déclare `orientation: 'portrait'` (Android). iOS l'ignore : dans l'application installée (`display-mode: standalone`), un téléphone en paysage (`pointer: coarse` et hauteur ≤ 500 px) voit l'écran « Tourne ton téléphone » (`#rotate-hint` dans `index.html`), posé par-dessus l'application sans la démonter. `MOBILE_BREAKPOINT_QUERY` inclut le paysage du téléphone : l'application mobile reste montée et rien de ce qui est saisi n'est perdu. Ajouter la classe `allow-landscape` sur `<html>` lève l'écran (photo ou vidéo plein écran).
- **Démarrage** : une image `apple-touch-startup-image` par taille d'iPhone (`public/splash/`, générées depuis le logo sur le fond de l'application), puis l'écran de chargement `#app-splash` d'`index.html`, identique, retiré en fondu par `hideAppSplash()` juste après le montage de Vue (sans fondu si moins de mouvement est demandé). Il n'existe que dans l'application installée : masqué par défaut en CSS, visible seulement sous `(display-mode: standalone)` ou avec `navigator.standalone` (classe `is-installed-app` posée dans `<head>`) ; dans un navigateur, ordinateur ou téléphone, il n'apparaît jamais et son logo n'est pas téléchargé. Le thème démarre toujours en sombre : il n'y a donc qu'une version, sombre.
- **Connexion** : sur téléphone, `LoginHome` affiche `MobileLoginScreen` (l'ordinateur garde sa page). Champs à 16 px avec `autocomplete` `username` / `current-password` (trousseau iCloud, Face ID), mot de passe affichable, bouton principal en bas qui suit le clavier, erreurs sous les champs (pas de message flottant), « Mot de passe oublié ? » en panneau du bas inscrit dans l'adresse (`#mot-de-passe-oublie`). La page de nouveau mot de passe passe en plein écran, bouton collé en bas.

## Règles d'interface

- Couleurs : variables `--m-*` définies sur `.m-shell`, dérivées du thème PrimeVue (clair et sombre).
- Cibles tactiles de 44 px au minimum (`.m-icon-button`), champs de saisie à 16 px, zones sûres respectées.
- Une page plein écran qui apporte son propre en-tête déclare `meta.mobileChrome: 'none'`.

## Onglet Institutions

`src/mobile/institutions/` : trois vues dans un même onglet (Institutions, Mes stages, Documents), chacune avec sa zone de défilement. La liste réutilise `institutionsStore`, `placesStore` et `institutionFiltersService` ; les filtres s'ouvrent dans un panneau du bas et sont gardés dans `mobileInstitutionsStore`. « Mes stages » reprend le calcul du profil (`utils/profileStages`), « Documents » le magasin `documentStore`. La fiche d'une institution est un écran empilé sur la route `/institution/:id`.

## Onglet Carte

`src/mobile/map/MapTab.vue` : carte Leaflet (fond OpenStreetMap) en plein écran, sans en-tête (`header: false` dans `nativeTabs`). Recherche et filtres flottent en haut ; les filtres sont ceux de l'onglet Institutions (`mobileInstitutionsStore`). Un appui sur un repère fait monter une fiche avec « Voir la fiche » et « Itinéraire ». La position de la personne n'est demandée qu'à l'appui sur le bouton. Une fiche ouverte depuis la carte reste dans l'onglet Carte (`adopts` dans `tabs.js`). « Voir sur la carte » (fiche d'institution) passe par `mobileMapStore`.

## Onglet Recherche

`src/mobile/search/SearchTab.vue` : champ de recherche (personnes et modules via `globalSearchService`, institutions, pages), tuiles d'accès rapide selon les réglages de gamification (`buildQuickTiles`), classement des maisons (table `houses`) et autres accès de la personne (`useNavigationDestinations`). Les modules ouverts depuis une tuile (défis, mot de la semaine, quiz, mentorat, présences) sont les pages existantes, affichées en écran empilé ; la coque masque leur titre et leur flèche de retour en double (`.game-header`).

## Écran Défis

`/challenges` s'affiche avec un écran conçu pour le téléphone (`src/mobile/challenges/`), déclaré dans `NATIVE_PAGES` ; l'ordinateur garde `ChallengesPage.vue`, téléchargée seulement si elle s'affiche (`loadWhenShown`). L'écran montre le résumé de la période, les défis de la période (à faire en tête, les plus avancés d'abord) et les derniers défis réussis. Toucher un défi à faire qui porte un lien ouvre le jeu ; les autres ouvrent leur fiche en panneau du bas (`#/defi`). États : squelettes au premier chargement, liste vide avec « Actualiser », erreur avec « Réessayer », hors ligne avec rechargement automatique au retour du réseau. Revenir sur l'écran après une minute recharge les défis.

## Onglet Profil

`src/mobile/profile/` : carte d'identité (photo, nom), puis deux vues : « Formation pratique » (mes stages, repris de l'onglet Institutions, dossier, documents) et « Progression » (maison avec son blason, niveau, série, défis, badges (`mobileProfileStore`, qui réutilise `gamificationServiceSupabase`, `challengesService`, `badgesService`), puis les accès personnels. « Réglages » (photo de profil, notifications, thème clair ou sombre, déconnexion) et « Mon dossier » (le dossier de formation existant, `ProfileInfo`) sont des écrans empilés. Le profil d'une autre personne garde la page existante.

## Tests

`tests/unit/mobileShellStore.spec.js`, `mobileShellComponents.spec.js`, `mobileHomeHelpers.spec.js`, `mobileInstitutions.spec.js`, `mobileMap.spec.js`, `mobileSearch.spec.js`, `mobileProfile.spec.js`, `responsiveNavigation.spec.js`.
