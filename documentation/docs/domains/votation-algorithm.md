---
title: Algorithme de votation et d'attribution
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Noyau métier</div>
    <h2 class="docs-section-head__title">Comment les places sont proposées, calculées et attribuées</h2>
  </div>
  <p class="docs-section-head__text">
    Cette page synthétise le comportement réellement observé dans `backend/supabase/resultatVotationStoreBackend.js`.
  </p>
</div>

## Point d'entrée technique

Le cœur de l'algorithme vit dans :

- `backend/supabase/resultatVotationStoreBackend.js`

Endpoints clés :

- `POST /api/resultat-votation/run-algorithm`
- `POST /api/resultat-votation/confirm-algorithm`
- `GET /api/resultat-votation/results/:pfpType/:year`
- `GET /api/resultat-votation/student/:userId/:pfpType/:year`
- `GET /api/resultat-votation/statistics/:pfpType/:year`

Pour les propositions spécifiques :

- `GET /api/resultat-votation/pfp3-proposals/:year`
- `POST /api/resultat-votation/save-pfp3-proposals`
- `POST /api/resultat-votation/generate-pfp4-proposals`
- `POST /api/resultat-votation/save-pfp4-proposals`
- `GET /api/resultat-votation/pfp4-proposals/:year`

## Ce que l'algorithme fait d'abord

Avant toute attribution, le backend :

1. vérifie l'authentification ;
2. vérifie l'accès admin ;
3. charge les assignations existantes ;
4. calcule la capacité déjà consommée ;
5. exclut les étudiants déjà assignés si nécessaire.

Conséquence importante :

- l'algorithme n'écrase pas naïvement l'existant ;
- il peut conserver des assignations manuelles, prioritaires ou déjà publiées.

## Données prises en compte

Les calculs s'appuient notamment sur :

- les étudiants à traiter ;
- les places disponibles ;
- la capacité de chaque place ;
- les critères couverts par chaque place ;
- les critères manquants de chaque étudiant ;
- le `priorityScore` ;
- les stages déjà réalisés ;
- les résultats déjà enregistrés.

## Étape 0 — Conservation de l'existant

Le backend charge :

- `student_result_vote`
- `StudentsPhysio`

Objectifs :

- repérer les places déjà assignées ;
- déduire la capacité restante ;
- ne pas reproposer une place déjà effectuée ;
- réinjecter les assignations existantes dans le résultat final.

## Étape 1 — Construction du pool des places

Chaque place est transformée en structure exploitable :

- capacité initiale ;
- capacité restante ;
- nombre de votes ;
- étudiants déjà assignés ;
- critères couverts.

Critères métiers observés :

- `MSQ`
- `SYSINT`
- `NEUROGER`
- `AIGU`
- `REHAB`
- `AMBU`
- `FR`
- `DE`

## Étape 2 — Tri des étudiants

Les étudiants éligibles sont triés principalement par :

1. `priorityScore` décroissant ;
2. nom/prénom en second niveau.

Cela signifie que l'ordre de passage dans l'algorithme est déjà une décision métier.

## Étape 3 — Construction des places candidates

Pour chaque étudiant, le backend construit une liste de places candidates en tenant compte :

- des places déjà faites ;
- de la capacité restante ;
- des critères manquants de l'étudiant ;
- de certains cas particuliers comme l'allemand (`DE`) ;
- du nombre minimal de places proposées dans certains cas.

## Logique générique d'attribution

Le code documente une logique dite “votation générique”.

Principe observé :

- les choix sont traités comme un pool de possibilités ;
- le but n'est pas seulement de respecter un rang ;
- l'objectif est d'attribuer la meilleure place disponible selon les critères manquants.

Tri des places candidates observé :

1. nombre de critères couverts ;
2. priorité à certains cas comme `DE` ;
3. popularité / pression sur la place ;
4. capacité restante ;
5. nom de place.

## Cas de fallback

Quand aucune place ne couvre réellement les critères manquants :

- l'étudiant peut quand même être assigné ;
- l'affectation est marquée comme fallback ;
- `assigned_rank = 99` sert de signal technique ;
- la note indique explicitement un cas “hors ciblage”.

Point important :

- un résultat peut donc être valide techniquement, tout en étant sous-optimal métier.

## Résultat persisté

Les résultats sont upsertés dans :

- `student_result_vote`

Clé de conflit observée :

- `user_id,pfp_type,year`

Champs importants enregistrés :

- `assigned_place_id`
- `assigned_place_name`
- `assigned_institution_name`
- `assigned_rank`
- `algorithm_run_id`
- `original_choices`
- `priority_score`
- `notes`
- `status`
- `assigned_at`

## Confirm algorithm

L'endpoint `confirm-algorithm` sert à persister un aperçu déjà calculé.

Usage typique :

1. calcul d'un aperçu ;
2. revue ;
3. confirmation ;
4. upsert en base.

## PFP3 — Propositions

Pour PFP3, le backend sait :

- lire les propositions sauvegardées ;
- sauvegarder des propositions par étudiant ;
- stocker ces propositions dans `votation_sessions`.

Le payload stocké contient notamment :

- `placeIds`
- `missingCriteria`
- `appliedRule`
- éventuellement `_assignCounts`

## PFP4 — Génération de propositions

Pour PFP4, le backend applique des règles métier supplémentaires selon les critères manquants.

Règles observées dans le code :

- cas `DE` seul ;
- cas `DE + SYSINT` ;
- cas `SYSINT` seul ;
- cas `SYSINT + autres` ;
- cas autres critères sans `DE` ;
- cas sans critère manquant.

Le backend :

- calcule les propositions ;
- déduplique les places ;
- exclut les places déjà réalisées ;
- annote la règle appliquée ;
- sauvegarde ensuite les propositions dans `votation_sessions`.

## Statistiques produites

Le backend calcule aussi des stats utiles :

- nombre total d'étudiants ;
- nombre d'assignations conservées ;
- nombre d'assignations générées ;
- nombre d'échecs ;
- nombre de places utilisées ;
- nombre d'assignations fallback ;
- moyenne de critères couverts ;
- nombre d'étudiants avec zéro critère couvert.

## Pièges de maintenance

- croire que l'algorithme se limite aux préférences utilisateur ;
- oublier les assignations existantes déjà persistées ;
- oublier que la capacité est diminuée par l'historique conservé ;
- ignorer les critères manquants et les cas `DE` / `SYSINT` ;
- modifier le front sans vérifier les notes, statuts et conventions backend.

## Réflexe de diagnostic

Quand un résultat semble faux :

1. vérifier l'entrée étudiante ;
2. vérifier les places candidates ;
3. vérifier les critères manquants ;
4. vérifier les capacités déjà consommées ;
5. vérifier si le cas est un fallback ;
6. vérifier enfin ce qui a été persisté dans `student_result_vote`.
