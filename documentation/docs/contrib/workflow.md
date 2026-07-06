---
title: Workflow de contribution
---

## Sequence recommandee

1. identifier le domaine métier
2. retrouver la route et la vue
3. confirmer la source de donnees
4. modifier store, service, vue ou backend au bon endroit
5. verifier tests et documentation

## Avant merge

- verifier le comportement reel
- lancer les tests cibles
- mettre a jour la doc si le fonctionnement change
- verifier les permissions si un ecran sensible est impacte

## Build utile

- `npm run build`
- `npm run build:all`
