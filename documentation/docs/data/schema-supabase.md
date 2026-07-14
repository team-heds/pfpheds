---
title: Schéma Supabase
---

## Méthode

Ce document est généré à partir du **schéma live réel**, interrogé via le descripteur OpenAPI exposé par PostgREST (`GET {SUPABASE_URL}/rest/v1/` avec `Accept: application/openapi+json`), pas depuis les fichiers de migration (qui sont incomplets — voir `backend/supabase/migrations.md`). La base expose **80 tables/vues** via l'API REST au moment de l'inspection (2026-07-14). Les commentaires reproduits ci-dessous (`--`) sont les `COMMENT ON COLUMN` réels stockés en base, pas des descriptions ajoutées ici.

## `user_profiles` — source de vérité des permissions

```
user_id            uuid NOT NULL (PK)
avatar_url          text
updated_at           timestamptz
house_id             uuid (FK → houses.id)              -- maison HES de l'utilisateur
last_login           timestamp                          -- pour calcul des streaks
login_streak         integer
created_at           timestamp
email                text                                -- copié depuis auth.users
forname              text
family_name          text
display_name         varchar
bio                  text
is_active            boolean
is_verified          boolean
role                 varchar                             -- PAS de FK vers roles.slug (voir auth/overview.md)
phone                varchar
city                 varchar
permissions          jsonb                                -- "permissions for RBAC" (commentaire SQL réel)
preferences          jsonb
firebase_id          text                                 -- pont avec l'ancien système Firebase
classe               text
metadata             jsonb
pfp_cohort           text                                 -- ex: PFP1A, PFP1B
primary_track_id     varchar (FK → tracks.id)
```

Deux colonnes de "cohorte" coexistent : `classe` (text libre) et `pfp_cohort` (text libre aussi) — aucune n'a de contrainte `CHECK` ni de FK vers une table de référence, malgré l'existence d'une table `classes` distincte dans le schéma (voir plus bas). `primary_track_id` référence `tracks.id` mais n'est peuplé par aucun code applicatif trouvé dans le dépôt — probablement posé pour un usage futur.

## `StudentsPhysio` — table pivot du domaine PFP, historique de dette technique visible

```
id                   uuid NOT NULL (PK)
user_id              uuid NOT NULL                        -- réf. auth.users
firebase_id          text                                 -- ID Firebase avant migration
aigu, ambu, msq, neuroger, rehab, sysint, sae   integer    -- compteurs de spécialités
fr, de, it, eng, all_lang                        integer   -- compteurs de langues
class                text
cas_particulier      boolean
lese                 boolean
pfp1a                text
pf1b                 integer   ⚠️ typo réel en base (pas "pfp1b") — colonne distincte de pfp1b (text) ci-dessous
pfp1b                text
pfp2                 text
pfp3                 text
pfp4                 text
pfp1a_retake, pfp1b_retake, pfp2_retake, pfp3_retake, pfp4_retake   text
pfp1a_absences...pfp4_absences   numeric
pfp1a_remarques...pfp4_remarques   text
absences             numeric      -- redondant avec les colonnes par PFP ci-dessus
remarques            text         -- idem
pfp_valided          jsonb        -- "Tableau JSONB des PFP validées avec leurs critères"
pfp_2                jsonb        -- distinct de pfp2 (text) ET de pfp2_data (jsonb) ci-dessous
pfpinfo              jsonb        -- "stages sélectionnés, etc."
pfp2_place_id        text
pfp2_data            jsonb        -- "Données complètes de l'affectation PFP2"
repondant_hes        text
repond_hes_id        text
student_note         text
canton               text
year                 text NOT NULL
created_at, updated_at, migrated_at   timestamptz
```

**Constat brut** : il existe simultanément `pfp2` (text), `pfp_2` (jsonb) et `pfp2_data` (jsonb) — trois colonnes au nom quasi identique avec des types et rôles différents, presque certainement issues de 3 vagues de développement successives sans nettoyage. Idem pour `pf1b` (typo, integer) vs `pfp1b` (text, la colonne réellement utilisée). **Avant d'écrire le moindre code touchant aux données PFP1B/PFP2, vérifier dans les vues concernées laquelle de ces colonnes est effectivement lue** (`grep -rn "pfp2_data\|pfp_2\b\|\.pfp2\b" src/`) plutôt que de deviner d'après le nom.

## `places` — convention de casse mixte, deux clés candidates

```
PlaceId              text NOT NULL (PK)                   -- ex: "-NzBxY..." (ancien ID Firebase RTDB push-key)
id                    text                                 -- colonne séparée, PAS la PK
NomPlace, InstitutionId, InstitutionName   text
MSQ, SYSINT, AIGU, REHAB, AMBU, NEUROGER   boolean          -- spécialités (PascalCase)
FR, DE, IT, ENG                             boolean          -- langues (PascalCase)
PFP1A, PFP1B, PFP2, PFP3, PFP4               jsonb           -- capacité par année: {"2025":"2","2026":"3"}
OffrePFP1A...OffrePFP4                       jsonb           -- offres proposées par année
pfp1a_proposition...pfp4_proposition          jsonb          -- propositions par année (minuscules, distinct de OffrePFPx)
Remarques                                    jsonb           -- par année
praticiensFormateurs                         text[]
AccordCadreDate, ConventionDate               date
CreatedAt, UpdatedAt                          timestamptz
Canton, Categorie, Lieu, Note                 text
InstitutionLegacyId, LegacyId, IDPlace        text           -- 3 identifiants legacy différents
fileurl, filename                             text           -- minuscules, seules colonnes non PascalCase avec praticiensFormateurs
selectedOut                                   boolean NOT NULL
```

`PlaceId` (le vrai `PRIMARY KEY`, format push-key Firebase du type `-NzBxY...`) coexiste avec une colonne `id` distincte non-PK, et avec 3 identifiants "legacy" (`InstitutionLegacyId`, `LegacyId`, `IDPlace`) — trace directe de la migration Firebase RTDB → Postgres (voir `data/migration-firebase-supabase.md`). La casse est majoritairement PascalCase (héritage RTDB où les clés JSON étaient en PascalCase), sauf `fileurl`, `filename`, `praticiensFormateurs` (camelCase) et `selectedOut` — **toute requête SQL brute doit citer les noms de colonnes entre guillemets doubles** (`"PlaceId"`, `"NomPlace"`) car Postgres met en minuscule les identifiants non quotés, ce qui casserait silencieusement une requête écrite sans guillemets.

Trois familles de champs JSONB par année parallèles et non fusionnées : `PFPx` (capacité), `OffrePFPx` (offres), `pfpx_proposition` (propositions, minuscules) — même remarque que pour `StudentsPhysio` : vérifier laquelle est réellement lue avant de modifier.

## `institutions`

```
InstitutionId         text NOT NULL (PK)
Name, Description, Note   text
Address, Locality, NPA, Canton   text/varchar
Latitude, Longitude    double precision
ImageURL               jsonb
Category, Language      text/varchar
AccordCadreDate, AccordCadrePDF, ConventionDate, ConventionPDF   date/text
CyberleanURL           text   ⚠️ typo réel ("Cyberlean" pas "Cyberlearn")
CyberlearnURL          text   -- orthographe correcte, colonne séparée de la précédente
URL                    text
MailChef, NomChef, PhoneChef   text
IdResponsablePhysio    text
UpdatedAt              timestamptz
is_hidden              boolean NOT NULL   -- "Masque une institution des vues publiques sans la supprimer"
```

**`CyberleanURL` et `CyberlearnURL` sont deux colonnes distinctes** — l'une est une faute de frappe de l'autre, jamais corrigée en base, et les deux existent en parallèle (confirmé aussi dans les logs applicatifs vus en troubleshooting Firebase Storage : `CyberleanURL: '...', CyberlearnURL: null`). Vérifier laquelle un écran donné lit réellement avant de considérer l'une comme "la bonne".

`is_hidden` est directement le mécanisme qui alimente le pattern "masquer sans supprimer" utilisé ailleurs dans le projet (menu admin, gamification) — ici appliqué au niveau base de données avec un vrai commentaire SQL explicite.

## `student_result_vote` — table centrale de l'algorithme d'attribution

```
id                      uuid NOT NULL (PK)
user_id                 uuid NOT NULL
pfp_type, year           text NOT NULL
assigned_place_id, assigned_place_name, assigned_institution_name   text
assigned_rank            integer     -- 1 = premier choix, 2 = deuxième, etc.
algorithm_run_id         uuid         -- traçabilité d'une exécution d'algorithme
algorithm_version        text
status                   text         -- 'draft' | 'published'
original_choices         jsonb
priority_score           numeric
assigned_praticien_id    bigint
repondant_hes, signataire_hes, lieu_signature   text
is_validated             boolean
pfp_validee, pfp_echec, pfp_arret   boolean
commentaire_arret        text
remarques                text
created_at, updated_at, assigned_at   timestamptz
```

C'est la table la plus interrogée directement depuis les vues (43 occurrences mesurées, voir `backend/supabase/services.md`). `algorithm_run_id` + `algorithm_version` permettent en théorie de rejouer/tracer une exécution d'algorithme d'attribution, mais aucune table associée listant les exécutions elles-mêmes (type `algorithm_runs`) n'a été trouvée dans le schéma — la traçabilité repose uniquement sur cet UUID stocké par ligne, sans table de référence.

## `votation_sessions`

```
id                    uuid NOT NULL (PK)
pfp_type, year, target_class, status   text NOT NULL
opened_at, closed_at   timestamptz
opened_by              uuid
is_priority            boolean   -- session réservée à des étudiants sélectionnés
priority_user_ids      jsonb     -- array de user_id autorisés
priority_reasons       jsonb     -- map user_id -> raisons
pfp4_proposals         jsonb     -- map userId -> [placeIds], généré par l'algo admin, filtre la vue de vote étudiant
```

## `gamification_data` et `houses`

```
gamification_data:
  id uuid (PK), user_id uuid NOT NULL, email text NOT NULL,
  total_xp integer, current_level integer,
  house_id uuid, house_points integer, gamification_metadata jsonb

houses:
  id uuid (PK), name text NOT NULL, motto text, color text,
  total_xp bigint, member_count integer, level integer
```

Les valeurs de maison utilisées côté frontend (`harmonis`, `elaris`, `doloris`, `solencia`, `gamemaster` — voir `ProfileInfo.vue`) doivent correspondre à `houses.name`, mais **aucune contrainte `CHECK` ou enum n'a été trouvée** sur cette colonne : la cohérence est garantie uniquement par convention applicative.

## `modules`

```
id                   integer NOT NULL (PK)
code                 varchar NOT NULL
short_code, number    varchar
title                text NOT NULL
responsable, responsable_email, coordinateur   text
color                varchar
year, credits, heures_contact   integer
track_id             text (FK → tracks.id)
```

`track_id` (FK réelle vers `tracks.id`) est la colonne qui alimente `can_access_track()` dans la policy RLS de `005_rls_policies_modules.sql` — c'est la seule table du schéma dont l'accès dépend effectivement du système RBAC B (`user_track_roles`, voir `auth/overview.md`).

## Tables exposées mais non documentées ici (inventaire, pour référence future)

`academic_tickets`, `academic_years`, `admin_users`, `alpinphysio_members`, `badges`, `calendar_cells`, `capsule_*` (6 tables — module e-learning "capsules"), `challenges`, `classes`, `cohorts`, `communities`, `content_library`, `course_modules`, `course_teachers`, `courses`, `daily_wheel_spins`, `dynamic_routes`, `event_likes`, `event_registrations`, `events`, `extensions`, `feedbacka_submissions`, `feedbackas`, `file_physio_files`, `file_physio_folders`, `firebase_supabase_mapping`, `house_leaderboard`, `import_users`, `planning_cells`, `planning_history`, `planning_slot_votes`, `planning_time_slots`, `popular_badges`, `post_media`, `posts`, `profiles`, `push_outbox`, `push_subscriptions`, `quest_steps`, `quests`, `role_permissions`, `roles`, `schema_migrations`, `semesters`, `structures`, `student_capsule_notes`, `student_capsule_progress`, `student_data`, `student_documents`, `student_module_responses`, `student_progress_details`, `todos`, `user_badges`, `user_challenge_progress`, `user_communities`, `user_daily_spins`, `user_permissions`, `user_quest_progress`, `video_library`, `votation_sessions`, `xp_history`.

Tables/vues calculées repérées : `academic_tickets_stats`, `capsules_with_stats`, `events_with_counts`, `popular_badges`, `house_leaderboard`, `v_role_permissions` — des vues SQL, pas des tables de base, à ne jamais tenter de modifier par `INSERT`/`UPDATE` direct.

## `schema_migrations` : piège de nommage

Cette table existe et contient une liste de versions datées de **2022 à 2024** (`20221125140132`, `20240214120130`, ...). Ce n'est **pas** un tracker des migrations applicatives du dépôt (`supabase/migrations/`, dates 2025-2026) — c'est la table de suivi interne de la stack Supabase self-hosted elle-même (GoTrue/Storage/Realtime). Ne pas la confondre avec un historique applicatif : elle ne référence aucun des fichiers `.sql` du dépôt.

## Tables du domaine RBAC non exposées via l'API REST

`tracks`, `user_roles`, `user_track_roles` **n'apparaissent pas** dans le descripteur OpenAPI PostgREST (contrairement aux 80 tables listées plus haut) alors qu'elles existent en base (confirmé par `42501 permission denied`, pas `42P01 relation does not exist` — voir `auth/security-services-legacy.md`). Un léger raccourci trompeur : `tracks` a quand même une RPC exposée, `/rpc/get_user_tracks` (définie dans `src/database/migrations/004b_functions.sql`), mais **cette RPC n'est appelée par aucun code frontend trouvé dans le dépôt** — probablement du code mort.
