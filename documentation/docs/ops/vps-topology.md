---
title: Déploiement VPS, Docker, Nginx et Firebase
---

<div class="docs-section-head">
  <div>
    <div class="docs-section-head__eyebrow">Infrastructure</div>
    <h2 class="docs-section-head__title">Les topologies de déploiement réellement visibles dans le repo</h2>
  </div>
  <p class="docs-section-head__text">
    Cette page documente ce que le dépôt supporte concrètement : frontend statique, backend Node, Nginx, Docker Compose et Firebase Hosting.
  </p>
</div>

## Deux stratégies visibles dans le repo

Le dépôt montre au moins deux modes de livraison :

1. frontend statique déployé via Firebase Hosting ;
2. stack VPS ou serveur avec Docker + Nginx + backend Node.

## Mode 1 — Firebase Hosting

Le fichier `firebase.json` indique :

- `dist/` comme dossier public ;
- des headers de sécurité et de cache ;
- une CSP explicite ;
- la coexistence avec les règles Firebase Database et Storage.

### Ce que cela implique

- le build frontend doit produire `dist/` ;
- la documentation copiée dans `dist/docs` peut être servie avec l'application ;
- le backend Node n'est pas servi par Firebase Hosting lui-même.

## Mode 2 — VPS / serveur Dockerisé

Le fichier `docker-compose.prod.yml` définit deux services :

- `backend`
- `frontend`

### Backend

- build à partir de `./backend`
- variables depuis `backend/.env`
- `NODE_ENV=production`
- port interne `3000`
- healthcheck via `/health`

### Frontend

- build via `Dockerfile.frontend.prod`
- variable `VITE_API_URL=/api`
- exposition du port `80`
- dépendance au backend sain

## Rôle de Nginx dans la stack VPS

Le fichier `deploy/nginx.frontend.prod.conf` montre :

- un root statique sur `/usr/share/nginx/html`
- un `try_files` pour supporter la SPA Vue
- un proxy `/api/` vers `backend:3000`
- un proxy `/health` vers le backend
- un cache long pour les assets statiques

## Lecture de la topologie VPS

```text
Client
→ Nginx (conteneur frontend)
→ fichiers statiques Vue dans /usr/share/nginx/html
→ proxy /api/* vers backend Node
→ backend Node
→ Supabase / FTP / services externes
```

## `Dockerfile.frontend.prod`

Le Dockerfile montre :

1. un build Node de l'application ;
2. l'injection de `VITE_API_URL` ;
3. la copie du `dist/` final dans une image Nginx ;
4. l'utilisation de la conf `deploy/nginx.frontend.prod.conf`.

## Ce qu'il faut vérifier sur un VPS

### Système

- Docker installé ;
- Docker Compose disponible ;
- ports réseau ouverts ;
- DNS pointant vers le serveur si domaine utilisé.

### Backend

- `backend/.env` présent ;
- variables Supabase, FTP et autres secrets définies ;
- container backend sain ;
- `/health` répond.

### Frontend

- build frontend réussi ;
- conteneur Nginx sain ;
- `/` répond ;
- `/api/ping` transite bien jusqu'au backend ;
- `/docs` fonctionne si la doc est embarquée dans `dist`.

## Procédure de déploiement VPS recommandée

1. builder localement ou sur serveur ;
2. vérifier `npm run build:all` ;
3. vérifier la présence de `dist/docs` ;
4. démarrer `docker compose -f docker-compose.prod.yml up -d --build` ;
5. tester `/health`, `/api/ping`, `/` et `/docs`.

## Différences importantes entre Firebase Hosting et VPS

| Sujet | Firebase Hosting | VPS Docker |
| --- | --- | --- |
| Frontend | oui | oui |
| Backend Node | non directement | oui |
| Proxy `/api` | hors Firebase Hosting pur | oui via Nginx |
| Contrôle Nginx | non | oui |
| Dépendance au serveur | faible | forte |
| Exploitation système | faible | complète |

## Réflexes en incident VPS

- tester `docker ps`
- tester `/health`
- tester `/api/ping`
- vérifier les logs du backend
- vérifier la résolution des proxys Nginx
- vérifier les secrets et la connectivité externe

## Limite de ce que montre le repo

Le dépôt montre une topologie Nginx/Docker clairement supportée.

Il ne contient pas, dans sa version active actuelle :

- de configuration Caddy active ;
- d'orchestration Kubernetes ;
- de reverse proxy externe plus détaillé que Nginx.
