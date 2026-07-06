---
title: Cartographie UI et ownership fonctionnel
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Vue frontend</div>
    <h2 class="docs-section-head__title">Comment le produit est découpé dans `src/views/`</h2>
  </div>
  <p class="docs-section-head__text">
    Cette page sert à retrouver rapidement où vit un domaine fonctionnel dans l'interface et dans l'admin.
  </p>
</div>

## Arborescence de premier niveau

Répertoires principaux observés dans `src/views/` :

- `admin`
- `apps`
- `associations`
- `auth`
- `capsulesInsuffiance`
- `documentation`
- `home`
- `institutions`
- `media`
- `pages`
- `planning`
- `social`
- `users`

## Sous-domaines admin

Répertoires observés dans `src/views/admin/` :

- `academic`
- `courses`
- `formation-pratique`
- `gamification`
- `institutions`
- `lists`
- `modules`
- `pfp`
- `places`
- `planning`
- `security`
- `soins-infirmiers`
- `tools`
- `users`
- `validation`
- `votations`

## Lecture pratique

Quand tu cherches une fonctionnalité :

1. repère d'abord la vue ;
2. cherche ensuite le store associé ;
3. cherche ensuite le service ;
4. vérifie enfin si le backend ou Supabase portent la logique réelle.

## Domaines fortement administrés

Les zones les plus denses côté admin sont en général :

- formation pratique / PFP
- planning
- soins infirmiers
- sécurité / utilisateurs
- votations
- gamification

## Répartition indicative

| Zone UI | Ce qu'on y trouve généralement |
| --- | --- |
| `views/admin/academic` | pilotage académique, dashboards, KPI |
| `views/admin/planning` | planification, workload, vues calendaires |
| `views/admin/formation-pratique` | administration large du domaine PFP |
| `views/admin/pfp` | campagnes, places, affectations, validation |
| `views/admin/votations` | résultats, previews, gestion des sessions |
| `views/admin/security` | contrôle d'accès, sécurité, outils admin |
| `views/social` | feed, communautés, interactions |
| `views/media` | bibliothèque, vidéos, contenus |
| `views/apps` | applications intégrées |

## Indices de couplage fort

Une vue mérite une attention particulière si :

- elle dépend de plusieurs stores ;
- elle appelle directement plusieurs services ;
- elle dépend d'un prétraitement de données externe ;
- elle combine Firebase et Supabase ;
- elle applique à la fois logique métier et contrôle d'accès.

## Réflexe de reprise

Pour documenter ou modifier un écran important, toujours noter :

- son répertoire de vue ;
- ses stores ;
- ses services ;
- ses permissions ;
- sa source de données ;
- son impact sur les autres flux.
