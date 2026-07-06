---
title: Authentification, rôles et permissions
---

## Résumé

Le projet n'a pas un seul mécanisme d'accès. Il combine :

- Firebase Auth
- Supabase Auth
- contrôle front par route
- contrôle métier par permissions
- contrôle base par RLS

## Fichiers de référence

- `src/firebase.js`
- `src/supabase.js`
- `src/router.js`
- `src/stores/authStore.js`
- `src/stores/role.js`
- `src/service/rolesService.js`

## Ce que fait Firebase

- authentification legacy
- source encore active dans certains flux utilisateurs
- intégration avec Realtime Database et Storage

## Ce que fait Supabase

- authentification moderne
- persistance de session
- PKCE flow
- base relationnelle
- permissions et policies

## Contrôle d'accès en pratique

### Niveau 1 : session

L'utilisateur doit être connu via `authStore`.

### Niveau 2 : routing

Le router évalue :

- `requiresAuth`
- `meta.need`
- `requiredRole`

### Niveau 3 : rôles et permissions

Le `roleStore` expose la lecture des permissions via `can()`.

### Niveau 4 : base

Les policies RLS Supabase doivent encore autoriser les requêtes.

## Conséquence de maintenance

Un problème d'accès peut venir :

- du provider d'auth
- du router
- du rôle
- d'une policy RLS

Il faut donc vérifier toute la chaîne, pas seulement la page visible.

## Recommandations

- toute nouvelle page sensible doit définir explicitement `meta.need`
- toute nouvelle table sensible doit avoir un plan RLS
- toute correction de droit doit être testée avec un vrai profil non-admin
