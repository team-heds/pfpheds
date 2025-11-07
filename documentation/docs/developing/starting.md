---
id: starting
title: Démarrer le développement
sidebar_label: Starting
---

Cette page explique comment lancer un environnement de développement complet, ainsi que les conventions générales.

## Démarrage rapide

```bash
# Installer
npm install

# App (Vite)
npm run dev

# Documentation (Docusaurus)
npm run docs:dev
```

## Conventions

- Gestion de code avec Git (une branche par feature, PRs petites et fréquentes).
- ESLint/Prettier: 
  - `npm run lint`
  - `npm run format`
- Typographie & UI: voir `Layout & Design` (Design system, themes, typographie).

## Débogage

- Vue DevTools recommandé (inspection composants, routes, store Pinia).
- Console/Network: surveiller les erreurs liées aux variables `.env`.

## Tests de connectivité

- Supabase: `npm run test:supabase`
- Firebase (script local): `node test-firebase.js`

## Structure du projet (vue d'ensemble)

```text
src/
  components/        # composants UI
  views/             # pages (routées)
  stores/            # Pinia stores
  assets/            # assets statiques
  router.js          # routes Vue Router
  main.js            # bootstrap app
```

Pour les détails d'architecture, voir la page `Architecture` et `Stack`.
