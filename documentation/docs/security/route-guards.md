---
title: Route guards
---

## Point d'entrée

- `src/router.js`

## Ce que fait le guard global

1. charge les routes dynamiques
2. vérifie l'état de session
3. initialise le `roleStore`
4. évalue `meta.need`
5. gère `requiredRole`
6. applique les redirections

## Métadonnées importantes

- `requiresAuth`
- `need`
- `requiredRole`
- `requiresModuleOwnership`

## Point important

Le projet privilégie `meta.need` pour la lecture moderne des permissions.
