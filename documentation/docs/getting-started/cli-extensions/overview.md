---
id: overview
title: CLI & Extensions
sidebar_label: CLI & Extensions
---

Cette page recense les commandes npm disponibles et les extensions/outils recommandés.

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Commandes (root package.json)

- `npm run dev`
  - Démarre l'app Vite en mode développement.
- `npm run build`
  - Build de l'app Vite en production.
- `npm run preview`
  - Prévisualisation locale du build Vite.
- `npm run lint`
  - Lint (ESLint) sur `.vue,.js,.jsx,.cjs,.mjs` avec fix auto.
- `npm run format`
  - Formatage Prettier du dossier `src/`.
- `npm run clean`
  - Supprime `node_modules` et `package-lock.json`, puis réinstalle. (Sur Windows, préférez l'équivalent PowerShell si besoin.)
- `npm run test:supabase`
  - Lance `test-supabase-connection.js` pour vérifier la connectivité Supabase.
- `npm run docs:dev`
  - Démarre la documentation Docusaurus (répertoire `documentation/`).
- `npm run docs:build`
  - Build la documentation Docusaurus.
- `npm run docs:serve`
  - Sert la documentation buildée.
- `npm run build:all`
  - Build l'app Vite + la documentation, puis copie la doc vers `dist/` via `scripts/copy-docs-to-dist.js`.

## Usages rapides

### Dev application

<Tabs>
<TabItem value="npm" label="npm" default>

```bash
npm run dev
```

</TabItem>
<TabItem value="pnpm" label="pnpm">

```bash
pnpm dev
```

</TabItem>
<TabItem value="yarn" label="yarn">

```bash
yarn dev
```

</TabItem>
</Tabs>

### Documentation (Docusaurus)

<Tabs>
<TabItem value="npm" label="npm" default>

```bash
npm run docs:dev
```

</TabItem>
<TabItem value="pnpm" label="pnpm">

```bash
pnpm run docs:dev
```

</TabItem>
<TabItem value="yarn" label="yarn">

```bash
yarn docs:dev
```

</TabItem>
</Tabs>

### Build complet (app + docs)

<Tabs>
<TabItem value="npm" label="npm" default>

```bash
npm run build:all
```

</TabItem>
<TabItem value="pnpm" label="pnpm">

```bash
pnpm run build:all
```

</TabItem>
<TabItem value="yarn" label="yarn">

```bash
yarn build:all
```

</TabItem>
</Tabs>

### Lint & Format

<Tabs>
<TabItem value="npm" label="npm" default>

```bash
npm run lint
npm run format
```

</TabItem>
<TabItem value="pnpm" label="pnpm">

```bash
pnpm run lint
pnpm run format
```

</TabItem>
<TabItem value="yarn" label="yarn">

```bash
yarn lint
yarn format
```

</TabItem>
</Tabs>

```bash
# Dev app
npm run dev

# Lancer la doc
npm run docs:dev

# Build app + doc
npm run build:all
```

> Note Windows: la commande `clean` utilise `rm -rf`. Si vous n'avez pas bash, utilisez PowerShell:
>
> ```powershell
> Remove-Item -Recurse -Force node_modules, package-lock.json; npm install
> ```

## Extensions VS Code recommandées

- Vue - Official (Volar)
- ESLint
- Prettier - Code formatter
- Docker (si utilisé)
- Markdown All in One (rédaction de docs)

## Outils navigateur

- Vue DevTools
  - Indispensable en dev Vue 3 (inspection composants, état, routes, etc.)

## Astuces

- Redémarrer le serveur après modification des variables `.env`.
- Utiliser des *fences* de langage dans les docs pour la coloration:
  - Commandes: ```bash
  - JS/TS/Vue: ```js, ```ts, ```vue
