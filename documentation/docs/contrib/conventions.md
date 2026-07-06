---
title: Conventions projet
---

## Objectif

Garder des modifications lisibles dans un codebase multi-domaines.

## Conventions de base

- composants Vue en PascalCase
- logique transverse dans `composables/`
- logique métier dans `service/`
- etat partage dans `stores/`
- routes par domaine dans `src/router/routes/`

## Regle pratique

Avant d'ajouter un nouveau fichier:

1. verifier si la logique existe deja ailleurs
2. eviter de dupliquer un service Firebase et un service Supabase pour le meme besoin
3. documenter tout ajout structurant dans la doc
