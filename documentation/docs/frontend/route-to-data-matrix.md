---
title: Matrice route → vue → données
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Traçabilité navigation</div>
    <h2 class="docs-section-head__title">Relier une URL au code et aux données qu'elle mobilise</h2>
  </div>
  <p class="docs-section-head__text">
    Cette page sert à partir d'une route concrète pour retrouver la vue, la couche logique et la donnée touchée.
  </p>
</div>

## Routes critiques sélectionnées

| Route | Vue | Couche logique principale | Données / API |
| --- | --- | --- | --- |
| `/feed` | `views/social/FeedView.vue` | `postsStore.js` | `/api/posts`, social backend |
| `/communities` | `views/social/CommunitiesView.vue` | vue + Supabase direct | `communities`, `user_communities`, `posts` |
| `/admin/supabase-diagnostic` | `views/admin/SupabaseDiagnosticView.vue` | vue directe | session Supabase, `user_profiles` |
| `/admin/security/rbac` | `views/admin/security/RBACAdminView.vue` | vue + Supabase direct | `roles`, `permissions`, `role_permissions`, `user_roles` |
| `/admin/routes-editor` | `views/home/DynamicRoutesEditorView.vue` | vue + Supabase direct | `dynamic_routes` |
| `/management_votation_prioritaire` | `views/admin/pfp/ManagementVotationPrioritaireView.vue` | vue PFP + logique directe | `StudentsPhysio`, `student_result_vote`, `places` |
| `/places_asssigned` | `views/admin/pfp/PlacesAssignedView.vue` | vue PFP + services | `places`, `praticiens_formateurs`, `student_result_vote` |
| `/votation/:pfpType` | `views/admin/votations/VotationGenericView.vue` | `resultatVotationService.js` | `/api/resultat-votation/*`, RPC, `student_result_vote` |
| `/admin/formation-pratique/secretariat/vue-ensemble` | `VueDEnsembleFP.vue` | vue PFP dense | `StudentsPhysio`, `student_result_vote`, `places`, `institutions`, `praticiens_formateurs`, `votation_sessions` |
| `/admin/tools/feedbacka/*` | vues Feedbacka | `feedbackaStore.js` | `/api/feedbacka/*` |
| `/tools/ftp-upload` | `FTPUploadTestView.vue` | vue + axios | `/api/ftp/upload`, `/api/ftp/diagnostic` |

## Lecture par familles de routes

### Routes sociales

- proviennent de `social.js`
- s'appuient sur le store posts ou des lectures Supabase directes
- touchent `posts`, `communities`, `user_communities`, hashtags

### Routes admin sécurité

- proviennent de `admin.js`
- pilotent la sécurité applicative
- touchent surtout les tables RBAC et `user_profiles`

### Routes PFP historiques

- proviennent de `pfp.js`
- utilisent fortement `page1.access`
- peuvent mélanger backend, Supabase direct et conventions legacy

### Routes votations

- proviennent de `votations.js`
- s'appuient sur `resultatVotationService.js`
- finissent souvent dans `student_result_vote` ou dans des RPC dédiées

### Routes outils / apps

- proviennent de `apps.js`
- couvrent un spectre plus large ;
- certaines sont simples, d'autres dépendent du backend ou de services externes.

## Réflexe de diagnostic

Quand une URL pose problème :

1. retrouver son module de route ;
2. ouvrir la vue ;
3. chercher le store/service utilisé ;
4. identifier si l'appel est direct Supabase ou `/api/*` ;
5. vérifier la table, la RPC ou le backend cible.
