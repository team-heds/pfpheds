---
title: Firebase Hosting
---

Ce guide explique comment déployer l’app (SPA) et la documentation sur Firebase Hosting.

## Pré-requis

- `firebase-tools` installé

```bash
npm i -g firebase-tools
firebase login
```

- Fichier `firebase.json` présent (déjà dans le repo) avec `public: "dist"`.

## Build

Construire l’app seule ou l’app + la doc:

```bash
# App seule
npm run build

# App + Docs (recommandé si vous servez la doc depuis Hosting)
npm run build:all
```

`build:all` copiera la doc dans `dist/docs/` via `scripts/copy-docs-to-dist.js`.

## Déploiement

```bash
firebase deploy --only hosting
```

## Réécritures (SPA + docs)

Pour que les routes SPA fonctionnent et que la doc soit servie sous `/docs/`, ajoutez (optionnel) des réécritures dans `firebase.json`:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      { "source": "/docs/**", "destination": "/docs/index.html" },
      { "source": "**", "destination": "/index.html" }
    ]
  }
}
```

Sans ces réécritures, les liens profonds (ex: `/some/route`) peuvent retourner 404.

## Notes

- Si vous n’exposez pas la doc via Firebase Hosting, vous pouvez ignorer `build:all`.
- Pour plusieurs environnements (staging/prod), utilisez des `targets` Firebase ou des projets distincts.
