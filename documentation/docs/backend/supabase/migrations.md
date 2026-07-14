---
title: Migrations Supabase
---

## Trois historiques de migration séparés, non coordonnés

Comptage exact des fichiers `.sql` par dossier :

| Dossier | Nombre de fichiers | Convention de nommage | Sujet dominant |
| --- | --- | --- | --- |
| `supabase/migrations/` | 19 | `YYYYMMDD_description.sql` | Permissions, planning, votation, storage (le plus actif/récent) |
| `src/database/migrations/` | 12 | `NNN_description.sql` (000 à 007, avec suffixes lettres) | RBAC par filière (`tracks`, `user_track_roles`), table `modules` |
| `migrations/` (racine) | 3 | libre, sans préfixe | Ajouts ponctuels PFP (`add_pfp_propositions_columns.sql`, etc.) |

**Aucun `supabase/config.toml` n'existe dans le dépôt** — `supabase/migrations/` n'est donc **pas** piloté par le Supabase CLI officiel (`supabase db push`, `supabase migration up`). C'est un dossier de fichiers SQL appliqués manuellement, typiquement via `psql "$DATABASE_URL" -f fichier.sql` (pattern confirmé dans `data/migration-firebase-supabase.md`). Il n'y a pas de table `schema_migrations` garantie ni de mécanisme empêchant une double-application ou un désordre d'ordre — la seule protection observée est l'usage ponctuel de `IF NOT EXISTS` / `DROP POLICY IF EXISTS` à l'intérieur des fichiers eux-mêmes (idempotence manuelle, pas systématique).

**Conséquence directe** : il n'existe aucune commande unique pour "remettre à jour une base vierge à l'état actuel" — il faudrait exécuter, dans le bon ordre, les fichiers des 3 dossiers, et certaines fonctions/tables critiques (`update_user_permissions`, `get_user_permissions`, la table `roles`/`permissions`/`role_permissions`) n'ont **aucune trace SQL dans le dépôt du tout** (voir `auth/overview.md`), donc même en rejouant les 34 fichiers SQL existants, la base reconstruite serait incomplète.

## `src/database/migrations/` — ordre d'exécution documenté dans le fichier lui-même

`004_MASTER_multi_filiere.sql` liste explicitement l'ordre attendu en commentaire :

```
1. 003_create_tracks_table.sql
2. 004_create_user_track_roles.sql
3. 004b_functions.sql
4. 004c_add_track_id_to_modules.sql
5. 004d_migrate_roles.sql
```

Mais **le fichier MASTER contient lui-même le SQL de 003 et 004** (il les réplique, `CREATE TABLE IF NOT EXISTS tracks`, `CREATE TABLE IF NOT EXISTS user_track_roles`) — donc `004_MASTER_multi_filiere.sql` seul suffit pour poser `tracks` + `user_track_roles` + les fonctions RBAC (`is_super_admin`, `has_track_role`, etc.). Les fichiers séparés `003_create_tracks_table.sql` et `004_create_user_track_roles.sql` semblent être les brouillons d'origine, fusionnés ensuite dans le MASTER — à vérifier avant de les exécuter séparément pour éviter les `CREATE TYPE` en double (le `DO $$ ... EXCEPTION WHEN duplicate_object THEN NULL; END $$` protège contre ce cas précis pour `track_role`, mais pas pour tout).

## `supabase/migrations/` — catalogue par domaine (19 fichiers, ordre chronologique réel)

```
20251215  create_feedbacka_module.sql              — module Feedbacka
20260114  create_api_my_permissions.sql             — RPC permissions (voir auth/permission-model.md)
20260130  add_async_periods_to_planning.sql          ┐
20260130  add_multiple_classes_support.sql           ├─ planning / classes (3 migrations le même jour)
20260130  clean_and_standardize_class_codes.sql       │
20260130  fix_unique_constraint.sql                  ┘
20260223  add_priority_to_votation_sessions.sql      ┐
20260225  add_priority_reasons_and_draft.sql          ├─ votation / PFP
20260325  add_remarques_to_student_result_vote.sql    │
20260529  copy_previous_year_place_propositions.sql   │
20260624  create_institution_offer_tracking.sql      ┘
20260316  add_student_count_to_classes.sql           — classes
20260422  grant_access_batch2_profiles.sql           ┐ grants role='admin' + permissions[] + user_track_roles
20260422  grant_access_to_physio_profiles.sql        ┘ SUPER_ADMIN sur ~20 comptes staff nommément
20260609  enable_institutions_storage.sql            ┐
20260610  add_is_hidden_to_institutions.sql           │
20260610  enable_avatars_storage.sql                  ├─ storage (voir backend/supabase/rls.md)
20260610  enable_student_documents_storage.sql        │
20260610  fix_storage_grants_self_hosted.sql         ┘
```

Les deux migrations du 22 avril (`grant_access_batch2_profiles.sql`, `grant_access_to_physio_profiles.sql`) accordent nommément `role='admin'` + un tableau de permissions à une vingtaine de comptes `@hevs.ch` en dur dans le `WHERE lower(email) IN (...)`, **et** insèrent des lignes `SUPER_ADMIN` dans `user_track_roles` pour les filières `SI` et `PHY`. C'est le seul exemple dans le dépôt qui met à jour les deux systèmes RBAC (A et B, voir `auth/overview.md`) en une seule migration cohérente — modèle à suivre pour toute future élévation de droits en masse plutôt que de passer uniquement par `ManageUserRoles.vue` (qui n'écrit que dans le système A).

## Réflexe avant toute migration

1. Identifier le dossier pertinent selon le domaine (voir tableau du haut).
2. Vérifier s'il existe déjà une migration récente sur la même table (`grep -rl "nom_table" supabase/migrations/ src/database/migrations/ migrations/`).
3. Appliquer manuellement via `psql`, pas de garantie d'ordre automatique.
4. Si la migration touche des permissions et concerne une filière SI/PHY, suivre le pattern à deux écritures de `20260422_grant_access_batch2_profiles.sql` (système A + système B).
5. Après application, si la migration crée une table/fonction destinée à être appelée par le frontend avec la clé anon ou service_role : vérifier les `GRANT` (voir `backend/supabase/overview.md`), pas seulement les policies RLS.
