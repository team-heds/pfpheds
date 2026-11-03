# Pilote humain gamification — test.hedsvs.ch

Date de préparation : 23 septembre 2026  
Environnement : `test.hedsvs.ch` / base `staging` uniquement  
Production : hors périmètre

## Objectif

Vérifier que la gamification est compréhensible et agréable pour un étudiant,
et que l'administrateur peut expliquer chaque résultat sans modifier
manuellement les points.

Le pilote utilise uniquement les comptes fictifs déjà créés. Leurs accès sont
conservés dans le fichier privé
`deploy/staging/gamification-pilot-accounts.json` et ne doivent jamais être
copiés dans ce document, Jira, une capture d'écran ou un message.

## Règle provisoire retenue

Pendant le pilote fermé, une publication vérifiée vaut 25 XP, avec un plafond
de **trois publications récompensées par jour**. Une quatrième publication peut
exister, mais elle ne donne aucun XP. Ce plafond limite le spam tout en laissant
assez de marge pour observer la progression.

Cette règle reste une décision de pilote. Elle devra être confirmée ou ajustée
avant toute activation en production.

## Préconditions

- le lot `heds25-617-pilot-v1` est dans l'état `installed` ;
- le coupe-circuit est ouvert uniquement pour la liste blanche ;
- seul le compte étudiant fictif du pilote est éligible ;
- aucune notification email ou push réelle n'est activée ;
- l'administrateur dispose de la console gamification en lecture seule ;
- les observations précédentes ont été exportées avant toute remise à zéro.

## Parcours étudiant

Renseigner la colonne « Observation » pendant le test. Ne pas corriger un
problème en cours de séance : le noter d'abord afin de conserver le contexte.

| Étape | Action | Résultat attendu | Observation |
| --- | --- | --- | --- |
| 1 | Se connecter avec le compte étudiant fictif | Connexion réussie, aucun message Firebase, gain de connexion visible une seule fois | |
| 2 | Ouvrir « Mon profil gamification » | Maison, niveau, XP et progression sont lisibles ; l'historique explique le gain de connexion | |
| 3 | Consulter quêtes, défis et badges | Les contenus `TEST — …` sont visibles, distincts des contenus normaux et non terminés au départ | |
| 4 | Modifier une information non sensible du profil puis enregistrer | Un seul gain de mise à jour apparaît ; le total, la maison et l'historique restent cohérents | |
| 5 | Créer une publication de test clairement identifiée | La publication existe, le gain est expliqué, le défi et la quête progressent et le badge pilote est attribué | |
| 6 | Recharger le profil gamification | Aucun second gain n'est créé par le rechargement ; les totaux sont inchangés | |
| 7 | Ouvrir le classement des maisons | Le classement est lisible sans classement nominatif général des étudiants | |
| 8 | Tester sur téléphone ou largeur 390 px | Aucun débordement horizontal ; boutons et textes restent utilisables | |
| 9 | Tester sur iPad ou largeur 834 px | Navigation, cartes et historique restent lisibles sans perte d'action | |

Le plafond de publication, la concurrence et le rejeu identique sont déjà
couverts automatiquement. Il n'est pas nécessaire de créer quatre publications
pendant chaque séance humaine.

## Parcours administrateur

| Étape | Action | Résultat attendu | Observation |
| --- | --- | --- | --- |
| 1 | Ouvrir le tableau de bord gamification | Les règles actives, montants, plafonds, activité et refus sont datés et compréhensibles | |
| 2 | Ouvrir l'utilisateur pilote | Le profil et l'historique correspondent à ce que l'étudiant vient de voir | |
| 3 | Consulter quêtes, défis et badges | Le cycle de vie et l'audience des contenus pilotes sont identifiables | |
| 4 | Consulter maisons et classement | Les points de la maison correspondent au journal XP du pilote | |
| 5 | Revenir sur le tableau de bord | Aucun bouton ne permet d'ajouter arbitrairement des XP ; les refus n'exposent aucune donnée personnelle | |

## Contrôles techniques après la séance

- total XP du profil = somme du journal XP ;
- points de maison du profil = total XP attribué par le pilote ;
- aucune clé d'événement dupliquée ;
- aucun gain pour un compte hors liste blanche ;
- aucun appel vers Firebase, `api2.hedsvs.ch` ou la production ;
- aucun email réel et aucune entrée push générés ;
- aucune erreur HTTP ou JavaScript bloquante ;
- toute quatrième publication du jour est refusée avec le motif `cap_reached`.

Le contrôle de base, sans écriture et sans donnée personnelle, est disponible
dans `deploy/staging/check-gamification-human-pilot-baseline.sql`.

## Classement des retours

| Niveau | Définition | Décision |
| --- | --- | --- |
| Bloquant | Perte ou incohérence de points, accès non autorisé, écran inutilisable, donnée de production touchée | Arrêt du pilote et fermeture du coupe-circuit |
| Important | Parcours réalisable mais résultat difficile à comprendre, mauvaise information ou problème responsive important | Correction obligatoire avant production |
| Confort | Formulation, espacement ou détail visuel sans incidence fonctionnelle | À planifier sans bloquer le pilote |

Pour chaque retour, noter : date, rôle, écran, action réalisée, résultat attendu,
résultat observé, niveau, capture éventuelle sans donnée sensible et ticket Jira
associé.

## Sortie du pilote

Le pilote est validé lorsque :

1. aucun retour bloquant n'est ouvert ;
2. les totaux XP, badges, défis, quêtes et maison sont cohérents ;
3. les retours importants possèdent une décision et un ticket ;
4. le responsable métier confirme les valeurs XP et le plafond de publication ;
5. le rapport final porte une décision explicite Go ou No-Go.

Même en cas de Go, aucun déploiement ou activation en production ne doit être
effectué sans une demande séparée et explicite.

## Remise à zéro

Après avoir consigné les observations, relancer le scénario reproductible
documenté dans `deploy/staging/GUIDE-TEST.md`. Il remet uniquement les données
du lot pilote à zéro, le réinstalle proprement et ne touche pas à la production.
