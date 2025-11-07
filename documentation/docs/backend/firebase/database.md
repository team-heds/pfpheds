---
title: Firebase Realtime Database
---

Guide d’utilisation de Realtime Database (RTDB).

## Accès & chemins

- Référence de base: `ref(db, path)` (voir `firebase.js` pour `db`)
- Exemples de chemins utilisés:
  - `Users/{uid}/Roles` — rôles d’accès dans le routeur
  - `Places/` — données historiques (migration en cours vers Supabase)

## Lecture simple

```js
import { ref, get } from 'firebase/database'
const snapshot = await get(ref(db, `Users/${uid}/Roles`))
if (snapshot.exists()) {
  const roles = snapshot.val()
}
```

## Règles de sécurité

- Définies dans `database.rules.json` (référencé par `firebase.json`)
- Vérifier que les chemins sensibles ne sont pas publics

## Bonnes pratiques

- Normaliser les chemins et les clés
- Migrer vers Supabase Postgres quand relationnel/filtrage avancé est requis
- Centraliser les accès dans des services/stores (éviter la logique dans les vues)
