# Gamification — contrôle du déploiement progressif sur test

Date : 23 septembre 2026  
Environnement : `test.hedsvs.ch` / base `staging` uniquement

## Résultat

- Coupe-circuit serveur installé devant le moteur d'attribution XP.
- Récompenses activées uniquement en mode `allowlist`.
- Un seul compte étudiant fictif du pilote est autorisé.
- Un profil désactivé est refusé même s'il reste dans la liste pilote.
- Les comptes hors audience reçoivent `audience_restricted` sans XP.
- Lorsque le coupe-circuit est fermé, les actions reçoivent
  `system_disabled` sans XP.
- Toute modification de configuration ou d'audience est réservée aux rôles
  privilégiés et journalisée avec acteur, motif et état avant/après.
- La console admin affiche l'état agrégé du déploiement sans donnée personnelle
  et sans commande d'activation.

## Vérifications

- Simulation transactionnelle de la migration : réussie.
- Test SQL/RLS `gamification_rollout_controls_ok` : réussi.
- Test unitaire `adminGamificationConsoleService.spec.js` : réussi.
- Build Vite/PWA complet : réussi.
- Qualité des données après installation : `blocking_issue_count = 0`.
- État final : `rewards_enabled = true`, `audience_mode = allowlist`,
  `allowlisted_users = 1`, `eligible_users = 1`.
- Production : non modifiée.

## Sauvegardes et empreintes

- Base avant migration :
  `/opt/pfpheds-staging/backups/before-gamification-rollout-20260923-121630.dump`
- Entrées frontend avant publication :
  `/opt/pfpheds-staging/backups/frontend-entrypoints-before-gamification-rollout-20260923.tar.gz`
- `index.html` publié :
  `af4bdadd9c4ec949ebb7253a6b472c1de4609f0c673d2ea37a2e780f862f2090`
- `sw.js` publié :
  `b7275efaa7777b14e43b880d02fa8b9b03e9a479350a4e991116d9f9ba968da4`

## Retour arrière opérationnel

Le premier geste est de fermer le coupe-circuit par la RPC administrative
auditée. Cela arrête les nouvelles récompenses sans supprimer l'historique. La
sauvegarde complète n'est utilisée qu'en dernier recours technique.

## Point d'exploitation

Le nettoyage conservateur du VPS a porté l'espace libre à 6,4 Go. Après les
builds et publications de validation, le contrôle final indique encore 5,1 Go
disponibles (74 % utilisés). Aucun code source, donnée Supabase ou déploiement
actif n'a été supprimé. L'inventaire détaillé est conservé dans
`docs/research/VPS-CLEANUP-2026-09-23.md`.
