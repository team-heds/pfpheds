# Rapport HEDS25-617 — pilote gamification

Dernière validation : 23 septembre 2026  
Cible : `test.hedsvs.ch` / base `staging` uniquement  
Production : inchangée

## Livraison

- Registre et audit privés des lots pilote dans `gamification_private`.
- RPC administratives d'aperçu, installation et reset idempotent.
- Exactement deux comptes fictifs `@example.invalid`, avec secrets hors dépôt.
- Une quête, trois défis et un badge dédiés au lot versionné
  `heds25-617-pilot-v1`.
- Ancienne graine globale neutralisée : elle refuse désormais de s'exécuter et
  renvoie vers l'installateur borné.
- Parcours UI test activé pour les rôles admin et étudiant.

## Preuves automatisées

### Isolation SQL

Résultat : `gamification_pilot_isolation_ok`.

Le test couvre l'aperçu sans écriture, l'installation, le doublon
d'installation, le refus étudiant, connexion/profil/publication/rejeu, défi,
badge, reset, doublon de reset, invariance des lignes hors lot, réinstallation
et absence de droit anonyme. La transaction de test est annulée.

Les tests unitaires ciblés du service et de l'intégration Supabase passent
également (`2` fichiers, `51/51`). Le build Vite/PWA dédié à
`test.hedsvs.ch` est réussi.

### Reproductibilité fonctionnelle

Deux cycles `reset → installation → scénario` ont produit le même résumé :

| Mesure | Résultat |
| --- | ---: |
| XP / points maison / journal | 230 / 230 / 230 |
| Niveau | 2 |
| Événements XP | 11 |
| Badges | 4 |
| Progressions de défis | 6 |
| Progressions de quête | 1 |
| Connexion, profil, publication | attribués |
| Rejeu identique | ignoré comme doublon |
| 4 publications concurrentes | 3 attribuées, 1 plafonnée |
| Complétion automatique de la quête | validée |
| Email et push externes | aucun changement |

Le pilote exerce désormais quatre publications simultanées. Le verrou de
fenêtre garantit exactement trois gains et un retour explicite `cap_reached`.
Les règles globales actives dans la copie de test restent visibles, cohérentes
avec le journal et reproduites à l'identique ; elles ne sont pas masquées par
le test et leur nettoyage relève d'un ticket de qualité des données séparé.

### Vérification navigateur

- Admin : badges, tableau de bord, maisons, utilisateurs, quêtes, défis et
  profil gamification de l'étudiant pilote.
- Étudiant : profil gamification, quêtes, défis, badges et classement maisons.
- L'ancienne URL `/admin/defis` redirige correctement vers la nouvelle console.
- Résultat : aucune redirection incorrecte, aucune réponse HTTP en erreur,
  aucune connexion interdite et aucun secret affiché par le scénario.
- Correction incluse : les URL Storage issues de la copie sont réécrites vers
  l'origine Supabase de l'environnement courant ; la page Quêtes n'utilise plus
  le composant d'onglets qui provoquait un écran vide.
- Correction incluse : le frontend test utilise désormais l'API applicative
  sous `/api` au lieu de traiter l'origine du site comme l'API.
- Correction incluse : l'absence légitime d'une ligne `gamification_data` sur
  un profil neuf est un état vide, et non une erreur HTTP 406.

### Simulation du parcours humain — 23 septembre 2026

La simulation navigateur complète est réussie avec les comptes fictifs du lot :

- étudiant : connexion, profil, récompense de profil, publication, historique,
  quête, défi, badge et classement ;
- administrateur : état du système, règles XP, événements refusés et lecture de
  l'historique de l'étudiant ;
- cohérence : 180 XP, niveau 2, 180 points maison, journal totalisant 180 XP,
  9 événements à clés uniques et quête terminée ;
- responsive : aucun débordement et aucun contrôle inférieur à 40 px à 390 px
  et 834 px ;
- diagnostic : zéro connexion Firebase ou production, zéro réponse HTTP en
  erreur, zéro erreur JavaScript et zéro erreur console.

Le parcours actif est maintenant Supabase-only. Les modules historiques de
stories, d'événements et de messagerie ne sont plus chargés silencieusement par
le fil ou le profil. Le Realtime reste activé par défaut, mais le build de test
le désactive explicitement car la pile staging réduite n'expose pas ce service.

## État laissé pour les essais manuels

Le lot est `installed` avec un état propre : 0 XP, journal vide, niveau 1,
0 point maison et une progression de quête non commencée. Les deux comptes
fictifs restent disponibles via le fichier privé
`deploy/staging/gamification-pilot-accounts.json`.

Cet état a été revérifié après la dernière validation navigateur, puis remis à
zéro avec le reset borné du lot. Le contrôle final confirme également une seule
entrée de liste blanche, celle de l'étudiant fictif du pilote.

## Scénarios complémentaires

- Complétion automatique d'une quête : `passed`.
- Plafond journalier des publications et concurrence : `passed`.
- Quête expirée : absence de progression validée par le test SQL transactionnel.
- Transition automatique d'une quête ou d'un défi vers l'état terminé :
  `passed` (cycle de vie HEDS25-620, tâche `pg_cron` exécutée chaque minute).

Le pilote vérifie qu'une quête hors période ne peut plus progresser. Le
rafraîchissement serveur effectue la transition une seule fois et conserve une
trace d'audit privée.

## Contrôles du déploiement progressif

- `gamification_pilot_isolation_ok` : réussi.
- `gamification_rollout_controls_ok` : réussi.
- Les tests sont transactionnels et terminent par `ROLLBACK`.
- Le coupe-circuit serveur et la liste blanche bornent les récompenses au
  compte étudiant fictif autorisé.
- Un utilisateur hors pilote, un profil désactivé ou un système fermé ne reçoit
  aucun XP.
- Le compte synthétique du test SQL est ajouté temporairement à la liste
  blanche dans la transaction, conformément au fonctionnement réel du pilote.

## Correctifs découverts pendant le pilote

1. Les dates du lot `heds25-617-pilot-v1` sont maintenant immuables afin que
   reset, réinstallation et second cycle utilisent exactement le même contrat.
2. Le build test injecte explicitement les trois origines Supabase, REST et API
   de l'environnement de test, sans recopier de fichier `.env` ni de secret.
3. Le chargement d'un profil gamification optionnel utilise un état vide sûr.
4. La publication du frontend est atomique et conserve une archive des points
   d'entrée permettant le retour arrière.
5. Le message de succès du profil est désormais affiché après la fin de la RPC
   de récompense, ce qui évite une navigation trop rapide avant l'attribution XP.
6. Les dépendances Firebase historiques du fil et du profil sont différées ou
   retirées du parcours courant afin de garantir un chemin Supabase-only.

## Décision de passage

**Go technique pour poursuivre le pilote fermé sur `test.hedsvs.ch`.**

Ce résultat n'est pas une autorisation de mise en production. Avant cela, il
reste à :

1. valider métier le plafond provisoire de trois publications récompensées par
   jour ;
2. faire essayer le parcours à un petit groupe humain et recueillir les
   incompréhensions ou comportements inattendus ;
3. obtenir une validation explicite avant toute activation en production.

Le parcours de séance et le rapport à compléter sont prêts dans :

- `deploy/staging/GAMIFICATION-HUMAN-PILOT.md` ;
- `deploy/staging/GAMIFICATION-HUMAN-PILOT-REPORT.md`.

## Sauvegardes

- Base avant migration :
  `/opt/pfpheds-staging/backups/before-HEDS25-617-20260921-1100.dump`.
- Base avant le moteur plafonds/quêtes HEDS25-477 :
  `/opt/pfpheds-staging/backups/before-HEDS25-477-completion-20260921.dump`.
- Frontend avant la livraison :
  `/opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-617-20260921-1140`.
- Frontend avant HEDS25-620 :
  `/opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-620-20260921-1535`.
- Frontend avant l'ajout de l'administration Supabase des défis :
  `/opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-620-challenges-20260921-1540`.
- Entrées frontend avant la correction de configuration API :
  `/opt/pfpheds-staging/backups/frontend-entrypoints-before-gamification-api-fix-20260923-1239.tar.gz`.
- Entrées frontend avant la correction de l'état vide du profil :
  `/opt/pfpheds-staging/backups/frontend-entrypoints-before-gamification-empty-state-fix-20260923-1245.tar.gz`.
- Entrées frontend avant la version Supabase-only certifiée :
  `/opt/pfpheds-staging/backups/frontend-entrypoints-before-gamification-profile-reward-20260923-134344.tar.gz`.

Empreintes de la version test validée :

- `index.html` :
  `1aa978a62699d4122ab57ff74da6940339b099e2c216beb410603bbefb5beea5` ;
- `sw.js` :
  `993838ed16226f98a3c15e67d444c3e26c8576e1cf6fb079d7de3ef4529ae1ce`.
