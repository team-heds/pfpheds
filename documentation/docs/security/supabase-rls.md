---
title: Supabase RLS
---

Ce guide couvre les principes de RLS (Row‑Level Security) côté Supabase/Postgres.

## Activer RLS

```sql
-- Exemple: activer RLS sur une table
alter table public.places enable row level security;
```

## Policies de base

```sql
-- Lecture publique (si nécessaire)
create policy "places_read" on public.places
  for select
  using (true);

-- Lecture restreinte par rôle/permission (exemple schématique)
create policy "places_read_by_perm" on public.places
  for select
  using (
    -- adapter selon votre modèle (ex: fonction app.current_perms() @> '{"page1.access"}')
    true
  );

-- Insert/Update par propriétaire (exemple avec colonne owner_id)
create policy "places_write_owner" on public.places
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);
```

> Adaptez vos policies au modèle réel (profils, rôles, permissions). Les scripts SQL de ce dépôt créent/ajustent ces règles au fil des migrations.

## Bonnes pratiques

- Activer RLS sur toutes les tables sensibles
- Préférer des policies explicites par opération (select/insert/update/delete)
- Utiliser des vues ou fonctions helper pour exposer des permissions calculées
- Tester les policies avec plusieurs comptes/contexts (auth.uid(), anon)

## Tables cibles dans ce projet (exemples)

- `public.user_profiles`
  - RLS activée, policies admin pour mise à jour des profils.
  - Colonne `permissions text[]` (voir `add_permissions_to_user_profiles.sql`).
  - Fonctions: `get_user_permissions(uid)`, `update_user_permissions()`, `user_has_permission()`.

- `public.institutions`, `public.places`
  - RLS activée.
  - Lecture: `select using (true)` ou restreinte par rôle selon besoin.
  - Écriture: policies owner‑based (ex: `auth.uid() = owner_id`) ou par rôle.

Exemple d’owner‑policy:

```sql
create policy "places_write_owner" on public.places
  for insert with check (auth.uid() = owner_id)
  to authenticated;
create policy "places_update_owner" on public.places
  for update using (auth.uid() = owner_id)
  to authenticated;
```

## RPC et permissions exposées au front

- Le store `useRoleStore` appelle `supabase.rpc('api_my_permissions')` et attend une table avec colonne `perm`.
- Créez l’alias si vous n’avez que `get_user_permissions(uid)`:

```sql
create or replace function public.api_my_permissions()
returns table(perm text)
language sql security definer
as $$ select unnest(public.get_user_permissions(auth.uid()::text)) as perm $$;
```

## Tests rapides

```sql
-- RLS activée ?
select relname as table, relrowsecurity as rls
from pg_class where relname in ('user_profiles','institutions','places');

-- Permissions utilisateur courant
select * from public.api_my_permissions();

-- Vérifier lecture institutions
set role anon; -- ou authenticated via JWT dans PostgREST
select count(*) from public.institutions;
reset role;
```

## Où sont les policies dans le projet ?

- Répertoire: `supabase_migrations/` (fichiers SQL)
- Voir aussi: `backend/supabase/overview` et `backend/supabase/migrations`
