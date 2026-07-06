---
title: Services media
---

## Services a connaitre

- `src/service/mediaService.js`
- `src/service/vimeoService.js`
- `src/service/videoLibraryService.js`
- `src/service/institutionMediaService.js`

## Rôle

Ces services centralisent la logique de consultation, validation et organisation des contenus media.

## Regle

Éviter de brancher des appels Vimeo directement dans les vues. La logique d'accès doit rester dans les services.
