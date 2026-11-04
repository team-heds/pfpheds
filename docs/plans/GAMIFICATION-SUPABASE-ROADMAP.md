---
ticket: GAMIFICATION-SUPABASE
validated: yes
environment: test-only-until-go-live-approval
---

# Feuille de route — Gamification Supabase

## 1. But du chantier

Remettre en service une gamification compréhensible, fiable et maintenable pour
les étudiants, avec Supabase comme unique autorité de données et de règles.
L'ensemble doit d'abord être validé sur `test.hedsvs.ch`. Aucun déploiement en
production et aucune reprise de récompense réelle ne sont autorisés avant une
validation métier explicite.

Le premier périmètre couvre :

- maison de l'étudiant ;
- niveau et XP ;
- badges ;
- défis ;
- quêtes avec étapes ;
- classement des maisons ;
- administration et suivi ;
- historique vérifiable des récompenses.

Sont différés : roue quotidienne, jeux 3D, tournois, Ventriglisse et toute
récompense liée aux commentaires.

## 2. Principes non négociables

1. Supabase est la seule source de vérité ; Firebase ne participe à aucun
   parcours actif.
2. Le navigateur ne calcule ni n'écrit directement l'XP, les badges ou les
   points des maisons.
3. Toute récompense passe par une opération serveur atomique, autorisée,
   idempotente et journalisée.
4. Un administrateur qui consulte ou modifie un profil ne reçoit jamais les
   récompenses de l'étudiant.
5. Les données et activités de test restent séparées de la production.
6. Une règle désactivée ou inconnue ne distribue rien et produit un diagnostic
   exploitable.
7. Les anciennes activités ne donnent pas automatiquement des bonus lors de la
   première connexion après activation.

## 3. Décisions métier à valider avant le développement du moteur

Les recommandations ci-dessous permettent d'avancer sans ambiguïté. Elles
doivent être confirmées avant de passer les stories concernées à « Prête ».

| Sujet | Recommandation | Pourquoi |
| --- | --- | --- |
| Récompenses historiques | Ne pas distribuer d'XP rétroactivement ; importer seulement les badges historiques sans bonus | Évite un gain massif à la première connexion |
| Connexion quotidienne | 5 XP, une fois par jour civil, fuseau Europe/Zurich | Règle simple et contrôlable |
| Mise à jour du profil | 20 XP, une seule fois lorsque le profil atteint les champs requis | Évite de récompenser chaque sauvegarde |
| Publication | 25 XP, avec plafond pilote de 3 gains par jour | Limite le spam ; valeur à confirmer après le pilote humain |
| Classement | Afficher les maisons ; ne pas publier un classement nominatif général des étudiants | Réduit la pression et protège la vie privée |
| Maison | Un changement uniquement via un processus administré et audité | Empêche les manipulations de classement |
| Quêtes | Progression déclenchée par des événements métier serveur | Évite la validation manuelle depuis le navigateur |
| Expiration | Une quête expirée devient non modifiable ; elle conserve son historique | Assure la traçabilité |

## 4. Ordre d'exécution recommandé

```text
Lot 0 — Décisions et contrat des règles
  ↓
Lot 1 — Moteur Supabase sécurisé
  ↓
Lot 2 — Quêtes, défis et badges exécutables
  ↓
Lot 3 — Nettoyage Firebase et qualité des données
  ↓
Lot 4 — Profils étudiant et console administrateur
  ↓
Lot 5 — Pilote, observation et passage contrôlé en production
```

Les lots 3 et 4 peuvent avancer partiellement en parallèle après stabilisation
du contrat du Lot 1. Le Lot 5 dépend de tous les autres.

## 5. Backlog Jira proposé

### Epic GAM-E0 — Définir les règles métier

#### GAM-001 — Formaliser le catalogue des événements et récompenses

**Priorité :** P0  
**Complexité :** 2/5  
**Acteurs :** responsable métier, administrateur, équipe de développement

**Story**  
En tant que responsable de la plateforme, je veux disposer d'un catalogue
unique des actions, récompenses, plafonds et conditions afin que le résultat
soit prévisible et identique dans toute l'application.

**Préconditions**

- L'audit `HEDS25-GAMIFICATION-SUPABASE.md` est accepté comme état initial.
- Les valeurs XP et les règles de rétroactivité sont validées par le métier.

**Critères d'acceptation**

1. Chaque action possède un identifiant stable en minuscules, par exemple
   `daily_login`, `profile_completed`, `create_post`.
2. Chaque action décrit sa valeur XP, sa fréquence, son plafond, sa clé
   d'idempotence et les effets possibles sur les défis, badges et maisons.
3. Les actions non supportées sont recensées et désactivées.
4. Le fuseau utilisé pour les règles quotidiennes est explicitement
   `Europe/Zurich`.
5. Le document définit le comportement en cas d'événement répété, tardif,
   inconnu ou invalide.
6. Une matrice relie chaque règle à son test automatisé futur.

**Erreur / état vide**

- Une action inconnue ne distribue rien et retourne un motif générique.
- Un catalogue vide empêche l'activation du moteur.

**Autorisation et audit**

- Seuls les administrateurs habilités peuvent modifier le catalogue actif.
- Toute évolution de règle possède une version et une date d'effet.

**Dépendances :** aucune.  
**Hors périmètre :** développement de l'interface ou attribution d'XP.

#### GAM-002 — Décider et figer la politique de reprise historique

**Priorité :** P0  
**Complexité :** 2/5  
**Acteurs :** responsable métier, administrateur

**Story**  
En tant que responsable métier, je veux définir le traitement des anciennes
actions et anciens badges afin qu'une réactivation ne crée pas de gains
inattendus ou injustes.

**Critères d'acceptation**

1. Aucun ancien événement ne crée automatiquement d'XP à la connexion.
2. Les badges historiques conservés sans bonus sont identifiables comme une
   reprise de données.
3. Un rapport avant/après indique utilisateurs, badges, XP et points de maison
   concernés sans exposer de données personnelles dans les logs techniques.
4. Une simulation sans écriture est disponible avant toute reprise.
5. Toute reprise est relançable sans doublon.

**Erreur / état vide**

- Une donnée historique ambiguë est mise en quarantaine, jamais récompensée par
  défaut.

**Autorisation et audit**

- La reprise nécessite une action administrative explicite et une trace de
  l'acteur, de la règle et du lot.

**Dépendances :** GAM-001.  
**Hors périmètre :** correction manuelle de profils non liés.

### Epic GAM-E1 — Construire le moteur Supabase fiable

#### GAM-003 — Centraliser l'enregistrement sécurisé des événements

**Priorité :** P0  
**Complexité :** 4/5  
**Acteur :** étudiant

**Story**  
En tant qu'étudiant, je veux que mes actions légitimes soient récompensées une
seule fois afin que mon XP reste exact même si je recharge une page ou répète
une requête.

**Critères d'acceptation**

1. Une seule opération serveur enregistre l'événement, applique les plafonds,
   ajoute l'XP, met à jour la maison et déclenche les progressions associées.
2. L'identité vient de la session Supabase ; aucun identifiant utilisateur
   fourni par le navigateur n'est considéré comme autorité.
3. Une même clé d'idempotence ne peut produire qu'une récompense.
4. Une transaction partiellement invalide ne produit aucune écriture.
5. Les droits `EXECUTE` sont minimaux ; toute fonction privilégiée fixe son
   `search_path`, vérifie l'utilisateur et n'est pas exécutable par `PUBLIC`.
6. Les politiques RLS empêchent un étudiant de lire ou modifier les
   progressions privées d'un autre étudiant.
7. Les totaux de maison sont dérivés ou mis à jour dans la même transaction,
   jamais directement depuis le navigateur.

**Erreur / état vide**

- Session absente : aucune écriture, réponse non authentifiée.
- Règle désactivée ou plafond atteint : aucune récompense, résultat explicite.
- Double envoi : réponse idempotente avec la récompense originale.

**Auditabilité**

- Le journal contient l'utilisateur, l'action, la version de règle, la clé
  d'idempotence, les points et l'horodatage ; jamais de mot de passe ou jeton.

**Dépendances :** GAM-001, GAM-002.  
**Validation :** tests SQL/RLS, concurrence, rejeu, droits anon/auth/admin et
contrôle des conseillers Supabase.  
**Retour arrière :** désactivation des règles sans suppression de l'historique.

#### GAM-004 — Empêcher les récompenses au mauvais utilisateur

**Priorité :** P0  
**Complexité :** 2/5  
**Acteurs :** étudiant, administrateur

**Story**  
En tant qu'administrateur, je veux consulter et modifier un profil sans recevoir
ses récompenses afin de préserver l'intégrité des scores.

**Critères d'acceptation**

1. Consulter un étudiant affiche sa maison, son niveau et son XP, pas ceux de
   l'administrateur.
2. Modifier le profil d'un tiers ne déclenche aucun événement personnel pour
   l'administrateur ou l'étudiant.
3. Seule une modification effectuée par l'étudiant sur son propre profil peut
   déclencher `profile_completed`.
4. Les tests couvrent admin vers étudiant, étudiant vers soi et URL de profil
   invalide.

**Dépendances :** GAM-003.  
**État actuel :** protection initiale présente sur la version test, à intégrer
dans le socle final et à tester côté serveur.

#### GAM-005 — Rendre les calculs de niveau et de maison déterministes

**Priorité :** P0  
**Complexité :** 3/5  
**Acteur :** étudiant, administrateur

**Story**  
En tant qu'utilisateur, je veux voir le même niveau et les mêmes totaux sur
tous les écrans afin de pouvoir faire confiance au classement.

**Critères d'acceptation**

1. Une formule unique calcule niveau, seuil suivant et progression.
2. La somme du journal XP correspond à l'XP courant de chaque utilisateur.
3. La somme des membres correspond au total de chaque maison selon la règle
   métier validée.
4. Une commande de contrôle signale les écarts sans les corriger implicitement.
5. Une réparation administrative produit un rapport avant/après et reste
   idempotente.

**Dépendances :** GAM-003.  
**Hors périmètre :** changement automatique de maison.

### Epic GAM-E2 — Rendre les quêtes, défis et badges exécutables

#### GAM-006 — Faire progresser les quêtes par événements serveur

**Priorité :** P1  
**Complexité :** 4/5  
**Acteur :** étudiant

**Story**  
En tant qu'étudiant, je veux que les étapes de mes quêtes avancent lorsque je
réalise réellement les actions demandées afin que la progression soit fiable.

**Critères d'acceptation**

1. Chaque étape référence une action supportée du catalogue.
2. La progression est appliquée dans le moteur serveur et non par une écriture
   libre du navigateur.
3. Une étape terminée ne peut pas régresser ni être récompensée deux fois.
4. Une quête est terminée uniquement lorsque toutes ses étapes obligatoires le
   sont.
5. Les dates d'ouverture et d'expiration sont respectées en
   `Europe/Zurich`.
6. Une quête non assignée ou expirée ne progresse pas.

**Erreur / état vide**

- Sans quête active, l'étudiant voit un état vide utile, pas une erreur.
- Une étape configurée avec une action inconnue est refusée à la publication.

**Dépendances :** GAM-003, GAM-005.

#### GAM-007 — Aligner défis et badges sur le catalogue d'actions

**Priorité :** P1  
**Complexité :** 3/5  
**Acteur :** étudiant

**Story**  
En tant qu'étudiant, je veux que mes défis et badges reflètent mes actions
réelles afin de comprendre pourquoi ils progressent ou se débloquent.

**Critères d'acceptation**

1. Aucun défi ou badge actif ne référence `LOGIN`, `POST_CREATE`,
   `COMMENT_CREATE` ou une autre action non supportée.
2. L'attribution d'un badge est idempotente.
3. Le bonus éventuel d'un badge n'est attribué qu'une fois et jamais lors
   d'une simple reprise historique.
4. Une fiche affiche la condition, la progression, la récompense et la date de
   fin.
5. Les objets désactivés restent consultables par l'administration mais ne
   progressent plus.

**Dépendances :** GAM-001, GAM-002, GAM-003.

#### GAM-008 — Administrer le cycle de vie d'une quête ou d'un défi

**Priorité :** P1  
**Complexité :** 4/5  
**Acteur :** administrateur habilité

**Story**  
En tant qu'administrateur, je veux préparer, vérifier, publier et clôturer une
quête ou un défi afin de ne jamais exposer une configuration incomplète.

**Critères d'acceptation**

1. Les états `brouillon`, `planifié`, `actif`, `terminé`, `archivé` sont
   définis et contrôlés.
2. Une publication refuse les dates incohérentes, étapes vides, actions
   inconnues ou récompenses non valides.
3. Un aperçu indique l'audience et le nombre de personnes concernées sans
   démarrer la quête.
4. La clôture empêche toute nouvelle progression mais conserve l'historique.
5. Chaque changement d'état est audité.

**Dépendances :** GAM-006, GAM-007.  
**Hors périmètre :** envoi automatique de notifications lors du premier pilote.

### Epic GAM-E3 — Supprimer la dette Firebase et fiabiliser les données

#### GAM-009 — Retirer Firebase du domaine gamification

**Priorité :** P1  
**Complexité :** 3/5  
**Acteur :** équipe de développement

**Story**  
En tant que mainteneur, je veux qu'aucun composant de gamification ne dépende de
Firebase afin d'éviter deux sources de vérité et des pannes difficiles à
diagnostiquer.

**Critères d'acceptation**

1. Les services historiques Firebase de gamification sont supprimés ou isolés
   hors du bundle actif.
2. Les widgets encore liés à Firebase sont migrés vers Supabase ou retirés.
3. Une recherche statique confirme qu'aucun import Firebase ne part du domaine
   gamification actif.
4. Les parcours E2E n'émettent aucune requête réseau Firebase.
5. Les erreurs générales de configuration Firebase ne polluent plus la console
   sur les pages Supabase-only.

**Dépendances :** GAM-003, GAM-006, GAM-007.  
**Retour arrière :** drapeau global de gamification, pas de retour à Firebase.

#### GAM-010 — Nettoyer et contrôler les données gamification

**Priorité :** P1  
**Complexité :** 3/5  
**Acteur :** administrateur technique

**Story**  
En tant qu'administrateur technique, je veux identifier les données orphelines,
expirées ou incohérentes afin de disposer d'une base saine avant le pilote.

**Critères d'acceptation**

1. Un rapport détecte profils orphelins, maisons absentes, doubles badges,
   étapes inconnues et écarts d'XP.
2. Les corrections sont séparées du diagnostic et peuvent être simulées.
3. Aucune suppression définitive n'est effectuée sans sauvegarde et validation.
4. Les données historiques expirées sont archivées ou conservées selon une
   règle explicite.
5. Le rapport final montre zéro incohérence bloquante.

**Dépendances :** GAM-002, GAM-005.  
**Sécurité :** rapport nominatif réservé aux administrateurs ; logs techniques
agrégés.

### Epic GAM-E4 — Offrir une expérience claire et administrable

#### GAM-011 — Unifier le parcours gamification du profil étudiant

**Priorité :** P1  
**Complexité :** 3/5  
**Acteur :** étudiant

**Story**  
En tant qu'étudiant, je veux retrouver ma maison, mon niveau, mes quêtes et mes
badges depuis mon profil afin de comprendre immédiatement ce que je peux faire.

**Critères d'acceptation**

1. Le profil présente maison, niveau, XP actuel et progression vers le niveau
   suivant sans surcharger la page.
2. Des accès explicites mènent aux quêtes, badges/défis et classement des
   maisons.
3. Chaque vue gère chargement, erreur, absence de maison et absence d'activité.
4. L'interface fonctionne au clavier, possède des libellés accessibles et ne
   dépend pas uniquement de la couleur.
5. Les vues sont vérifiées sur mobile, iPad et ordinateur sans débordement ni
   action plus petite que 44 px.
6. Un administrateur en consultation voit les données de la personne ciblée.

**Dépendances :** GAM-004, GAM-005, GAM-006, GAM-007.  
**État actuel :** un premier résumé responsive est actif sur la version test.

#### GAM-012 — Expliquer chaque gain dans un historique personnel

**Priorité :** P2  
**Complexité :** 3/5  
**Acteur :** étudiant

**Story**  
En tant qu'étudiant, je veux consulter l'origine de mes points afin de pouvoir
comprendre mon score et signaler une anomalie.

**Critères d'acceptation**

1. L'historique affiche libellé compréhensible, points, date et objet lié.
2. Les événements techniques ou données sensibles ne sont jamais exposés.
3. L'étudiant ne peut consulter que son historique ; un administrateur
   habilité peut consulter celui d'un étudiant dans un cadre de support.
4. La pagination évite de charger tout l'historique.
5. Un état vide explique comment commencer.

**Dépendances :** GAM-003.

#### GAM-013 — Créer une console de pilotage administrateur

**Priorité :** P1  
**Complexité :** 4/5  
**Acteur :** administrateur habilité

**Story**  
En tant qu'administrateur, je veux contrôler l'état du système et préparer les
contenus afin de mener le pilote sans modifier directement la base.

**Critères d'acceptation**

1. La console affiche règles actives, quêtes/défis publiés, utilisateurs
   actifs, événements refusés et incohérences.
2. Les chiffres ont une source, une date de fraîcheur et une définition.
3. Les actions sensibles demandent confirmation et produisent un audit.
4. Aucun écran ne permet d'ajouter arbitrairement de l'XP à un utilisateur.
5. Les corrections exceptionnelles utilisent une procédure dédiée avec motif,
   acteur et compensation traçable.
6. Un rôle non autorisé reçoit un refus et ne voit aucune donnée agrégée
   sensible.

**Dépendances :** GAM-003, GAM-008, GAM-010.

### Epic GAM-E5 — Piloter et livrer sans risque

#### GAM-014 — Préparer un jeu de test reproductible

**Priorité :** P0 avant pilote  
**Complexité :** 3/5  
**Acteur :** équipe de validation

**Story**  
En tant que testeur, je veux disposer de comptes et scénarios reproductibles
afin de valider toutes les règles sans toucher à la production.

**Critères d'acceptation**

1. Les rôles étudiant et administrateur sont couverts sur la base test.
2. Les scénarios couvrent connexion, profil, publication, quête, défi, badge,
   expiration, plafond et rejeu.
3. Une remise à zéro limitée aux données générées par le pilote est possible.
4. Les tests ne déclenchent ni email réel ni notification réelle.
5. Les secrets et mots de passe ne sont pas stockés dans le dépôt ou les logs.

**Dépendances :** GAM-003 à GAM-013.

#### GAM-015 — Exécuter un pilote fermé sur test.hedsvs.ch

**Priorité :** P0 avant production  
**Complexité :** 3/5  
**Acteurs :** administrateur, groupe pilote étudiant

**Story**  
En tant que responsable de la plateforme, je veux observer un pilote fermé afin
de vérifier les règles, l'ergonomie et la stabilité avant toute mise en
production.

**Critères d'acceptation**

1. Une sauvegarde test et un état initial chiffré sont conservés.
2. Le pilote suit un script validé avec résultats attendus.
3. Aucun appel Firebase et aucune connexion à la base de production ne sont
   observés.
4. Les écarts XP/maison, erreurs RPC et événements refusés sont suivis.
5. Les retours utilisateurs sont classés en bloquant, important ou confort.
6. Le pilote se termine sans incohérence bloquante et avec un rapport signé.

**Dépendances :** GAM-014.

**État au 23 septembre 2026 :** validation technique réussie. Le protocole
humain est prêt dans `deploy/staging/GAMIFICATION-HUMAN-PILOT.md`. La story ne
sera terminée qu'après consignation des retours humains et décision Go/No-Go.

#### GAM-016 — Déployer progressivement en production

**Priorité :** P0 de mise en service  
**Complexité :** 4/5  
**Acteurs :** responsable métier, administrateur technique

**Story**  
En tant que responsable de la plateforme, je veux activer progressivement la
gamification afin de pouvoir arrêter le système sans perte de données en cas de
problème.

**Critères d'acceptation**

1. Une sauvegarde et un rapport de préflight sont validés avant la migration.
2. Les migrations sont append-only, versionnées et testées sur une copie.
3. Les règles sont d'abord déployées désactivées, puis activées par étape.
4. Le premier déploiement peut limiter l'audience à un groupe pilote.
5. Un kill switch désactive les nouvelles récompenses sans effacer
   l'historique ni masquer les profils.
6. Les contrôles à J+1 et J+7 comparent événements, XP, badges et points de
   maison.
7. Le passage en production nécessite une approbation métier explicite.

**Dépendances :** GAM-015.  
**Retour arrière :** désactiver l'émission de récompenses, conserver les
événements, puis appliquer si nécessaire des compensations auditables ; aucune
suppression en masse.

## 6. Découpage conseillé en sprints

### Sprint A — Intégrité avant fonctionnalités

- GAM-001 — catalogue des règles ;
- GAM-002 — reprise historique ;
- GAM-003 — moteur sécurisé ;
- GAM-004 — séparation admin/étudiant ;
- GAM-005 — calculs déterministes.

**Sortie attendue :** XP fiable et rejouable, sans interface d'administration
complète. Aucune récompense rétroactive automatique.

### Sprint B — Contenu réellement jouable

- GAM-006 — progression des quêtes ;
- GAM-007 — défis et badges ;
- GAM-008 — cycle de vie administré ;
- GAM-010 — diagnostic des données.

**Sortie attendue :** une quête pilote complète, explicable et clôturable.

### Sprint C — Simplification et expérience

- GAM-009 — retrait Firebase ;
- GAM-011 — parcours du profil ;
- GAM-012 — historique personnel ;
- GAM-013 — console administrateur.

**Sortie attendue :** parcours Supabase-only, responsive et exploitable sans
requêtes manuelles en base.

### Sprint D — Pilote et préparation production

- GAM-014 — scénarios reproductibles ;
- GAM-015 — pilote fermé ;
- GAM-016 — plan de mise en production progressive.

**Sortie attendue :** décision Go/No-Go documentée. La production reste
inchangée tant que le Go n'est pas donné.

## 7. Définition de « Prête » pour une story

Une story peut entrer en développement lorsque :

- ses décisions métier sont validées ;
- son audience et ses droits sont connus ;
- ses dépendances sont terminées ;
- ses cas d'erreur et états vides sont définis ;
- les données personnelles manipulées sont identifiées ;
- les commandes de validation et le retour arrière sont prévus.

## 8. Définition de « Terminée »

Une story est terminée lorsque :

- les critères d'acceptation passent sur `test.hedsvs.ch` ;
- les tests unitaires, SQL/RLS et E2E concernés passent via Portly ;
- aucun appel Firebase n'est émis par le parcours concerné ;
- aucun secret, jeton ou donnée personnelle n'apparaît dans les logs ;
- les migrations sont append-only et vérifiées ;
- l'interface couvre chargement, erreur et état vide ;
- les contrôles mobile, iPad, clavier et droits ont été exécutés ;
- la documentation d'exploitation et le retour arrière sont à jour ;
- une preuve de validation est attachée au ticket Jira.

## 9. Matrice minimale de validation

| Parcours | Étudiant | Admin | Non connecté | Rejeu | Mobile/iPad |
| --- | --- | --- | --- | --- | --- |
| Connexion quotidienne | récompense plafonnée | aucune récompense tiers | refus | aucun doublon | oui |
| Profil complété | soi uniquement | aucune récompense tiers | refus | aucun doublon | oui |
| Publication | auteur uniquement | selon règle validée | refus | aucun doublon | oui |
| Quête | progression assignée | lecture/support | refus | stable | oui |
| Badge | attribution unique | lecture/support | refus | stable | oui |
| Classement maison | lecture autorisée | lecture | selon choix métier | n/a | oui |
| Administration | refus | rôle habilité | refus | audit stable | oui |

## 10. Jalons de décision

1. **Validation métier des règles** après GAM-001 et GAM-002.
2. **Validation sécurité** après GAM-003 à GAM-005.
3. **Validation fonctionnelle** après GAM-006 à GAM-013.
4. **Go pilote** avant GAM-015.
5. **Go production** uniquement après le rapport du pilote et avant GAM-016.

## 11. Risques à suivre dans Jira

- attribution rétroactive excessive lors d'une première connexion ;
- divergence entre XP utilisateur et points de maison ;
- mélange du profil consulté avec le compte administrateur connecté ;
- anciennes conditions de badges incompatibles avec les événements actuels ;
- fonction Supabase privilégiée trop largement exécutable ;
- doublons lors de requêtes concurrentes ou rejouées ;
- dépendance Firebase réintroduite par un ancien composant ;
- publication d'une quête incomplète ou destinée à la mauvaise audience ;
- confusion entre données de test copiées et activité réelle de production.

## 12. Premier ordre de travail concret

1. Valider GAM-001 et GAM-002 avec les valeurs XP et plafonds.
2. Implémenter GAM-003, puis prouver l'idempotence et les permissions.
3. Fermer GAM-004 et GAM-005 avant d'ajouter de nouvelles récompenses.
4. Construire une seule quête pilote via GAM-006 à GAM-008.
5. Nettoyer les données et Firebase avec GAM-009 et GAM-010.
6. Finaliser l'expérience et l'administration avec GAM-011 à GAM-013.
7. Exécuter GAM-014 et GAM-015 sur test.
8. Préparer GAM-016, sans l'exécuter avant le Go explicite.
