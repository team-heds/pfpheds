---
title: CI/CD
---

Cette page décrit le pipeline CI/CD utilisé pour construire et déployer la plateforme.

## Workflow GitHub Actions

Fichier: `.github/workflows/deploy-prod.yml`

- Déclencheur: `push` sur la branche `prod`
- Environnement: `ubuntu-latest`, Node 18
- Étapes principales:
  1. `checkout`
  2. `setup-node`
  3. Génération de `firebase.js` à partir des secrets GitHub
  4. `npm ci`
  5. `npm run build`
  6. Déploiement FTP du dossier `dist/`

### Secrets requis

Définir dans `Settings → Secrets and variables → Actions`:

- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_DATABASE_URL`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `FTP_SERVER`
- `FTP_USERNAME`
- `FTP_PASSWORD`

### Construire l’app et la documentation

Le script `npm run build` ne construit que l’app (Vite). Pour intégrer la documentation:

```bash
npm run build:all
```

Ce script:
- lance `vite build`
- lance `npm run docs:build`
- copie `documentation/build` → `dist/docs` via `scripts/copy-docs-to-dist.js`

Si vous souhaitez déployer la doc avec l’app via le pipeline, remplacez dans le workflow:

```yaml
- name: Build app + docs
  run: npm run build:all
```

### Déploiement FTP

Le workflow utilise `SamKirkland/FTP-Deploy-Action@v4.3.4` pour synchroniser `./dist/` vers le serveur (dossier racine `/`).

Paramètres clés:

```yaml
server: ${{ secrets.FTP_SERVER }}
username: ${{ secrets.FTP_USERNAME }}
password: ${{ secrets.FTP_PASSWORD }}
local-dir: ./dist/
server-dir: /
```

Astuce: pour servir la documentation sous `/docs/`, assurez-vous que `dist/docs/` est présent (via `build:all`) et que votre serveur (Caddy/Nginx) réécrit correctement les routes (voir `devops/vps-caddy-nginx`).

## Bonnes pratiques

- Utiliser une branche `staging` avec un workflow similaire pointant vers un répertoire serveur différent.
- Empêcher la fuite de secrets: ne commitez jamais de clés, utilisez les secrets GitHub.
- Conserver des artefacts de build si nécessaire (`actions/upload-artifact`).
