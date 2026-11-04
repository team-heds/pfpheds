# Nettoyage conservateur du VPS — 23 septembre 2026

## Résultat

- Espace disponible avant : environ 346 Mo, disque à 99 %.
- Espace disponible après : 6,4 Go, disque à 67 %.
- Espace récupéré pendant l'opération : 6 450 249 728 octets.

## Éléments supprimés

- 17 anciens répertoires de builds frontend dans `/opt/pfpheds-staging` ;
- 25 anciens répertoires de rollback frontend dans
  `/opt/pfpheds-staging/backups` ;
- images Docker orphelines uniquement ;
- journaux systemd archivés au-delà de 100 Mo.

## Éléments conservés

- frontend actuellement servi et ses empreintes ;
- deux rollbacks frontend récents ;
- sauvegarde des points d'entrée avant la gamification ;
- dossier de sauvegarde du pilote gamification ;
- toutes les sauvegardes PostgreSQL ;
- configurations, volumes et conteneurs Docker actifs ;
- archives `/opt/supabase/backups`.

## Contrôles après nettoyage

- frontend de production : HTTP 200 ;
- service Auth de production : HTTP 200 ;
- protection de `test.hedsvs.ch` : HTTP 401 attendu sans identifiants ;
- tunnel frontend test : HTTP 200 ;
- base test : accessible, zéro anomalie gamification bloquante ;
- base production : accessible ;
- empreintes `index.html` et `sw.js` test inchangées ;
- aucun conteneur ou volume actif supprimé.

Le conteneur Studio de test reste marqué `unhealthy` à cause d'un healthcheck
qui interroge `127.0.0.1:3000`, alors que Next.js est lié au nom du conteneur.
Ses logs montrent une application démarrée et prête. Le compteur d'échecs couvre
plusieurs jours et ne provient donc pas du nettoyage.
