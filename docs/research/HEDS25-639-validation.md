# HEDS25-639 — Affectation RM sécurisée et annulation

Date : 29 septembre 2026  
Environnement : `https://test.hedsvs.ch` et base Supabase `staging` uniquement  
Production : inchangée

## Résultat

Le responsable de module peut affecter un ou plusieurs enseignants ayant réellement
postulé à un créneau de son périmètre. L'opération est atomique, auditable et
réversible : les enseignants sont écrits dans le planning, les votes ne sont
supprimés qu'après une affectation réussie et l'annulation restaure l'état précédent.

## Sécurité et règles métier

- fonctions dédiées `assign_si_postulation_teachers` et `undo_si_postulation_assignment` ;
- utilisateur authentifié obligatoire et contrôle du périmètre RM avant toute écriture ;
- verrouillage du créneau pendant l'affectation ;
- chaque enseignant demandé doit avoir un vote courant et un profil résolvable ;
- déduplication des identifiants côté interface et côté base ;
- historique conservant l'acteur, le créneau, les enseignants précédents et les votes précédents ;
- lecture de l'historique limitée par RLS aux modules autorisés ;
- aucun droit d'exécution anonyme sur les fonctions privilégiées ;
- aucun droit de lecture anonyme sur la table d'historique.

## Preuves de recette sur la base de test

Cycle complet exécuté sur le module `S.SI.374.3061.F.24`, créneau `4547` :

- vote enseignant créé ;
- affectation RM réussie ;
- enseignant écrit dans le créneau ;
- votes supprimés atomiquement ;
- annulation réussie ;
- enseignants précédents restaurés ;
- vote précédent restauré ;
- données de recette et historique supprimés en fin de test ;
- production non touchée.

Le contrôle SQL confirme également :

- RLS active sur `si_postulation_assignment_history` ;
- `anon` ne peut ni exécuter l'affectation ni lire l'historique ;
- `authenticated` peut appeler la fonction, qui applique ensuite les contrôles métier et de périmètre ;
- la lecture authentifiée de l'historique reste filtrée par la politique RLS.

## Tests reproductibles

- tests unitaires : `tests/unit/siPostulationAssignmentService.spec.js` ;
- cycle dynamique : `deploy/staging/verify-si-rm-assignment-cycle.mjs` ;
- migration : `supabase/migrations/20260929180605_secure_si_rm_assignment.sql`.

Le cycle dynamique doit être lancé via Portly avec `HEDS_STAGING_URL=http://localhost:8180`.

## État de livraison

La fonctionnalité est disponible sur l'environnement de test. Elle reste en validation
manuelle et ne doit pas être publiée en production sans confirmation explicite.
