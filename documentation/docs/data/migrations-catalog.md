---
title: Catalogue des migrations Supabase
---

## Objectif

Donner une vue lisible des migrations presentes dans `supabase/migrations/`.

## Migrations repertoriees

| Fichier | Intention apparente |
| --- | --- |
| `20251215_create_feedbacka_module.sql` | creation module Feedbacka |
| `20260114_create_api_my_permissions.sql` | creation RPC permissions |
| `20260130_add_async_periods_to_planning.sql` | periodes asynchrones planning |
| `20260130_add_multiple_classes_support.sql` | support classes multiples |
| `20260130_clean_and_standardize_class_codes.sql` | normalisation codes classes |
| `20260130_fix_unique_constraint.sql` | correction contrainte d'unicite |
| `20260223_add_priority_to_votation_sessions.sql` | priorite sur sessions de votation |
| `20260225_add_priority_reasons_and_draft.sql` | raisons de priorite et brouillon |
| `20260316_add_student_count_to_classes.sql` | nombre d'etudiants par classe |
| `20260325_add_remarques_to_student_result_vote.sql` | remarques sur resultats vote etudiant |
| `20260422_grant_access_batch2_profiles.sql` | grants profils batch 2 |
| `20260422_grant_access_to_physio_profiles.sql` | grants profils physio |
| `20260529_copy_previous_year_place_propositions.sql` | copie propositions année précédente |
| `20260609_enable_institutions_storage.sql` | storage institutions |
| `20260610_add_is_hidden_to_institutions.sql` | drapeau visibilite institutions |
| `20260610_enable_avatars_storage.sql` | storage avatars |
| `20260610_enable_student_documents_storage.sql` | storage documents etudiants |
| `20260610_fix_storage_grants_self_hosted.sql` | correction grants storage self-hosted |
| `20260624_create_institution_offer_tracking.sql` | suivi des offres institutions |

## Migrations structurantes a connaitre

### Permissions

- `20260114_create_api_my_permissions.sql`

Impact:

- chargee par `roleStore`
- critique pour la lecture des permissions runtime

### Planning

- `20260130_add_async_periods_to_planning.sql`
- `20260130_add_multiple_classes_support.sql`
- `20260130_clean_and_standardize_class_codes.sql`

Impact:

- domaine planning
- classes
- periodes

### Votation / PFP

- `20260223_add_priority_to_votation_sessions.sql`
- `20260225_add_priority_reasons_and_draft.sql`
- `20260325_add_remarques_to_student_result_vote.sql`
- `20260529_copy_previous_year_place_propositions.sql`
- `20260624_create_institution_offer_tracking.sql`

Impact:

- campagnes
- secretariat
- suivi des offres
- resultats

### Storage

- `20260609_enable_institutions_storage.sql`
- `20260610_enable_avatars_storage.sql`
- `20260610_enable_student_documents_storage.sql`
- `20260610_fix_storage_grants_self_hosted.sql`

Impact:

- fichiers
- avatars
- documents etudiants

## Regle de reprise

Avant de toucher un domaine métier, vérifier si une migration récente a déjà formalisé le besoin. Une partie importante des comportements visibles dépend de ces migrations.
