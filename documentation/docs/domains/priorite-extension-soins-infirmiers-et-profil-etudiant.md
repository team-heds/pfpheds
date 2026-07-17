---
title: "PRIORITÉ — Extension Soins Infirmiers + nouveaux champs profil étudiant"
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Spécification de développement prioritaire</div>
    <h2 class="docs-section-head__title">Dupliquer le système Formation Pratique pour les Soins Infirmiers + enrichir le profil étudiant</h2>
  </div>
  <p class="docs-section-head__text">
    Page dédiée à un chantier de développement demandé explicitement pour la reprise du projet. Deux besoins distincts mais liés : (1) répliquer tout le dispositif de stage de la Physiothérapie pour la filière Soins Infirmiers, (2) ajouter deux informations au profil étudiant qui doivent influencer l'attribution des stages.
  </p>
</div>

## Besoin 1 — Répliquer le système de stage (Formation Pratique) pour Soins Infirmiers

### Contexte

Le dispositif complet décrit dans `domains/formation-pratique-fonctionnel.md` (référentiel institutions/places, campagnes d'offres, votation étudiante, attribution algorithmique, validation, suivi) **n'existe aujourd'hui que pour la filière Physiothérapie**. La filière Soins Infirmiers dispose d'un système de **planning de cours** (`domains/planning-soins.md` — années académiques, modules, cours, semestriers) mais **aucun équivalent du système de stage PFP** : pas de référentiel de places de stage, pas de campagne de votation, pas d'algorithme d'attribution, pas de suivi de validation.

**Vérifié dans le code (2026-07-17)** : aucune table `StudentsSI`/équivalent de `StudentsPhysio`, aucun mécanisme de votation ou d'attribution pour Soins Infirmiers n'a été trouvé dans le dépôt. C'est un vrai vide fonctionnel, pas une variante existante à ajuster.

### Ce qu'il faut reprendre du modèle Physio (référence complète)

| Brique Physio existante | Rôle | Doc technique de référence |
| --- | --- | --- |
| `institutions` + `places` | Référentiel des lieux de stage et de leurs places | `data/schema-supabase.md` |
| `StudentsPhysio` | Profil étudiant + suivi des stages validés | `data/schema-supabase.md` |
| `votation_sessions` | Campagnes de votation, y compris votation prioritaire | `data/schema-supabase.md` |
| `student_result_vote` | Résultats d'attribution | `data/schema-supabase.md` |
| Algorithme d'attribution (`resultatVotationStoreBackend.js`) | Logique de tri par priorité + couverture des critères manquants | `domains/votation-algorithm.md` |
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

### Où toucher concrètement (pour cadrer un devis/estimation)

| Zone | Fichiers/tables concernés (Physio, à dupliquer pour SI) |
| --- | --- |
| Schéma | `user_profiles` ou `StudentsPhysio` (nouveaux champs), `places` (champ `necessite_permis`) |
| UI profil étudiant | `src/components/user/library/CardNameProfile.vue`, `src/components/user/details/ProfileInfo.vue` |
| UI gestion des places (admin) | Écrans `admin/formation-pratique/places` (voir `domains/formation-pratique-traceability.md`) |
| Algorithme d'attribution | `backend/supabase/resultatVotationStoreBackend.js` (voir `domains/votation-algorithm.md`, étapes 1 et 3) |

## Priorité et séquencement recommandé

1. **D'abord** : les deux champs de profil (permis + lieu de travail) sur la filière Physio existante — impact limité, algorithme déjà en place à adapter, valeur immédiate pour les campagnes de votation en cours.
2. **Ensuite** : trancher la question de conception (schéma partagé multi-filière vs duplication) avec l'équipe technique, **avant** de commencer le développement Soins Infirmiers — ce choix conditionne tout le reste du chantier et est coûteux à changer après coup.
3. **Enfin** : construire le dispositif Soins Infirmiers complet (référentiel, campagnes, votation, algorithme adapté aux critères SI, écrans admin), en réutilisant au maximum les permissions déjà prévues (`AdminSoins`, `EnseignantSoins`, `RMSoins`, `EtudiantSoins`) et l'infrastructure `tracks`/`user_track_roles` déjà posée.

## Questions à clarifier avec l'équipe métier avant de chiffrer ce chantier

- Quelle est la structure réelle des stages Soins Infirmiers (combien d'étapes, quel nommage) ?
- Quels sont les critères de spécialité pertinents pour les places de stage Soins Infirmiers (équivalent de `MSQ`/`SYSINT`/etc. pour Physio) ?
- Le champ "lieu de travail" doit-il être limité aux institutions déjà partenaires, ou doit-il accepter n'importe quel employeur (y compris hors référentiel) ?
- L'exclusion "pas de stage où l'étudiant travaille" doit-elle être une règle dure (jamais proposée) ou un simple avertissement visible par le secrétariat lors de la validation manuelle ?
