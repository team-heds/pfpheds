---
title: Firebase Storage
---

Stockage de fichiers (images, PDF, etc.) via Firebase Storage.

## Initialisation

- L’instance `storage` est exportée depuis `firebase.js`:

```js
import { storage } from '@/firebase.js'
```

## Upload / Download (exemple)

```js
import { ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage'

// Upload
const file = /* File */
const path = `uploads/${Date.now()}_${file.name}`
const fileRef = sRef(storage, path)
await uploadBytes(fileRef, file)
const url = await getDownloadURL(fileRef)

// url: lien public à stocker en DB
```

## Règles de sécurité

- Les règles sont définies dans `storage.rules` (référencées par `firebase.json`).
- Éviter l’accès public en écriture. Autoriser la lecture publique seulement si nécessaire.

## Bonnes pratiques

- Sauvegarder l’URL du fichier (Storage) côté base (Supabase/Firebase) au lieu d’imbriquer le binaire.
- Organiser les dossiers par feature (ex: `institutions/`, `places/`, `users/`).
