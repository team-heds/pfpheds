---
title: Backend actif versus fichiers legacy
---

## Pourquoi cette page

Le dossier `backend/` contient a la fois:

- des routes actives
- des scripts d'import
- des fichiers de test
- des copies
- des fichiers provisoires

Sans distinction claire, il est facile de modifier le mauvais fichier.

## Fichiers backend actifs en production applicative

### Serveur et configuration

- `backend/index.js`
- `backend/supabaseClient.js`

### Routes montees

- `backend/supabase/careconversStoreBackend.js`
- `backend/supabase/communitiesStoreBackend.js`
- `backend/supabase/enseignantsStoreBackend.js`
- `backend/supabase/feedbackaBackend.js`
- `backend/supabase/filePhysioBackendStore.js`
- `backend/supabase/hashtagStoreBackend.js`
- `backend/supabase/institutionsStoreBackend.js`
- `backend/supabase/postsBackendStore.js`
- `backend/supabase/praticiensStoreBackend.js`
- `backend/supabase/pushBackend.js`
- `backend/supabase/resultatVotationStoreBackend.js`
- `backend/uploads/ftpRoutes.js`

### Worker actif potentiel

- `backend/workers/pushOutboxWorker.js`

## Fichiers non prioritairement applicatifs

### Imports / seeds / migration

- `importUsers.js`
- `importPosts.js`
- `importPlaces.js`
- `importInstitutions.js`
- `importEnseignants.js`
- `importCommunities.js`
- `importPraticiensFormateurs.js`
- `exportPlacesFromFirebase.js`
- scripts `seed_*`, `restore-*`, `migrate-*`

### Tests et diagnostics

- `test-algo-v4.js`
- `test-algo-v4-sim.js`
- `parse-votes.js`
- `export-pfp4-criteres.js`

### Fichiers a traiter comme dette

- `careconversStoreBackend copy.js`
- `careconversStoreBackend copy 2.js`
- `Untitled-1.js`
- `todo`

## Regle de travail

Quand tu modifies `backend/`:

1. commencer par verifier si le fichier est effectivement monte dans `backend/index.js`
2. ignorer les copies sauf si elles servent explicitement de référence historique
3. considerer les fichiers d'import comme outillage, pas comme logique applicative vivante

## Recommandation

A terme, il faudrait isoler:

- `backend/routes/`
- `backend/scripts/`
- `backend/legacy/`

Aujourd'hui ce n'est pas le cas, donc la lecture de `backend/index.js` reste la source de vérité.
