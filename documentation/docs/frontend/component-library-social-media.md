---
title: Bibliothèque de composants - social, médias, événements
---

## Répertoires concernés

- `src/components/social/library/`
- `src/components/events/`
- `src/components/video/`
- `src/components/media/`

## Social library

Composants notables :

- `MainFeed.vue`
- `MainFeedSupabase.vue`
- `PostItem.vue`
- `CreatePostDialog.vue`
- `PostTextarea.vue`
- `CommunitiesList.vue`
- `CommunityFeed.vue`
- `StoriesBar.vue`
- `StoryModal.vue`
- `StoryEditor.vue`
- `AddStoryCore.vue`
- `InfinityScroll.vue`
- `ImageCropper.vue`
- `VotationBanner.vue`

## Ce que porte cette famille

- feed ;
- publication de contenu ;
- stories ;
- communautés ;
- édition média ;
- scroll infini ;
- UI sociale mobile.

## Points d'attention

- cette famille est dense et très couplée au social backend ;
- certains composants mélangent UI, upload, édition et logique de publication ;
- `MainFeedSupabase.vue` et les composants associés méritent une lecture attentive en reprise.

## Événements

Composants notables :

- `EventCard.vue`
- `EventDetail.vue`
- `EventForm.vue`

Usage :

- affichage synthétique ;
- détail ;
- création/édition d'événements.

## Vidéo / média

Composants notables :

- `VideoCard.vue`
- `ModuleSection.vue`
- `VideoPlayerVimeo.vue`

Usage :

- bibliothèque vidéo ;
- modules média ;
- lecture Vimeo.

## Réflexe de reprise

Quand un bug touche ces composants :

1. identifier si le problème est UI, upload, API ou storage ;
2. vérifier les services associés ;
3. vérifier si le composant est utilisé en web, mobile ou admin ;
4. vérifier les dépendances Vimeo / médias / backend social.
