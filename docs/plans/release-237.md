# Release #237 — mise en production

> Préparé le 4 novembre 2026. Rien de ce plan n'a encore été exécuté en production.

## État de départ

- **Code en prod** : `prod` = #240 (algorithme de votation v6 + correctif des audits npm), déployé le 4.11.2026.
- **PR #237** (`claude/sauvegarde-travail-codex` → `prod`) : environ 730 fichiers, travail gamification, SI, AlpinPhysio, BA25/BA26 et ops. `prod` y est déjà fusionnée, la CI est verte et la PR est fusionnable.
- **Base prod** : simulation en lecture seule du 4.11.2026 (`scripts/supabase/apply-release-237-migrations.sh`) :
  - 3 migrations déjà présentes : `20260923124000` (langue et canton du profil), `20260930141639` et `20261103085335` (récursion RLS de `user_track_roles`) ;
  - **21 migrations à appliquer** ;
  - TEST : 24/24 présentes.

## Pourquoi le code et la base doivent passer ensemble

Le code de la #237 appelle des fonctions et des tables que seules ces migrations créent (`record_my_gamification_action` v6, `gamification_private.*`, règles SI, colonnes `events.*`, tables AlpinPhysio). Déployer le code sans les migrations casserait la gamification, le SI et les événements.

L'inverse n'est pas garanti non plus : les migrations durcissent des règles d'accès (votes SI, événements, rôles) et changent le moteur d'actions. L'ancien code n'a pas été testé contre la nouvelle base. Les étapes 3 à 5 s'enchaînent donc sans pause, dans la même fenêtre de maintenance.

## Déroulé

| # | Étape | Commande | Arrêt si |
|---|---|---|---|
| 0 | Prévenir les utilisateurs d'une courte maintenance (≈ 15 min), hors période de votation | — | une votation est ouverte |
| 1 | **Répétition** sur une copie de la base prod (base temporaire `rehearsal_237` dans le même conteneur, supprimée ensuite) | `pg_dump` prod → `createdb rehearsal_237` → `pg_restore` → appliquer les 21 migrations → marqueurs 24/24 → `dropdb` | une migration échoue sur les données réelles |
| 2 | Simulation sur prod | `bash scripts/supabase/apply-release-237-migrations.sh` | autre chose que « 21 à appliquer » |
| 3 | Application (sauvegarde `pg_dump` vérifiée, une transaction par migration, confirmation `APPLIQUER-PROD`) | `bash scripts/supabase/apply-release-237-migrations.sh --apply` | une transaction échoue (arrêt automatique) |
| 4 | Fusion de la #237 dans `prod` (squash) | bouton GitHub ou `gh pr merge 237 --squash` | CI rouge |
| 5 | Déploiement depuis un checkout propre de `origin/prod` | `bash deploy_hedsvs.sh --check` puis `--deploy` | `--check` échoue |
| 6 | Vérifications | voir ci-dessous | — |

## Vérifications après déploiement

- Connexion étudiante et admin ; tableau de bord admin.
- Gamification : profil, quiz des maisons (maison déjà attribuée), progression, classement des maisons ; console admin gamification.
- Votation PFP : page admin BA25 PFP2 (63 assignés), Places assignées (choix N, brouillons publiables).
- SI : planning, postulations enseignant, assignation RM.
- AlpinPhysio : page publique, hub admin, événements et inscriptions.
- Journaux backend sans erreur 5xx pendant 15 minutes.

## Retour arrière

- **Code** : la sauvegarde du déploiement est dans `/opt/pfpheds-releases/<release>` (site et backend). Remettre les deux dossiers, puis relancer la stack.
- **Base** : la sauvegarde `before-release-237-prod-<date>.dump` est faite par l'étape 3 (avec `sha256`). La restauration complète écrase les écritures faites depuis : à réserver à un échec grave, idéalement pendant la fenêtre de maintenance.

## Corrections apportées pour cette release

- Les marqueurs de détection utilisent l'empreinte md5 du code pour les fonctions préexistantes redéfinies par les migrations. Avant, le script s'arrêtait sur de faux états partiels et aurait sauté 3 migrations.
- La règle d'ordre accepte les 3 correctifs indépendants déjà appliqués.
- `scripts/deployment/remote.sh` ne copie plus le site dans Caddy quand Caddy le monte déjà en lecture seule. Cette copie faisait échouer la fin du déploiement du 4.11.2026.
