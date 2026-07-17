---
title: "PRIORITÉ — Extension Soins Infirmiers + nouveaux champs profil étudiant"
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">⚠️ Priorité n°1 pour la redéfinition complète de l'application</div>
    <h2 class="docs-section-head__title">Cahier des charges pour la nouvelle application — le module Formation Pratique (Physio + Soins Infirmiers) + profil étudiant</h2>
  </div>
  <p class="docs-section-head__text">
    <strong>Cette page s'adresse à l'entreprise externe qui va redévelopper cette application entièrement à neuf.</strong> Elle ne décrit pas un patch à appliquer sur le code actuel : elle décrit ce que la <strong>nouvelle application</strong> doit couvrir en priorité n°1, en s'appuyant sur ce que fait déjà la version actuelle (à étudier comme référence fonctionnelle, pas comme code à réutiliser tel quel).
  </p>
</div>

## Périmètre exact de la priorité n°1

Tout ce qui a été construit pour la Physiothérapie autour du **stage clinique** doit être repris intégralement dans la nouvelle application, comme socle fonctionnel commun aux deux filières (Physio et Soins Infirmiers) :

1. **Le système de votation** — campagnes, ouverture/fermeture de session, votation standard et votation prioritaire.
2. **La gestion des places de stage et des institutions** — référentiel institutions, référentiel places, critères/spécialités couverts par chaque place, praticiens formateurs rattachés.
3. **L'algorithme d'attribution** — tri par priorité, couverture des critères manquants, conservation de l'existant, gestion des cas fallback.
4. **Le profil étudiant avec ses critères** — historique des stages effectués, critères déjà couverts vs critères manquants par étudiant (ce qui alimente directement l'algorithme), statut de validation par stage.
5. **Toute la préparation de la votation** — campagnes d'offres par institution, suivi de l'envoi des offres, tableaux récapitulatifs, avant même l'ouverture du vote aux étudiants.
6. **Toute l'administration et la gestion PFP** — l'ensemble des écrans admin (Données FP, Gestion FP, Votations, Secrétariat FP) listés en détail ci-dessous.

Le détail complet de chacun de ces 6 points suit dans les sections ci-dessous. Rien de tout cela n'est optionnel ou secondaire — c'est le cœur métier de l'application actuelle, et donc de la nouvelle.

## Inventaire complet de l'existant Physio — la spécification fonctionnelle de référence pour la nouvelle application

**Ce périmètre est le cahier des charges fonctionnel minimal de la nouvelle application web.** Il ne s'agit pas de code à migrer : l'application actuelle sert ici de **spécification vivante** — chaque écran listé ci-dessous décrit un besoin fonctionnel réel, validé par l'usage, que la nouvelle application doit couvrir dès sa conception (y compris pour Soins Infirmiers, qui doit être pensé et développé nativement dans la nouvelle application, pas comme un module ajouté après coup). Liste établie à partir du menu admin réel (`src/config/adminMenu.js`) et des routes réellement déclarées (`src/router/routes/`) de l'application actuelle, pas d'une supposition.

### Écrans admin déjà construits et fonctionnels (Physiothérapie)

**Dashboard**
- Dashboard PFP (vue de synthèse globale de la filière)

**Données de référence (Données FP)**
- Gestion des étudiants
- Gestion des institutions partenaires
- Gestion des enseignants Physio
- Gestion des praticiens formateurs
- Gestion des places de stage

**Gestion administrative (Gestion FP)**
- Profil répondant (l'enseignant référent gère son propre profil)
- Management des signatures de convention

**Votations et attribution**
- Gestion des offres (saisie des places offertes par institution/année)
- Votation lésé (votation prioritaire pour cas particuliers)
- Votation PFP (votation standard par cohorte/stage)
- Places assignées (résultat de l'attribution)
- Validation des places
- Validation PFP (validation finale du stage)

**Secrétariat FP (supervision et suivi)**
- Vue d'ensemble FP (tableau de bord consolidé)
- Vérification des critères étudiants
- Suivi des institutions
- Suivi de l'envoi des offres
- Tableau récapitulatif des offres
- Récap notes PFP
- Récap évaluation CPT
- Suivi des cas particuliers
- Centre d'alertes

### Écrans et flux complémentaires (hors menu admin principal, mais actifs dans les routes)

- Historique des stages PFP de l'étudiant (`/historique_pfp`)
- Documents PFP (`/documents_pfp`)
- Consultation d'une institution en détail, y compris vue publique (`/institution/:id`, `/institution_details/:id`)
- Formulaires de création/modification d'institution (`/institution_form`, `/institution_form_modif/:id`)
- Affectation de stage étudiant (deux variantes trouvées : générale et "BA24" — probablement une version par cohorte/promotion, à clarifier lequel est le flux actif)
- Circuit de validation/réception de documents (`/validation`, `/reception`)
- Statistiques de places PFP (`/stats_place_pfp`)
- Répartition de stage BA2 (`/stage_repartition`)

**Point de vigilance pour l'analyse fonctionnelle** : plusieurs routes de l'application actuelle semblent être des variantes historiques d'un même besoin (ex. `ManagementPFPEnCours`, `ManagementPlacesSafe`, `VotationPreview`, `VotationManagementView` à côté des écrans listés dans le menu admin actuel). Avant de spécifier ces écrans pour la nouvelle application, **déterminer avec l'équipe métier lesquelles de ces routes correspondent à un vrai besoin actif aujourd'hui versus lesquelles sont des versions abandonnées non nettoyées** — ne pas redévelopper une fonctionnalité morte par simple copie du menu. Méthode de vérification dans `backend/supabase/services.md` et `frontend/route-catalog.md`.

### Ce que fait déjà l'algorithme d'attribution (la logique métier à reproduire, pas le code)

Le moteur d'attribution complet (tri par priorité, couverture des critères manquants, conservation de l'existant, gestion des cas fallback, statistiques) est entièrement fonctionnel pour Physio — voir `domains/votation-algorithm.md`, qui documente précisément **la logique métier** à implémenter dans la nouvelle application. C'est la pièce la plus complexe et la plus mature du système actuel : **la nouvelle application doit reproduire ce comportement métier (pas nécessairement le code), en le concevant dès le départ comme un moteur générique paramétrable par filière**, pour éviter d'avoir à le réécrire une seconde fois quand Soins Infirmiers sera ajouté.

### Ce qui est fonctionnel côté profil étudiant aujourd'hui (dont le suivi de critères, essentiel à l'algorithme)

- Informations personnelles de base, avatar, ville, classe.
- Rattachement à un répondant HES.
- **Compteurs de critères couverts par l'étudiant** : un compteur par spécialité (musculo-squelettique, système intégré, neuro-gériatrie, soins aigus, réhabilitation, ambulatoire) et par langue (français, allemand, italien, anglais), incrémentés au fil des stages effectués. **C'est cette information, par étudiant, que l'algorithme compare aux critères couverts par chaque place pour déterminer les critères manquants et prioriser l'attribution** (voir `domains/votation-algorithm.md`) — sans ce suivi par étudiant, l'algorithme ne peut pas fonctionner. À reproduire à l'identique dans le principe pour Soins Infirmiers, avec les critères de spécialité propres à cette filière (voir Besoin 1 plus bas).
- Historique et statut des stages (validé, échoué, arrêté avec commentaire).
- Suivi des absences par stage.
- Gamification (maison, XP, niveau, quêtes) — fonctionnalité transversale, indépendante de la Formation Pratique elle-même.

C'est sur cette base fonctionnelle que doivent venir se greffer les deux nouveaux champs demandés (permis de conduire, lieu de travail) dès la conception du profil étudiant dans la nouvelle application — voir Besoin 2 plus bas.

## Besoin 1 — Concevoir le module Formation Pratique de la nouvelle application pour les deux filières dès le départ (Physio + Soins Infirmiers)

### Contexte

Le dispositif complet décrit dans `domains/formation-pratique-fonctionnel.md` (référentiel institutions/places, campagnes d'offres, votation étudiante, attribution algorithmique, validation, suivi) **n'existe aujourd'hui que pour la filière Physiothérapie**, dans l'application actuelle. La filière Soins Infirmiers dispose d'un système de **planning de cours** (`domains/planning-soins.md` — années académiques, modules, cours, semestriers) mais **aucun équivalent du système de stage PFP** : pas de référentiel de places de stage, pas de campagne de votation, pas d'algorithme d'attribution, pas de suivi de validation.

**Vérifié dans le code actuel (2026-07-17)** : aucune table `StudentsSI`/équivalent de `StudentsPhysio`, aucun mécanisme de votation ou d'attribution pour Soins Infirmiers n'a été trouvé. C'est un vrai vide fonctionnel — **la nouvelle application doit donc concevoir ce module comme nativement multi-filière dès le premier jour**, plutôt que de recopier l'erreur de conception actuelle (un module pensé uniquement pour Physio, auquel il faudrait "ajouter" Soins Infirmiers après coup).

### Ce que la logique métier Physio actuelle doit inspirer dans la nouvelle application

| Élément fonctionnel existant (Physio, application actuelle) | Rôle | Doc de référence pour la spécification |
| --- | --- | --- |
| Référentiel institutions + places de stage | Lieux de stage et leurs places | `data/schema-supabase.md` |
| Profil étudiant + suivi des stages validés | Suivi individuel du parcours de stage | `data/schema-supabase.md` |
| Campagnes de votation, y compris votation prioritaire | Collecte des vœux étudiants | `data/schema-supabase.md` |
| Résultats d'attribution | Traçabilité de qui a été assigné où | `data/schema-supabase.md` |
| Algorithme d'attribution | Logique de tri par priorité + couverture des critères manquants | `domains/votation-algorithm.md` |
| Écrans admin (Votations, Secrétariat FP, Formation Pratique) | Gestion des offres, votation, validation, suivi | `domains/formation-pratique-fonctionnel.md` |

### Ce qui ne doit PAS être une simple copie

Les critères métier de Physio (`MSQ`, `SYSINT`, `NEUROGER`, `AIGU`, `REHAB`, `AMBU`, langues) sont spécifiques à la physiothérapie. Les Soins Infirmiers ont probablement des critères de spécialité différents (à définir avec l'équipe métier SI — ex. types de service : médecine, chirurgie, pédiatrie, psychiatrie, gériatrie, urgences...). **Ne pas copier les critères tels quels : redéfinir la nomenclature de critères propre aux Soins Infirmiers avant de dupliquer le schéma.**

De même, les stages PFP1A→PFP4 sont une numérotation propre à Physio. La structure des stages Soins Infirmiers (nombre de stages, nommage, durée) doit être confirmée avec l'équipe pédagogique SI avant de calquer une structure à 5 étapes qui ne correspond peut-être pas à leur cursus réel.

### Portée technique estimée

1. **Schéma de données** : nouvelles tables équivalentes à `StudentsPhysio`/`places`/`institutions` (ou extension des tables existantes avec une colonne `track_id` = `'SI'` si on choisit un schéma partagé plutôt que dupliqué — à trancher en conception, voir la remarque ci-dessous).
2. **Algorithme d'attribution** : adapter la logique de tri/couverture des critères aux critères SI définis avec l'équipe métier.
3. **Écrans admin** : dupliquer/généraliser les écrans Votations et Secrétariat FP pour qu'ils fonctionnent sur les deux filières (voir remarque sur `tracks`/`user_track_roles` ci-dessous — l'infrastructure RBAC par filière existe déjà partiellement, voir `auth/overview.md`, "Système B").
4. **Permissions** : le projet a déjà des permissions `AdminSoins`, `EnseignantSoins`, `RMSoins`, `EtudiantSoins` (voir `auth/permission-model.md`) — probablement prévues justement pour cet usage futur, à vérifier et réutiliser plutôt que recréer.

### Recommandation de conception

Le projet a déjà une table `tracks` (`SI`/`PHY`) et un système `user_track_roles` (voir `auth/overview.md`, système B) qui semblent avoir été posés en prévision de ce genre d'extension multi-filière, mais qui ne sont aujourd'hui utilisés que pour une seule policy RLS sur `modules`. **Il est probablement plus sain de généraliser le schéma existant (`places`, `institutions`, `votation_sessions`, `student_result_vote`) avec une colonne `track_id` que de dupliquer entièrement les tables** — à trancher en conception technique avant de coder, car ça détermine si l'algorithme d'attribution est un seul moteur générique (paramétré par filière) ou deux moteurs séparés.

## Besoin 2 — Deux nouveaux champs sur le profil étudiant

Ces deux champs concernent **les deux filières** (Physio et Soins Infirmiers), puisqu'ils influencent directement l'attribution des stages.

### 2.1 — Permis de conduire

**Besoin exprimé** : savoir si un étudiant possède le permis de conduire.

**Pourquoi** : certaines places de stage sont difficiles ou impossibles d'accès en transports en commun — connaître cette information permet de ne proposer/attribuer ces places qu'aux étudiants qui peuvent s'y rendre en voiture.

**Ce qu'il faut ajouter** :
- Un champ booléen `a_permis_conduire` (ou équivalent) sur le profil étudiant (`user_profiles` et/ou `StudentsPhysio`/équivalent SI).
- Un champ correspondant côté **place** de stage : `necessite_permis` (ou équivalent) pour marquer les places difficiles d'accès sans véhicule.
- **Impact algorithme** : l'algorithme d'attribution (`domains/votation-algorithm.md`) doit exclure — ou au minimum déprioriser fortement — une place marquée `necessite_permis: true` pour un étudiant sans permis, de la même manière qu'il gère déjà les critères de langue/spécialité manquants.
- **Impact UI** : ajouter la case à cocher dans l'écran de profil étudiant, et un champ équivalent dans le formulaire de gestion des places (admin).

### 2.2 — Lieu de travail (pour éviter les conflits d'affectation)

**Besoin exprimé** : permettre à un étudiant de renseigner son lieu de travail actuel (s'il travaille à côté de l'école, en parallèle des études), pour **ne jamais lui attribuer un stage dans cette même institution**.

**Pourquoi** : éviter un conflit — un étudiant ne doit pas faire son stage clinique dans l'institution où il est déjà employé (problème de mélange des rôles, d'objectivité de l'évaluation, ou simplement de non-sens pédagogique à refaire ce qu'il connaît déjà en tant qu'employé).

**Ce qu'il faut ajouter** :
- Un champ sur le profil étudiant permettant de renseigner un ou plusieurs lieux de travail. Recommandation : **lier ce champ au référentiel `institutions` existant** (sélection dans une liste, pas un champ texte libre) pour que l'exclusion algorithmique soit fiable — un champ texte libre ("je travaille à l'Hôpital de X") ne peut pas être comparé automatiquement à l'`InstitutionId` d'une place sans traitement de texte fragile. Si l'étudiant travaille dans un lieu qui n'est pas encore une institution partenaire référencée, prévoir une option "autre" en texte libre à traiter manuellement par le secrétariat plutôt que par l'algorithme.
- **Impact algorithme** : lors de la construction des places candidates pour un étudiant (`domains/votation-algorithm.md`, étape 3), **exclure systématiquement toute place appartenant à une institution où l'étudiant a déclaré travailler** — cette règle doit être une exclusion dure (comme les places déjà réalisées), pas juste une dépriorisation.
- **Impact UI** : ajouter un sélecteur d'institution(s) dans l'écran de profil étudiant, avec la possibilité d'en ajouter plusieurs si l'étudiant a plusieurs employeurs.

### Où c'est implémenté dans l'application actuelle (référence pour dimensionner l'équivalent dans la nouvelle application)

Ces pointeurs servent à **estimer la complexité et comprendre le comportement attendu** en étudiant l'existant — pas à éditer ces fichiers, qui appartiennent à l'application actuelle et ne seront pas repris tels quels.

| Zone fonctionnelle | Référence dans l'application actuelle (Physio) |
| --- | --- |
| Schéma de données | `user_profiles` / `StudentsPhysio` (profil étudiant), `places` (places de stage) |
| UI profil étudiant | `src/components/user/library/CardNameProfile.vue`, `src/components/user/details/ProfileInfo.vue` |
| UI gestion des places (admin) | Écrans `admin/formation-pratique/places` (voir `domains/formation-pratique-traceability.md`) |
| Algorithme d'attribution | `backend/supabase/resultatVotationStoreBackend.js` (voir `domains/votation-algorithm.md`, étapes 1 et 3) |

## Priorité et séquencement recommandé pour la nouvelle application

1. **D'abord** : concevoir le profil étudiant de la nouvelle application avec les deux nouveaux champs (permis + lieu de travail) et le module Formation Pratique nativement multi-filière (Physio + Soins Infirmiers) dès le schéma de données initial — ne pas construire "Physio d'abord, Soins Infirmiers ensuite" comme l'application actuelle l'a fait.
2. **Ensuite** : spécifier avec l'équipe métier les critères de spécialité et la structure des stages Soins Infirmiers (voir questions ouvertes ci-dessous) — ce choix conditionne le schéma et l'algorithme, à trancher avant le développement, pas pendant.
3. **Enfin** : développer le moteur d'attribution comme un moteur générique paramétrable par filière dès la première version, en s'appuyant sur la logique métier Physio déjà éprouvée (`domains/votation-algorithm.md`) comme spécification de comportement.

## Questions à clarifier avec l'équipe métier avant de chiffrer ce chantier

- Quelle est la structure réelle des stages Soins Infirmiers (combien d'étapes, quel nommage) ?
- Quels sont les critères de spécialité pertinents pour les places de stage Soins Infirmiers (équivalent de `MSQ`/`SYSINT`/etc. pour Physio) ?
- Le champ "lieu de travail" doit-il être limité aux institutions déjà partenaires, ou doit-il accepter n'importe quel employeur (y compris hors référentiel) ?
- L'exclusion "pas de stage où l'étudiant travaille" doit-elle être une règle dure (jamais proposée) ou un simple avertissement visible par le secrétariat lors de la validation manuelle ?
