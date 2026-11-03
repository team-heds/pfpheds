# HEDS25-628 — Livraison sur l'environnement de test

Date : 29 septembre 2026  
Cible : `test.hedsvs.ch` / base `staging` uniquement

## Résultat

La route de postulation SI n'accepte plus le besoin générique
`authenticated`. L'interface réserve le vote à `EnseignantSoins`, masque les
comptes globaux aux enseignants et lie chaque écriture à l'identité Supabase
courante.

La politique globale `planning_slot_votes_select_auth` a été remplacée par
quatre politiques explicites :

- lecture de ses propres votes pour `EnseignantSoins` ;
- lecture des votes de ses modules pour `RMSoins` ;
- supervision globale pour l'administration ;
- création/mise à jour de ses propres votes uniquement ;
- suppression personnelle, ou nettoyage par le RM du module/l'administration.

Tout privilège de table a été retiré au rôle `anon`.

## Vérifications

- Vitest ciblé : 3/3.
- Build Vite : réussi.
- Build staging isolé : réussi.
- Matrice SQL : enseignant propriétaire, autre enseignant, RM propriétaire,
  autre RM, admin, utilisateur non-SI et anonyme — réussie avant et après
  migration.
- Quatre politiques attendues actives et aucun privilège `anon`.

## Sauvegardes et empreinte

- DB : `/opt/pfpheds-staging/backups/before-HEDS25-628-20260929-115627.dump`
- Frontend :
  `/opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-628-20260929-115627`
- `index.html` :
  `4708800ca8dc7e5c422775247a5d689c931e28b98dc9470f3f08d57814370941`

La production n'a pas été touchée.
