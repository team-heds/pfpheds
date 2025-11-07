---
title: Scripts
---

Scripts utiles pour tester services et documentation en local.

## Supabase — test de connexion

```bash
node test-supabase-connection.js
```

- Vérifie la connexion serveur, Auth, et un sign‑up test
- Utilise `VITE_SUPABASE_URL` et `VITE_SUPABASE_KEY` depuis `.env`

Ou via alias npm:

```bash
npm run test:supabase
```

## Firebase — test (Node)

```bash
node test-firebase.js
```

- Vérifie la présence des `VITE_FIREBASE_*` et la config
- Imprime un résumé lisible dans le terminal

## Docs — build & preview

```bash
npm run docs:build
npm run docs:serve
```

- Build Docusaurus sous `documentation/build/`
- `docs:serve` sert le build (port 3000)

## Build combiné (app + docs)

```bash
npm run build:all
```

- `vite build` puis `npm run docs:build`
- Copie la doc vers `dist/docs/` via `scripts/copy-docs-to-dist.js`

## Astuces

- Après modification de `.env`, redémarrer `npm run dev`
- Pour Windows, utiliser `Copy-Item` (PowerShell) au lieu de `cp`
