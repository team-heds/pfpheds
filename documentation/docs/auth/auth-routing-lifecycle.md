---
title: Cycle auth, rôles et routing
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Cycle réel</div>
    <h2 class="docs-section-head__title">Comment l'accès est décidé dans l'application</h2>
  </div>
  <p class="docs-section-head__text">
    Cette page synthétise le comportement observé dans `src/router.js`, `authStore.js` et `role.js`.
  </p>
</div>

## Vue d'ensemble

Trois briques décident de l'accès :

- `authStore` : connaît l'utilisateur et le provider actif ;
- `roleStore` : charge les permissions ;
- `router.beforeEach` : applique les règles d'accès page par page.

## Séquence de navigation

```text
Navigation
→ chargement éventuel des routes dynamiques
→ checkAuthState()
→ roleStore.init()
→ lecture de meta.need
→ lecture éventuelle de meta.requiredRole
→ redirection / accès / refus
```

## Ce que fait `authStore`

Dans `src/stores/authStore.js`, le store :

- gère Firebase et Supabase ;
- sait si l'app est en mode bypass auth ;
- restaure la session ;
- surveille l'expiration de session Supabase ;
- écoute les événements auth des deux providers.

### Cas importants

- `VITE_DISABLE_AUTH=true` force un utilisateur invité ;
- Firebase reste prioritaire si sa session est restaurée en premier ;
- sinon Supabase devient le provider actif ;
- le store essaie un refresh si le token Supabase est expiré ou invalide.

## Ce que fait `roleStore`

Dans `src/stores/role.js`, le store :

- récupère la session Supabase courante ;
- charge les permissions via RPC `api_my_permissions` ;
- fallback sur `user_profiles.role` et `user_profiles.permissions` ;
- expose `can()` et `isSuper`.

### Source de vérité des permissions

Ordre observé :

1. RPC Supabase `api_my_permissions`
2. fallback `user_profiles.role`
3. fallback `user_profiles.permissions`

### Cas important

La permission `super.all` court-circuite les contrôles métier front.

## Ce que fait le router

Dans `src/router.js`, le guard :

1. normalise `meta.need` sur toutes les routes ;
2. charge une fois les routes dynamiques ;
3. exécute `checkAuthState()` ;
4. initialise `roleStore` ;
5. applique les redirections et permissions.

## Normalisation de `meta.need`

Si une route n'a pas de `meta.need` :

- `requiresAuth=true` devient `authenticated`
- sinon la route devient `public`

Cela évite qu'une route protégée reste sans besoin explicite.

## Cas de redirection importants

### Route `/`

Comportement observé :

- utilisateur connecté → redirection `/feed`
- sinon → redirection `/home`

### Routes password reset

Les routes `/reset-password` et `/new-password` sont laissées passer tôt pour éviter de consommer le code PKCE.

### Route refusée

Si une permission manque, redirection vers `/access`.

## `need` versus `requiredRole`

Le projet utilise deux mécanismes :

- `meta.need` : mécanisme recommandé et le plus lisible ;
- `meta.requiredRole` : mécanisme historique encore présent.

Le guard supporte les deux. Il faut donc vérifier les deux lors d'un diagnostic.

## Pièges de maintenance

- une route peut sembler publique si `meta.need` a été mal renseigné ;
- un utilisateur peut être connecté mais sans permissions chargées ;
- une page peut passer le front mais échouer côté RLS ;
- le mode bypass auth peut masquer un vrai problème de droits ;
- des routes dynamiques peuvent modifier le résultat attendu après chargement.

## Fichiers à lire ensemble

- `src/router.js`
- `src/router/routes/index.js`
- `src/stores/authStore.js`
- `src/stores/role.js`
- `src/service/rolesService.js`

## Réflexe de diagnostic

Quand une page est inaccessible :

1. vérifier la session ;
2. vérifier `authProvider` ;
3. vérifier `roleStore.perms` ;
4. vérifier `meta.need` ;
5. vérifier `requiredRole` si présent ;
6. vérifier ensuite la policy RLS ou l'API backend.
