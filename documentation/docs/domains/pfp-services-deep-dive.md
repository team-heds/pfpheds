---
title: Services PFP, étudiants et votes
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Services métier</div>
    <h2 class="docs-section-head__title">Ce que portent réellement `studentsService`, `votesBackendService` et `resultatVotationService`</h2>
  </div>
  <p class="docs-section-head__text">
    Cette page documente les services les plus sensibles du domaine formation pratique et votation.
  </p>
</div>

## `studentsService.js`

Rôle observé :

- servir de couche de récupération et de fusion des données étudiantes ;
- privilégier `user_profiles` comme source plus fiable pour les identités ;
- enrichir ensuite depuis `StudentsPhysio`.

Points importants :

- le service assume une coexistence de sources ;
- il essaie plusieurs sélections selon les colonnes réellement disponibles ;
- il maintient un cache simple module-level ;
- il mappe la classe via `StudentsPhysio` quand nécessaire.

Signal d'architecture :

- les étudiants ne vivent pas dans une seule table parfaitement propre ;
- la reprise doit toujours vérifier la cohérence `user_profiles` ↔ `StudentsPhysio`.

## `votesBackendService.js`

Rôle observé :

- encapsuler les RPC de vote ;
- centraliser les opérations de lecture/écriture de vote étudiant ;
- éviter d'écrire directement dans la table depuis les écrans.

RPC utilisées :

- `get_student_vote`
- `upsert_student_vote`
- `delete_student_vote`
- `has_student_voted`
- `get_all_student_votes`
- `count_votes`
- `get_top_voted_places`

Lecture complémentaire :

- `vote_statistics`
- `vote_place_aggregation`

Signal d'architecture :

- le vote étudiant est fortement orienté RPC ;
- la logique métier de vote ne vit pas uniquement dans les vues.

## `resultatVotationService.js`

Rôle observé :

- piloter les endpoints backend de calcul et de persistance des résultats ;
- servir de façade front pour l'algorithme de votation ;
- mixer endpoints backend et RPC/lectures Supabase directes selon le besoin.

Endpoints principaux :

- run / confirm algorithm ;
- résultats ;
- étudiant ;
- statistiques ;
- status ;
- suppression de résultat ;
- suppression d'exécution ;
- génération et sauvegarde PFP3/PFP4.

Points importants :

- le service gère explicitement les tokens Supabase ;
- une partie des lectures simples passe directement par Supabase ;
- les calculs lourds passent par Express.

## Réflexe de reprise

Quand un problème touche la PFP :

1. vérifier la source étudiant dans `studentsService` ;
2. vérifier si le vote passe par RPC ou backend HTTP ;
3. vérifier si le résultat final est lu depuis `student_result_vote` ;
4. vérifier les propositions `votation_sessions` si PFP3/PFP4.
