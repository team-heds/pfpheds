---
title: Modèle de permissions et matrice d'accès
---

## Chiffres réels du dépôt (mesurés, pas estimés)

Comptage exact sur `src/router/routes/*.js` (12 fichiers, ~249 déclarations de route) :

| Mesure | Compte |
| --- | --- |
| Routes avec `requiresAuth: true` | 209 |
| Routes avec `meta.need` explicite | 134 |
| Routes avec `meta.requiredRole` (mécanisme legacy) | 2 |

**Lecture** : au moins ~75 routes ont `requiresAuth: true` sans `need` explicite dans leur propre déclaration — elles reçoivent donc `need: 'authenticated'` par défaut via la normalisation de `router.js` (voir `auth/auth-routing-lifecycle.md`), ce qui veut dire **accessibles à tout compte connecté**, indépendamment du rôle. Le mécanisme `requiredRole` est quasi mort : seulement 2 occurrences dans toute la base de routes (`votations.js`, `admin.js`), à ne pas utiliser pour du nouveau code.

## `roleStore.can()` — implémentation exacte

```js
// src/stores/role.js
function can(perm) {
  if (Array.isArray(perm)) {
    if (perm.includes('public') || perm.includes('anonymous')) return true
    if (perm.includes('authenticated')) return isAuthenticated.value
    return isSuper.value || perm.some(p => perms.value.includes(p))
  }
  if (perm === 'public' || perm === 'anonymous') return true
  if (perm === 'authenticated') return isAuthenticated.value
  return isSuper.value || perms.value.includes(perm)
}
```

`isSuper.value` vaut `perms.value.includes('super.all')`. Donc `super.all` court-circuite **tout** `can()`, y compris pour des permissions qui n'existent nulle part par ailleurs dans le code — un compte avec `super.all` passe n'importe quel `need`, même un futur `need: 'permission-qui-n-existe-pas-encore'`.

## Chargement des permissions (`loadPermissions`) — ordre de résolution exact

```js
async function loadPermissions() {
  const permsSet = new Set()

  // A) Source principale : RPC api_my_permissions()
  const { data: rows, error: rpcError } = await supabase.rpc('api_my_permissions')
  if (!rpcError && Array.isArray(rows)) {
    for (const r of rows) if (r?.perm) permsSet.add(r.perm)
  }

  // B) Fallback : lecture directe de user_profiles
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, permissions')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profile) {
    if (profile.role) permsSet.add(profile.role)          // le rôle devient lui-même une "permission"
    let p = profile.permissions
    if (typeof p === 'string') p = JSON.parse(p)           // tolère un stockage string JSON
    if (Array.isArray(p)) for (const perm of p) if (perm) permsSet.add(perm)
  }

  perms.value = Array.from(permsSet)
}
```

Point technique important : **A et B s'exécutent tous les deux et sont fusionnés dans un `Set`**, ce n'est pas un vrai fallback "si A échoue alors B" — B tourne systématiquement en plus de A. Concrètement, `perms.value` contient l'union de ce que renvoie la RPC et de ce que contient directement `user_profiles`. Comme la RPC `api_my_permissions()` (voir SQL ci-dessous) lit elle-même `user_profiles.role` et `user_profiles.permissions`, **A et B lisent la même source de données deux fois** — la RPC n'apporte donc aucune permission qui ne serait pas déjà accessible via B. Le seul avantage réel de la RPC est le `SECURITY DEFINER` qui permet de lire `user_profiles` même si une policy RLS restrictive empêcherait normalement un utilisateur non-admin de lire sa propre ligne autrement.

## SQL exact de `api_my_permissions()`

```sql
-- supabase/migrations/20260114_create_api_my_permissions.sql
CREATE OR REPLACE FUNCTION api_my_permissions()
RETURNS TABLE (perm text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  user_role text;
  user_permissions jsonb;
BEGIN
  IF current_user_id IS NULL THEN RETURN; END IF;

  SELECT up.role, up.permissions INTO user_role, user_permissions
  FROM user_profiles up WHERE up.user_id = current_user_id;

  IF user_role IS NOT NULL THEN
    RETURN QUERY SELECT user_role::text;
  END IF;

  IF user_permissions IS NOT NULL AND jsonb_typeof(user_permissions) = 'array' THEN
    RETURN QUERY SELECT jsonb_array_elements_text(user_permissions)::text;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION api_my_permissions() TO authenticated;
```

Détail piégeux : le `RETURN QUERY SELECT user_role::text` renvoie le rôle **seul**, il ne fait pas `UNION` avec les permissions — mais comme les deux blocs `IF` s'exécutent l'un après l'autre (pas de `ELSE`), la fonction renvoie bien le rôle **et** chaque élément du tableau `permissions` comme lignes distinctes de la même table de résultat. C'est facile à mal lire au premier passage.

## Clés de permission réellement utilisées dans le code (extraites, pas inventées)

Valeurs `need` uniques trouvées dans `src/router/routes/*.js` :

| Valeur | Fréquence | Fichier(s) principal(aux) |
| --- | --- | --- |
| `'page1.access'` | 49 routes | formation pratique (physio) |
| `'admin'` | 23 routes | admin.js |
| `'page2.access'` | 1 route | pages.js |
| `'prioritaire'` | 1 route | votations.js |

Combinaisons multi-valeurs (`need: [...]`) trouvées dans `admin.js` :

```js
need: ['admin', 'editor']
need: ['admin', 'house_coach']
need: ['admin', 'RMSoins']
need: ['admin', 'RMSoins', 'PlanificateurHoraires']
need: ['admin', 'EnseignantSoins', 'RMSoins']
need: ['admin', 'EnseignantSoins', 'EnseignantPhysio']
need: ['authenticated', 'admin', 'RMSoins', 'EnseignantSoins']
need: ['super.all', 'admin']
need: ['super.all', 'admin', 'AdminPhysio', 'EnseignantPhysio']
```

Permissions gérables depuis l'UI admin (`ManageUserRoles.vue`, checkboxes réelles du composant) :

```js
'page1.access', 'page2.access', 'super.all', 'admin',
'AdminSoins', 'AdminPhysio', 'EnseignantSoins', 'EnseignantPhysio',
'EtudiantSoins', 'EtudiantPhysio', 'RMSoins',
'BA24-PHY', 'BA23-PHY', 'BA25-PHY', 'B25-SI', 'B24-SI', 'B23-SI'
```

Les 6 dernières (`BA23-PHY` etc.) sont des **cohortes**, pas des rôles fonctionnels — elles servent à filtrer l'accès par volée d'étudiants dans certains écrans, pas dans le router (aucune route n'a `need: 'BA23-PHY'` dans le code actuel).

## Attention : `need: ['authenticated', 'admin', ...]` ne fait pas ce qu'on pourrait croire

Rappel du guard (`router.js`) :

```js
const allowAuth = Array.isArray(need) ? need.includes('authenticated') : need === 'authenticated';
if (allowAuth) return next();
```

Ce check est évalué **avant** le check de permission granulaire. Donc `need: ['authenticated', 'admin', 'RMSoins', 'EnseignantSoins']` (vu dans `admin.js`) autorise en réalité **n'importe quel utilisateur connecté** — la présence de `'authenticated'` dans le tableau rend `'admin'`/`'RMSoins'`/`'EnseignantSoins'` inertes pour cette route précise, puisque le court-circuit se déclenche avant d'atteindre le bloc `roleStore.can()`. C'est vraisemblablement un bug de configuration existant dans `admin.js`, pas un comportement voulu — à corriger si la route en question doit réellement être restreinte.

## Recommandation de convergence

1. Ne plus utiliser `meta.requiredRole` (2 usages restants, migrer vers `need`).
2. Ne jamais combiner `'authenticated'` avec une permission spécifique dans le même tableau `need` — le court-circuit annule la restriction (voir ci-dessus).
3. Documenter toute nouvelle valeur de `need` ici dès sa création, pour que ce tableau reste une source de vérité.
4. Auditer périodiquement les ~75 routes `requiresAuth: true` sans `need` propre — elles sont accessibles à tout compte connecté par défaut.
