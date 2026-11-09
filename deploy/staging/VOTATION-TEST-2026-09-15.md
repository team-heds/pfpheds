# Test de votation — BA25 / PFP2 / 2026-2027

## Périmètre

Uniquement https://test.hedsvs.ch et la base `staging` du conteneur `pfpheds-staging-db-1`. Aucun appel de modification vers la production. Comptes réels copiés, mot de passe de test ; aucune identité ou aucun secret reproduit dans ce rapport.

Sauvegarde préalable : `/opt/pfpheds-staging/backups/before-vote-test-20260915.dump` sur le VPS. Les essais ont utilisé le formulaire admin et le formulaire étudiant dans des contextes de navigateur séparés, via Playwright supervisé par Portly.

## Résultats

| Étape | Résultat |
|---|---|
| Sélection admin BA25 / PFP2 / 2026-2027 | OK, clé de campagne 2027 |
| Population affichée | 64 étudiants |
| Somme brute des capacités proposées | 59, soit 5 de moins que la population affichée ; ne représente pas toutes les offres potentielles |
| Ouverture depuis le dialogue admin | OK, création de session HTTP 201 |
| Lecture de la session par un étudiant BA25 | OK, HTTP 200, une session ouverte reçue |
| Formulaire étudiant PFP2 | BLOQUÉ : « Aucune place disponible », aucune ligne de choix |
| Enregistrement de votes | Non atteint, 0 vote enregistré |
| Attribution / validation / publication | Non exécutées, faute de vote test enregistrable |
| Fermeture de sécurité | OK, toutes les sessions de test refermées |

L'écran admin affiche aussi « À placer: 0 / Capacité: 0 — Capacité suffisante » avant votes, alors que les compteurs généraux sont 64/59. Ce message n'est pas une preuve de capacité suffisante pour toute la cohorte.

Trois ouvertures brèves ont permis d'instrumenter le blocage. La table de sessions n'a pas de champ de nom libre : le libellé TEST est celui de ce rapport, les sessions sont identifiées par leurs UUID :

- `db5d0f63-e7d8-4675-9f64-7a1a276f7d59`
- `0eb6d1ad-74fd-4ff0-87ad-209af7766f83`
- `c20e1bac-4440-471e-aafa-459beb3288a1`

## État final vérifié en base

0 session ouverte, 0 vote PFP2 2027/2026-2027, 0 attribution pour ce contexte. Les trois sessions fermées sont conservées comme historique de test ; aucune ancienne votation ni attribution n'a été supprimée.

## Suite nécessaire

Diagnostiquer et corriger le chargement ou filtrage des places côté étudiant : l'accès à la session fonctionne, mais ses places proposées ne s'affichent pas. Ne pas conclure à un refus RLS sur la seule base du message. Rejouer ensuite les votes de trois comptes, la clôture et l'attribution, puis tester les cas particuliers et le déficit de capacité. L'ancien défaut SQL des résultats n'a pas pu être retesté dans ce parcours.

Ce test ne valide PAS le parcours complet et n'autorise aucune ouverture en production.

## Ajustement du 16 septembre 2026 — 64 capacités de test

À la demande de l'utilisateur, ajout en base `staging` uniquement de cinq places
fictives d'une capacité chacune, identifiées `TEST-BA25-PFP2-2027-1` à `-5`,
sous une institution explicitement nommée `[TEST] Institution fictive — PFP2 BA25`.
Les 59 capacités proposées existantes sont inchangées. Total SQL vérifié : **64**
dans `pfp2_proposition["2027"]` (année académique 2026-2027).

Script : `seed-pfp2-ba25-64.sql`, transactionnel, rejouable et bloqué si la base
n'est pas `staging` ou si les 59 capacités initiales ont changé.
Sauvegarde préalable VPS : `/opt/pfpheds-staging/backups/before-64-seats-20260916.dump`.
Pas de modification des étudiants, des autres années ni de la production.
Après ajout : aucune session PFP2 2027 ouverte, aucun vote PFP2 2027 enregistré.
Cet ajustement de capacité ne résout ni ne valide le blocage d'affichage étudiant
documenté ci-dessus et ne prouve pas la faisabilité des attributions selon les critères.
La nouvelle vérification navigateur admin a échoué avant connexion (champ e-mail
introuvable après 30 secondes) ; le total 64 est donc confirmé en base, pas dans
l'interface. Aucune nouvelle session de votation n'a été créée par cet essai.
