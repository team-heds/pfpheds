---
title: Traçabilité détaillée de la formation pratique
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">PFP détaillée</div>
    <h2 class="docs-section-head__title">Relier les écrans PFP aux stores, services, endpoints et tables</h2>
  </div>
  <p class="docs-section-head__text">
    Cette page sert de carte de reprise détaillée pour le domaine le plus dense du projet.
  </p>
</div>

## Principe

La formation pratique ne se comprend pas écran par écran. Il faut relier :

- les vues ;
- les stores ;
- les services ;
- le backend ;
- les tables Supabase ;
- les scripts ou migrations qui préparent parfois la donnée.

## Matrice ciblée PFP

| Fonction | Vue / zone | Store / service | Backend / RPC | Tables / données |
| --- | --- | --- | --- | --- |
| Gestion des places | `admin/pfp/ManagementPlaces*`, `PlacesViewPHYFP` | `placesStore` + services PFP | parfois direct Supabase | `places` |
| Institutions PFP | `InstitutionsViewPHYFP`, vues secrétariat | services métier | direct Supabase | `institutions`, `places` |
| Praticiens formateurs | `PraticiensFormateurViewPHYFP` | `praticiensStore`, `praticiensFormateursStore` | `/api/praticiens` ou direct selon écran | `praticiens_formateurs`, `places` |
| Résultats de votation | `VotationGenericView`, previews, résultats | `resultatVotationService` | `/api/resultat-votation/*` | `student_result_vote` |
| Vote étudiant | vues de votation | `votesBackendService` | RPC Supabase | votes / agrégats |
| Cohortes et étudiants | `EtudiantsViewPHYFP`, secrétariat | `studentsService` | direct Supabase | `StudentsPhysio`, `user_profiles` |
| Cas particuliers | `SuiviCasParticuliers.vue` | logique vue + données directes | direct Supabase | `suivi_cas_particuliers`, `student_result_vote` |
| Alertes PFP | `AlertesDashboard.vue` | `pfpAlertsService`, `intelligentAlertsService` | mixte | `StudentsPhysio`, `student_result_vote`, suivi cas |

## Tables les plus sensibles

Les tables qui reviennent le plus dans le domaine sont :

- `StudentsPhysio`
- `places`
- `institutions`
- `praticiens_formateurs`
- `student_result_vote`
- `votation_sessions`
- `suivi_cas_particuliers`
- `recap_cpt_evaluation`
- `user_profiles`

## Vues PFP très critiques

En reprise technique, surveiller particulièrement :

- `src/views/admin/pfp/PlacesAssignedView.vue`
- `src/views/admin/pfp/ManagementVotationPrioritaireView.vue`
- `src/views/admin/pfp/ManagementOffreView.vue`
- `src/views/admin/votations/VotationGenericView.vue`
- `src/views/admin/formation-pratique/secretariat/VueDEnsembleFP.vue`
- `src/views/admin/formation-pratique/secretariat/VerificationCriteresEtudiants.vue`

## Lecture recommandée d'un écran PFP

Pour un écran PFP important :

1. identifier le route module (`pfp.js` ou `votations.js`) ;
2. identifier la vue ;
3. relever les appels Supabase directs ;
4. relever les services appelés ;
5. relever les endpoints `/api/resultat-votation` si présents ;
6. vérifier les tables manipulées ;
7. vérifier la permission `page1.access` ou équivalent.

## Signal d'architecture à retenir

La PFP est un domaine hybride :

- une partie passe par services backend ;
- une partie lit directement Supabase ;
- une partie dépend de conventions legacy et de données historiques ;
- une partie du métier est encodée dans les notes, flags et structures JSON.

## Réflexe avant modification

Avant de changer un flux PFP :

- identifier l'impact sur `student_result_vote` ;
- vérifier si `votation_sessions` stocke des propositions liées ;
- vérifier si la vue dépend d'un résultat déjà publié ;
- vérifier si les places déjà validées doivent être exclues ;
- vérifier si des critères manquants ou cas particuliers entrent dans le calcul.
