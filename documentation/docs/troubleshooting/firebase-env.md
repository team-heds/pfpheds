---
title: Problèmes Variables Firebase
---

Résoudre les problèmes liés aux variables d’environnement Firebase (`.env`).

## Symptômes

- `FIREBASE FATAL ERROR: Can't determine Firebase Database URL`
- `Component auth has not been registered yet`
- Variables affichées lettre par lettre (ex: `V I T E _ F I R E B A S E _ ...`)

## Causes fréquentes

- Fichier `.env` corrompu (mauvais encodage/copier-coller)
- Cache Vite obsolète (`node_modules/.vite`)
- Variables manquantes ou mal nommées (`VITE_*` requis pour Vite)

## Correctifs rapides

1) Recréer `.env` depuis un fichier sain (éviter echo ligne‑à‑ligne)

Windows (PowerShell):

```powershell
Copy-Item .env.production .env
```

macOS/Linux:

```bash
cp .env.production .env
```

2) Purger le cache Vite et redémarrer

Windows (PowerShell):

```powershell
Remove-Item -Recurse -Force node_modules\.vite
npm run dev
```

macOS/Linux:

```bash
rm -rf node_modules/.vite
npm run dev
```

3) Vérifier les variables requises

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=pfpheds.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pfpheds
VITE_FIREBASE_STORAGE_BUCKET=pfpheds.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=1:...:web:...
VITE_FIREBASE_DATABASE_URL=https://pfpheds-default-rtdb.europe-west1.firebasedatabase.app
```

4) Tester

- Lancer l’app et vérifier les logs `src/firebase.js` (présence variables)
- Utiliser la page de diagnostic (bouton « Diagnostic Firebase »)
- Voir aussi `testing/firebase-test`

## Bonnes pratiques

- Toujours copier `.env` depuis un fichier modèle valide (pas d’echo multi‑lignes)
- Ne jamais commiter `.env` (sensible)
- Redémarrer Vite après modification de `.env`
