# HEDS25-619 — preuve de déploiement test

Date : 21 septembre 2026. Environnement : `test.hedsvs.ch` uniquement.

- Sauvegarde privée :
  `/opt/pfpheds-staging/backups/HEDS25-619-20260921-171913`.
- Migration appliquée :
  `20260921145302_align_challenges_badges_action_catalog.sql`.
- Frontend : build isolé gamification publié sur la stack de test.
- Accès Wi-Fi ajouté : `153.109.1.104`, sans retirer les anciennes adresses.
  La configuration Caddy a été validée puis rechargée à chaud.
- Production contrôlée après l'opération : HTTP 200.

## Invariants après déploiement

- Attributions historiques : 207, inchangées.
- Événements `BADGE_UNLOCK` historiques : 9, inchangés.
- Doublons d'attribution : 0.
- Badges actifs supportés : 12.
- Badges actifs incompatibles : 0.
- Défis actifs incompatibles : 0.
- Lignes d'audit privées : 5.
- RPC de progression : interdite à `anon`, autorisée à `authenticated` et
  limitée à `auth.uid()`.

## Vérifications fonctionnelles

- Deux cycles pilotes identiques : 230 XP, niveau 2, 230 points maison,
  4 badges, 6 progressions de défis, quête complétée, plafond journalier et
  rejeu idempotent validés.
- Aucun email ni push généré.
- Navigateur admin : maisons, utilisateurs, quêtes, défis et badges validés.
- Navigateur étudiant : profil, quêtes, défis, achievements et classement
  validés.
- Réponses HTTP en erreur : 0.
- Connexions Firebase/production interdites : 0.
- Aucun secret imprimé.

Jira n'a pas été modifié ni clôturé pendant ce déploiement.
