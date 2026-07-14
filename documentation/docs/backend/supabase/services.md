---
title: Services Supabase
---

## Principe affiché vs réalité mesurée

La convention affichée dans ce projet est : centraliser les accès Supabase dans `src/service/` (48 fichiers) et les stores Pinia, pour que les vues orchestrent sans porter la logique de requête. **Comptage exact des appels `.from(` (lecture/écriture de table) par couche, sur tout `src/` :**

| Couche | Appels `.from(` | Part du total |
| --- | --- | --- |
| `src/views/` | 326 | 47 % |
| `src/service/` | 226 | 32 % |
| `src/components/` | 142 | 20 % |
| **Total** | **694** | 100 % |

**La couche censée centraliser les accès (`service/`) représente moins du tiers des requêtes réelles.** Les vues et composants font, ensemble, près de 70 % des accès directs à Supabase. Ce n'est pas une anomalie ponctuelle mais un pattern dominant du projet — toute réécriture d'une table doit donc inclure une recherche `grep -rn "from('nom_table'" src/` plutôt que de supposer qu'un seul service centralise l'accès.

## Tables les plus interrogées directement depuis `views/` (top 10, comptage exact)

```
43  student_result_vote
38  user_profiles
36  StudentsPhysio
13  places
11  planning_time_slots
11  courses
10  modules
10  calendar_cells
 9  course_teachers
 8  votation_sessions / user_communities / institutions
```

`student_result_vote` et `StudentsPhysio` (79 appels directs cumulés depuis les vues) sont les deux tables les plus fragiles à faire évoluer : toute modification de schéma sur ces deux tables oblige à auditer un grand nombre de vues, pas seulement un service.

## RPC appelées directement depuis des vues (contournement total de la couche service)

```
src/views/admin/pfp/ManagementOffreView.vue
src/views/admin/users/ManageUserRoles.vue
src/views/admin/users/UserListView.vue
```

Ces trois vues appellent `supabase.rpc(...)` sans passer par aucun service intermédiaire.

## Liste complète des RPC appelées côté frontend (16 distinctes, extraites du code)

```js
// Permissions / administration
supabase.rpc('api_my_permissions')            // src/stores/role.js
supabase.rpc('update_user_permissions', ...)   // ManageUserRoles.vue
supabase.rpc('assign_quest_to_all_users', ...) // gamification

// Votation étudiant
supabase.rpc('get_student_vote', ...)
supabase.rpc('upsert_student_vote', ...)
supabase.rpc('delete_student_vote', ...)
supabase.rpc('has_student_voted', ...)
supabase.rpc('get_all_student_votes', ...)
supabase.rpc('count_votes', ...)
supabase.rpc('get_top_voted_places', ...)
supabase.rpc('get_student_result', ...)
```

Seules `api_my_permissions` (voir `auth/permission-model.md`) et les RPC de votation ont une définition SQL retrouvée dans `supabase/migrations/`. `update_user_permissions` n'en a aucune — voir `auth/overview.md`, section "Anomalie connue".

## Services les plus critiques (identifiés par usage transversal, pas par taille de fichier)

| Service | Rôle réel |
| --- | --- |
| `rolesService.js` | Résolution de rôles legacy, encore appelé par le router pour 2 routes (`auth/security-services-legacy.md`) |
| `supabaseStorageService.js` | Upload avatar/documents, respecte la convention `{user_id}/` requise par les policies RLS storage |
| `gamificationServiceSupabase.js` | Lecture/écriture `gamification_data`, appelé depuis `CardNameProfile.vue` et `RightSidebar.vue` |
| `studentsService.js` | Accès `StudentsPhysio`, une des deux tables les plus fragiles (voir plus haut) |
| `planningService.js` | Accès `planning_time_slots`, `calendar_cells`, `courses` |
| `resultatVotationService.js` | Accès `student_result_vote`, la table la plus interrogée du projet |

## Recommandation concrète (pas générique)

Étant donné le ratio mesuré (47 % vues / 32 % services / 20 % composants), la recommandation utile n'est pas "centraliser dans les services" en général (déjà tenté et non tenu), mais plutôt :

1. Pour toute modification de `student_result_vote` ou `StudentsPhysio` : lancer `grep -rn "from('student_result_vote'" src/` (ou `StudentsPhysio`) avant de commencer, car la majorité des points d'impact seront dans `views/`, pas dans `service/`.
2. Ne pas supposer qu'un changement de RPC (ex. `get_student_vote`) est capturé par un seul service — vérifier aussi les vues qui appellent `supabase.rpc()` directement (liste ci-dessus).
3. Nouveau code : accepter que la convention "tout dans les services" ne sera probablement pas respectée spontanément — si c'est un objectif réel, il faut soit un lint custom, soit accepter le statu quo et documenter systématiquement les accès directs comme celui-ci.
