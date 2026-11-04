# HEDS25-630 — Rapport de validation test

Date : 2026-09-29  
Environnement modifié : `test.hedsvs.ch` uniquement

## Résultat

- Résolution déterministe des enseignants : `user_id`, puis email, puis nom historique unique.
- Regroupement par identifiant Supabase canonique pour les profils SI reconnus.
- Conservation des intervenants externes dans le calcul sous une identité `legacy` séparée.
- Aucune fusion automatique lorsqu'un nom ou un email est ambigu.
- Diagnostic visible et exportable : sources de résolution, inconnus, ambiguïtés et entrées exclues.
- Aucune donnée de planning réécrite et aucune migration de base appliquée.

## Audit de la base test

- Année académique active : `2026-2027`.
- 18 profils canoniques `EnseignantSoins` relevés pendant l'audit initial.
- 285 représentations textuelles distinctes relevées dans les créneaux avant résolution.
- Vérification dans l'interface après déploiement :
  - 1 912 créneaux scannés ;
  - 1 091 occurrences rattachées à un profil SI canonique ;
  - 1 187 occurrences externes ou historiques conservées comme non résolues ;
  - 0 occurrence ambiguë ;
  - les enseignants internes vérifiés n'apparaissent qu'une fois dans la feuille de charges.

## Preuves automatisées

- `tests/unit/siTeacherIdentity.spec.js` : 6 tests réussis.
- `tests/unit/siWorkloadIdentity.spec.js` : 2 tests réussis.
- Régression SI ciblée : 15 tests réussis au total.
- ESLint ciblé : réussi.
- Build isolé avec les variables test : réussi.

## Déploiement test

- Script : `deploy/staging/deploy-heds630-test.sh`.
- Sauvegarde créée : `/opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-630-20260929-121858`.
- SHA-256 de `index.html` : `b813b63d240d590744cb67d243f73724be2ca0c887d54d24ebde901ada01a847`.
- Le statut HTTP externe `401` est attendu, le site test étant protégé par le réseau autorisé.

## Promotion future vers la production

Le code ne contient aucune URL ni donnée propre à la base test. La promotion devra réutiliser le même artefact validé ou reconstruire le même commit avec les variables de production, créer une sauvegarde du frontend de production, vérifier les empreintes puis effectuer un contrôle visuel de la feuille de charges. Aucune opération de production n'a été exécutée dans ce ticket.
