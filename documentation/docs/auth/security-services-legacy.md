---
title: Sécurité, rôles et compatibilité legacy
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Compatibilité historique</div>
    <h2 class="docs-section-head__title">`rolesService.js` : un troisième modèle de rôles, indépendant de `roleStore`</h2>
  </div>
  <p class="docs-section-head__text">
    Ce service (453 lignes, `src/service/rolesService.js`) définit son propre catalogue de rôles/permissions, distinct de `user_profiles.permissions` ET de `user_track_roles`. Il n'est pas mort : il est appelé par le router pour le bloc `requiredRole` legacy.
  </p>
</div>

## Le catalogue interne de `rolesService.js`

```js
export const ROLES = {
  GAME_MASTER: 'game_master',
  HOUSE_COACH: 'house_coach',
  PROFESSOR: 'professor',
  ADMIN: 'admin',
  STUDENT: 'student'
}

export const PERMISSIONS = {
  MANAGE_ALL: 'manage_all',
  CREATE_CHALLENGES: 'create_challenges', EDIT_CHALLENGES: 'edit_challenges', ...
  CREATE_QUESTS: 'create_quests', EDIT_QUESTS: 'edit_quests', ...
  CREATE_BADGES: 'create_badges', EDIT_BADGES: 'edit_badges', ...
  MANAGE_USERS: 'manage_users', ASSIGN_ROLES: 'assign_roles', VIEW_USER_STATS: 'view_user_stats',
  MANAGE_HOUSES: 'manage_houses', MANAGE_HOUSE_POINTS: 'manage_house_points', VIEW_HOUSE_STATS: 'view_house_stats',
  VIEW_ANALYTICS: 'view_analytics', EXPORT_DATA: 'export_data'
}

export const ROLE_PERMISSIONS = {
  [ROLES.GAME_MASTER]: [ /* toutes les permissions */ ],
  [ROLES.ADMIN]: [ /* toutes sauf quelques-unes */ ],
  [ROLES.HOUSE_COACH]: [ /* sous-ensemble gamification */ ],
  [ROLES.PROFESSOR]: [ /* lecture seule + création défis */ ],
  [ROLES.STUDENT]: []
}
```

C'est un système RBAC **statique en mémoire**, conçu à l'origine pour le module gamification (défis/quêtes/badges/maisons). Ces valeurs (`game_master`, `manage_all`, `create_challenges`...) **n'existent dans aucune colonne `user_profiles.permissions` observée** ni dans le catalogue de `ManageUserRoles.vue` — c'est un troisième vocabulaire de permissions, séparé des deux autres décrits dans `auth/overview.md`.

## `getUserRoles(userId, provider)` — deux implémentations totalement différentes selon le provider

```js
async getUserRoles(userId, provider = 'firebase') {
  if (provider === 'supabase') return await this.getUserRolesSupabase(userId)
  return await this.getUserRolesFirebase(userId)
}
```

### Côté Firebase

```js
async getUserRolesFirebase(userId) {
  const rolesRef = dbRef(db, `Users/${userId}/Roles`)
  const snapshot = await get(rolesRef)
  return snapshot.val() || {}   // format objet: { admin: true, editor: false }
}
```

Lit directement la Realtime Database Firebase, chemin `Users/{userId}/Roles`. Format objet plat, pas un tableau.

### Côté Supabase — 3 stratégies en cascade, avec fallback silencieux

```js
async getUserRolesSupabase(userId) {
  // 1) user_metadata.roles (stocké sur auth.users, JWT)
  const { data: { user } } = await supabase.auth.getUser()
  if (user?.user_metadata?.roles) return user.user_metadata.roles

  // 2) table user_roles (role_name, is_active)
  const { data: rolesData } = await supabase
    .from('user_roles')
    .select('role_name, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
  if (rolesData?.length > 0) {
    const rolesObject = {}
    rolesData.forEach(r => { if (r.is_active) rolesObject[r.role_name] = true })
    return rolesObject
  }

  // 3) fallback: user_profiles.role (colonne unique) converti en objet { [role]: true }
  const { data: profileData } = await supabase
    .from('user_profiles').select('role').eq('user_id', userId).single()
  if (profileData?.role) return { [profileData.role]: true }

  // 4) dernier recours : rôle générique
  return { user: true }
}
```

**Table `user_roles` mentionnée ici est différente de `user_track_roles`** (voir `auth/overview.md`). Aucune migration du dépôt (`supabase/migrations/`, `migrations/`, `src/database/migrations/`) ne définit `CREATE TABLE user_roles` — comme pour `update_user_permissions`, elle a été créée hors dépôt. **Vérifié en base le 2026-07-14** : la table existe bel et bien (`user_roles` et `user_track_roles` renvoient `42501 permission denied for table`, pas `42P01 relation does not exist` — signature exacte d'une table présente mais sans `GRANT` accordé au rôle `service_role`). C'est le même symptôme que celui corrigé pour le storage par `20260610_fix_storage_grants_self_hosted.sql` : sur cette instance self-hosted, les nouvelles tables ne reçoivent pas automatiquement les grants PostgREST attendus. Tant qu'aucun `GRANT` n'est appliqué, même le service role backend ne peut pas lire `user_roles` — un script d'administration qui interroge cette table échouera silencieusement si l'erreur n'est pas vérifiée (c'est justement le cas ici : `rolesError` est destructuré mais seul `!rolesError && rolesData?.length > 0` est testé, donc l'erreur `42501` fait simplement tomber dans la stratégie 3 sans log).

## Où ce service est réellement appelé

Un seul point d'entrée actif trouvé dans le code applicatif : le bloc `requiredRole` legacy de `router.js` (voir `auth/auth-routing-lifecycle.md`, "Point critique n°2"). Comme seulement 2 routes du dépôt utilisent encore `meta.requiredRole` (`votations.js` → `VotationPrioritaire`, `admin.js`), ce chemin de code n'est exercé que sur ces 2 routes précises.

Le fichier exporte aussi `requirePermission()` et `requireRole()`, deux fabriques de guards Vue Router basées sur `getAuth().currentUser` (Firebase uniquement, ignore complètement Supabase) — **aucun import de ces deux fonctions n'a été trouvé ailleurs dans le code applicatif** lors de l'inspection ; elles semblent mortes.

## Risques de maintenance concrets

- **Croire qu'il n'y a qu'un système de rôles** : il y en a trois (`user_profiles.permissions` / `user_track_roles` / `rolesService.ROLE_PERMISSIONS`), avec des vocabulaires de permissions différents (`admin` vs `SUPER_ADMIN` vs `manage_all`).
- **Modifier `user_roles`** en pensant affecter le contrôle d'accès du router : cette table n'est lue que par `rolesService.getUserRolesSupabase()`, elle-même seulement appelée sur 2 routes.
- **Supprimer `rolesService.js`** en pensant qu'il est totalement mort : il ne l'est pas complètement, `router.js` en dépend toujours pour `votation_prioritaire` et une route de `admin.js`.

## Réflexe de reprise

Face à un droit incohérent sur une route qui utilise `meta.requiredRole` :

1. Identifier le provider actif (`authStore.authProvider`).
2. Si `'firebase'` → vérifier `Users/{userId}/Roles` dans la RTDB.
3. Si `'supabase'` → vérifier dans l'ordre : `auth.users.raw_user_meta_data.roles`, puis table `user_roles` (si elle existe), puis `user_profiles.role`.
4. Comparer avec ce que lit `roleStore` (`api_my_permissions` + `user_profiles`) — les deux peuvent diverger puisque ce sont deux chemins de lecture indépendants.
