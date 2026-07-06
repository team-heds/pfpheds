---
title: Traçabilité frontend ↔ backend ↔ données
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Chaînes techniques</div>
    <h2 class="docs-section-head__title">Comment les appels front arrivent réellement au backend et à la base</h2>
  </div>
  <p class="docs-section-head__text">
    Cette page documente les flux les plus importants observés entre stores/services frontend, endpoints backend et données.
  </p>
</div>

## Flux social

### Front

- `src/stores/postsStore.js`

### Appels

- `GET /api/posts`
- `POST /api/posts`
- `PUT /api/posts/:postId`
- `DELETE /api/posts/:postId`

### Backend

- `backend/supabase/postsBackendStore.js`

### Données associées

- `posts`
- `post_media`
- hashtags
- RPC `create_post_with_hashtags`

## Flux Feedbacka

### Front

- `src/stores/feedbackaStore.js`

### Appels

- `GET /api/feedbacka`
- `GET /api/feedbacka/:id`
- `POST /api/feedbacka`
- `PUT /api/feedbacka/:id`
- `POST /api/feedbacka/:id/test`
- `POST /api/feedbacka/:id/submit`
- `GET /api/feedbacka/:id/submissions`

### Backend

- `backend/supabase/feedbackaBackend.js`

## Flux résultats de votation

### Front

- `src/service/resultatVotationService.js`

### Appels backend observés

- `POST /api/resultat-votation/run-algorithm`
- `POST /api/resultat-votation/confirm-algorithm`
- `GET /api/resultat-votation/assignment-counts/:pfpType/:year`
- `GET /api/resultat-votation/pfp3-proposals/:year`
- `POST /api/resultat-votation/save-pfp3-proposals`
- `POST /api/resultat-votation/generate-pfp4-proposals`
- `POST /api/resultat-votation/save-pfp4-proposals`
- `GET /api/resultat-votation/pfp4-proposals/:year`
- `GET /api/resultat-votation/results/:pfpType/:year`
- `GET /api/resultat-votation/student/:userId/:pfpType/:year`
- `GET /api/resultat-votation/statistics/:pfpType/:year`
- `PUT /api/resultat-votation/status/:resultId`
- `DELETE /api/resultat-votation/:resultId`
- `DELETE /api/resultat-votation/algorithm-run/:algorithmRunId`

### Backend

- `backend/supabase/resultatVotationStoreBackend.js`

### Données associées

- `student_result_vote`
- `vote_place_aggregation`
- RPC `get_algorithm_results`
- RPC `get_student_result`

## Flux institutions / médias

### Front

- `src/service/institutionMediaService.js`

### Appels

- `POST /api/institutions/:institutionId/images`
- `DELETE /api/institutions/:institutionId/images`

### Backend

- `backend/supabase/institutionsStoreBackend.js`

### Données associées

- table `institutions`
- bucket storage `institutions`

## Flux FTP

### Front

- `src/views/apps/tools/FTPUploadTestView.vue`

### Appels

- `POST /api/ftp/upload`
- `GET /api/ftp/diagnostic`

### Backend

- `backend/uploads/ftpRoutes.js`

## Flux rôles et permissions

### Front

- `src/stores/role.js`
- `src/views/admin/users/ManageUserRoles.vue`
- `src/views/admin/security/RBACAdminView.vue`

### Accès observés

- RPC `api_my_permissions`
- RPC `update_user_permissions`
- RPC `get_user_permissions`
- lecture/écriture directe :
  - `permissions`
  - `roles`
  - `role_permissions`
  - `user_roles`
  - `user_profiles`

## Principe de diagnostic

Quand un flux casse, identifier :

1. le point d'entrée frontend ;
2. le store ou service appelant ;
3. l'endpoint ou la table réellement utilisée ;
4. le fichier backend qui porte la logique ;
5. la table ou la RPC finale.
