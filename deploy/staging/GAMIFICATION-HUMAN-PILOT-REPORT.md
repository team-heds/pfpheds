# Rapport du pilote humain gamification

Statut : simulation automatisée du parcours humain réussie  
Environnement : `test.hedsvs.ch` / base `staging` uniquement  
Production : inchangée

## Séance

- Date : 23 septembre 2026
- Responsable : contrôle automatisé Codex/Playwright
- Testeur étudiant fictif : compte privé du lot `heds25-617-pilot-v1`
- Testeur administrateur : compte privé du lot `heds25-617-pilot-v1`
- Version frontend (`index.html`) :
  `1aa978a62699d4122ab57ff74da6940339b099e2c216beb410603bbefb5beea5`
- Version service worker :
  `993838ed16226f98a3c15e67d444c3e26c8576e1cf6fb079d7de3ef4529ae1ce`

## État initial vérifié — 23 septembre 2026

- lot : `installed` ;
- période pilote : 21 au 28 septembre 2026 ;
- XP / niveau / points maison : `0 / 1 / 0` ;
- événements XP / badges / défis démarrés : `0 / 0 / 0` ;
- une quête pilote installée, non commencée ;
- récompenses activées en mode `allowlist` ;
- un seul compte autorisé, correspondant à l'étudiant fictif du pilote ;
- production inchangée.

## Résultat des parcours

| Parcours | Résultat | Commentaire |
| --- | --- | --- |
| Connexion et gain quotidien | Réussi | Gain visible et journalisé |
| Profil, XP et historique | Réussi | Libellés connexion, profil et publication visibles |
| Mise à jour du profil | Réussi | 10 XP attribués après la sauvegarde effective |
| Publication, quête, défi et badge | Réussi | Publication persistée, quête terminée, défi et badge visibles |
| Classement des maisons | Réussi | Page accessible et alimentée |
| Console administrateur | Réussi | État système, règles XP et événements refusés visibles |
| Mobile 390 px | Réussi | Aucun débordement, aucun contrôle inférieur à 40 px |
| iPad 834 px | Réussi | Aucun débordement, aucun contrôle inférieur à 40 px |

## Retours

| Niveau | Écran | Attendu | Observé | Ticket | Décision |
| --- | --- | --- | --- | --- | --- |
| Corrigé | Profil | Le succès doit apparaître après l'attribution XP | Le toast précédait la RPC XP | HEDS25-617 | Toast déplacé après la récompense |
| Corrigé | Profil et fil | Parcours Supabase-only | Des modules Firebase historiques étaient chargés en arrière-plan | HEDS25-617 | Imports rendus différés ou retirés du parcours |
| Corrigé | Test | Pas de WebSocket absent | Le socle staging réduit n'expose pas Realtime | HEDS25-617 | Realtime désactivable par variable d'environnement |

## Cohérence après essai

- [x] total XP égal au journal : `180` ;
- [x] points de maison cohérents : `180` ;
- [x] neuf clés d'événements uniques, sans doublon ;
- [x] aucune récompense hors liste blanche ;
- [x] aucun appel Firebase ou production ;
- [x] aucune notification réelle ;
- [x] aucune erreur HTTP, JavaScript ou console ;
- [x] observations consignées avant remise à zéro.

## Décisions métier

- Publication : 25 XP — validé techniquement, validation métier à confirmer.
- Plafond : 3 publications récompensées par jour — validé techniquement, validation métier à confirmer.
- Connexion quotidienne : 5 XP — validé techniquement, validation métier à confirmer.
- Mise à jour du profil : 10 XP — validé techniquement, validation métier à confirmer.

## Décision finale

- [x] Go technique pour poursuivre le pilote fermé sur test ;
- [ ] No-Go, corrections nécessaires ;
- [x] essai humain subjectif encore requis avant toute préparation production.

Motif : tous les contrôles fonctionnels, visuels, navigateur et de cohérence en
base sont réussis. Cette simulation ne remplace pas le ressenti d'un vrai
utilisateur sur la clarté et l'intérêt des récompenses.

Validation responsable métier : à recueillir après l'essai humain.

Date : 23 septembre 2026

## Correctif de suivi — 28 septembre 2026

- Le badge attribué lors de la complétion d'un défi est maintenant renvoyé
  immédiatement dans `badges_unlocked` par la RPC publique.
- Le centre global reçoit cette réponse même lorsque Realtime est désactivé sur
  l'environnement de test.
- Une clé de déduplication empêche une seconde notification lorsque Realtime
  signale ensuite le même badge.
- Le parcours mobile de création d'une publication appelle désormais le même
  moteur Supabase que le parcours ordinateur.
- Migration et frontend publiés uniquement sur `test.hedsvs.ch`; production
  inchangée.
- Preuves : scénario SQL pilote transactionnel réussi, 65 tests gamification
  ciblés réussis au total, dont 7 centrés notification/feed, et build staging
  réussi.

Le constat mineur de notification différée est donc résolu. L'essai humain
subjectif et la validation des valeurs XP restent nécessaires avant toute
préparation de production.

## Revalidation navigateur — 28 septembre 2026

Le parcours complet a été rejoué sur le frontend effectivement publié sur
`test.hedsvs.ch`, avec les comptes fictifs du lot pilote :

- connexion étudiant et connexion administrateur réussies ;
- modification du profil et attribution XP réussies ;
- publication persistée et attribution XP réussies ;
- badge `TEST — Première publication` renvoyé immédiatement par la RPC ;
- notification de badge visible immédiatement et une seule fois ;
- quête, défi, badge, classement et historique visibles ;
- console administrateur et historique de l'étudiant accessibles ;
- cohérence base confirmée : `180 XP`, `180` points maison, neuf événements
  et neuf clés uniques, quête terminée ;
- mobile `390 × 844` et iPad `834 × 1112` sans débordement ni contrôle
  interactif inférieur à 40 px ;
- zéro appel Firebase/production, zéro réponse HTTP en erreur, zéro erreur
  JavaScript et zéro erreur console.

Après la revalidation, la publication temporaire et la modification du profil
ont été nettoyées. Le lot pilote a ensuite été réinitialisé et réinstallé
dans son état reproductible `installed`. La production est restée inchangée.

## Revalidation après harmonisation graphique — 28 septembre 2026

- charte HES·SO restaurée sur Quêtes, Défis, Badges et Classement : bleu nuit,
  surfaces sombres et jaune de marque ;
- couleurs de maison conservées comme accents secondaires sur les contours,
  repères et barres de progression ;
- parcours navigateur complet réussi : connexion, profil, publication, quête,
  défi, badge immédiat, classement, historique étudiant et console admin ;
- cohérence navigateur : `180 XP`, `180` points maison, neuf événements et neuf
  clés uniques ;
- scénario transactionnel exécuté deux fois à l'identique : plafond de trois
  publications récompensées et rejeu sans double récompense validés ;
- aucun appel Firebase/production, aucune erreur HTTP/JavaScript/console et
  aucune notification externe ;
- lot pilote remis à l'état propre `installed` après les essais ; production
  inchangée.

## Revalidation de la fiche de progression — 28 septembre 2026

- fiche profil harmonisée avec Quêtes, Défis, Badges et Classement ;
- informations métier inchangées : niveau, XP, maison, historique, quêtes,
  défis et badges proviennent toujours du même parcours Supabase ;
- contraste des accents de maison calculé automatiquement ;
- mobile, tablette et ordinateur sans débordement de page ni petite cible
  tactile ;
- aucune erreur JavaScript pendant les trois parcours connectés ;
- 22 tests ciblés et audit Impeccable réussis ;
- publication limitée à `test.hedsvs.ch`, production inchangée.

## Revalidation des écrans administratifs — 28 septembre 2026

- Quêtes, Défis, Badges et Maisons utilisent désormais le même en-tête et le
  même chemin de retour vers le tableau de bord gamification ;
- recherches, filtres et actions des cartes possèdent un nom accessible ;
- composition responsive validée en mobile et ordinateur ;
- zéro erreur JavaScript, zéro débordement horizontal et zéro bouton sans nom
  sur les huit parcours contrôlés ;
- 27 tests ciblés et audit Impeccable réussis ;
- aucune écriture métier effectuée pendant les contrôles ;
- publication limitée à `test.hedsvs.ch`, production inchangée.

## Revalidation du parcours de notifications — 28 septembre 2026

- un seul système de notification est désormais actif dans le parcours
  étudiant : le composant global relié au moteur Supabase ;
- l'ancien composant local de la page Badges, non déclenché et susceptible de
  doubler les messages, a été retiré de cette page ;
- les notifications immédiates et Realtime partagent la même clé de
  déduplication pour un badge ;
- les temporisations sont nettoyées au démontage et l'historique en mémoire est
  borné à 50 éléments ;
- les textes longs, les petits écrans et la préférence de réduction des
  animations sont pris en charge ;
- 14 tests ciblés réussis, audit Impeccable sans anomalie et build staging
  réussi ;
- parcours navigateur complet réussi, avec un seul message pour le badge
  débloqué, aucune erreur HTTP/JavaScript/console et aucune connexion vers
  Firebase ou la production ;
- audit visuel Quêtes, Défis, Badges et Classement réussi en `390 px` et
  `1440 px` : aucun débordement, aucune petite cible, aucun contrôle sans nom et
  aucun champ sans libellé ;
- frontend publié uniquement sur `test.hedsvs.ch` : index
  `f58a74a627698e51f81c60adb531c1c983f7b33ae7c466edd4e18000e9d90a37`,
  service worker
  `b9fc7b56a6c82576328096e4fdac26972d644a18ddefd79f76df0404e6cf2453` ;
- sauvegarde de retour arrière :
  `/opt/pfpheds-staging/backups/frontend-dist-before-gamification-notification-20260928-113744.tar.gz` ;
- lot pilote remis à l'état propre `installed` ; production inchangée.

## Réactivation du Ventriglisse 3D — 28 septembre 2026

- jeu réactivé depuis la page Jeux et publié uniquement sur
  `test.hedsvs.ch` ;
- parcours de base conservé pour deux à six participants, avec choix des
  avatars, décor cafétéria, piste texturée, eau et bulles ;
- moteur de course local et déterministe, classement final intégré à la page
  et nouvelle manche possible sans rechargement ; les scores sont cumulés
  pendant la session selon le classement de chaque manche ;
- animation Three.js conservée lorsque WebGL est disponible, avec un mode
  simplifié entièrement jouable et visuel lorsque WebGL est absent ;
- adaptation mobile validée sans débordement et sans cible interactive trop
  petite ;
- partie explicitement amicale : aucune écriture Supabase, aucun XP et aucune
  notification ;
- navigation, course à cinq participants, classement, mobile et diagnostics
  navigateur validés sans erreur ni appel Firebase/production ;
- neuf tests unitaires ciblés réussis et build staging réussi ;
- frontend publié avec l’index
  `e4fa90d3e41dea646d2f974909f2efe728a6a4c8db612d9f94121c02f6290709`
  et le service worker
  `d8a87453889861e701907b91bddaaccb4cd751c1f1e940a19efafe819e3f1c82` ;
- sauvegarde de retour arrière :
  `/opt/pfpheds-staging/backups/frontend-dist-before-gamification-notification-20260928-131036.tar.gz` ;
- production inchangée.

## Personnages 3D sélectionnables — 28 septembre 2026

- Deux vrais modèles humanoïdes locaux, « Fille » et « Garçon », remplacent les
  anciens avatars géométriques dans la vue WebGL. Chaque participant choisit
  son personnage avant la course ; les choix sont indépendants des couloirs.
- Les modèles GLB adaptés proviennent des ressources locales PhysioTechApp
  (`assets/avatars/v1/exports`) ; leur base Quaternius est sous licence CC0.
  Le dépôt contient un avis de provenance dans
  `src/components/games/assets/avatars/NOTICE.md`.
- Le chargement est mis en cache par modèle, chaque participant reçoit sa
  propre copie du squelette ; si un modèle ne charge pas, la course conserve
  un avatar de secours. Le mode simplifié reste jouable sans WebGL.
- La politique de sécurité de la passerelle staging autorise désormais les
  URL `blob:` utilisées par le chargeur GLB pour les textures. Le conteneur
  `gateway` a été recréé seul ; la réponse HTTP contient la nouvelle règle.
- Deux réponses GLB `200`, course complète à cinq participants, classement et
  mobile vérifiés sur `test.hedsvs.ch`, sans erreur JavaScript, console ou HTTP,
  ni appel Firebase/production. Aucun XP n'est attribué par ce jeu.
- Le décor est entièrement chargé avant d'afficher l'état « piste prête » et
  les étiquettes restent au-dessus des personnages agrandis.
- La progression de la course suit le temps écoulé même sur un rendu 3D lent ;
  les deux modèles V1 ont été contrôlés dans la scène avant et après la manche.
- Frontend staging final : index
  `2f88de2c803698d2ec71ee8758fea20ebb40e17dda790693320261193559c721`,
  service worker
  `67267369e6eb630ec44bc021533a50c6d065b1421f9b61cd08da944d4b82aae8`.
- Sauvegardes de retour arrière :
  `/opt/pfpheds-staging/backups/frontend-dist-before-gamification-notification-20260928-135035.tar.gz`
  (premier déploiement),
  `/opt/pfpheds-staging/backups/frontend-dist-before-gamification-notification-20260928-144052.tar.gz`
  (dernier déploiement) et
  `/opt/pfpheds-staging/backups/Caddyfile-before-ventriglisse-20260928`.
- Production inchangée.
