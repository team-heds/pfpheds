# Gamification — parcours et fiabilité

2 novembre 2026 · **Publié sur TEST uniquement** · [Ma progression](https://test.hedsvs.ch/gamification-profile)

## Résultat

Le profil personnel devient le point d’entrée du parcours : maison, XP, prochaine quête réellement attribuée, accès aux quêtes, défis, badges, classement et jeux. La charte HEdS, les illustrations et les quatre couleurs de maison sont conservées. L’historique des points reste disponible dans un panneau dépliable. La consultation administrative d’un autre profil demeure en lecture seule et ne propose pas d’actions personnelles sur sa cible.

Les vues distinguent désormais chargement, absence de contenu et échec avec possibilité de réessayer. Les anciennes réponses ne peuvent plus remplacer celles du profil, des badges ou des défis du compte courant. Les données du profil sont relues sans cache pour cette vue ; une panne ne se transforme plus en faux total de zéro.

Les étapes des quêtes sont visibles et ordonnées. `current_step` représente le nombre d’étapes obligatoires terminées : aucun avancement n’est inventé depuis le pourcentage ni depuis `step_order`. Si le modèle ne permet pas d’identifier cette progression sans ambiguïté, seules les instructions sont affichées.

Le classement reprend le calcul existant de niveau maison, avec ses seuils SQL ; les deux courbes d’affichage divergentes sont retirées. Les anciennes entrées de cache estimées sont ignorées. Aucun nouveau barème XP n’est introduit.

Une récompense déjà traitée ne redéclenche pas de célébration. Les notifications du moteur portent l’utilisateur concerné et les files sont vidées à un changement de compte. Le badge « Nouveau » et l’animation d’arrivée sont réservés à un gain neuf. Icônes PrimeIcons et emojis restent compatibles ; les mouvements du profil, des cartes concernées et de l’espace jeux respectent la préférence de mouvement réduit.

L’espace jeux présente les jeux activés et permet de revenir à la progression. **Ventriglisse3D conserve intégralement ses avatars fille/garçon, son décor, ses courses et ses scores** ; il ne distribue pas d’XP. Les fichiers du jeu et ses ressources ne sont pas modifiés par ce lot.

## Pilote Supabase

Une quête additionnelle « TEST — Parcours gamification novembre » est préparée du 2 au 9 novembre 2026 (Europe/Zurich), uniquement pour l’étudiant fictif déjà autorisé par le pilote fermé. Elle demande une modification du profil puis une publication TEST. Son bonus propre est de 0 XP ; seules les règles et récompenses d’actions déjà installées s’appliquent. La quête reste à **0/2 étapes et 0 %**, prête pour une recette humaine.

L’installation est additive, gardée sur la base `staging`, vérifiée à blanc puis appliquée après sauvegarde. Les anciens profils, XP, historiques, maisons, quêtes, règles et publics sont contrôlés avant/après. Aucun élargissement de l’autorisation de récompenses, aucune notification email/push demandée, aucun ancien pilote réinitialisé.

Une répétition transactionnelle du vrai moteur a validé les deux actions, une quête terminée à 2/2 et 100 %, la cohérence du journal XP et le rejeu d’une même publication sans gain supplémentaire. Toutes les modifications simulées ont été annulées ; la quête installée et les historiques d’avant simulation restent intacts. Le total simulé inclut les bonus existants du moteur, sans nouveau barème.

Les badges et défis n’ont pas encore de public individuel équivalent à celui du pilote de quêtes : aucun catalogue global n’a donc été réactivé pour tous les comptes copiés. Roue, ROM Runner et tournois restent désactivés. La production n’est pas ouverte à ces changements.

## Vérifications et limites

- **251 tests dans 17 fichiers** passent dans la branche isolée ; build Vite/PWA réussi.
- **287 tests dans 22 fichiers** passent dans le checkout principal après report et fusion des trois tests possédant déjà des changements indépendants. Deux assertions de source devenues obsolètes dans le test local de présentation du profil sont alignées sur les liens déclaratifs et le défilement partagé ; les tests montés du parcours restent en place.
- Revue indépendante du diff : aucun défaut bloquant identifié.
- Impeccable : aucun signal résiduel du détecteur sur le profil, BadgeCard et l’espace jeux après correction des animations. Ce détecteur ne constitue pas une certification d’accessibilité.
- Recette étudiant fictif sur les vues progression, quêtes, défis, badges, maisons et jeux en 390 px : aucun débordement horizontal ni alerte de chargement observés. Prochaine quête et ses deux instructions affichées, lien vers le journal fonctionnel.
- Profil contrôlé en 834 px (thèmes clair et sombre) et 1440 px. Contraste du nom sur la photo et retour à la ligne des XP corrigés ; aucune image cassée observée sur le profil.
- Une vraie course Ventriglisse a été lancée et terminée : quatre participants, scores 4/3/2/1, nouvelle manche disponible, avatars et décor présents.
- La version publique TEST charge `/assets/index-CJwpe8jA.js` ; la session administrateur existante affiche sa progression et ses badges sans erreur de chargement. La recette locale utilise la même base TEST avec une session fictive sur une origine distincte, sans déconnecter l’administrateur.

Pas de recette sur appareil tactile physique ni de contrôle VoiceOver revendiqués. ENG-09 reste partiellement à faire pour ces contrôles et les animations du jeu. La page Quêtes conserve une limite préexistante : un changement de compte sans navigation nécessite son actualisation ; la déconnexion normale quitte cette page. Le pilote humain reste à réaliser avant une ouverture plus large. Le lot 2 général de l’audit Apple Design demeure reporté.

Preuves : [recette navigateur](/Users/antoinequarroz/Lab/projets/pfpheds/artifacts/gamification-experience-2026-11-02/browser-evidence.json), [profil publié](/Users/antoinequarroz/Lab/projets/pfpheds/artifacts/gamification-experience-2026-11-02/progression-publiee-test.png), [profil fictif](/Users/antoinequarroz/Lab/projets/pfpheds/artifacts/gamification-experience-2026-11-02/progression-desktop.png), [tablette claire](/Users/antoinequarroz/Lab/projets/pfpheds/artifacts/gamification-experience-2026-11-02/progression-tablette-clair.png), [étapes](/Users/antoinequarroz/Lab/projets/pfpheds/artifacts/gamification-experience-2026-11-02/quete-etapes-mobile.png), [course](/Users/antoinequarroz/Lab/projets/pfpheds/artifacts/gamification-experience-2026-11-02/ventriglisse-course.png).

## Livraison et sauvegardes

- Branche locale : `codex/gamification-experience-stability`, code `f9680529`, basé sur `0a4cd23e`. Aucun push GitHub revendiqué.
- Les 29 fichiers de source/tests sont reportés dans le checkout principal après contrôle des empreintes et sauvegarde. Les trois tests divergents sont fusionnés sans conflit ; les autres travaux locaux restent préservés.
- Frontend TEST : 1 365 fichiers du candidat vérifiés ; 455 nouveaux assets ajoutés, aucun ancien asset supprimé ou écrasé. Points d’entrée activés après sauvegarde ; gateway et réponse HTTP vérifiés.
- Sauvegarde frontend : `/opt/pfpheds-staging/backups/frontend-dist-before-apple-navigation-20261102T155216Z-9vnscnx6.tar.gz`, SHA256 `8004247bee51aa7a90f399873f71f601a0f89b1fcd11678d37274a9219a31507`.
- Sauvegarde base TEST avant ajout : `/opt/pfpheds-staging/backups/before-gamification-experience-20261102T153126Z.dump`, SHA256 `3cd7be4d133c377f3e60ee2a6176c32e4d0336cba0cfb53dec0256905da3f8a1`.
- HTML TEST : `a6f3afa9a5e5b27d3a0e5321569f457a13b0dfbcd5645ee5e959b3fc5e710994`.
- Service worker TEST : `4d695e50b01af785380d6c97db8a9a8fb04547d0af1aec1e97cdc96764f5ed1c`.
- Les empreintes HTML/service worker de production sont identiques avant/après. Aucun déploiement backend ni écriture de données de production.

La connexion Jira reste indisponible (`UNAUTHORIZED`, reconnexion nécessaire) : aucun statut Jira modifié. ENG-10 est corrigé sur TEST ; les autres sujets généraux de l’audit ne sont pas déclarés terminés.
