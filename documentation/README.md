# Documentation HEdS (Docusaurus)

## Scripts

- `npm run docs:dev` — Démarrer le serveur de docs (hot reload)
- `npm run docs:build` — Builder les docs (documentation/build)
- `npm run build:all` — Build app + docs puis copie vers `dist/docs`

## Développement

- Ajouter vos pages dans `documentation/docs/`
- Organiser la sidebar via `documentation/sidebars.js`
- Personnaliser le thème via `documentation/src/css/custom.css`

## Déploiement Firebase

Les docs sont servies sous `/docs`. Le build global:

```bash
npm run build:all
firebase deploy
```
