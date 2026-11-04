# SI — Interface de remédiation du planning

Date : 2026-09-29

Environnement : `test.hedsvs.ch` uniquement

État : correction unitaire contrôlée disponible sur test

## Objectif

Donner au secrétariat SI une vue exploitable des anomalies du planning avant
toute correction de données. L'écran distingue les correspondances uniques des
cas ambigus et des décisions entièrement manuelles.

Route : `/admin/soins-infirmiers/qualite-planning`

## Fonctionnalités livrées

- résumé par catégorie : cours, enseignant, salle et horaire ;
- périmètre limité à l'année académique active et à ses classes ;
- filtres par anomalie, niveau de décision et classe ;
- recherche par créneau, cours, module, classe et valeur ;
- comparaison avant/après lorsqu'une correspondance unique existe ;
- détail du motif et des possibilités repérées ;
- accès depuis le dashboard Secrétariat SI et le menu Planning ;
- rendu responsive contrôlé à 390 × 844 px ;
- correction disponible uniquement pour les correspondances uniques ;
- justification et confirmation explicites obligatoires ;
- historique avant/après, auteur, date et motif ;
- annulation unitaire avec protection contre les modifications concurrentes.

## Résultat sur la base test 2026–2027

- 1 912 créneaux analysés ;
- 263 liens de cours à traiter, dont 2 propositions uniques ;
- 831 affectations d'enseignants à traiter, dont 7 propositions uniques ;
- 1 715 salles à renseigner ;
- 7 horaires réellement incomplets ou invalides ;
- 2 816 anomalies au total ;
- 9 propositions à vérifier et 2 807 décisions humaines.

Les heures au format `HHhMM` sont acceptées comme des horaires valides, en
cohérence avec la feuille de charges. Elles ne sont donc plus présentées comme
des anomalies.

## Sécurité et écriture contrôlée

- route protégée par `SI_SECRETARIAT_ACCESS` ;
- aucune écriture Supabase directe depuis le navigateur ;
- API authentifiée limitée à `AdminSoins`, `page2.access` ou administrateur ;
- RPC accessibles uniquement au rôle serveur `service_role` ;
- comparaison de la valeur courante avant chaque correction et annulation ;
- correction et historique enregistrés dans la même transaction ;
- table d'historique inaccessible aux rôles `anon` et `authenticated` ;
- production non modifiée.

## Validation

- 40 tests SI ciblés réussis ;
- 14 tests de remédiation/qualité rejoués après harmonisation des horaires ;
- ESLint ciblé réussi ;
- build de production réussi ;
- contrôle navigateur admin desktop et mobile réussi ;
- aucune erreur JavaScript ou serveur sur la nouvelle route ;
- aucun débordement horizontal global à 390 px.

Le proxy Realtime de l'environnement local retourne encore `503`, car la stack
de test n'installe pas Realtime. Cela n'affecte pas ce parcours de lecture REST.

## Déploiement test

- index SHA-256 : `ba6b417bd4b4c850ce9412d614c951215ec979b011a3fea8f61ca1369a24eaea` ;
- service worker SHA-256 : `57897067dc10a92ab95f5ce5eb272595de5ad4e7b757fa36076e6e56d49f3db5` ;
- rollback : `/opt/pfpheds-staging/backups/frontend-dist-before-SI-PLANNING-REMEDIATION-20260929-221642.tar.gz`.

Le contrôle public automatisé depuis le réseau courant est arrêté par la liste
d'accès du site (`403`) avant l'authentification applicative. Le même parcours a
été validé via le tunnel privé vers la stack test, et les empreintes du frontend
servi dans le conteneur correspondent au paquet publié.

## Workflow livré le 30 septembre 2026

- migrations : `20260930060553_secure_si_planning_remediation.sql` et
  `20260930065312_align_si_course_remediation_evidence.sql` ;
- API : application, historique et restauration ;
- validation SQL transactionnelle avec contrôle d'isolation ;
- recette API réelle : salle appliquée puis restaurée exactement ;
- recette sur les deux propositions sûres réelles `#4560` et `#4562` :
  cours donneur vérifié, correction appliquée, historique contrôlé, annulation
  contrôlée et valeur d'origine restaurée exactement ;
- contrôle d'autorisation réel : un compte temporaire `EtudiantSoins` a reçu un
  refus `403` pour la lecture de l'historique, l'application et l'annulation ;
  le compte temporaire a ensuite été supprimé ;
- contrôle navigateur : page, filtres, tableau, dialogue, justification,
  confirmation et bouton initialement désactivé ;
- capture : `artifacts/si-planning-remediation-dialog.png` ;
- index SHA-256 : `af369a3e13309368cbc5e70aded715d3b6ae0a5619140430e0716b3cca94618a` ;
- service worker SHA-256 : `5bf8f321b90385155baa9e9b9ce32fb57b378ffcbb722b143d58123dcf931805` ;
- sauvegarde DB :
  `/opt/pfpheds-staging/backups/before-si-planning-remediation-20260930-085714.dump` ;
- sauvegarde frontend :
  `/opt/pfpheds-staging/backups/frontend-dist-before-SI-PLANNING-REMEDIATION-20260930-083205.tar.gz` ;
- sauvegarde API :
  `/opt/pfpheds-staging/backups/backend-before-si-remediation-20260930-083104.tar.gz`.

Il n'existe toujours aucune correction en masse. Les cas ambigus et manuels
restent volontairement non modifiables depuis cette interface.

## Dernière recette avant préparation de release — 30 septembre 2026

- année active contrôlée : `2026-2027` ;
- propositions sûres de rattachement de cours : `2/2` réussies ;
- historique « appliquée » puis « annulée » : `2/2` réussi ;
- restauration exacte de la valeur initiale : `2/2` réussie ;
- autorisations étudiant : `3/3` actions refusées ;
- tests unitaires du domaine : `6/6` réussis ;
- tests de l'API : `4/4` réussis ;
- lint ciblé : réussi ;
- build complet : réussi ;
- isolation SQL avec rollback transactionnel : réussie ;
- environnement modifié pendant la recette : test uniquement ;
- production modifiée : non.
