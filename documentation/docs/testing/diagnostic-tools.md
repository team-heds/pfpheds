---
title: Outils de Diagnostic
---

Outils et méthodes pour diagnostiquer rapidement les problèmes (Firebase, Supabase, Docs).

## Diagnostics intégrés (in‑app)

- **Supabase**: ouvrir `/admin/supabase-diagnostic`
  - Affiche la session, exécute des requêtes de test, montre erreurs éventuelles
- **Firebase**: dans la page admin simple modules, bouton "Diagnostic Firebase"
  - Vérifie la présence des variables, teste une lecture RTDB et affiche des messages clairs

## Console navigateur (dev)

- Activer la console (F12) et regarder les logs:
  - `firebase.js` loggue la présence des variables `VITE_FIREBASE_*`
  - Les guards du routeur logguent les permissions (`roleStore.perms`, `isSuper`)

## Variables d’environnement

- `.env` (Vite) doit contenir:
  - Firebase: `VITE_FIREBASE_*`
  - Supabase: `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`
- Redémarrer `npm run dev` après toute modification de `.env`

## Scripts / utilitaires

- Test Supabase (Node): `node test-supabase-connection.js`
  - Vérifie la connexion, l’Auth et un sign‑up test
- Build Docs: `npm run docs:build` puis `node scripts/copy-docs-to-dist.js`

## Problèmes fréquents

- Firebase Auth non enregistré → voir `troubleshooting/firebase-auth`
- Variables d’environnement illisibles (encodage) → voir `troubleshooting/firebase-env`
- URL Supabase contenant `/rest/v1` → normalisation automatique dans `src/supabase.js`
