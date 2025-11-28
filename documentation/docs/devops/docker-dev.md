---
title: Docker Dev
---

Ce guide explique comment utiliser `docker-compose.dev.yml` pour servir l’application buildée et, optionnellement, simuler un backend local.

## Prérequis

- Docker / Docker Compose
- Build local de l’app (`dist/`)

## Services

Fichier: `docker-compose.dev.yml`

- **frontend-dev**
  - Image basée sur `Dockerfile.dev`
  - Monte `./dist` dans `/usr/share/nginx/html`
  - Exposé sur `http://localhost:3002`
- **backend-dev** (optionnel)
  - Construit depuis `./backend` (Dockerfile)
  - Exposé sur `http://localhost:3001`

## Démarrer le serveur statique (app)

1) Construire l’app (et la doc si besoin):

```bash
# App seule
npm run build

# App + Docs → dist/ + dist/docs/
npm run build:all
```

2) Lancer le conteneur frontend:

```bash
docker compose -f docker-compose.dev.yml up -d frontend-dev
# ou
docker-compose -f docker-compose.dev.yml up -d frontend-dev
```

3) Ouvrir: `http://localhost:3002`

## Mettre à jour après changements

Le conteneur sert le contenu de `dist/`. Après modifications du code:

```bash
npm run build
# ou
npm run build:all
```

> Pas besoin de redémarrer le conteneur: le volume reflète la nouvelle build

## Lancer le backend local (optionnel)

```bash
docker compose -f docker-compose.dev.yml up -d backend-dev
# ou
docker-compose -f docker-compose.dev.yml up -d backend-dev
```

Backend accessible via `http://localhost:3001` selon l’implémentation `./backend`.

## Logs & arrêt

```bash
docker compose -f docker-compose.dev.yml logs -f frontend-dev
docker compose -f docker-compose.dev.yml down
```

## Notes

- `Dockerfile.dev` et Nginx servent un contenu statique (SPA). Pour les routes `history`, vérifiez la conf Nginx/Caddy sur le serveur (voir `devops/vps-caddy-nginx`).
