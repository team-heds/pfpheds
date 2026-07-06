---
title: Sécurité, rôles et compatibilité legacy
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Compatibilité historique</div>
    <h2 class="docs-section-head__title">Pourquoi le système de rôles n'est pas encore purement unifié</h2>
  </div>
  <p class="docs-section-head__text">
    Cette page détaille le rôle de `rolesService.js` et les raisons de la coexistence Firebase / Supabase.
  </p>
</div>

## `rolesService.js`

Le service porte un rôle de compatibilité entre plusieurs modèles :

- rôles Firebase historiques ;
- rôles Supabase modernes ;
- format objet legacy du type `{ admin: true }` ;
- lecture d'un rôle unique dans `user_profiles`.

## Sources gérées

### Côté Firebase

- lecture via Realtime Database ;
- chemins legacy du type `Users/{userId}/Roles`.

### Côté Supabase

Le service essaie plusieurs stratégies :

1. `user_metadata.roles`
2. table `user_roles`
3. table `user_profiles.role`
4. fallback utilisateur simple

## Pourquoi c'est important

Le router et certains écrans anciens peuvent encore dépendre :

- d'un schéma objet legacy ;
- d'un rôle unique ;
- ou de permissions plus modernes.

## Risques de maintenance

- croire qu'un seul mécanisme de rôle existe ;
- modifier uniquement `user_roles` alors que certains écrans lisent encore `user_profiles.role` ;
- casser une compatibilité Firebase encore utile dans certains flux.

## Réflexe de reprise

Quand un droit semble incohérent :

1. vérifier `roleStore` ;
2. vérifier `rolesService` ;
3. vérifier `user_profiles.role` ;
4. vérifier `user_roles` ;
5. vérifier s'il reste un chemin Firebase legacy impliqué.
