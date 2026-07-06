---
title: Catalogue détaillé des endpoints backend
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">API serveur</div>
    <h2 class="docs-section-head__title">Ce que le backend expose réellement</h2>
  </div>
  <p class="docs-section-head__text">
    Cette page complète la cartographie des routes backend avec une lecture plus orientée exploitation et reprise.
  </p>
</div>

## Point d'entrée serveur

Le montage des endpoints est fait dans `backend/index.js`.

## Endpoints métier montés

| Endpoint | Source montée | Usage |
| --- | --- | --- |
| `/api/institutions` | `institutionsStoreBackend` | institutions |
| `/api/communities` | `communitiesStoreBackend` | communautés |
| `/api/enseignants` | `enseignantsStoreBackend` | enseignants |
| `/api/filePhysio` | `filePhysioBackendStore` | fichiers physio |
| `/api/hashtags` | `hashtagStoreBackend` | hashtags |
| `/api/posts` | `postsBackendStore` | feed social |
| `/api/praticiens` | `praticiensStoreBackend` | praticiens |
| `/api/resultat-votation` | `resultatVotationStoreBackend` | résultats de votation |
| `/api/feedbacka` | `feedbackaBackend` | outil Feedbacka |
| `/api/push` | `pushBackend` | notifications push |
| `/api/ftp` | `ftpRoutes` | uploads / diagnostic FTP |
| `/api/chat` | `careconversStoreBackend` | chat stateful |

## Endpoints techniques et de test

| Endpoint | Rôle |
| --- | --- |
| `/api/ping` | ping simple |
| `/health` | healthcheck infra |
| `/api/ftp/diagnostic` | diagnostic direct FTP |
| `/api/praticiens_formateurs-test` | route test |
| `/api/pong` | test |
| `/api/pongg` | test |
| `/api/chapters` | exemple / test Supabase |

## Points importants de lecture

### CORS

Les origines autorisées diffèrent selon `NODE_ENV` :

- production : domaines HEdS explicitement listés ;
- développement : localhost et 127.0.0.1 sur ports connus.

### Parsing JSON

Le serveur accepte des payloads JSON jusqu'à `10mb`.

### Debug local

En environnement non production, un middleware loggue les requêtes entrantes.

## Ce qui est exploitable versus ce qui est historique

Le fait qu'un fichier existe dans `backend/supabase/` ne veut pas dire qu'il est réellement monté.

Toujours distinguer :

- les routes effectivement branchées dans `backend/index.js` ;
- les fichiers auxiliaires ;
- les scripts d'import, seed ou test ;
- les reliquats legacy.

## Réflexe de diagnostic backend

Quand un appel échoue :

1. vérifier que l'endpoint est bien monté dans `backend/index.js` ;
2. vérifier que le frontend appelle le bon chemin ;
3. vérifier les variables serveur ;
4. vérifier CORS ;
5. vérifier ensuite Supabase, FTP ou le service externe concerné.
