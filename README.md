# Plateforme HEdS

Plateforme web Vue 3 pour la formation pratique, les espaces métier académiques, le social, l’administration et plusieurs outils internes.

## État du dépôt

Le projet est un monolithe frontend avec coexistence de plusieurs couches historiques :

- Vue 3 + Vite ;
- PrimeVue + Pinia + Vue Router ;
- backend mixte Firebase / Supabase ;
- documentation technique centralisée dans Docusaurus.

La source de vérité documentaire n’est plus dans les README dispersés du code, mais dans `documentation/`.

## Documentation

Point d’entrée principal :

- `documentation/`

Pages utiles en priorité :

- `documentation/docs/intro.md`
- `documentation/docs/architecture.md`
- `documentation/docs/system/overview.md`
- `documentation/docs/frontend/bootstrap.md`
- `documentation/docs/frontend/route-catalog.md`
- `documentation/docs/frontend/component-library-overview.md`
- `documentation/docs/backend/overview.md`
- `documentation/docs/data/overview.md`
- `documentation/docs/domains/formation-pratique.md`
- `documentation/docs/domains/planning-soins.md`
- `documentation/docs/ops/vps-topology.md`
- `documentation/docs/ops/vps-operations.md`

## Démarrage

Prérequis :

- Node.js 18+
- npm

Installation :

```bash
npm ci
npm --prefix backend ci
```

Lancement local :

```bash
npm run dev:full
```

Cette commande démarre ensemble :

- le frontend Vite sur le port configuré par le projet ;
- le backend Express sur le port `3000`.

Elle nécessite les dépendances du backend ainsi qu'un fichier `backend/.env` configuré à partir de `backend/.env.example`.

## Scripts utiles

```bash
npm run dev
npm run dev:full
npm run build
npm run preview
npm run lint
npm run format
npm run test:unit
npm run test:e2e
npm run docs:dev
npm run docs:build
npm run docs:serve
npm run build:all
```

## Structure utile

```text
src/
  components/   composants UI et métier
  views/        pages routées
  stores/       stores Pinia
  service/      services historiques
  layout/       shell applicatif
  router/       modules et garde de navigation

documentation/
  docs/         documentation technique Docusaurus
```

## Principes de reprise

Si quelqu’un doit reprendre le projet :

1. lire `documentation/docs/intro.md`
2. lire `documentation/docs/architecture.md`
3. lire `documentation/docs/system/recovery-checklist.md`
4. lire `documentation/docs/frontend/route-catalog.md`
5. lire `documentation/docs/frontend/component-library-critical-components.md`
6. lire `documentation/docs/backend/frontend-backend-traceability.md`
7. lire les docs métier concernées avant toute modification

## Notes

- Le dépôt contient encore des reliquats legacy côté code, surtout autour des couches historiques Firebase et de certains modules métier.
- La documentation Docusaurus a été restructurée pour servir de base de reprise technique complète.
