---
id: setup
title: Environment Setup
sidebar_label: Setup de l'environnement
---

Bienvenue dans le guide d'installation de la plateforme HEdS.

Ce guide couvre les prérequis, l'installation, la configuration des variables d'environnement et le démarrage des applications (app + documentation).

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

## Prérequis

- Node.js 18+ et npm 9+
- Git
- Docker (optionnel, pour le dev backend et la conteneurisation)
- VS Code recommandé (extensions listées plus bas)

Vérifier vos versions:

```bash
node -v
npm -v
```

## 1) Récupérer le projet

```bash
git clone <url-du-repo>
cd pfpheds
```

## 2) Installer les dépendances

<Tabs>
<TabItem value="npm" label="npm" default>

```bash
npm install
```

</TabItem>
<TabItem value="pnpm" label="pnpm">

```bash
pnpm install
```

</TabItem>
<TabItem value="yarn" label="yarn">

```bash
yarn install
```

</TabItem>
</Tabs>

## 3) Variables d'environnement

- Copier le template et compléter les valeurs manquantes.

<Tabs>
<TabItem value="windows" label="Windows" default>

```powershell
Copy-Item .env.production.example .env
```

</TabItem>
<TabItem value="unix" label="macOS/Linux">

```bash
cp .env.production.example .env
```

</TabItem>
</Tabs>

- Renseigner les variables Firebase et Supabase (clés publiques uniquement). Ne mettez pas de secrets privés dans la doc ou dans le code client.
- Exemple (placeholder):

```bash
VITE_FIREBASE_API_KEY=xxxx
VITE_FIREBASE_AUTH_DOMAIN=xxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxxx
VITE_FIREBASE_STORAGE_BUCKET=xxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_FIREBASE_DATABASE_URL=https://xxxx-default-rtdb.europe-west1.firebasedatabase.app

VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_KEY=public-anon-key
```

Astuce:
- En cas d'ennuis d'encodage, recréez `.env` depuis un fichier valide (évitez les `echo` multiples).
- Redémarrez votre serveur après modification des variables.

## 4) Lancer l'application (Vite)

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

Par défaut: http://localhost:5173

## 5) Lancer la documentation (Docusaurus)

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

Par défaut: http://localhost:3000/docs/

Build et preview de la doc:

<Tabs>
<TabItem value="npm" label="npm" default>

```bash
npm run docs:build
npm run docs:serve
```

</TabItem>
<TabItem value="pnpm" label="pnpm">

```bash
pnpm run docs:build
pnpm run docs:serve
```

</TabItem>
<TabItem value="yarn" label="yarn">

```bash
yarn docs:build
yarn docs:serve
```

</TabItem>
</Tabs>

## 6) Vérifications & Diagnostics

- Tester la connexion Supabase:

```bash
npm run test:supabase
```

- Tester la configuration Firebase (script local):

```bash
node test-firebase.js
```

## 7) Dépannage rapide

- Voir: `Troubleshooting` dans la sidebar
  - `troubleshooting/firebase-env` – Variables Firebase
  - `troubleshooting/firebase-auth` – Auth non enregistrée
  - `troubleshooting/env-encoding` – Encodage `.env`

## 8) Extensions VS Code utiles

- Vue - Official (Volar)
- ESLint / Prettier
- Docker (si utilisé)

Pour plus de détails, voir la page "CLI & Extensions".
