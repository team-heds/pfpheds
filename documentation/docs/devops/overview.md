---
title: DevOps — Overview
sidebar_label: Overview
---

Vue d’ensemble des options de déploiement et outillages DevOps utilisés dans la plateforme.

## Cibles

- VPS (Caddy/Nginx)
  - Voir `devops/vps-caddy-nginx`
- Firebase Hosting
  - Voir `devops/firebase-hosting`

## Environnement de développement (Docker)

- Conteneurs de dev locaux (DB, services)
- Voir `devops/docker-dev`

## CI/CD

- Automatiser les builds (app + docs), tests et déploiements
- Voir `devops/ci-cd`

## Gestion des gros fichiers

- Référentiel et bonnes pratiques
- Voir `devops/large-files`

## Workflow type

1. Build app
   ```bash
   npm run build
   ```
2. Build docs
   ```bash
   npm run docs:build
   ```
3. Déploiement VPS (exemple)
   - Copier `dist/` sur le serveur
   - Recharger Caddy/Nginx

## Notes

- La commande combinée `npm run build:all` build l’app et la doc, puis copie la doc dans `dist/`.
- Assurez-vous que les variables `.env` sont correctes avant tout build.
