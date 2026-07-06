---
title: Build, packaging et déploiement
---

## Surfaces à déployer

Le projet peut impliquer jusqu'à trois surfaces :

- frontend principal
- documentation Docusaurus
- backend Node/Express

## Build frontend

```bash
npm run build
```

Sortie :

- `dist/`

## Build documentation

```bash
npm run docs:build
```

Sortie :

- `documentation/build/`

## Build global

```bash
npm run build:all
```

Ce script :

1. build le frontend
2. build la documentation
3. copie les docs dans `dist/docs`

## Fichiers de déploiement à connaître

- `firebase.json`
- `docker-compose.dev.yml`
- `docker-compose.prod.yml`
- `Dockerfile.dev`
- `Dockerfile.frontend.prod`
- `deploy/nginx.frontend.prod.conf`
- `scripts/copy-docs-to-dist.js`

## Points de vigilance

### Si le changement touche seulement la doc

Le frontend n'a pas besoin d'être modifié, mais le build global doit toujours produire `dist/docs`.

### Si le changement touche Supabase

Vérifier aussi :

- migrations
- RLS
- scripts de déploiement éventuels

### Si le changement touche le backend

Vérifier :

- variables `backend/.env`
- routes exposées
- comportement Docker ou serveur cible

## Procédure minimale avant livraison

1. `npm run docs:build`
2. `npm run build`
3. si besoin, `npm --prefix backend run dev` ou vérification backend ciblée
4. vérifier que `/docs` reste accessible dans la sortie finale
