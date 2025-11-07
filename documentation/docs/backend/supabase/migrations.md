---
title: Migrations Supabase
---

Procédure pour appliquer les migrations SQL présentes dans `supabase_migrations/`.

## Ordre recommandé

1. `00_init_schema.sql`
2. `20251028_create_institutions.sql`
3. `20251028_create_places.sql`
4. `add_role_to_profiles.sql`
5. `add_permissions_to_user_profiles.sql`
6. Tous les autres fichiers utilitaires (`initialize_storage.sql`, `fix_*`, etc.)
7. (Optionnel) `20251106_import_places_from_json.sql` — import de données depuis un JSON Firebase

> Vérifiez les dépendances commentées en tête de chaque fichier avant exécution.

## Exécution avec psql

Pré-requis: accès à la base Postgres de votre projet Supabase.

```bash
# Exemple avec variable d'environnement DATABASE_URL (postgres://...)
psql "$DATABASE_URL" -f supabase_migrations/00_init_schema.sql
psql "$DATABASE_URL" -f supabase_migrations/20251028_create_institutions.sql
psql "$DATABASE_URL" -f supabase_migrations/20251028_create_places.sql
psql "$DATABASE_URL" -f supabase_migrations/add_role_to_profiles.sql
psql "$DATABASE_URL" -f supabase_migrations/add_permissions_to_user_profiles.sql
```

Importer les données des places (optionnel):

```bash
# Ouvrir le fichier et coller le JSON Firebase dans le bloc $$ ... $$
# puis exécuter
psql "$DATABASE_URL" -f supabase_migrations/20251106_import_places_from_json.sql
```

## Vérifications rapides

```sql
-- Tables présentes ?
select table_name from information_schema.tables 
where table_schema='public' and table_name in ('user_profiles','gamification_data','institutions','places');

-- RLS activée ?
select relname as table, relrowsecurity as rls
from pg_class where relname in ('user_profiles','gamification_data','institutions','places');

-- Index principaux
select indexname, tablename from pg_indexes 
where tablename in ('user_profiles','gamification_data','institutions','places');
```

## Notes

- Les migrations créent des policies RLS de base; adaptez-les selon vos besoins métiers.
- Les fonctions utilitaires (ex: triggers, vues, helpers) sont dans `00_init_schema.sql`.
- `add_permissions_to_user_profiles.sql` ajoute un système de permissions (colonne `permissions[]`) et fonctions RPC (`get_user_permissions`, etc.).

## Exécution avec Supabase CLI (local)

```bash
# Démarrer l'instance locale
npx supabase start

# Appliquer des fichiers SQL manuellement (ex: depuis la racine du projet)
psql "postgres://postgres:postgres@127.0.0.1:54322/postgres" -f supabase_migrations/00_init_schema.sql
psql "postgres://postgres:postgres@127.0.0.1:54322/postgres" -f supabase_migrations/add_permissions_to_user_profiles.sql
```

## Cache PostgREST / RPC non visibles (PGRST202)

Si une RPC n'est pas visible immédiatement (erreur PGRST202), recharger le cache:

```sql
-- Dans la base
NOTIFY pgrst, 'reload schema';
```

Ou exécuter le script utilitaire:

```bash
psql "$DATABASE_URL" -f supabase_migrations/reload_permissions_functions.sql
```

## Local vs distant

- Local (Supabase CLI): port Postgres par défaut `54322`, utilisateur/mot de passe `postgres`.
- Distant (projet Supabase): utilisez l'URL `postgres://...` fournie par le tableau de bord et un rôle avec droits suffisants.
