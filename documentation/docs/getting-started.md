---
id: getting-started
title: Prise en main
---

## Prérequis

- Node.js 18+
- npm 9+
- Accès Firebase & Supabase (variables d'environnement)

## Installation (App)

```bash
npm install
npm run dev
```

## Installation (Docs)

```bash
npm install --prefix documentation
npm run docs:dev
```

## Variables d'environnement clés

- Firebase: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_DATABASE_URL`, etc.
- Supabase: `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`
- Vimeo: `VITE_VIMEO_ACCESS_TOKEN`

## Build & Déploiement

- Build global (app + docs):

```bash
npm run build:all
```

Le site de documentation est copié dans `dist/docs/` et servi par Firebase sous `/docs`.
