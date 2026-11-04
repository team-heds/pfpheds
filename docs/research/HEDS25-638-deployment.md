# HEDS25-638 — Validation et publication test

Date : 29 septembre 2026

## Résultat

Le design des six écrans d'administration Soins infirmiers est harmonisé sur `test.hedsvs.ch` uniquement. La production réelle n'a pas été modifiée.

Le travail suit une logique de finition Impeccable : conservation de la charte existante, réduction des effets décoratifs, hiérarchie plus nette et composants plus cohérents, sans refonte fonctionnelle.

## Changements vérifiés

- en-têtes avec icône, titre et sous-titre visibles ;
- cartes KPI alignées sur une même géométrie ;
- couleurs secondaires réservées aux informations sémantiques ;
- sections, barres de filtres et tableaux harmonisés ;
- synthèse enseignant débarrassée du dégradé décoratif ;
- responsive mobile avec espace protégé au-dessus de la navigation fixe ;
- aucune modification des règles métier, permissions ou données.

## Preuves

- test de contrat visuel : 9 assertions réussies ;
- non-régression SI : 9 fichiers, 48 tests réussis ;
- isolation SQL des votes : `si_postulation_votes_isolation_ok`, transaction annulée ;
- smoke test : accès anonyme refusé, cinq routes admin chargées sans erreur 5xx ;
- contrôle visuel : 12 combinaisons (six vues × desktop/mobile), aucun débordement ni erreur JavaScript ;
- toutes les routes de contrôle ont été exécutées en lecture seule.

## Publication test

- index SHA-256 : `aa783c4353fa2559d1e37aff7161fad2a9f67d2760d46600270590c9e65003b4`
- service worker SHA-256 : `b3b86396b1586a3052266c07b8645767ef98e7616475d0954516a7b721ab44d8`
- rollback : `/opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-638-20260929-171811.tar.gz`
- captures : `artifacts/HEDS25-638/`
