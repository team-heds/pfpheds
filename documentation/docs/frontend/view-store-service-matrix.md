---
title: Matrice vue → store → service → backend → données
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Traçabilité</div>
    <h2 class="docs-section-head__title">Retrouver rapidement toute la chaîne d'une fonctionnalité</h2>
  </div>
  <p class="docs-section-head__text">
    Cette matrice sert à comprendre où se situe la logique réelle : vue, store, service, endpoint, table ou RPC.
  </p>
</div>

## Règle de lecture

Pour une fonctionnalité donnée :

1. commencer par la vue ;
2. repérer le store ou le service appelé ;
3. vérifier si l'appel part vers Supabase direct ou `/api/*` ;
4. identifier enfin la table, la RPC ou le module backend concerné.

## Matrice synthétique

| Domaine / écran | Vue principale | Store / service | Backend / API | Données principales |
| --- | --- | --- | --- | --- |
| Feed social | `views/social/FeedView.vue` | `postsStore.js` | `/api/posts` | `posts`, hashtags, médias liés |
| Communautés | `views/social/CommunitiesView.vue` | accès Supabase direct + backend social | parfois `/api/communities`, parfois direct | `communities`, `user_communities`, `posts` |
| Feedbacka étudiant | `views/pages/FeedbackaStudentView.vue` | `feedbackaStore.js` | `/api/feedbacka/*` | objets Feedbacka, soumissions |
| Votation PFP | `views/admin/votations/VotationGenericView.vue` | `resultatVotationService.js`, `votesBackendService.js` | `/api/resultat-votation/*` + RPC | `student_result_vote`, RPC de vote |
| Places assignées | `views/admin/pfp/PlacesAssignedView.vue` | logique vue + services PFP | lecture directe Supabase + flux backend votation | `places`, `praticiens_formateurs`, `student_result_vote` |
| Institutions PFP | `views/admin/formation-pratique/InstitutionsViewPHYFP.vue` | vues + services métier | Supabase direct | `institutions`, `places` |
| Médias institution | vues institution/admin | `institutionMediaService.js` | `/api/institutions/:id/images` | bucket storage institutions |
| RBAC admin | `views/admin/security/RBACAdminView.vue` | accès direct Supabase | pas de backend dédié | `permissions`, `roles`, `role_permissions`, `user_roles` |
| Routes dynamiques | `views/home/DynamicRoutesEditorView.vue` | vue + Supabase direct | pas de backend dédié | `dynamic_routes` |
| Diagnostic Supabase | `views/admin/SupabaseDiagnosticView.vue` | vue | Supabase direct | session, `user_profiles`, requêtes test |

## Flux 1 — Social

Chaîne principale observée :

```text
FeedView / composants sociaux
→ postsStore.js
→ axios vers /api/posts
→ backend/supabase/postsBackendStore.js
→ Supabase (posts, post_media, hashtags, RPC create_post_with_hashtags)
```

Points importants :

- le social n'est pas purement frontend ;
- le backend sert d'orchestrateur pour certains flux d'écriture ;
- certaines vues communautés lisent aussi directement Supabase.

## Flux 2 — Feedbacka

Chaîne principale observée :

```text
FeedbackaStudentView / outils admin Feedbacka
→ feedbackaStore.js
→ /api/feedbacka
→ backend/supabase/feedbackaBackend.js
→ stockage backend / logique d'évaluation
```

Points importants :

- store orienté API HTTP ;
- endpoints séparés pour test, submit et submissions ;
- domaine plus “outil métier” que simple CRUD.

## Flux 3 — Votation et résultats PFP

Chaîne principale observée :

```text
VotationGenericView / vues PFP
→ resultatVotationService.js
→ /api/resultat-votation/*
→ backend/supabase/resultatVotationStoreBackend.js
→ tables résultats + RPC get_algorithm_results / get_student_result
```

Tables / mécanismes observés :

- `student_result_vote`
- `vote_place_aggregation`
- RPC `get_student_result`
- RPC et logique d'algorithme côté backend

Point important :

- ce domaine alterne entre appels backend et lectures Supabase directes ;
- il faut distinguer lecture simple, simulation, génération de propositions et confirmation.

## Flux 4 — Institutions et médias

Chaîne observée :

```text
Vue institution / admin institution
→ institutionMediaService.js
→ /api/institutions/:id/images
→ backend institutionsStoreBackend
→ Supabase Storage bucket institutions
```

Point important :

- upload/suppression passent par backend ;
- les URLs images sont ensuite réinterprétées en chemin storage.

## Flux 5 — Sécurité et rôles

Chaîne observée :

```text
RBACAdminView / ManageUserRoles / router
→ roleStore + vues admin sécurité
→ Supabase direct
→ permissions / roles / role_permissions / user_roles
→ RPC update_user_permissions, get_user_permissions
```

Point important :

- une partie de la sécurité vit en lecture/écriture directe base ;
- le router et `roleStore` dépendent ensuite de ce socle.

## Réflexe de maintenance

Si une fonctionnalité casse :

- vérifier d'abord si elle est backend-driven ou Supabase-direct ;
- vérifier si la logique est dans la vue, le store ou un service ;
- vérifier si la permission échoue avant même l'appel ;
- vérifier enfin si la donnée source a changé.
