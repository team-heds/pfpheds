---
title: Backend Node et API serveur
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Côté serveur</div>
    <h2 class="docs-section-head__title">Quand le backend devient la vraie couche applicative</h2>
  </div>
  <p class="docs-section-head__text">
    Le backend ne sert pas seulement d'appoint : certains flux sensibles ou multi-étapes passent réellement par lui.
  </p>
</div>

<div class="docs-grid docs-grid--featured">
  <div class="docs-card docs-card--featured"><span class="docs-card__tag">API</span><span class="docs-card__icon">◫</span><h3>Routes serveur</h3><p>Exposition d'endpoints métier et d'intégrations externes.</p></div>
  <div class="docs-card docs-card--featured"><span class="docs-card__tag">SEC</span><span class="docs-card__icon">●</span><h3>Secrets & flux sensibles</h3><p>Cas où le navigateur ne doit pas porter seul la logique.</p></div>
  <div class="docs-card docs-card--featured"><span class="docs-card__tag">OPS</span><span class="docs-card__icon">▣</span><h3>Workers & scripts</h3><p>Imports, push, seed et automatisations techniques.</p></div>
</div>

## Rôle du backend

Le serveur Node/Express dans `backend/` n'est pas accessoire. Il sert de couche applicative pour plusieurs besoins qui ne vivent pas proprement dans le frontend :

- routes API métier
- intégrations externes
- uploads FTP
- push
- certains flux reliés à Supabase

## Point d'entrée

- fichier principal : `backend/index.js`
- package dédié : `backend/package.json`

## Architecture visible

```text
backend/
|-- index.js
|-- supabase/
|   |-- institutionsStoreBackend.js
|   |-- praticiensStoreBackend.js
|   |-- postsBackendStore.js
|   |-- communitiesStoreBackend.js
|   |-- feedbackaBackend.js
|   `-- ...
|-- uploads/
|   `-- ftpRoutes.js
|-- workers/
|   `-- pushOutboxWorker.js
`-- scripts divers d'import, seed, migration et diagnostic
```

## Endpoints déclarés dans `backend/index.js`

Le serveur monte notamment :

- `/api/institutions`
- `/api/communities`
- `/api/enseignants`
- `/api/filePhysio`
- `/api/hashtags`
- `/api/posts`
- `/api/praticiens`
- `/api/resultat-votation`
- `/api/feedbacka`
- `/api/push`
- `/api/ftp`
- `/api/chat`

Et fournit aussi :

- `/api/ping`
- `/health`

## Quand passer par le backend plutôt que par le frontend

Utiliser le backend si :

- la logique a besoin de secrets serveur
- il faut contacter un service externe non exposé au navigateur
- le flux métier doit être centralisé côté serveur
- il faut encapsuler des opérations sensibles ou multi-étapes

Ne pas l'utiliser juste pour contourner un problème de modélisation front ou de policy RLS.

## Fichiers à auditer en priorité

- `backend/index.js`
- `backend/supabaseClient.js`
- `backend/uploads/ftpRoutes.js`
- `backend/workers/pushOutboxWorker.js`
