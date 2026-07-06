---
title: Supabase - vue d'ensemble
---

## Rôle dans le projet

Supabase est la cible principale pour:

- l'auth moderne
- la base relationnelle
- les politiques RLS
- le stockage moderne

## Fichier principal côté frontend

- `src/supabase.js`

## Comportements importants

- lecture de `VITE_SUPABASE_URL`
- lecture de `VITE_SUPABASE_KEY`
- normalisation de l'URL si `/rest/v1` est fourni par erreur
- configuration de session persistante avec PKCE

## Conséquence de maintenance

Une évolution Supabase peut impacter:

- auth
- rôles et permissions
- stores Pinia
- services métier
- backend Express
