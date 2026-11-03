# Audit UI gamification — 28 septembre 2026

## Confort de jeu — 3 novembre 2026

Complément public : après connexion avec l’admin fictif de TEST, la recette du jeu est terminée sur le site publié. Un défaut d’empaquetage audio et deux fichiers vides sont corrigés ; les quatre WAV sont maintenant livrés et décodés. Deux manches complètes, pause/reprise clavier, arrêt/réactivation du son et cumul 4/3/2/1 puis 8/6/4/2 sont vérifiés, sans erreur console nouvelle. L’ancienne limitation 403 est levée pour cette recette. Le contrôle physique d’onglet masqué, le tactile physique et VoiceOver restent ouverts. [Preuves publiques](/Users/antoinequarroz/Lab/projets/pfpheds/artifacts/gamification-play-comfort-2026-11-03/public-verification.json).

Ventriglisse dispose de Pause/Reprendre, de raccourcis Espace/P limités à la piste, d’une pause lors du masquage de l’onglet et d’une caméra fixe en mouvement réduit. Les opérations tardives et le son sont nettoyés à la sortie. Les titres sont lisibles sur le fond bleu même en thème clair. Les quêtes ne conservent plus les données d’un autre compte. 323 tests passent après intégration, et une vraie course 3D avec pause/reprise et scores est vérifiée via le tunnel TEST. Publication TEST seule ; ouverture publique du navigateur de recette refusée par le réseau (403), sans modification de la protection. [Rapport et limites](/Users/antoinequarroz/Lab/projets/pfpheds/docs/research/GAMIFICATION-EXPERIENCE-2026-11-02.md).

## Parcours et fiabilité — 2 novembre 2026

Le profil « Ma progression » relie la prochaine quête réellement attribuée, les objectifs, les badges, la maison et les jeux. Les erreurs de lecture sont distinguées des états vides, les réponses tardives isolées par profil et les étapes de quêtes affichées sans progression inventée. Les célébrations concernent uniquement un gain neuf (ENG-10), et le classement reprend les seuils maison existants. Une course Ventriglisse complète et le moteur du pilote fermé ont été vérifiés. 251 tests passent dans la branche et 287 dans le checkout principal ; publication TEST uniquement. [Rapport, preuves et limites](/Users/antoinequarroz/Lab/projets/pfpheds/docs/research/GAMIFICATION-EXPERIENCE-2026-11-02.md).

## Reprise des quêtes — 2 novembre 2026

Les défauts ENG-03 et ENG-04 relevés par l’audit Apple Design sont corrigés sur `test.hedsvs.ch` : retrait des puces de filtre sans disparition des résultats, conservation des autres critères, états terminé/échu distincts et absence de faux signal d’expiration après réussite. Les noms de difficultés et les icônes PrimeIcons des quêtes ont également été corrigés. La charte HEdS et les couleurs des maisons restent identiques.

94 tests passent dans la branche isolée, puis 71 dans le checkout principal sur les fichiers concernés. La recette sur TEST confirme le retour d’une à trois quêtes après retrait de la difficulté, la conservation du type et de la recherche, ainsi que les icônes et libellés du détail. Les états de réussite et de passage d’échéance sont vérifiés avec des composants montés et une horloge contrôlée. Aucun changement de moteur XP, de backend ou de règle métier ; production inchangée. [Rapport et limites](/Users/antoinequarroz/Lab/projets/pfpheds/docs/research/GAMIFICATION-QUESTS-2026-11-02.md).

## Harmonisation finale

Les vues Quêtes, Défis, Badges et Classement partagent désormais le même en-tête, les mêmes indicateurs de progression, les mêmes surfaces et une hiérarchie responsive commune. Les emoji décoratifs des en-têtes et statistiques ont été remplacés par des icônes d'interface cohérentes. Les filtres Badges ont été regroupés dans une barre unique et les informations temporelles des Défis utilisent le même langage visuel que les indicateurs.

Contrôle final sur `test.hedsvs.ch`, en 390 px et 1440 px : aucun débordement horizontal, aucune cible interactive sous 44 px, aucun contrôle sans nom, aucun champ sans libellé, aucun saut de niveau de titre et aucune image sans texte alternatif.

Les règles actuellement validées restent inchangées : connexion quotidienne `5 XP`, modification du profil `10 XP`, publication `25 XP`, avec un maximum de trois publications récompensées par jour. Les niveaux, badges et points de maison continuent d'être calculés par le moteur Supabase autoritaire.

Périmètre : parcours étudiant publié sur `test.hedsvs.ch` uniquement.  
Production : inchangée.  
Données : comptes et contenus synthétiques du pilote fermé.

## Audit Health Score

| Dimension | Score | Constat principal |
| --- | ---: | --- |
| Accessibilité | 2/4 | Contraste des défis, boutons sans nom et hiérarchie de titres |
| Performance | 2/4 | 21 transitions de largeur et plusieurs animations permanentes |
| Responsive | 3/4 | Aucun débordement, mais deux boutons du classement sous 44 px |
| Thème | 2/4 | Variables et couleurs codées en dur se contredisent selon les pages |
| Intégrité d’implémentation | 2/4 | Trois langages visuels et quelques libellés/états contradictoires |
| **Total** | **11/20** | **Acceptable, corrections importantes avant ouverture large** |

## Verdict

Le parcours est fonctionnel, responsive et suffisamment stable pour le pilote
fermé. Il n’est pas encore prêt pour une ouverture large : la page des défis
présente un contraste insuffisant, le classement possède deux commandes sans
nom accessible et plusieurs pages ne partagent pas encore une grammaire
visuelle cohérente.

## Problèmes prioritaires

### P1 — Cartes de défis difficilement lisibles

- **Emplacement** : `ChallengeCard.vue`, styles autour des lignes 280–458.
- **Observation** : dans le thème publié, les cartes vert clair affichent le
  titre, la description et la progression en blanc ou gris très clair.
- **Impact** : le nom et l’objectif du défi deviennent difficiles à lire ; le
  contraste ne permet pas de garantir WCAG AA.
- **Correction** : imposer des jetons de texte foncés sur surface claire, puis
  tester les états normal, proche de la fin et terminé.

### P1 — Commandes du classement sans nom accessible

- **Emplacement** : `HousesRankingPage.vue:8` et
  `HousesRankingPage.vue:15`.
- **Observation** : les boutons retour et actualiser ne contiennent qu’une
  icône, sans `aria-label`. Sur mobile ils mesurent environ `33 × 44 px`.
- **Impact** : les lecteurs d’écran n’annoncent pas leur fonction et la cible
  tactile est trop étroite.
- **Correction** : ajouter les noms accessibles et une taille minimale de
  `44 × 44 px`.

### P2 — Libellés de formulaires incomplets

- **Emplacement** : recherche des quêtes `QuestsPage.vue:173–182` et recherche
  des badges `AchievementsPage.vue:71–78`.
- **Observation** : le texte visuel n’est pas relié au champ par `for`/`id` ou
  par un nom ARIA.
- **Impact** : le but du champ peut être mal annoncé par les technologies
  d’assistance.
- **Correction** : relier chaque libellé au champ et transformer l’icône de
  suppression de recherche en vrai bouton nommé.

### P2 — Hiérarchie sémantique irrégulière

- **Observation** : les quatre routes sautent au moins un niveau de titre ; la
  page des défis en saute deux.
- **Impact** : la structure est moins compréhensible en navigation par titres.
- **Correction** : conserver un seul `h1`, puis des `h2` de sections et des
  `h3` de cartes.

### P2 — Vocabulaire et système visuel incohérents

- **Emplacement** : `AchievementsPage.vue:10` et
  `AchievementsPage.vue:29`, plus les quatre pages inspectées.
- **Observation** : « Achievements » reste en anglais ; les quêtes utilisent
  une interface sombre, les défis et badges une grande surface claire, et le
  classement une troisième composition.
- **Impact** : l’ensemble ressemble à plusieurs modules accolés et demande un
  réapprentissage à chaque écran.
- **Correction** : utiliser « Mes badges » et partager le même en-tête, les
  mêmes surfaces, espacements, filtres et états de cartes.

### P2 — Animations et transitions trop coûteuses

- **Preuve déterministe** : 42 avertissements Impeccable, dont 21 transitions
  de largeur, 10 effets de rebond, 10 accents latéraux et un texte dégradé.
- **Impact** : risque de saccades et de surcharge visuelle, surtout sur appareils
  modestes ; seules quatre composantes du domaine couvrent actuellement
  `prefers-reduced-motion`.
- **Correction** : conserver l’animation utile, remplacer les transitions de
  mise en page par `transform`/`opacity` et fournir une variante réduite.

## Points positifs

- aucune route inspectée ne produit de débordement horizontal à 390 ou
  1 440 px ;
- les cartes de quêtes, défis et badges sont alimentées par les données du
  pilote Supabase ;
- les principaux contrôles des quêtes, défis et badges atteignent 44 px ;
- aucune image sans texte alternatif n’a été détectée ;
- les états de chargement et d’erreur existent dans les pages principales.

## Preuves

- script reproductible : `deploy/staging/audit-gamification-ui.mjs` ;
- captures : `artifacts/gamification-ui-audit/` ;
- routes : `/quests`, `/challenges`, `/achievements`, `/houses/ranking` ;
- formats : mobile `390 × 844` et ordinateur `1440 × 1000` ;
- détecteur : 42 avertissements, aucun blocage automatique.

Deux messages `Failed to fetch` ont été consignés lorsque le script d’audit
enchaînait rapidement les navigations depuis `/quests`. Ils ne se reproduisent
pas dans le parcours fonctionnel stabilisé, qui attend chaque chargement et
s’est terminé sans erreur. Ils sont donc classés comme artefact du harnais et
non comme défaut confirmé de l’interface.

## Ordre de correction recommandé

1. Contraste et états des cartes de défis.
2. Accessibilité du classement et des champs de recherche.
3. Libellés français et hiérarchie des titres.
4. Unification visuelle des quatre pages.
5. Réduction des animations et passe finale responsive.

## Passe de correction — 28 septembre 2026

Les corrections prioritaires ont été publiées uniquement sur
`test.hedsvs.ch` :

- contraste stable et lisible des cartes de défis et de badges ;
- couleur de texte calculée selon la couleur de chaque maison, y compris le
  jaune Doloris ;
- date de fin des défis inclusive jusqu’à la fin de la journée ;
- libellé « Mes badges » et messages de chargement entièrement en français ;
- boutons retour/actualiser nommés et cibles tactiles de 44 px ;
- cartes du classement accessibles au clavier ;
- recherches et tris reliés à leurs libellés ;
- hiérarchie de titres continue ;
- en-tête mobile des quêtes simplifié ;
- variante `prefers-reduced-motion` sur les surfaces principales.

La revalidation du frontend publié couvre les quatre routes en mobile et sur
ordinateur. Résultat agrégé : zéro débordement horizontal, zéro cible tactile
trop petite, zéro commande sans nom, zéro champ sans libellé, zéro saut de
titre et zéro image sans alternative.

Preuves complémentaires : 18 tests unitaires ciblés réussis et build staging
complet réussi. Empreintes actives :

- `index.html` : `bddcfd517c16eea135a6ddae27d032d649ea7e8f4649404d2a835f5ef7e8fa94` ;
- `sw.js` : `680014f4dd01949286fb0e01aae250c87468ab637199898d4010527a6b904dce`.

Sauvegarde frontend :
`/opt/pfpheds-staging/backups/frontend-dist-before-gamification-notification-20260928-093401.tar.gz`.
La production est inchangée.

## Harmonisation du profil gamification — 28 septembre 2026

La fiche de progression a été alignée sur les quatre écrans précédents sans
modifier sa logique métier :

- en-tête partagé et lecture administrative clairement identifiée ;
- niveau, XP, maison, raccourcis et historique regroupés selon une hiérarchie
  de lecture continue ;
- jaune HES·SO réservé aux actions et aux gains, couleurs de maison utilisées
  comme accents secondaires ;
- contraste du texte calculé automatiquement pour chaque maison ;
- barre d'XP animée par transformation et respect de la réduction de mouvement ;
- contrôle sur mobile, tablette et ordinateur sans débordement de page, erreur
  JavaScript ou cible tactile trop petite.

La version est publiée uniquement sur `test.hedsvs.ch`. Preuves : 22 tests
ciblés réussis, détecteur Impeccable sans défaut et build staging complet
réussi. Empreintes actives :

- `index.html` : `3f228e6d4a1efca7944bd7928c61ab3bd77c843d40e8cc64afc497cf35be0584` ;
- `sw.js` : `6b11653ed088d4552f71857494eaa729baaf83b9f82a2376cf0fd54fe625d64a`.

La production reste inchangée.

## Gestion des utilisateurs — 28 septembre 2026

La gestion des utilisateurs a été sécurisée et publiée uniquement sur
`test.hedsvs.ch` :

- retrait du bouton global d'ajout de points, qui ouvrait un formulaire sans
  utilisateur sélectionné ;
- retrait de la fausse action de réinitialisation de mot de passe ;
- ajout d'une action XP par utilisateur avec motif obligatoire et écriture
  d'audit ;
- ajout du changement de maison, synchronisé entre le profil et la progression
  gamification ;
- autorisation d'écriture déterminée par `app_is_privileged()` côté Supabase ;
- filtre des maisons fiabilisé malgré les différences de casse des données ;
- libellés accessibles, formulaires explicites et mise en page mobile réparée,
  y compris pour les écrans administratifs en mode large.

Le scénario connecté reproductible
`deploy/staging/verify-gamification-user-management.mjs` a vérifié : filtre
Elaris, ajout de 1 XP, recalcul du total, changement Doloris → Harmonis,
synchronisation de `gamification_data.house_id` et
`user_profiles.house_id`, puis restauration Doloris et annulation de l'XP.
L'état final est identique à l'état initial. Aucun secret n'est imprimé et la
production n'est jamais appelée.

Preuves : 18 tests unitaires ciblés réussis, build staging complet réussi,
parcours connecté sans erreur JavaScript ni réponse HTTP en échec, contrôle
mobile `390 × 844` sans débordement ou contenu rogné. Empreintes actives :

- `index.html` : `bd21b8b71772c387daca955dfa2a9fd6d334a9ddde67b822224e99220d77bf81` ;
- `sw.js` : `5a8259a1aadf8bc9a97d6fa355e4f7ee5d45acc8c44db59fa54e147f263aa2a0`.

Sauvegarde frontend :
`/opt/pfpheds-staging/backups/frontend-dist-before-gamification-notification-20260928-111217.tar.gz`.
La production reste inchangée.

## Administration de la gamification — 28 septembre 2026

Le premier lot d'harmonisation administrative est publié uniquement sur
`test.hedsvs.ch` :

- en-tête commun pour Quêtes, Défis, Badges et Maisons ;
- retour cohérent vers le tableau de bord gamification ;
- un seul titre principal par écran et hiérarchie `h1` puis `h2` ;
- intitulés de gestion corrigés, sans confusion avec la seule création ;
- recherches, filtres et actions sur les cartes nommés pour les technologies
  d'assistance ;
- barres d'actions et filtres adaptés au mobile ;
- classement des maisons recomposé sans chevauchement sur petit écran.

La revalidation connectée couvre les quatre routes en mobile `390 × 844` et
ordinateur `1440 × 1000` : zéro erreur JavaScript, zéro débordement horizontal,
zéro bouton sans nom accessible. Les seuls contrôles mesurés sous 44 px sont
le lien d'évitement global hors écran, qui devient visible au focus.

Preuves : 27 tests gamification ciblés réussis, détecteur Impeccable sans
défaut et build staging complet réussi. Empreintes actives :

- `index.html` : `e07283444e56c5f39171e3ca34fb5b019638365ad8b323084e0d01d93de984ac` ;
- `sw.js` : `10416af2b3cd46ffd2705546b17eaf0ad75a2b5d0adf1bf65673094cc8b99e2d`.

Aucune donnée Supabase n'a été modifiée pendant l'audit. La production reste
inchangée.

## Formulaires et actions administratives — 28 septembre 2026

Le second lot d'administration est publié uniquement sur `test.hedsvs.ch` :

- formulaires Défi et Badge recomposés en grille responsive, sans décalage ni
  débordement ;
- fenêtres bornées à la hauteur disponible sur mobile, avec contenu défilable ;
- champs, listes et commandes de fenêtre intégralement nommés pour les
  technologies d'assistance ;
- boutons Maisons reliés aux statistiques et à la liste des membres ;
- filtre de maison transmis et appliqué automatiquement dans la gestion des
  utilisateurs ;
- retrait du contrôle local basé sur d'anciennes chaînes de rôle, la route
  administrative restant la source d'autorisation.

Le parcours connecté a vérifié sur la base test : création, modification et
archivage d'une quête ; création, modification et archivage d'un défi ;
création, modification et désactivation d'un badge. Les enregistrements
synthétiques ont ensuite été supprimés par identifiant exact. Les navigations
vers `/houses/gamemaster/stats` et
`/admin/gamification/users?house=Elaris` ont aussi été validées, avec le filtre
Elaris actif.

Preuves : 24 tests métier ciblés, puis 12 tests de non-régression réussis ;
audit visuel mobile/ordinateur sans erreur JavaScript, écriture inattendue,
champ sans libellé ou bouton sans nom ; détecteur Impeccable sans défaut ;
build staging complet réussi. Empreintes actives :

- `index.html` : `77910d7f160bea0ab0afc3584cac3d9c0e701fe2448fbd3704e7c1797e43f989` ;
- `sw.js` : `21c88bc46a0246353aa469ed9d5fbe136a7c5ee27c900e68af2d587a81f88065`.

Sauvegarde frontend :
`/opt/pfpheds-staging/backups/frontend-dist-before-gamification-notification-20260928-102511.tar.gz`.
La production reste inchangée.

## Tableau de bord de pilotage — 28 septembre 2026

Le tableau de bord gamification a été consolidé et publié uniquement sur
`test.hedsvs.ch` :

- statistiques conservées sur leurs sources Supabase et contrats serveur ;
- indicateurs cliquables reliés aux écrans Quêtes, Défis, Badges et
  Participants ;
- changement de période limité aux métriques concernées, sans recharger les
  RPC indépendantes de la période ;
- état d'erreur explicite et récupérable pour les indicateurs généraux ;
- libellés et pluriels corrigés ;
- cinq indicateurs opérationnels regroupés dans une surface commune plus
  lisible, sans bordures d'accent concurrentes ;
- suppression de l'imbrication invalide d'un bouton dans une carte KPI déjà
  interactive.

Le scénario connecté
`deploy/staging/verify-gamification-dashboard.mjs` a vérifié le passage Mois →
Semaine, le contrat `version: 1`, le statut `ok` du domaine gamification,
l'absence de rechargement des RPC indépendantes et la navigation clavier vers
la gestion des défis. Le contrôle responsive couvre mobile `390 × 844`,
tablette `834 × 1112` et ordinateur `1440 × 1000`, sans débordement ni cible
tactile trop petite.

Preuves : 27 tests ciblés réussis, détecteur Impeccable sans défaut, build
staging complet et parcours connecté réussis. Empreintes actives :

- `index.html` : `56ae8d7182fedd7d81c7ba93bac2290eb874e96eb35fb673851a87c6f3d1440e` ;
- `sw.js` : `a27ec178996eeeb0386c8154add9b2a888ef3866a93324ecd02cfd8a24b0d695`.

Sauvegarde frontend :
`/opt/pfpheds-staging/backups/frontend-dist-before-gamification-notification-20260928-112833.tar.gz`.
La production reste inchangée.
