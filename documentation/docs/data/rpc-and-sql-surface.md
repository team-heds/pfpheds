---
title: RPC Supabase et surface SQL exposée
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Surface SQL</div>
    <h2 class="docs-section-head__title">Les RPC et primitives SQL visibles dans le code</h2>
  </div>
  <p class="docs-section-head__text">
    Cette page liste les RPC explicitement repérées dans le code et les migrations les plus significatives qui les encadrent.
  </p>
</div>

## RPC observées côté frontend ou backend

### Permissions / rôles

- `api_my_permissions`
- `get_user_permissions`
- `update_user_permissions`

Usage :

- chargement des permissions runtime ;
- administration des rôles ;
- fallback de sécurité front.

### Votation / résultats

- `get_student_vote`
- `upsert_student_vote`
- `delete_student_vote`
- `has_student_voted`
- `get_all_student_votes`
- `count_votes`
- `get_top_voted_places`
- `get_algorithm_results`
- `get_student_result`

Usage :

- vote étudiant ;
- lecture de résultats ;
- statistiques ;
- calculs d'agrégats.

### Administration / maintenance

- `delete_user`
- `assign_quest_to_all_users`

## Migrations particulièrement visibles

Fichiers présents dans `supabase/migrations/` :

- `20260114_create_api_my_permissions.sql`
- `20260223_add_priority_to_votation_sessions.sql`
- `20260225_add_priority_reasons_and_draft.sql`
- `20260325_add_remarques_to_student_result_vote.sql`
- `20260529_copy_previous_year_place_propositions.sql`
- `20260609_enable_institutions_storage.sql`
- `20260610_enable_avatars_storage.sql`
- `20260610_enable_student_documents_storage.sql`
- `20260624_create_institution_offer_tracking.sql`

## Ce que cela veut dire pour la reprise

Le comportement métier ne vit pas uniquement :

- dans les vues ;
- dans les stores ;
- ou dans le backend Express.

Une partie importante du système vit aussi :

- dans les RPC Supabase ;
- dans les policies RLS ;
- dans les migrations qui ajoutent colonnes, drafts, raisons, storage et règles métier.

## Risques de modification

- casser un flux en modifiant seulement le frontend ;
- ignorer une RPC utilisée indirectement par un service ;
- oublier qu'une migration ajoute un champ désormais attendu ;
- modifier une table sans vérifier la logique SQL associée.

## Réflexe d'audit

Avant de toucher un flux sensible :

1. chercher les appels `supabase.rpc(...)` ;
2. chercher les appels `supabase.from(...)` sur la table concernée ;
3. lire les migrations récentes liées au domaine ;
4. vérifier si un endpoint backend encapsule en plus une logique métier.
