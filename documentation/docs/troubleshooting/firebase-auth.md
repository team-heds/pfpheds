---
title: Erreur Firebase Auth
---

Résoudre l’erreur:

```
Uncaught Error: Component auth has not been registered yet
```

## Symptômes

- Crash au démarrage sur `getAuth()`/`initializeAuth`
- Stack trace côté Firebase Auth

## Causes probables

- Variables d’environnement Firebase manquantes/incomplètes (`.env`)
- `.env` corrompu (encodage) → variables illisibles par Vite
- Initialisation différée cassée (rare)

## Diagnostic rapide

- Ouvrir l’admin simple modules et cliquer « Diagnostic Firebase » (onglet Configuration)
  - Vérifie chaque variable `VITE_FIREBASE_*`
  - Teste une lecture RTDB et affiche un état explicite
- Observer la console au démarrage: `src/firebase.js` loggue la présence de chaque variable

## Correctifs

1) Vérifier `.env`

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pfpheds
VITE_FIREBASE_STORAGE_BUCKET=pfpheds.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=1:...:web:...
VITE_FIREBASE_DATABASE_URL=https://pfpheds-default-rtdb.europe-west1.firebasedatabase.app
```

2) Si `.env` semble corrompu (espaces entre chaque caractère), recréer le fichier

- Windows (PowerShell):

```powershell
Copy-Item .env.production .env
```

- macOS/Linux:

```bash
cp .env.production .env
```

3) Purger le cache Vite et redémarrer

```powershell
# Windows PowerShell
Remove-Item -Recurse -Force node_modules\.vite
npm run dev
```

4) Re-tester via la page de diagnostic et `testing/firebase-test`

## Références

- `testing/firebase-test` — tests rapides dans la console
- `troubleshooting/firebase-env` — problèmes d’encodage `.env`
- `src/firebase.js` — logs et validation des variables
