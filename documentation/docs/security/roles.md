---
title: "Rôles & Permissions"
---

Ce document décrit le modèle de permissions consommé par le front et son usage dans le routeur.

## Source des permissions (front)

- Store: `src/stores/role.js` (`useRoleStore`)
  - `perms: string[]` — liste des permissions
  - `isSuper` — vrai si `perms` contient `super.all`
  - `can(perm | perm[])` — vérifie une ou plusieurs permissions
  - Initialisation: `init()` charge la session Supabase et les permissions via une RPC (par ex. `get_user_permissions` ou `api_my_permissions` selon votre configuration)

> L’implémentation de la fonction RPC côté base doit renvoyer une liste de permissions pour l’utilisateur courant. Voir les migrations SQL pour la création de cette RPC.

## RPC attendue côté DB

- Le store appelle par défaut `supabase.rpc('api_my_permissions')`.
- Si votre schéma expose déjà `get_user_permissions(uid text)`, créez un alias compatible:

```sql
-- Alias simple qui transforme le tableau en table (colonne perm)
create or replace function public.api_my_permissions()
returns table(perm text)
language sql
security definer
as $$
  select unnest(public.get_user_permissions(auth.uid()::text)) as perm;
$$;
```

- Mise à jour des permissions (administration): `update_user_permissions(target_user_id text, new_permissions text[])`.
  - Définie dans `supabase_migrations/add_permissions_to_user_profiles.sql`.
  - En cas de cache PostgREST, voir `supabase_migrations/reload_permissions_functions.sql` (NOTIFY pgrst, 'reload schema').

## Dans le routeur
  - `need: 'page1.access'`
  - `need: ['admin', 'editor']`
  - Spéciaux: `public`, `anonymous`, `authenticated`
- `meta.requiredRole`: support historique basé sur des rôles nommés
- Bypass: `isSuper` accorde l’accès quelle que soit la permission

## Convention de nommage (conseillée)

- Préfixer par domaine:
  - `admin.*` (ex: `admin.settings`, `admin.users`)
  - `page*.access` (ex: `page1.access`, `page2.access`)
  - `media.*`, `fp.*` (formation pratique), `si.*` (soins-infirmiers)

## Exemples

```js
import { useRoleStore } from '@/stores/role'
const roleStore = useRoleStore()

if (roleStore.can('page1.access')) {
  // afficher bouton ou lien
}

if (roleStore.can(['admin', 'editor'])) {
  // au moins une des permissions
}
```

## Bonnes pratiques

- Centraliser la logique d’autorisation avec `roleStore.can()`
- Préférer les permissions granulaires aux rôles macro
- Documenter les permissions métiers dans les specs (qui peut faire quoi)
