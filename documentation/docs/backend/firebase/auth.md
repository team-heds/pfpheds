---
title: Firebase Auth
---

Authentification Firebase utilisée par l’app (voir `firebase.js`).

## Initialisation

L’app initialise `Auth` via `getAuth(app)` après vérification des variables d’environnement dans `firebase.js`.

Variables requises: `VITE_FIREBASE_*` (voir `backend/firebase/overview`).

## Cas d’usage

- Vérification d’état dans le routeur (guards)
- Lecture des rôles utilisateur dans RTDB: `Users/{uid}/Roles`

## Problèmes fréquents

- Erreur « Component auth has not been registered yet »
  - Voir `troubleshooting/firebase-auth`
  - La cause est généralement des variables manquantes → voir `troubleshooting/firebase-env`

## Bonnes pratiques

- Ne pas commiter de clés. Utiliser `.env` et secrets CI.
- Redémarrer Vite après modification de `.env`.
- Logger en dev (déjà présent dans `firebase.js`).
