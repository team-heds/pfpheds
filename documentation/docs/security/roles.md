---
title: "Rôles & Permissions"
---

Cette page a été fusionnée conceptuellement avec `auth/overview.md` et `auth/permission-model.md`, qui contiennent désormais le détail technique complet (4 systèmes RBAC coexistants, code exact de `roleStore.can()`, matrice des `need` réellement utilisés, RPC `api_my_permissions()` en entier). Cette page reste comme point d'entrée rapide + un ajout non couvert ailleurs : la liste exhaustive des RPC RBAC exposées.

## Résumé ultra-condensé (détail dans `auth/overview.md`)

- Store : `src/stores/role.js` (`useRoleStore`) — `perms`, `isSuper`, `can()`.
- Source principale : RPC `api_my_permissions()`, qui lit `user_profiles.role` + `user_profiles.permissions`.
- `isSuper` = `perms.includes('super.all')`, court-circuite tout `can()`.
- Ce système front ne remplace pas un audit RLS côté base — voir `backend/supabase/rls.md`.

## RPC RBAC exposées via PostgREST mais non câblées dans `roleStore` (inventaire complet)

Voir `data/rpc-and-sql-surface.md` pour la liste complète et commentée (93 RPC au total). Rappel des plus pertinentes pour la gestion de rôles :

```
set_user_profile_rbac(_email, _role, _permissions, _is_active)   -- provisioning complet en un appel, sous-utilisée
promote_user_to_admin(user_email)
is_admin(email_param) / is_superadmin() / is_super_admin()        -- 3 variantes redondantes
user_has_permission(user_uid, required_permission)
has_perm(p)
whoami()
```

## Dans le routeur

- `need: 'page1.access'`, `need: ['admin', 'editor']` — voir la matrice réelle et les pièges de config dans `auth/permission-model.md`.
- `meta.requiredRole` : mécanisme historique, seulement 2 occurrences restantes dans tout le dépôt.
- `isSuper` accorde l'accès quelle que soit la permission demandée.

## Convention de nommage observée (pas universellement respectée)

- `page*.access` (`page1.access`, `page2.access`) — historique formation pratique.
- Rôles filière directs (`AdminSoins`, `AdminPhysio`, `EnseignantSoins`, ...) utilisés à la fois comme `role` unique et comme entrées de `permissions[]` — voir `auth/permission-model.md` pour la liste exhaustive extraite du code.
- Cohortes (`BA23-PHY`, `B24-SI`, ...) mélangées dans le même tableau `permissions[]` que les vraies permissions fonctionnelles, sans préfixe distinctif.

## Exemple d'usage (`roleStore.can()`)

```js
import { useRoleStore } from '@/stores/role'
const roleStore = useRoleStore()

if (roleStore.can('page1.access')) { /* ... */ }
if (roleStore.can(['admin', 'editor'])) { /* au moins une des deux */ }
```

⚠️ Ne jamais inclure `'authenticated'` dans le même tableau qu'une permission spécifique dans `meta.need` — voir le bug documenté dans `auth/permission-model.md` (le guard court-circuite sur `'authenticated'` avant d'évaluer le reste).

## Bonnes pratiques

- Centraliser la logique d'autorisation front avec `roleStore.can()`.
- Utiliser `set_user_profile_rbac()` (RPC déjà existante) plutôt qu'un upsert manuel sur `user_profiles` pour tout provisioning de compte.
- Ne jamais considérer la sécurité comme acquise côté front — vérifier systématiquement RLS (`security/supabase-rls.md`).
