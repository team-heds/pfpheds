# Présentation Reveal.js

La présentation de reprise PFPHEdS se trouve dans `presentation/`.

## Accès

- Développement dédié : `npm run presentation:dev`, puis `http://localhost:5182/presentation/`.
- Build : `npm run presentation:build`.
- Tests : `npm run presentation:test` ou `npm run test`.

La présentation est un sous-projet Vite indépendant. Son build sort dans `presentation/dist/` avec `base: '/presentation/'`, prêt pour une publication sous `https://hedsvs.ch/presentation/`.

## Structure

- `presentation/package.json` : scripts et dépendances isolés.
- `presentation/vite.config.js` : base path `/presentation/`.
- `presentation/src/main.js` : initialisation Reveal.js.
- `presentation/src/presentation.js` : agrégation des chapitres.
- `presentation/src/slides/` : contenu modulaire des slides.
- `presentation/src/components/` : copie de code, liens externes, progression.
- `presentation/src/theme/` : thème HEdS et impression.
- `presentation/tests/` : tests Playwright.

## Maintenance

Conserver des slides courtes et vérifiables. Les détails opérationnels longs doivent rester dans la documentation Docusaurus, pas dans la présentation.

Avant livraison, vérifier :

- navigation clavier ;
- affichage mobile ;
- mode contraste ;
- export PDF avec `?print-pdf` ;
- build Vite.
