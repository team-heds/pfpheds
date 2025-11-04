# Roles, Permissions & Router Access Guide

Ce document explique comment les accès sont décidés dans l’application (Vue 3 + Pinia + Vue Router) et comment configurer correctement l’auth, les rôles, les permissions et le router.

## Vue d’ensemble

- **Auth providers**
  - `Firebase` (via `src/stores/authStore.js`, getter `isFirebaseUser`)
  - `Supabase` (via `src/stores/authStore.js`, getter `isSupabaseUser`)
- **Permissions (Supabase)**
  - `src/stores/role.js`: charge les permissions depuis Supabase (RPC `api_my_permissions` + `user_metadata.permissions`). Expose `perms`, `isSuper`, `can()`.
  - Normalisation de noms: `'page1' -> 'page1.access'`, `'page2' -> 'page2.access'`, supprime le suffixe `.access` pour certains alias (ex: `AdminPhysio.access -> AdminPhysio`).
- **Rôles (Firebase/Supabase)**
  - `src/service/rolesService.js`: lit les rôles sous forme d’objet `{ roleName: true }` selon le provider actif.
    - Firebase: Realtime DB `Users/{uid}/Roles`
    - Supabase: `user_metadata.roles` ou table `user_roles`
- **Router guard**
  - `src/router.js`: vérifie `requiresAuth`, `meta.need` (permissions) et `meta.requiredRole` (rôles).

```mermaid
direction TB
flowchart TD
  A[Navigation] --> B[authStore.checkAuthState]
  B --> C[roleStore.init (Supabase perms)]
  C --> D{Route meta}
  D -->|need: 'perm'| E[roleStore.can('perm')]
  E -->|non| Z[Refus]
  E -->|oui| F[Continue]
  D -->|requiredRole: ['r1','r2']| G[roleStore.can(rX)]
  G -->|non| H[rolesService.getUserRoles(provider)]
  H --> I{rX === true ?}
  I -->|non| Z[Refus]
  I -->|oui| F[Accès]
  F --> Y[Page]
```

## Stores et services

- **`src/stores/authStore.js`**
  - Détermine le provider actif (`authProvider`: `'firebase'` ou `'supabase'`).
  - Getters: `isLoggedIn`, `isFirebaseUser`, `isSupabaseUser`.
  - Méthodes: `checkAuthState()`, `initializeAuth()`.

- **`src/stores/role.js` (Supabase permissions)**
  - State: `session`, `perms`, `initialized`.
  - Actions: `init()` charge et fusionne `rpc('api_my_permissions')` et `user_metadata.permissions`.
  - Getters: `isSuper` (vrai si `perms` contient `super.all`).
  - Méthodes: `can(perm)` → `isSuper || perms.includes(perm)`.

- **`src/service/rolesService.js` (rôles côté provider)**
  - Firebase: lit `Users/{uid}/Roles` → `{ admin: true, editor: false, ... }`.
  - Supabase: lit `user_metadata.roles` ou `user_roles` (colonnes `role_name`, `is_active`).
  - API: `getUserRoles(userId, provider)`, `hasRole`, `hasPermission` (legacy), etc.

## Router: comment l’accès est décidé

Fichier: `src/router.js` (guard principal en bas du fichier)

- **Initialisation**
  - `authStore.checkAuthState()` → détecte utilisateur Firebase puis Supabase.
  - `roleStore.init()` → charge `perms` depuis Supabase (si session Supabase).

- **`meta.need` (permissions Supabase uniquement)**
  - Exemple: `meta: { need: 'super.all' }`, `meta: { need: 'page1.access' }`.
  - Vérification via `roleStore.can(need)`.
  - Si tu es connecté via Firebase (sans session Supabase): `roleStore.perms` est vide → accès refusé.

- **`meta.requiredRole` (rôles côté provider actif)**
  - Vérification 1: `roleStore.isSuper || roleStore.can(role)` (permet de passer si la permission porte le même nom).
  - Vérification 2: `rolesService.getUserRoles(userId, provider)` → doit contenir un des rôles requis.

- **`requiresAuth`**
  - Si non connecté: redirection vers `/` ou `/home` avec toast.

## Exemples concrets de routes sensibles

- `'/admin'` → `meta: { requiresAuth: true, need: 'super.all' }`
  - Nécessite la permission Supabase `super.all`. Le rôle `admin` seul ne suffit pas.

- `'/admin/settings'` → `meta: { requiresAuth: true, requiredRole: ['admin','editor'] }`
  - Nécessite un de ces rôles dans la source du provider actif (Firebase ou Supabase).

- PFP (ex. `'/management_offre'`) → `meta: { requiresAuth: true, need: 'page1.access' }`
  - Nécessite la permission Supabase `page1.access`.

## Me donner tous les accès (recettes)

- **Connecté via Supabase (recommandé pour tout ce qui utilise `need`)**
  - Permissions pour passer `need`:
    - Ajouter au moins: `super.all`, `page1.access`, `page2.access`.
    - Selon sections: `AdminPhysio`, `EnseignantPhysio`, `AdminSoins`, `EnseignantSoins`, `RMSoins`, …
  - Où les mettre:
    - `user_metadata.permissions` (array de strings), et/ou
    - Créer/fixer la fonction RPC `api_my_permissions` pour retourner ces permissions.
  - Rôles pour passer `requiredRole`:
    - `user_metadata.roles` (objet `{ admin: true, editor: true, game_master: true }`) ou table `user_roles`.

- **Connecté via Firebase**
  - Pour `requiredRole`: définir `Users/{uid}/Roles` dans Realtime DB (ex: `{ admin: true, editor: true }`).
  - Pour `need`: non pris en compte par défaut (ciblé Supabase). Options:
    - Se connecter via Supabase pour ces pages, ou
    - Modifier le guard pour faire un fallback vers les rôles Firebase (cf. Unification ci-dessous), ou
    - Remplacer `need` par `requiredRole` pour ces routes.

## Débogage rapide

- Ouvre la console et navigue → `src/router.js` logge :
  - **Utilisateur**: email + provider (`authProvider`).
  - **Permissions Supabase**: `roleStore.perms`, `isSuper`, `can('page1.access')`, etc.
  - **requiredRole**: résultat du check `rolesService.getUserRoles(...)`.

- Si une page bloque:
  - **Identifier la contrainte**: `need` (permission) ou `requiredRole` (rôle).
  - **Vérifier la source**:
    - `need` → regarder `roleStore.perms` (Supabase uniquement).
    - `requiredRole` → vérifier les rôles dans la base du provider actif.

## Bonnes pratiques pour ajouter une route

- **Basé permissions (Supabase)**
```js
{ path: '/admin', component: AdminView, meta: { requiresAuth: true, need: 'super.all' } }
```

- **Basé rôles (provider)**
```js
{ path: '/admin/settings', component: AdminSettingsView, meta: { requiresAuth: true, requiredRole: ['admin'] } }
```

- **Éviter de mixer `need` et `requiredRole` sans nécessité**.
- Documenter la permission/le rôle attendu à côté de la route.

## Options d’unification (au choix)

- **Option A — Permissions only (Supabase)**
  - Ne garder que `meta.need` + `roleStore.can()` ; supprimer la 2e vérif `rolesService`.
  - Avantage: une seule source de vérité (RPC Supabase + metadata).

- **Option B — Rôles only (provider)**
  - Remplacer `need` par `requiredRole` partout ; s’appuyer sur `rolesService` (Firebase + Supabase).
  - Avantage: homogène avec historique Firebase.

- **Option C — Pont Firebase pour `need`**
  - Si `authProvider === 'firebase'` et `need` défini → mapper `need` vers des rôles Firebase équivalents.
  - Avantage: conserve `need` tout en supportant Firebase; Inconvénient: un peu plus complexe.

## Pièges fréquents

- **Connecté via Firebase** et tenter d’accéder à des routes `need` → `perms` Supabase vides → refus.
- **Double vérification des rôles**: visible dans le menu (filtré par `roleStore`) mais bloqué par `rolesService` au guard.
- **Doublons/typos de routes** réduisent la lisibilité et compliquent les tests (ex.: duplications `/calendar`, `/notes`, `/tools`, `/game`, et typo `/places_asssigned`).

## Références code (à consulter)

- `src/stores/authStore.js` — detection provider, état d’auth.
- `src/stores/role.js` — permissions Supabase, `perms`, `can()`.
- `src/service/rolesService.js` — lecture rôles (Firebase + Supabase).
- `src/router.js` — guard: `need`, `requiredRole`, `requiresAuth`.
- `src/components/admin/lists/AdminSidebar.vue` — filtrage du menu basé sur `roleStore`.

## FAQ

- **J’ai tous les rôles mais ça bloque**
  - Vérifie si la route utilise `need` (permission). Si oui, il faut alimenter `roleStore.perms` (Supabase).
- **Comment me donner accès à PFP ?**
  - Ajoute `page1.access` (Supabase) dans `user_metadata.permissions` ou via `api_my_permissions`.
- **Comment voir mes permissions actuelles ?**
  - Ouvre n’importe quelle page admin: la console affiche `roleStore.perms` (et dans `AdminSidebar.vue`, la carte "🔐 Permissions").

---

Si tu veux, je peux unifier le guard (`src/router.js`) selon l’option que tu choisis (Permissions only / Rôles only / Pont Firebase) et nettoyer les doublons/typos de routes.
