---
title: Routeur Multi-Systèmes
---

Cette page explique l’architecture "multi‑systèmes" de l’app: Auth/RTDB Firebase et données/permissions Supabase.

## Composants clés

- `firebase.js`: init Firebase (Auth, RTDB, Storage). Variables `VITE_FIREBASE_*` requises.
- `src/supabase.js`: client Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`).
- `src/stores/role.js`: charge la session Supabase et les permissions via RPC, expose `can()` et `isSuper`.
- `src/router.js`: guard global `beforeEach` gère `requiresAuth`, `need`, `requiredRole` et charges dynamiques.

## Flux de navigation

1) Au premier passage: chargement des routes dynamiques (Supabase) via `addDynamicRoutesToRouter(router)`.
2) Vérification de l’état d’auth (Firebase ou Supabase) via `authStore.checkAuthState()`.
3) Initialisation des permissions (`roleStore.init()` → session Supabase + RPC permissions).
4) Application des règles de route:
   - `need: 'public' | 'anonymous'` → autorisé
   - `need` défini et pas d’utilisateur → redirect `'/'`
   - `need` défini → `isSuper` ou `roleStore.can(need)`
   - `requiresAuth` sans utilisateur → redirect `'/'`
   - `requiredRole` (héritage) → vérification via `rolesService`

## Exemple de métadonnées de route

```js
{
  path: '/admin/routes-editor',
  component: DynamicRoutesEditorView,
  meta: { requiresAuth: true, need: ['super.all','admin'] }
}
```

## Permissions côté base

- Permissions calculées/storées dans `user_profiles.permissions[]` (voir migration `add_permissions_to_user_profiles.sql`).
- RPC d’exemple: `get_user_permissions(uid)` qui retourne `TEXT[]`.

## Recommandations

- Centraliser l’auth et les permissions dans des stores (Pinia)
- Éviter la logique d’autorisation dans les vues; utiliser `roleStore.can()`
- Documenter la taxonomie de permissions par domaines (`admin.*`, `page*.access`, `fp.*`)
