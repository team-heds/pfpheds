---
title: Cartographie des routes backend
---

## Objectif

Avoir une lecture rapide de ce que sert le backend Express et ou se trouve chaque route.

## Point d'entree

- declaration globale: `backend/index.js`

## Routes montees

| Prefixe | Fichier principal | Domaine |
| --- | --- | --- |
| `/api/institutions` | `backend/supabase/institutionsStoreBackend.js` | institutions |
| `/api/communities` | `backend/supabase/communitiesStoreBackend.js` | communautes |
| `/api/enseignants` | `backend/supabase/enseignantsStoreBackend.js` | enseignants |
| `/api/filePhysio` | `backend/supabase/filePhysioBackendStore.js` | fichiers physio |
| `/api/hashtags` | `backend/supabase/hashtagStoreBackend.js` | hashtags |
| `/api/posts` | `backend/supabase/postsBackendStore.js` | social |
| `/api/praticiens` | `backend/supabase/praticiensStoreBackend.js` | praticiens |
| `/api/resultat-votation` | `backend/supabase/resultatVotationStoreBackend.js` | votation |
| `/api/feedbacka` | `backend/supabase/feedbackaBackend.js` | feedbacka |
| `/api/push` | `backend/supabase/pushBackend.js` | push |
| `/api/ftp` | `backend/uploads/ftpRoutes.js` | FTP |
| `/api/chat` | `backend/supabase/careconversStoreBackend.js` | chat stateful |

## Routes techniques directes

| Route | Usage |
| --- | --- |
| `/health` | healthcheck |
| `/api/ping` | test simple |
| `/api/ftp/diagnostic` | verification config FTP |
| `/api/chapters` | test Supabase / exemple technique |

## Exemple concret: `postsBackendStore.js`

Cette route expose un CRUD posts simplifie:

- `POST /api/posts/`
- `GET /api/posts/`
- `PUT /api/posts/:id`
- `DELETE /api/posts/:id`

Particularites:

- creation via RPC `create_post_with_hashtags`
- enrichissement avec `author:user_profiles`, hashtags, likes, replies
- la suppression s'appuie sur les permissions de la base

## Ce qu'il faut verifier avant de modifier une route backend

1. le frontend consomme-t-il directement cette route ?
2. existe-t-il déjà un service front ou un store qui dépend de sa forme de réponse ?
3. une RPC ou une policy RLS est-elle impliquee ?
4. la route utilise-t-elle un client standard ou un client admin ?

## Clients Supabase cote backend

Le backend dispose de deux modes dans `backend/supabaseClient.js`:

- client normal, avec RLS
- client admin si `SUPABASE_SERVICE_ROLE_KEY` est disponible

Implication:

- certaines operations peuvent contourner RLS
- il faut documenter explicitement les cas ou ce bypass est assume

## Dette visible

Le dossier `backend/supabase/` contient aussi des copies, scripts d'import et fichiers non finalises. Ils ne doivent pas etre confondus avec les routes actives.
