---
title: Workflow de Contribution
---

Ce guide décrit le workflow de contribution (branches, commits, PR, revue, CI/CD).

## Branching

- Branche stable: `main`
- Déploiement: `prod` (CI → FTP)
- Travail par ticket:
  - `feature/JIRA-123-intitule`
  - `fix/JIRA-456-correction-bug`

## Commits

- Inclure la clef Jira si applicable: `JIRA-123: message clair`
- Style: verbe à l’impératif, concis, décrit l’intention

## Pull Requests

- Base: `main` (ou `prod` pour hotfix)
- Titre: `JIRA-123: court descriptif`
- Description:
  - Contexte / Pourquoi
  - Changements principaux
  - Comment tester (commandes, pages)
  - Impacts (perf, sécurité, doc)
- Checklist: `npm run lint`, `npm run build`, docs mises à jour

## Revue de code

- Au moins 1 reviewer
- Points à regarder: lisibilité, sécurité (RLS/permissions), accessibilité, perfs

## CI/CD

- Workflow: `.github/workflows/deploy-prod.yml`
- Build app (`npm run build`) ou app + docs (`npm run build:all`)
- Déploiement FTP depuis `dist/`

## Releases & notes

- Tag des versions au merge des features majeures
- Page `project/releases` pour le changelog

## Documentation

- Docs dans `documentation/docs/` (voir `contrib/github`)
- Images dans `documentation/static/img/` et référencer `/img/...`
