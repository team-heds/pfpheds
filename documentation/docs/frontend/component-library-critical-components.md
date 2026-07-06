---
title: Bibliothèque de composants - composants critiques
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Lecture prioritaire</div>
    <h2 class="docs-section-head__title">Les composants à auditer en premier pour reprendre le frontend</h2>
  </div>
  <p class="docs-section-head__text">
    Cette page liste les composants qui concentrent le plus de logique, de réutilisation ou de couplage métier.
  </p>
</div>

## Priorité 1 — structure globale

### `src/layout/AppLayout.vue`

À lire si :

- le shell global casse ;
- le responsive global est instable ;
- le comportement du layout semble incohérent.

Responsable de :

- l’assemblage `AppSidebar` / `AppTopbar` / `router-view` ;
- les classes de layout calculées depuis `useLayout()` ;
- la fermeture hors clic du menu overlay.

Point de vigilance :

- la fonction `unbindOutsideClickListener` retire le listener avec une référence potentiellement incorrecte ; c’est un point à vérifier si des comportements fantômes apparaissent.

### `src/layout/AppSidebar.vue`

À lire si :

- la navigation latérale pose problème ;
- des entrées disparaissent ;
- l’affichage menu / permissions devient incohérent.

### `src/layout/AppTopbar.vue`

À lire si :

- les actions hautes, raccourcis ou accès utilisateur posent problème.

## Priorité 2 — auth / navigation visible

### `src/components/common/forms/AuthForm.vue`

Composant clé pour le tunnel d’entrée utilisateur.

Contrat principal :

- props : `email`, `password`, `remember`, `loading`, états d’erreur ;
- events : `update:email`, `update:password`, `update:remember`, `submit`, `reset-password`.

Lecture utile si :

- la page de login affiche mal les erreurs ;
- le binding du formulaire ne remonte plus ;
- un refactoring auth a cassé les événements attendus par la vue parente.

### `src/components/common/utils/MobileBottomNav.vue`

Important pour la navigation mobile.

### `src/components/common/utils/GlobalSearch.vue`

À surveiller si la recherche transversale casse.

## Priorité 3 — admin réutilisable

### `src/components/admin/layouts/AdminLayout.vue`

Coque admin réutilisable.

### `src/components/admin/common/AdminPageHeader.vue`

Standardise les pages admin.

### `src/components/admin/widgets/DashboardKpiGrid.vue`

Composant structurant pour plusieurs dashboards.

Responsabilités notables :

- ordre des cartes ;
- masquage ;
- tailles ;
- comparaison ;
- export / import ;
- persistance locale.

### `src/components/admin/widgets/StatsCard.vue`

Carte KPI simple mais très centrale.

### `src/components/admin/widgets/SmartVisualization.vue`

Composant potentiellement dense, avec logique de visualisation et d’export.

### `src/components/admin/places/CreatePlaceDialog.vue`

Critique si le flux de création de places change.

## Priorité 4 — social

### `src/components/social/library/MainFeedSupabase.vue`

Probablement un des composants sociaux les plus critiques.

Responsabilités notables :

- chargement initial des posts ;
- filtres hashtag / communauté ;
- upload média ;
- abonnement temps réel ou polling ;
- intégration gamification ;
- mode mobile / desktop.

### `src/components/social/library/PostItem.vue`

Brique cœur du feed.

### `src/components/social/library/CreatePostDialog.vue`

À lire si la publication casse.

### `src/components/social/library/CommunityFeed.vue`

À lire si le flux communauté casse.

### `src/components/social/library/StoryModal.vue`

À lire si les stories posent problème.

## Priorité 5 — événements / médias

### `src/components/events/EventForm.vue`

Critique pour la création / édition d’événements.

Contrat principal :

- props : `event`, `editMode`, `userId` ;
- events : `submit`, `close`, `delete`.

Point sensible :

- le composant gère à la fois création, modification et suppression ;
- il mélange validation, preview image et contrôle d’autorisation.

Dette ou bug probable :

- la suppression émet `event?.id` alors que `event` n’est pas déclaré dans le scope script ; il faut probablement utiliser `props.event?.id`.

### `src/components/events/EventDetail.vue`

Dense, utile pour les interactions événementielles.

### `src/components/video/VideoCard.vue`

Brique de base de la bibliothèque vidéo.

### `src/components/media/VideoPlayerVimeo.vue`

Critique si la lecture Vimeo casse.

## Priorité 6 — profil / gamification

### `src/components/gamification/QuestCard.vue`

Carte métier centrale côté quêtes.

### `src/components/gamification/ChallengeCard.vue`

Carte critique côté défis.

### `src/components/gamification/BandeauMaison.vue`

Très visible dans l’identité gamification.

### `src/components/user/profile/HESHouseQuiz.vue`

Important pour l’attribution / onboarding maison.

## Réflexe de reprise

Si tu n'as pas le temps de tout lire :

1. `layout/`
2. `common/forms/AuthForm.vue`
3. `admin/widgets/*`
4. `social/library/MainFeedSupabase.vue`
5. `events/EventForm.vue`
6. composants PFP directement depuis les vues / composants admin métier

## Note de dette technique

Le dossier composants contenait aussi quelques reliquats non runtime qui ne participaient pas à l’application active. Ils ont été retirés du repo pendant ce chantier pour réduire le bruit.
