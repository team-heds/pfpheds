---
ticket: GAMIFICATION-LANCEMENT-2026-2027
validated: test
environment: test validé le 9 novembre 2026, production à lancer
---

# Lancement de la gamification 2026-2027

## Décisions (9 novembre 2026)

| Sujet | Décision |
| --- | --- |
| Remise à zéro | XP, niveaux et points des maisons à 0. Maisons et badges conservés. Ancien total archivé. |
| Défis | 4 défis ouverts ensemble pendant 4 semaines (voir ci-dessous) |
| Public | Étudiants BA24, BA25 et BA26 (`role = EtudiantPhysio`). Admins et enseignants ne gagnent rien. |
| Maisons | BA24 et BA25 gardent leur maison, sans refaire le quiz. Seuls les BA26 (sans maison) passent le quiz. Les BA23 sont retirés des maisons. |
| Répartition | Les BA26 complètent les maisons les plus petites pour que les 4 maisons aient le même nombre de joueurs (BA24+BA25 aujourd'hui : Harmonis 41, Elaris 36, Doloris 30, Solencia 19). |
| Post BA26 | Publié dans le feed de production uniquement |

### Défis de lancement

| Défi | Action comptée | Objectif | XP |
| --- | --- | --- | --- |
| Profil à jour | mise à jour du profil | 1 | 25 |
| Présence régulière | connexion (1 par jour) | 5 jours | 30 |
| Premier partage | publication dans le feed | 1 | 40 |
| Pilier de la maison | connexion (1 par jour) | 12 jours | 60 |

Les règles de base restent celles du moteur : connexion 5 XP par jour, profil 10 XP par jour,
publication 25 XP (3 par jour au plus), maison attribuée au quiz 50 XP.

## Ce qui est livré

- Migration `20261109090000_gamification_season_reset.sql` : `preview_gamification_season_reset`
  et `apply_gamification_season_reset` (administrateurs, une seule fois par saison, archive
  `gamification_private.season_user_archive` / `season_house_archive`, écriture compensatoire
  `SEASON_RESET` dans `xp_history` pour garder le journal égal aux totaux).
- Migration `20261109100000_balanced_house_assignment.sql` : attribution des maisons décidée
  par le serveur. Le quiz n'est ouvert qu'aux joueurs sans maison (`get_my_house_quiz_status`).
  La préférence du quiz est retenue si sa maison a au plus 1 joueur de plus que la moins
  remplie, sinon la moins remplie est attribuée (`preview_my_house_assignment`,
  `assign_my_house`, verrou contre les attributions simultanées). Une maison existante n'est
  jamais modifiée. Avant, l'équilibrage se faisait dans le navigateur, qui ne voit que la
  ligne de l'étudiant : il ne fonctionnait pas.
- Script `scripts/supabase/gamification-launch-2026-2027.sql`, dans l'ordre : clôture des
  anciens défis, quêtes échues et badges `TEST — …` ; réconciliation du journal XP et
  contrôle de qualité (outils existants, déjà passés sur TEST en septembre, jamais en prod) ;
  remise à zéro ; BA23 retirés des maisons (leur maison reste dans l'archive de saison) ;
  4 défis ; public BA24–BA26 ; récompenses actives. Une transaction, relançable sans double
  effet.
- Corrections d'interface trouvées pendant la recette :
  - page Défis : période et temps restant tirés des dates réelles (au lieu de « semaine 44 »
    et d'un compte à rebours hebdomadaire), cartes lisibles (styles de la fenêtre de détail
    qui débordaient sur les cartes), icônes par type de défi ;
  - quiz de maison : plus de « Félicitations » si l'enregistrement échoue, maison réellement
    retenue par le serveur affichée (un nouveau quiz ne change pas une maison existante),
    profil à jour sans attendre le cache, un seul message ;
  - statistiques de maison vues par un étudiant : totaux officiels de la maison, plus de
    « 1 membre » ni de classement nominatif (réservé aux administrateurs) ;
  - bandeau de maison : nom plus recouvert par les boutons dans la colonne du profil ;
  - invitations « Découvre ta maison » et page du quiz : affichées seulement si le serveur
    ouvre le quiz au compte (message « non disponible » sinon, jamais d'écran vide).

## Recette sur TEST (9 novembre 2026)

- Sauvegarde : `/opt/pfpheds-staging/backups/before-gamification-launch-2026-2027-20261109T081556Z.dump`
  (SHA256 `f8320e4c…5ffb2`).
- Répétition en transaction annulée, puis application : 200 comptes archivés, 131 984 XP
  archivés, 193 écritures compensatoires, XP restant 0, contrôle de qualité sans anomalie
  bloquante, 4 défis actifs, 189 étudiants BA24–BA26 ajoutés au public.
- Relance du script : aucun effet (remise à zéro et défis non dupliqués).
- Parcours d'une étudiante BA26 fictive (`student.ba26.gamification@example.invalid`) :
  connexion +5 XP et défis de connexion à 1/5 et 1/12, quiz de maison avec équilibrage
  (Harmonis) +50 XP, publication +25 XP et défi « Premier partage » validé +40 XP,
  profil +10 XP et défi « Profil à jour » validé +25 XP, badges débloqués.
- Pages vérifiées en bureau et mobile (375 px) : progression, défis, badges, classement,
  statistiques de maison, profil.
- Équilibrage : compte hors public → « Quiz des maisons non disponible » ; même compte ajouté
  au public → quiz orienté vers Solencia (la moins remplie), +50 XP, profil à jour.
  Un BA23 est refusé par le serveur, un BA24 voit sa maison sans quiz.

## Répétition sur une copie de la prod (9 novembre 2026)

Copie fraîche de la base prod dans une base temporaire du même conteneur, supprimée ensuite :

- les 23 migrations à appliquer passent sans erreur ; marqueurs 26/26 ;
- script de lancement : 6 anciens défis et 2 quêtes échues clos, 192 soldes d'ouverture,
  192 maisons de profil synchronisées, 25 lignes orphelines en quarantaine, 0 anomalie
  bloquante, 131 939 XP archivés, 7 BA23 retirés, 4 défis, 189 joueurs ;
- simulation des 63 BA26 avec préférences aléatoires (annulée) : maisons finales
  Doloris 47, Elaris 48, Harmonis 47, Solencia 47 ; toujours 0 anomalie ;
- relance du script : aucun effet.

## Mise en production (dans l'ordre)

Prérequis : la release #237 est prête (PR #241 fusionnée, plan `docs/plans/release-237.md`).

1. **Migrations** (sauvegarde vérifiée incluse) :
   `scripts/supabase/apply-release-237-migrations.sh` puis `--apply` (mot de confirmation
   `APPLIQUER-PROD`). La liste inclut maintenant `20261109090000_gamification_season_reset.sql`.
2. **Code** : fusion de #237 dans `prod` (squash), puis déploiement depuis un worktree propre
   de `origin/prod` avec, dans `.env.production.local` du worktree :

   ```
   VITE_GAMIFICATION_USER_UI=true
   VITE_GAMIFICATION_HOUSE_QUIZ=true
   VITE_GAMIFICATION_BADGES_CHALLENGES=true
   VITE_GAMIFICATION_GAMES_HUB=true
   VITE_GAMIFICATION_VENTRIGLISSE=true
   VITE_GAMIFICATION_DAILY_WHEEL=false
   VITE_GAMIFICATION_ROM_RUNNER=false
   VITE_GAMIFICATION_TOURNAMENTS=false
   ```

   Sans ces lignes, la gamification reste masquée : on peut donc déployer la release d'abord
   et activer l'interface au moment du lancement.
3. **Données de lancement**, juste après le déploiement, avec le compte administrateur et la
   date du jour du lancement :

   ```
   ssh heds-vps "docker exec -i supabase-db-1 psql -X -v ON_ERROR_STOP=1 \
     -v admin_id=<uuid admin> -v launch_date=<AAAA-MM-JJ> -U postgres -d postgres" \
     < scripts/supabase/gamification-launch-2026-2027.sql
   ```

   Contrôle attendu : `xp_total = 0`, `points_maisons = 0`, `defis_actifs = 4`,
   `public_recompenses` = 189 (63 BA24 + 63 BA25 + 63 BA26).
4. **Post BA26** dans le feed de production (texte validé à part).
5. **Vérification** : connexion d'un compte étudiant réel volontaire, défis visibles,
   connexion comptée.

## Retour arrière

- Interface : redéployer sans les variables `VITE_GAMIFICATION_*` (tout redevient masqué).
- Récompenses : `configure_gamification_rollout(false, 'allowlist', '<raison>')` coupe tous
  les gains sans rien effacer.
- Données : la saison archivée reste dans `gamification_private.season_user_archive` ; la
  sauvegarde `pg_dump` de l'étape 1 permet une restauration complète.

## Suite

- Notifier la réussite d'un défi (aujourd'hui seuls les badges ont une notification ; l'XP du
  défi est bien attribué).
- Planifier la clôture automatique des défis à leur date de fin (la page masque déjà les défis
  échus).
- Quiz de maison : réponses à rendre accessibles au clavier et aux lecteurs d'écran.
