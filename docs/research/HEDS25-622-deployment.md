# HEDS25-622 — Preuves de livraison test

Date : 22 septembre 2026  
Environnement : `test.hedsvs.ch` / base `staging` uniquement  
Production : inchangée

## Résultat

Le rapport de qualité agrégé passe de 221 anomalies bloquantes à 0. La
correction a synchronisé 193 maisons entre `gamification_data` et
`user_profiles`. Elle a conservé 3 profils gamification et 25 progressions de
quête historiques dans leurs tables d'origine tout en enregistrant une copie
privée de quarantaine. Aucune ligne publique n'a été supprimée.

Deux quêtes terminées sans étapes restent conservées comme historique. Le seul
profil sans maison est un compte administrateur et demeure un avertissement non
bloquant.

## Garde-fous installés

- Prévisualisation administrative agrégée, sans écriture et sans donnée
  nominative.
- Application idempotente avec lot versionné et journal privé.
- Audit privé de chaque synchronisation de maison.
- Synchronisation atomique des futures attributions utilisateur et admin.
- Refus des nouveaux enregistrements gamification ou progression sans profil.
- Accès anonyme et étudiant refusé aux RPC d'administration.

## Vérifications

- 8 suites SQL gamification réussies avant déploiement.
- Test transactionnel réel réussi après déploiement.
- Rejeu du lot sans écriture.
- 5 écrans admin et 5 écrans étudiant vérifiés dans le navigateur.
- 0 requête Firebase/production et 0 erreur HTTP pendant le parcours.

## Sauvegarde et retour arrière

Sauvegarde complète :
`/opt/pfpheds-staging/backups/before-HEDS25-622-20260922.dump`.

Empreinte SHA-256 :
`2fa2fdcb86b7adc116f6bbc52613a52e224f36e6d5638d62f2097bf1fbb0988e`.

