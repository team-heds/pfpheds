---
title: Scripts
---

## Scripts utiles

### Build docs

```bash
npm run docs:build
npm run docs:serve
```

### Build complet

```bash
npm run build:all
```

### Tests frontend

```bash
npm run test:unit
npm run test:coverage
npm run test:e2e
```

### Tests ciblés environnement

```bash
node test-supabase-connection.js
node test_postgres_connection.js
node test_all_rpcs.js
```

## Règle

Après toute modification de `.env`, redémarrer les processus de dev.
