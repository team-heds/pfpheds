---
title: Route Guards
---

Ce document explique le fonctionnement des guards de navigation (router) et l’usage des métadonnées de routes.

## Aperçu

Fichier: `src/router.js`

- Guard principal: `router.beforeEach(async (to, from, next) => { ... })`
- Chargement des routes dynamiques au premier passage via `addDynamicRoutesToRouter(router)` (depuis Supabase)
- Vérification état auth via `authStore.checkAuthState()`
- Initialisation des permissions via `roleStore.init()`

## Métadonnées supportées

- `meta.requiresAuth: boolean`
  - Si vrai, nécessite un utilisateur connecté
- `meta.need: string | string[]`
  - Permissions (ex: `page1.access`) vérifiées par `roleStore.can()`
  - Cas spéciaux: `public` ou `anonymous` → autorisé sans auth
  - Super‑utilisateur: `roleStore.isSuper` bypass
- `meta.requiredRole: string | string[]` (schéma historique)
  - Conserve la compatibilité avec des rôles nommés, vérifiés côté store/RTDB

## Routes dynamiques (Supabase)

- Source: `src/composables/useDynamicRoutes.js`
  - `loadDynamicRoutes()` lit la table `dynamic_routes` (colonnes: path, name, component_path, requires_auth, need, menu_*).
  - Pour chaque entrée, `meta` est construit ainsi:
    - `requiresAuth: route.requires_auth || false`
    - `need: route.need` si défini, sinon `need = requiresAuth ? 'authenticated' : 'public'`
  - Les routes sont ajoutées via `addDynamicRoutesToRouter(router)` et marquées `meta.dynamic = true`.

Extrait simplifié:

```js
// useDynamicRoutes.js
const meta = { requiresAuth: route.requires_auth || false, dynamic: true }
meta.need = (route.need ?? (meta.requiresAuth ? 'authenticated' : 'public'))
```

## Séquence au runtime

1) Charger routes dynamiques (une seule fois)
2) Vérifier/authentifier l’utilisateur (store auth)
3) Initialiser le store de rôles/permissions (Supabase)
4) Appliquer les règles:
   - Si `need` contient `public`/`anonymous` → accès direct
   - Si `need` défini et pas d’utilisateur → redirection `'/'
   - Sinon, `canAccess = roleStore.isSuper || roleStore.can(need)`
   - Si `requiresAuth` et pas d’utilisateur → redirection `'/'
   - Si `requiredRole` défini → vérifier via `rolesService.getUserRoles()` (héritage)

## Exemple de route

```js
{ path: '/admin/routes-editor',
  component: DynamicRoutesEditorView,
  name: 'DynamicRoutesEditor',
  meta: { requiresAuth: true, need: ['super.all','admin'] }
}
```

## Extrait du guard (simplifié)

```js
router.beforeEach(async (to, from, next) => {
  await authStore.checkAuthState()
  if (!roleStore.initialized) await roleStore.init()

  const need = to.meta.need
  const user = authStore.user

  const allowAnon = Array.isArray(need)
    ? (need.includes('public') || need.includes('anonymous'))
    : (need === 'public' || need === 'anonymous')
  if (allowAnon) return next()

  if (need && !user) return next('/')

  if (need) {
    const canAccess = Array.isArray(need)
      ? (roleStore.isSuper || need.some(n => roleStore.can(n)))
      : (roleStore.isSuper || roleStore.can(need))
    if (!canAccess) return next({ path: '/access' })
  }

  if (to.matched.some(r => r.meta.requiresAuth) && !user) return next('/')
  next()
})
```

## Bonnes pratiques

- Préférer `meta.need` (permissions) à `requiredRole` (héritage)
- Grouper les permissions par domaines (`admin.*`, `page*.access`)
- Éviter la logique métier directement dans les vues; utiliser stores/services
