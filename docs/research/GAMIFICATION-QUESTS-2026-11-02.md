# Reprise gamification — Quêtes fiables

2 novembre 2026 · **Publié sur TEST uniquement** · [Journal de quêtes](https://test.hedsvs.ch/quests)

Le lot 2 d’accessibilité générale est reporté à la demande de l’utilisateur. La reprise gamification traite ENG-03 et ENG-04 de l’audit, avec les corrections d’affichage directement rencontrées dans les mêmes cartes.

## Corrections

- Retirer une puce rétablit une sélection « Toutes » correcte, sans effacer les autres filtres ni la recherche. Les puces « all » ne s’affichent plus ; les libellés sont en français.
- Changer un filtre, le tri ou la recherche revient à la première page. Le tri ne modifie plus le tableau source des quêtes.
- Une quête `completed` reste terminée, même après sa date limite. Sa date de réussite vient de `completed_at`, jamais de la date limite ; si elle manque, la mention reste simplement « Terminée ».
- La réussite n’affiche plus d’urgence, d’expiration ou de compte à rebours. Une quête réellement échue possède un libellé cohérent dans sa carte et son détail.
- Le signal local `quest-expired` est émis une seule fois lors du franchissement d’une échéance ; aucune émission pour une quête déjà terminée ou déjà échue au montage.
- Les valeurs de difficultés existantes sont traduites correctement dans le détail. La référence à une constante inexistante du détail parent est supprimée.
- Une valeur comme `pi pi-home` devient une vraie icône PrimeIcons, tout en conservant les emojis existants.

Les règles serveur, l’XP, les récompenses, les maisons, les publics pilotes et les données historiques ne sont pas modifiés. Aucun service Firebase ajouté.

## Source

- Branche locale : `codex/gamification-quest-stability`.
- Commit : `0a4cd23e`, basé sur `7cd1f876`, la version TEST issue du lot de navigation.
- Deux composants runtime : `QuestCard.vue` et `QuestsPage.vue`.
- Deux nouveaux fichiers de tests comportementaux : `questCardState.spec.js` et `questFilters.spec.js`.
- Le harnais ancien `gamificationServiceSupabase.spec.js` de la branche est aligné avec les contrats actuels `auth.getUser()` et `maybeSingle()`, sans modifier le service ni retirer les assertions existantes. Les refus pour une cible tierce ou une session absente sont couverts.

Les deux composants et les nouveaux tests sont reportés dans le checkout principal après contrôle des versions et sauvegarde. Son fichier `gamificationServiceSupabase.spec.js` possédait déjà des modifications indépendantes : il est conservé intégralement et validé séparément. Les autres travaux locaux restent préservés. Aucun push GitHub revendiqué.

## Vérification

- **94 tests passent dans 9 fichiers** de la branche isolée (`tmp_367d562a`), dont 23 tests montés sur les filtres et les cartes. Les contrôles de filtre utilisent les vrais composants PrimeVue Dropdown, Chip, Paginator et Button.
- **71 tests passent dans 3 fichiers** du checkout principal après report (`tmp_148339a9`).
- Build Vite/PWA réussi (`tmp_a77eff5a`) avec la clé anonyme TEST validée et les drapeaux gamification existants conservés.
- Recette navigateur sur `test.hedsvs.ch` : défaut reproduit avant publication ; entrée finale `/assets/index-BaMLbIaP.js` contrôlée après publication.
- Avant : retirer « Difficulté: EASY » laisse une liste vide et une fausse puce « Type: all ».
- Après : sélection « Facile » = une quête ; retrait = trois quêtes, aucune fausse puce. Avec recherche et type, retirer la difficulté conserve le type ; retirer ensuite le type conserve la recherche.
- Détail réel : difficulté « Facile », statut « Expirée » et icône maison rendue correctement ; aucune erreur JavaScript observée.
- Aucun débordement horizontal dans la vue bureau à 1 280 px.

La session de recette est administrateur et ne comporte aucune quête terminée. Les états terminés, les dates absentes/invalides, la transition d’échéance et l’absence de faux événements sont donc vérifiés avec des fixtures de composants et une horloge contrôlée, sans créer ni attribuer de quête en base. Aucune recette tactile ou VoiceOver n’est revendiquée.

Preuves : [résultats navigateur](/Users/antoinequarroz/Lab/projets/pfpheds/artifacts/gamification-quests-2026-11-02/browser-evidence.json), [avant](/Users/antoinequarroz/Lab/projets/pfpheds/artifacts/gamification-quests-2026-11-02/avant-retrait-filtre.png), [après](/Users/antoinequarroz/Lab/projets/pfpheds/artifacts/gamification-quests-2026-11-02/apres-filtres.png).

## Publication

Frontend TEST uniquement, avec sauvegarde complète et activation contrôlée des points d’entrée. Les anciens assets restent présents. Les 1 365 fichiers du candidat et le montage du gateway ont été vérifiés.

- HTML TEST : `bae91821b6e33f5aec1839b564f65ff2b773cd24bc8b041a041131cf5c5ab787`.
- Service worker TEST : `48b8402b0bd2c3c04b4a5c5b4e8df627ed263a15b9cd0d38e70727aadfaa248b`.
- Sauvegarde avant ce correctif : `/opt/pfpheds-staging/backups/frontend-dist-before-apple-navigation-20261102T144038Z-RJ6RIDPA.tar.gz` ; nom conservé par l’outil de publication réutilisé.
- Les empreintes HTML/service worker de production sont identiques avant et après. Aucun déploiement de backend ni de production.

## Suivi et suite

La connexion Jira renvoie `UNAUTHORIZED` et demande une reconnexion ; aucun ticket ni statut Jira n’a été modifié. Le suivi local de l’audit est à jour.

La suite proposée dans la gamification est ENG-10 : réserver les célébrations de badges à un nouveau gain réel, puis compléter le pilote humain. Le moteur et ses récompenses restent sous les contrôles de déploiement déjà en place.
