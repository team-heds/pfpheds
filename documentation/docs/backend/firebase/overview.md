---
title: Firebase - Vue d'ensemble
---

Vue d’ensemble de l’intégration Firebase (App Web) dans la plateforme.

## Modules utilisés

- `firebase/app` — initialisation
- `firebase/auth` — authentification
- `firebase/database` — Realtime Database
- `firebase/storage` — stockage de fichiers

Fichier d’init: `firebase.js` (racine du projet)

## Variables d’environnement (Vite)

Définies dans `.env` et lues via `import.meta.env`:

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_DATABASE_URL=
```

L’app vérifie la présence de ces variables au démarrage (voir logs dans `firebase.js`).

## Ressources liées

- `backend/firebase/database` — structure et accès RTDB
- `backend/firebase/auth` — authentification et pièges courants
- `backend/firebase/storage` — gestion de fichiers
- `troubleshooting/firebase-env` — variables manquantes
- `troubleshooting/firebase-auth` — erreur “Component auth …”
