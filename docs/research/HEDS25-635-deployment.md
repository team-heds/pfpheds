# HEDS25-635 — Validation et déploiement test

Date : 29 septembre 2026  
Environnement : `https://test.hedsvs.ch` uniquement

## Résultat

- navigation admin mobile remplacée par un tiroir accessible ;
- dashboard Secrétariat SI adapté ;
- dashboard RM SI adapté ;
- dashboard Enseignant SI adapté ;
- planning journalier adapté ;
- feuille de charges adaptée ;
- cours en postulation adapté ;
- aucun débordement horizontal global détecté à 390, 820 et 1440 px ;
- aucune erreur JavaScript détectée pendant les contrôles automatisés ;
- aucune mutation de données réalisée pendant les contrôles navigateur.

## Preuves

- 40 tests unitaires SI réussis ;
- build complet réussi ;
- 15 combinaisons route/viewport vérifiées ;
- captures : `artifacts/HEDS25-635/` ;
- hash `index.html` déployé : `e4533a2d54f76db626ac6d10bd52a1bbc4997fa5895b8b9a336aba0878dfdf0c` ;
- hash `sw.js` déployé : `3cba480dfa836f4fa7a7886ed4ac365fd641fa23c57c6b3ac07a0a23672835be`.

## Rollback

Archive compressée vérifiée :

`/opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-635-20260929-162639.tar.gz`

## Production

Aucune modification ni publication en production.

## Complément de recette — postulations SI

La table desktop a été condensée sans modifier les règles métier : les informations
`Classe / semaine` et `Créneau` sont regroupées, tandis que les actions de planning
et de vote restent visibles. La présentation mobile conserve l'ensemble des champs
d'aide à la décision.

- 25 tests unitaires ciblés réussis ;
- création d'un vote depuis une session Enseignant SI vérifiée ;
- visibilité immédiate du vote depuis une session RM Soins vérifiée ;
- ouverture du créneau exact dans le planning enseignant en lecture seule vérifiée ;
- retrait du vote et absence de donnée de recette résiduelle vérifiés ;
- contrôle visuel desktop effectué à partir de `artifacts/SI-SPRINT-368-UAT/` ;
- composant déployé : `SIPostulationCoursesView-DE9LcG35.js` ;
- hash `index.html` déployé : `68fa14b85d63ac644bae6ed85a5182777b95da97e8bcf00da3087f7a247ef243` ;
- hash `sw.js` déployé : `35735282437d8f81f25ca1afa4d3a7883da56f0e8b2b58b6aaeee8b93019c093`.

Rollback de ce complément :

`/opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-635-20260929-213028.tar.gz`

La production n'a pas été touchée.
