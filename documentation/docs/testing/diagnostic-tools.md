---
title: Outils de diagnostic
---

Outils et méthodes pour diagnostiquer rapidement les problèmes Firebase, Supabase et documentation.

## Diagnostics intégrés

- Supabase : ouvrir `/admin/supabase-diagnostic`
  - affiche la session, exécute des requêtes de test et remonte les erreurs
- Firebase : dans l'admin simple modules, bouton `Diagnostic Firebase`
  - vérifie les variables, teste une lecture RTDB et affiche des messages lisibles

## Console navigateur

- `firebase.js` loggue la présence des variables `VITE_FIREBASE_*`
- les guards du routeur logguent les permissions (`roleStore.perms`, `isSuper`)

## Variables d'environnement

- `.env` doit contenir :
  - Firebase : `VITE_FIREBASE_*`
  - Supabase : `VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`
- redémarrer `npm run dev` après toute modification

## Scripts utiles

- test Supabase Node : `node test-supabase-connection.js`
- build docs : `npm run docs:build`

## Problèmes fréquents

- Firebase Auth non enregistré → voir `troubleshooting/firebase-auth`
- variables d'environnement illisibles → voir `troubleshooting/firebase-env`
- URL Supabase contenant `/rest/v1` → normalisation automatique dans `src/supabase.js`
