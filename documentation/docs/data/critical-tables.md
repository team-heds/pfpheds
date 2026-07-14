---
title: Tables critiques et responsabilités métier
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Données critiques</div>
    <h2 class="docs-section-head__title">Les tables qu'il faut connaître avant toute modification sensible</h2>
  </div>
  <p class="docs-section-head__text">
    Criticité mesurée par fréquence d'accès direct (`grep -c "from('table'"` sur `src/`), pas par intuition. Le schéma détaillé (colonnes exactes, pièges) est dans `data/schema-supabase.md` — cette page classe et hiérarchise.
  </p>
</div>

## Classement par fréquence d'accès direct (mesuré sur tout `src/`, tables métier)

| Rang | Table | Occurrences `.from(` | Domaine |
| --- | --- | --- | --- |
| 1 | `student_result_vote` | 43 | Résultats d'attribution PFP |
| 2 | `user_profiles` | 38 | Auth / permissions / profil |
| 3 | `StudentsPhysio` | 36 | Référentiel étudiant PFP |
| 4 | `places` | 13 | Référentiel places de stage |
| 5 | `planning_time_slots` | 11 | Planning SI |
| 5 | `courses` | 11 | Planning SI |
| 6 | `modules` | 10 | Structure pédagogique |
| 6 | `calendar_cells` | 10 | Planning SI |
| 7 | `course_teachers` | 9 | Planning SI |
| 8 | `votation_sessions` | 8 | Campagnes de votation PFP |
| 8 | `user_communities` | 8 | Social |
| 8 | `institutions` | 8 | Référentiel institutions |

Une table en tête de ce classement signifie que sa modification de schéma a le plus de chances de casser du code réparti sur de nombreux fichiers, **majoritairement dans `views/`** (voir `backend/supabase/services.md`) — pas seulement dans un service central.

## Auth, profils et permissions

Voir `auth/overview.md` pour le détail complet (4 systèmes RBAC coexistants) et `data/schema-supabase.md` pour les colonnes exactes de `user_profiles`. Point de synthèse : `user_profiles` est à la fois le profil enrichi affiché à l'écran ET la source de vérité des permissions runtime — toute corruption de cette table a un double impact (affichage + contrôle d'accès).

## Formation pratique et votation (le cœur métier du projet)

### `StudentsPhysio`

Référentiel étudiant physio. Contient de la dette de schéma réelle et documentée dans `data/schema-supabase.md` (colonnes `pfp2` / `pfp_2` / `pfp2_data` qui se chevauchent, typo `pf1b`). Avant toute modification : identifier précisément quelle colonne parmi les variantes est lue par l'écran concerné.

### `places`

Référentiel des places de stage, hérité de Firebase RTDB (clé primaire `PlaceId` au format push-key `-NzBxY...`). Casse PascalCase dominante — toute requête SQL brute doit citer les colonnes entre guillemets doubles.

### `student_result_vote`

Table la plus interrogée du projet. Stocke les assignations, statuts (`draft`/`published`) et sorties de l'algorithme d'attribution (`algorithm_run_id`, `algorithm_version`, `priority_score`). Aucune table `algorithm_runs` de référence trouvée — la traçabilité d'une exécution repose uniquement sur l'UUID répété sur chaque ligne concernée.

### `votation_sessions`

Sessions de votation, avec un mécanisme de session "prioritaire" (`is_priority` + `priority_user_ids` + `priority_reasons` en JSONB) qui restreint le vote à une liste explicite d'étudiants — mécanisme ad hoc plutôt qu'une table de jointure `votation_session_students`.

### `institutions`

Référentiel institutions. Contient une colonne `is_hidden` avec commentaire SQL explicite (`"Masque une institution des vues publiques sans la supprimer"`) — c'est l'implémentation en base du même pattern "masquer sans supprimer" utilisé côté frontend (menu admin, gamification). Contient aussi un doublon de typo : `CyberleanURL` vs `CyberlearnURL`.

## Social et engagement

`posts`, `post_media`, `communities`, `user_communities`, `events`, `event_registrations`, `event_likes` — domaine social, impact plus limité en cas de bug (pas de conséquence académique directe), mais volumétrie potentiellement élevée (flux temps réel via Supabase Realtime, voir composants `MainFeed.vue`/`MainFeedSupabase.vue`).

## Planning et exploitation (Soins Infirmiers)

`modules`, `courses`, `course_teachers`, `calendar_cells`, `planning_time_slots`, `planning_cells`, `planning_history`, `classes`, `cohorts`, `semesters`, `academic_years`. `modules.track_id` est la seule colonne du schéma dont l'accès dépend du RBAC "système B" (`user_track_roles`/`can_access_track()`, voir `auth/overview.md`) — tout le reste du domaine planning repose sur le système A (`user_profiles.permissions`) comme le reste de l'app.

## Storage (buckets, pas des tables Postgres classiques)

Voir `backend/supabase/rls.md` pour le détail complet des policies. Résumé : `institutions` (écriture ouverte à tout authentifié), `avatars` et `student-documents` (écriture restreinte au dossier `{user_id}/` du propriétaire) — les trois sont **publics en lecture**.

## Réflexe de reprise (mis à jour)

1. Consulter le rang de la table dans le tableau de fréquence ci-dessus — plus le rang est élevé, plus l'audit d'impact doit être large (`views/` en priorité, pas seulement `service/`).
2. Lire les colonnes exactes et leurs pièges connus dans `data/schema-supabase.md` avant d'écrire la moindre requête.
3. Vérifier les migrations récentes touchant la table (`data/migrations-catalog.md`).
4. Vérifier la policy RLS effective, pas supposée (`backend/supabase/rls.md`).
5. Si la table est liée à `user_track_roles`/`tracks` (seul cas connu : `modules`) : vérifier aussi le système RBAC B en plus du système A.
