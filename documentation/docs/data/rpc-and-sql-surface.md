---
title: RPC Supabase et surface SQL exposée
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Surface SQL</div>
    <h2 class="docs-section-head__title">93 RPC exposées, ~16 réellement appelées depuis le frontend</h2>
  </div>
  <p class="docs-section-head__text">
    Liste obtenue en interrogeant directement le descripteur OpenAPI de PostgREST (`GET {SUPABASE_URL}/rest/v1/` avec `Accept: application/openapi+json`) le 2026-07-14 — c'est la liste réelle des fonctions Postgres exposées à l'API, indépendamment de ce que le dépôt Git documente.
  </p>
</div>

## Écart mesuré entre surface exposée et usage frontend

- **93 fonctions RPC** exposées via PostgREST.
- **~16 appels `supabase.rpc(...)`** trouvés dans tout `src/` (voir `backend/supabase/services.md`).
- Le reste (~77 fonctions) est soit du code mort côté frontend, soit appelé uniquement par du SQL interne (triggers, autres fonctions), soit destiné à un usage backend/administratif jamais implémenté côté Node.

## Découverte utile : une RPC de provisioning RBAC existe déjà et n'a pas été utilisée

```sql
set_user_profile_rbac(_email text, _role text, _permissions jsonb, _is_active boolean)
```

Signature confirmée par introspection directe de l'API. **Cette fonction fait exactement ce qu'un script d'administration devrait utiliser pour créer/mettre à jour le rôle et les permissions d'un compte** (`role`, `permissions`, `is_active` en un seul appel atomique côté serveur) — au lieu de faire un `UPDATE`/`UPSERT` manuel sur `user_profiles` depuis un script Node, comme cela a été fait le 2026-07-14 pour provisionner le compte de Pierre Pache. Utiliser cette RPC pour tout provisioning futur est probablement plus sûr (validation et effets de bord potentiels côté SQL non auditables depuis le frontend) qu'un upsert direct sur la table.

Autres RPC RBAC exposées, non câblées dans `roleStore` ni dans aucun service frontend trouvé :

```
can_access_track(track_id)          -- système B, voir auth/overview.md
has_any_track_role()
has_perm(p text)                     -- variante courte de user_has_permission ?
has_track_access(...)
has_track_access_level(...)
has_track_role(track_id, role)
is_admin(email_param text)           -- vérifie par email, pas par uid
is_global_admin()
is_module_owner(...)
is_rm_for_module(module_id)
is_super_admin()
is_superadmin()                      -- ⚠️ doublon probable de is_super_admin(), sans underscore, sans paramètre
promote_user_to_admin(user_email text)
user_has_permission(user_uid, required_permission)
whoami()
get_user_permissions(uid)
get_user_tracks()                    -- définie dans 004b_functions.sql, aucun appel frontend trouvé
api_my_track_permissions()
api_my_track_roles()                 -- définie dans 004_MASTER_multi_filiere.sql, non lue par roleStore
```

`is_admin()` et `is_superadmin()` en particulier semblent être une paire de fonctions redondantes avec `is_super_admin()` (avec underscore, définie dans `004_MASTER_multi_filiere.sql`) — trois façons différentes de répondre à peu près à la même question, avec des signatures différentes (par email vs sans paramètre vs via `auth.uid()` implicite). Avant d'utiliser l'une d'entre elles dans du nouveau code, vérifier laquelle correspond réellement au système RBAC actif (système A, `user_profiles`, voir `auth/overview.md`) plutôt que de deviner d'après le nom.

## RPC gamification exposées (non documentées ailleurs dans le dépôt)

```
calculate_level_from_xp(...)
check_and_unlock_badges(...)
get_all_gamification_users()
get_daily_wheel_status(...)
get_leaderboard(...)
initialize_user_gamification(...)
insert_spin_v2(...)
spin_daily_wheel(...)
update_challenge_progress(...)
xp_for_next_level(...)
```

Système de "roue quotidienne" (`daily_wheel_spins`, `spin_daily_wheel`, `insert_spin_v2`) jamais mentionné dans les vues admin de gamification connues (`ChallengeManagementView.vue`, `QuestManagementView.vue`, etc.) — probablement une fonctionnalité gamification distincte des défis/quêtes/badges déjà documentés, à explorer séparément si le module gamification est retravaillé.

## RPC "capsules" (module e-learning distinct, jamais documenté)

```
create_capsule_with_modules(...), delete_capsule(...), duplicate_capsule(...),
get_capsule_analytics(...), get_capsule_complete(...), list_capsules(...), update_capsule(...)
```

Correspond aux tables `capsules`, `capsule_modules`, `capsule_evaluations`, `capsule_feedback`, `capsule_learning_objectives`, `capsule_prerequisites`, `student_capsule_notes`, `student_capsule_progress` (8 tables au total dans le schéma, voir `data/schema-supabase.md`) — un module entier de gestion de contenu pédagogique ("capsules") qui n'a pas encore de page de documentation dédiée dans `documentation/docs/`. À documenter séparément si ce module est actif en production.

## RPC votation / résultats (documentées et actives)

```
get_student_vote, upsert_student_vote, delete_student_vote, has_student_voted,
get_all_student_votes, count_votes, get_top_voted_places, get_algorithm_results,
get_student_result, upsert_student_result, copy_previous_year_place_propositions
```

Ce sont les seules RPC du domaine PFP réellement appelées depuis le frontend (`resultatVotationService.js` et équivalents). `copy_previous_year_place_propositions` correspond à la migration `20260529_copy_previous_year_place_propositions.sql`.

## RPC système / infrastructure

```
get_active_routes(), upsert_dynamic_routes(...)   -- routes dynamiques, voir useDynamicRoutes.js / router.js
delete_user(...)                                    -- suppression de compte, à auditer avant tout usage (cascade ?)
find_user_email_by_name(...), extract_family_name_from_email(...), extract_forname_from_email(...), generate_display_name(...)
```

Plus les fonctions PostgreSQL standard de l'extension `pgcrypto`/`uuid-ossp`/`pg_trgm` (`gen_random_uuid`, `pgp_armor_headers`, `uuid_generate_v4`, `show_trgm`, etc.) — exposées automatiquement par PostgREST dès lors qu'elles sont dans le schéma `public`, sans lien avec la logique métier du projet.

## Migrations SQL les plus visibles (rappel, détail dans `backend/supabase/migrations.md`)

- `20260114_create_api_my_permissions.sql`
- `20260223_add_priority_to_votation_sessions.sql`, `20260225_add_priority_reasons_and_draft.sql`
- `20260325_add_remarques_to_student_result_vote.sql`
- `20260529_copy_previous_year_place_propositions.sql`
- `20260609_enable_institutions_storage.sql`, `20260610_enable_avatars_storage.sql`, `20260610_enable_student_documents_storage.sql`, `20260610_fix_storage_grants_self_hosted.sql`
- `20260624_create_institution_offer_tracking.sql`

## Réflexe d'audit avant de toucher un flux sensible

1. `grep -rn "supabase.rpc(" src/` pour voir les RPC réellement appelées, pas la totalité de la surface.
2. Si la fonction n'a pas de définition dans `supabase/migrations/` ni `src/database/migrations/` : elle a été créée hors dépôt (comme `update_user_permissions`, `set_user_profile_rbac`, la plupart des RPC gamification/capsules) — traiter comme une dépendance non versionnée, à extraire en migration avant toute modification.
3. Avant d'écrire un nouveau script d'administration : vérifier d'abord s'il existe déjà une RPC correspondante dans la liste ci-dessus plutôt que de manipuler les tables directement.
