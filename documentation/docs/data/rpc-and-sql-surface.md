---
title: RPC Supabase et surface SQL exposée
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Surface SQL</div>
    <h2 class="docs-section-head__title">Un écart mesuré entre surface exposée et usage frontend</h2>
  </div>
  <p class="docs-section-head__text">
    Interroger le descripteur OpenAPI de PostgREST (`GET {SUPABASE_URL}/rest/v1/`) donne la liste réelle des fonctions Postgres exposées à l'API — indépendamment de ce que le dépôt Git documente. Le détail complet des noms de fonctions n'est volontairement pas reproduit ici (dépôt public) ; contacter l'équipe technique pour la liste exhaustive à usage interne.
  </p>
</div>

## Écart mesuré entre surface exposée et usage frontend

- Le nombre de fonctions RPC exposées via PostgREST est significativement plus élevé que le nombre d'appels `supabase.rpc(...)` trouvés dans `src/` (voir `backend/supabase/services.md` pour la méthode de comptage).
- La différence correspond à du code mort côté frontend, des fonctions appelées uniquement par du SQL interne (triggers, autres fonctions), ou des RPC d'administration jamais implémentées côté Node.

## Provisioning de compte : préférer une RPC serveur à un upsert manuel

Une fonction RPC dédiée au provisioning RBAC (rôle + permissions + statut actif en un seul appel atomique côté serveur) existe déjà en base, indépendamment des migrations versionnées du dépôt. Elle n'a pas été utilisée le 2026-07-14 lors de la création d'un compte administrateur — un `UPDATE`/`UPSERT` manuel sur `user_profiles` a été fait à la place depuis un script Node. **Pour tout provisioning futur, vérifier d'abord l'existence d'une RPC serveur dédiée avant d'écrire directement sur `user_profiles`** — plus sûr (validation et effets de bord côté SQL non contournables depuis un script externe) qu'un upsert direct sur la table.

Plusieurs fonctions répondent à la question "cet utilisateur est-il admin ?" avec des signatures différentes (par email, sans paramètre, via `auth.uid()` implicite) — signe de redondance accumulée au fil du temps. Avant d'utiliser l'une d'entre elles dans du nouveau code, vérifier laquelle correspond réellement au système RBAC actif (système A, `user_profiles.role`/`permissions`, voir `auth/overview.md`) plutôt que de deviner d'après le nom.

## Modules applicatifs révélés par la surface RPC, non documentés ailleurs

L'inventaire des RPC exposées fait apparaître deux modules applicatifs complets qui n'ont pas encore de page de documentation dédiée :

- **Gamification "roue quotidienne"** (spins journaliers, niveaux XP, déblocage de badges) — distinct des défis/quêtes/badges déjà documentés dans le menu admin.
- **Module "capsules"** — gestion de contenu pédagogique (création, évaluation, suivi de progression étudiant), avec 8 tables dédiées dans le schéma (voir `data/schema-supabase.md`).

À documenter séparément si ces deux modules sont actifs en production.

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
find_user_email_by_name(...), extract_family_name_from_email(...), extract_forname_from_email(...), generate_display_name(...)
```

Plus les fonctions PostgreSQL standard des extensions `pgcrypto`/`uuid-ossp`/`pg_trgm` — exposées automatiquement par PostgREST dès lors qu'elles sont dans le schéma `public`, sans lien avec la logique métier du projet.

## Migrations SQL les plus visibles (rappel, détail dans `backend/supabase/migrations.md`)

- `20260114_create_api_my_permissions.sql`
- `20260223_add_priority_to_votation_sessions.sql`, `20260225_add_priority_reasons_and_draft.sql`
- `20260325_add_remarques_to_student_result_vote.sql`
- `20260529_copy_previous_year_place_propositions.sql`
- `20260609_enable_institutions_storage.sql`, `20260610_enable_avatars_storage.sql`, `20260610_enable_student_documents_storage.sql`, `20260610_fix_storage_grants_self_hosted.sql`
- `20260624_create_institution_offer_tracking.sql`

## Réflexe d'audit avant de toucher un flux sensible

1. `grep -rn "supabase.rpc(" src/` pour voir les RPC réellement appelées, pas la totalité de la surface exposée.
2. Si une fonction utilisée n'a pas de définition dans `supabase/migrations/` ni `src/database/migrations/` : elle a été créée hors dépôt (comme `update_user_permissions`, voir `auth/overview.md`) — traiter comme une dépendance non versionnée, à extraire en migration avant toute modification.
3. Avant d'écrire un nouveau script d'administration : vérifier d'abord auprès de l'équipe technique s'il existe déjà une RPC serveur correspondante plutôt que de manipuler les tables directement.
