---
title: Routing, navigation et contrôle d'accès
---

## Organisation

- `src/router/routes/*.js`: routes par domaine
- `src/router.js`: garde globale, `meta.need`, routes dynamiques

## Fichiers de routes

- `auth.js`
- `pages.js`
- `admin.js`
- `pfp.js`
- `social.js`
- `apps.js`

## Meta importante

- `requiresAuth`
- `need`
- `requiredRole`
- `requiresModuleOwnership`

## Point critique

Une partie des routes est chargee dynamiquement au runtime. Il faut donc diagnostiquer la navigation a la fois cote fichiers statiques et cote injection dynamique.
