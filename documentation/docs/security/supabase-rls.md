---
title: Supabase RLS
---

## Principe

RLS protège les lignes accessibles selon l'utilisateur et son contexte d'authentification.

## Règle pratique

Toute table sensible doit avoir des policies explicites, pas implicites.

## Zones à surveiller

- profils
- institutions
- places
- données de vote
- documents

## Point critique du projet

Le front charge les permissions via `api_my_permissions`, mais cela ne remplace pas les policies RLS sur les tables métier.
