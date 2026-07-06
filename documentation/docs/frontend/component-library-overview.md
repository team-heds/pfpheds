---
title: Bibliothèque de composants - vue d'ensemble
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Component library</div>
    <h2 class="docs-section-head__title">Comment le projet découpe ses composants réutilisables</h2>
  </div>
  <p class="docs-section-head__text">
    Cette page sert de point d'entrée pour naviguer dans la bibliothèque de composants réelle du projet.
  </p>
</div>

## Familles observées dans `src/components/`

Répertoires principaux :

- `academic`
- `admin`
- `capsulesInsuffiance`
- `careconvers`
- `common`
- `editor`
- `events`
- `games`
- `gamification`
- `home`
- `media`
- `plugins`
- `Profile`
- `push`
- `social`
- `tournois`
- `ui`
- `user`
- `video`

## Grandes catégories utiles

Pour reprendre le front, il faut distinguer :

- composants de layout global ;
- composants utilitaires communs ;
- composants admin réutilisables ;
- composants métiers lourds ;
- composants social/media ;
- composants de profil et gamification.

## Ce qui ressemble à une vraie bibliothèque réutilisable

Les familles les plus “bibliothèque” sont :

- `src/layout/`
- `src/components/common/`
- `src/components/ui/`
- `src/components/admin/widgets/`
- `src/components/events/`
- `src/components/video/`

## Ce qui ressemble plus à des composants métier

- `src/components/admin/details/`
- `src/components/admin/forms/`
- `src/components/social/library/`
- `src/components/gamification/`
- `src/components/user/details/`

## Lecture recommandée

1. `layout` pour comprendre la coque globale ;
2. `common` et `ui` pour les briques génériques ;
3. `admin/widgets` pour les dashboards et KPI ;
4. `social/library` pour le sous-système social ;
5. `events`, `video`, `gamification` pour les familles spécialisées.

## Signaux de dette visibles

Le dossier composants montre aussi quelques reliquats ou artefacts :

- fichiers de test ou temporaires ;
- composants historiques aux noms hétérogènes ;
- doublons de logique entre composants métier et vues.

Cela ne veut pas dire qu'ils sont supprimables sans audit, mais il faut les repérer comme dette potentielle.
