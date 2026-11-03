# HEDS25-477 — preuves de complétion du moteur gamification

Date : 21 septembre 2026  
Cible : `test.hedsvs.ch` / base `staging` uniquement  
Production : inchangée

## Résultat

- Catalogue de règles privé et versionné pour connexion, profil et publication.
- Fenêtres journalières calculées en `Europe/Zurich`.
- Plafond test provisoire : 3 publications récompensées par jour.
- Verrou transactionnel par utilisateur, action et fenêtre.
- Réponse explicite `cap_reached`, sans XP ni progression de quête.
- Étapes de quête reliées aux actions vérifiées côté serveur.
- Progression privée, séquentielle, limitée aux quêtes assignées et actives.
- Complétion et récompense de quête idempotentes.
- Aucun droit direct `PUBLIC`, `anon` ou `authenticated` sur les tables privées.

## Vérifications

Le test `gamification_caps_quests_isolation.sql` valide :

- la frontière de jour suisse ;
- trois publications attribuées puis la quatrième plafonnée ;
- le rejeu traité comme doublon ;
- la complétion d'une quête à deux étapes ;
- l'absence de progression pour une quête expirée ou non assignée ;
- le rollback complet lors d'une erreur située après l'attribution XP ;
- les droits d'exécution de la RPC et la présence du verrou transactionnel.

Les suites SQL historiques ont également été rejouées avec succès : moteur
d'actions, non-rétroactivité, totaux déterministes, pilote et import historique.

Le pilote fonctionnel a exécuté deux cycles identiques avec quatre publications
simultanées. Chaque cycle a produit exactement trois gains, un plafond, un
rejeu ignoré et une quête complétée. Les compteurs email et push sont restés
inchangés.

## Limite métier avant production

Le plafond de 3 publications récompensées par jour est une valeur provisoire
de test. Il doit être confirmé ou remplacé par la règle métier avant toute
préparation d'une migration de production.
