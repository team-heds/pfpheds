---
title: PWA, service worker et cache
---

## Ce qui existe

Le frontend est prepare comme PWA via Vite.

## Point central

Le comportement le plus important est actuellement dans `src/main.js`:

- comparaison de `APP_VERSION`
- purge des anciens service workers
- suppression des caches
- rechargement de l'application si la version change

## Implication

Une modification du cycle de build ou du versionnement peut impacter:

- les utilisateurs deja connectes
- la fraicheur des assets
- le comportement offline

## Regle

Ne pas toucher a la gestion de version du service worker sans tester un vrai cycle de mise a jour navigateur.
