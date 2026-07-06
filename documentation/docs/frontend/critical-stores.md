---
title: Stores critiques et responsabilités
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">État applicatif</div>
    <h2 class="docs-section-head__title">Les stores qu'il faut connaître pour reprendre le produit</h2>
  </div>
  <p class="docs-section-head__text">
    Cette page complète la cartographie stores/services en mettant l'accent sur les stores les plus structurants.
  </p>
</div>

## Stores observés dans `src/stores/`

Extraits notables :

- `authStore.js`
- `role.js`
- `userStore.js`
- `placesStore.js`
- `praticiensStore.js`
- `praticiensFormateursStore.js`
- `postsStore.js`
- `chatStore.js`
- `votesStore.js`
- `documentStore.js`
- `eventStore.js`

## `authStore.js`

Responsabilité :

- gérer l'utilisateur courant ;
- supporter Firebase et Supabase ;
- restaurer la session ;
- surveiller l'expiration de session ;
- gérer le mode bypass auth.

Pourquoi il est critique :

- il conditionne tout le cycle d'accès ;
- il influence directement `router.beforeEach` ;
- il détermine le provider actif.

## `role.js`

Responsabilité :

- charger les permissions runtime ;
- exposer `can()` ;
- gérer `isSuper`.

Pourquoi il est critique :

- il traduit la session en permissions concrètes ;
- il mélange RPC et fallback `user_profiles` ;
- il porte une grande partie de la logique d'autorisation front.

## `userStore.js`

Responsabilité probable :

- maintenir le profil utilisateur enrichi ;
- gérer la lecture/abonnement des données liées à l'utilisateur.

Pourquoi il est critique :

- il sert souvent de pont entre session auth et données métier utilisateur.

## `placesStore.js`

Responsabilité probable :

- centraliser l'état des places PFP ;
- porter les listes et chargements liés aux campagnes.

Pourquoi il est critique :

- la PFP dépend fortement des places ;
- il peut être impliqué dans l'affectation, les validations et les suivis.

## `praticiensStore.js` et `praticiensFormateursStore.js`

Responsabilité probable :

- gérer les praticiens et praticiens formateurs ;
- alimenter les vues d'administration et les correspondances PFP.

Pourquoi ils sont critiques :

- ils structurent une partie du référentiel métier de la formation pratique.

## `postsStore.js`

Responsabilité probable :

- gestion du feed social ;
- chargement des posts, communautés, hashtags ou flux apparentés.

Pourquoi il est critique :

- dépendance au backend social ;
- impacts possibles sur l'engagement et la gamification.

## `votesStore.js`

Responsabilité probable :

- centraliser les données de votation ;
- porter certains écrans de résultats ou de preview.

Pourquoi il est critique :

- les votations sont un flux métier sensible ;
- l'état de ce store peut avoir un impact direct sur les décisions métier affichées.

## Réflexes de lecture

Pour un store critique, documenter systématiquement :

- sa source de données ;
- les services appelés ;
- les vues qui le consomment ;
- les permissions nécessaires ;
- les effets de bord sur d'autres domaines.

## Ordre de priorité de lecture recommandé

1. `authStore.js`
2. `role.js`
3. `userStore.js`
4. `placesStore.js`
5. `postsStore.js`
6. `votesStore.js`
