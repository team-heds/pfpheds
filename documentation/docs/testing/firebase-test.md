---
title: Test Firebase
---

Vérifier la configuration et la connectivité Firebase (Auth, RTDB, Storage).

## 1) Vérifier les variables

Variables requises dans `.env` (Vite):

```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_DATABASE_URL=
```

`firebase.js` journalise la présence de chaque variable au démarrage (console).

## 2) Test rapide (console navigateur)

Dans l’app en dev (`npm run dev`), ouvrir la console DevTools et exécuter:

```js
import { db, auth, storage } from '/src/firebase.js'
console.log('db', !!db, 'auth', !!auth, 'storage', !!storage)
```

## 3) Lecture RTDB (exemple)

```js
import { get, ref } from 'firebase/database'
import { db } from '/src/firebase.js'

const snap = await get(ref(db, 'Users'))
console.log('Users exists?', snap.exists())
```

## 4) Erreurs fréquentes

- « Component auth has not been registered yet »
  - Voir `troubleshooting/firebase-auth`
  - Souvent dû à des variables manquantes → voir `troubleshooting/firebase-env`
- `.env` modifié sans redémarrer Vite → redémarrer `npm run dev`
