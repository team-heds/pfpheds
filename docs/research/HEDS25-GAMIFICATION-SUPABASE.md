# Audit gamification Supabase — 2026-09-21

## Objectif

Remettre en service la gamification sur `test.hedsvs.ch` uniquement, avec
Supabase comme autorité unique. Firebase ne doit être ni lu ni écrit par le
parcours réactivé.

## Parcours réel observé

- Le profil étudiant est composé par `ProfileView.vue` → `ProfileInfo.vue` →
  `CardNameProfile.vue`.
- Le bandeau maison, la barre d'XP et le quiz existent déjà dans
  `CardNameProfile.vue`, mais sont masqués par les variables
  `VITE_GAMIFICATION_USER_UI` et `VITE_GAMIFICATION_HOUSE_QUIZ`.
- Les pages `/quests`, `/achievements`, `/challenges`, `/houses/ranking` et
  `/gamification-profile/:id` existent. Les badges et défis sont également
  derrière `VITE_GAMIFICATION_BADGES_CHALLENGES`.
- Les lectures principales utilisent `gamificationServiceSupabase.js`,
  `userQuestsService.js`, `badgesService.js` et `challengesService.js`.
- Les récompenses LOGIN, PROFILE_UPDATE et POST passent par la RPC sécurisée
  `record_my_gamification_action`, qui déduit l'utilisateur de `auth.uid()` et
  rend les événements idempotents.

## État vérifié de la base test

La base utilisée par la plateforme test est `staging` dans le conteneur
`pfpheds-staging-db-1`.

| Objet | État au 2026-09-21 |
| --- | ---: |
| Maisons | 5 |
| Profils gamification | 199, tous assignés à une maison |
| Quêtes | 2, toutes expirées en 2025 |
| Affectations de quêtes | 416, toutes au statut `failed` |
| Étapes de quête | 0 |
| Badges | 18 actifs |
| Badges obtenus | 2 |
| Défis | 5, tous expirés en 2025 |
| Progressions de défis | 0 |
| Historique XP | 0 |
| Spins roue quotidienne | 0 ; fonctionnalité serveur désactivée |

Les totaux et effectifs des maisons correspondent aux agrégats de
`gamification_data`. La base contient donc une bonne fondation, mais aucune
activité courante testable.

## Constats prioritaires

### P0 — le profil consulté peut afficher la gamification de l'administrateur

`CardNameProfile.vue` charge d'abord la gamification de l'utilisateur présent
dans l'URL, puis `fetchCurrentUserProfile()` recharge celle de l'utilisateur
connecté dans le même état réactif. Sur un profil consulté par un admin, le
bandeau et l'XP peuvent donc appartenir à l'admin.

### P0 — une mise à jour de profil par un admin peut récompenser le mauvais compte

La vue appelle `onProfileUpdate(route.params.id)`, mais la RPC Supabase ignore
volontairement l'identifiant du navigateur et récompense `auth.uid()`. Un admin
qui sauvegarde le profil d'un étudiant peut donc recevoir l'XP. La récompense
doit être limitée à la modification de son propre profil.

### P0 — une vue contient encore une écriture directe sur les points de maison

`GamificationProfilePage.vue` peut mettre à jour `houses.total_xp` depuis le
navigateur lors d'un palier. C'est incompatible avec le moteur sécurisé : tous
les points doivent être attribués dans une transaction Supabase vérifiée.

### P1 — données de démonstration incompatibles avec le moteur actuel

Les défis utilisent `LOGIN`, `POST_CREATE` et `COMMENT_CREATE`, alors que le
moteur progresse `daily_login`, `update_profile` et `create_post`. Ils sont de
plus tous expirés. Plusieurs conditions de badges utilisent également des
actions non supportées (`POST_CREATE`, `COMMENT_CREATE`, `login_streak`).

### P1 — les quêtes ne forment pas encore un parcours exécutable

Les deux quêtes ont expiré, leurs affectations sont toutes `failed`, aucune
étape n'existe et le navigateur n'a volontairement pas le droit de valider une
progression. Il faut un parcours pilote Supabase avec des étapes et des règles
serveur explicites avant de prétendre à une complétion automatique.

### P1 — code gamification Firebase résiduel

Trois widgets non référencés utilisent encore `gamificationService.js` et, pour
l'un d'eux, Firebase Auth. `questsService.js`, `hesHousesService.js` et
`gamificationService.js` sont des implémentations historiques Firebase. Aucun
de ces modules ne doit être réintroduit dans le parcours test.

### P2 — cohérence visuelle et responsive

Le détecteur d'interface relève 45 motifs, surtout des transitions de largeur,
des animations rebondissantes et des accents latéraux épais. Le profil
gamification est très long, importe plusieurs composants inutilisés et garde de
grands blocs commentés. Le premier passage doit privilégier un résumé clair
dans le profil existant, des liens explicites vers les vues détaillées et un
comportement mobile stable.

## Sécurité Supabase

- Les tables exposées ont RLS activé et les progressions personnelles sont
  limitées à `auth.uid()` ou aux rôles privilégiés.
- Les mutations de récompense passent par des RPC `security definer` ; elles
  doivent conserver un `search_path` fixé, des noms qualifiés et des droits
  d'exécution minimaux.
- La roue quotidienne reste désactivée : elle ne doit pas être incluse dans la
  première réactivation.
- Les profils test utilisent des données réelles copiées, mais toute nouvelle
  activité, quête ou récompense de ce chantier reste dans la base `staging`.

## Première tranche de remise en service

1. Corriger la cible du bandeau profil et empêcher toute récompense admin.
2. Supprimer l'écriture navigateur sur `houses.total_xp`.
3. Ajouter un résumé gamification cohérent au profil, avec accès au journal de
   quêtes et au classement des maisons.
4. Activer sur le build test `USER_UI`, `HOUSE_QUIZ` et
   `BADGES_CHALLENGES`; laisser les jeux et la roue désactivés.
5. Installer sur la base test un petit parcours pilote daté 2026 avec les
   actions réellement supportées par la RPC.
6. Ajouter les tests unitaires des régressions P0, construire via Portly,
   déployer uniquement sur `test.hedsvs.ch`, puis vérifier en admin et avec un
   compte étudiant test.

## Hors de cette tranche

- jeux 3D, tournois et Ventriglisse ;
- roue quotidienne ;
- récompenses sur commentaires ;
- déploiement ou modification de données en production.
