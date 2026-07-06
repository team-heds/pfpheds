---
title: Firebase - vue d'ensemble
---

## Rôle dans le projet

Firebase reste présent comme socle legacy sur plusieurs flux:

- authentification
- Realtime Database
- Storage
- Hosting

## Fichier principal

- `src/firebase.js`

## Variables attendues

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_DATABASE_URL=
```

## Comportement important

Si ces variables ne sont pas présentes, le frontend désactive Firebase et loggue les clés manquantes.

## À retenir

Même si Supabase devient la cible principale, Firebase ne doit pas être traité comme mort tant que les flux legacy existent encore.
