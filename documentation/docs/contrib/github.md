---
title: Utiliser GitHub avec le projet
sidebar_label: GitHub (projet)
---

Ce guide explique comment cloner, développer, contribuer et publier avec GitHub pour ce dépôt.

## Cloner et démarrer

```bash
# Cloner
git clone https://github.com/antoinequarroz/pfpheds.git
cd pfpheds

# Installer
npm install

# Démarrer l'app
npm run dev

# Démarrer la documentation
npm run docs:dev
```

Voir aussi: `getting-started` et `getting-started/environment/setup`.

## Branches et versionnage

- Branches typiques:
  - `main`: intégration stable
  - `prod`: branche de déploiement (workflow CI `deploy-prod.yml`)
  - `feature/<clef>-<slug>` (ex: `feature/JIRA-123-filtre-carte`)
  - `fix/<clef>-<slug>`
- Releases: tags et changelog (voir `project/releases`)

## Conventions de commit

- Préfixer avec la clef Jira si applicable: `JIRA-123: message`  
- Messages courts, à l'impératif, décrivant l'intention

## Pull Requests (PR)

- Cible: `main` (ou `prod` pour hotfix)
- Titre: `JIRA-123: description courte`
- Description: ce que ça change, comment tester, impacts
- Checklist: lint OK (`npm run lint`), build OK (`npm run build`), doc mise à jour si nécessaire
- Reviewer: au moins 1 relecture

## CI/CD

- Pipeline GitHub Actions (`.github/workflows/deploy-prod.yml`)
- Build app (`npm run build`) ou app + docs (`npm run build:all`)
- Déploiement FTP de `dist/`

## Documentation

- Pages dans `documentation/docs/`
- Sidebar: `documentation/sidebars.js`
- Assets: `documentation/static/img/` puis référencer via `/img/...`

## Issues & Projets

- Issues GitHub pour tâches rapides/techniques
- Kanban Sprint dans Jira (voir `project/jira-github-workflow`)
- Lier commits/PR à Jira via la clef (ex: `JIRA-123` dans le titre/commit)

## Bonnes pratiques

- Petites PR ciblées et faciles à relire
- Tests manuels et capture avant/après si impact UI
- Mettre à jour la documentation quand c'est utile
