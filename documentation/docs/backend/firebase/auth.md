---
title: Firebase Auth
---

## Rôle

Firebase Auth reste utilisé pour une partie des sessions legacy.

## Points de référence

- `src/firebase.js`
- `src/stores/authStore.js`

## Intégration

`authStore` expose:

- `signUpFirebase`
- `signInFirebase`
- `resetPasswordFirebase`

et écoute aussi `onAuthStateChanged`.

## Point de vigilance

Le projet étant hybride, une correction auth doit toujours être vérifiée aussi côté Supabase.
