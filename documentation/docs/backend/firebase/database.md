---
title: Firebase Realtime Database
---

## Rôle

La Realtime Database porte encore une partie des données historiques du projet.

## Fichier principal

- `src/firebase.js`

## Usage typique

- données legacy utilisateurs
- rôles historiques
- structures encore non migrées

## Réalité de maintenance

Avant de modifier un flux supposé legacy, vérifier s'il lit encore vraiment la RTDB ou s'il a déjà été déplacé vers Supabase.
