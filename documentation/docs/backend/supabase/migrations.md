---
title: Migrations Supabase
---

## Source de vérité

Les migrations réellement présentes sont dans:

- `supabase/migrations/`

## Ce qu'il faut faire

- appliquer les migrations dans l'ordre logique
- vérifier l'impact métier avant exécution
- relire les changements liés aux permissions et au stockage

## Migrations structurantes

- permissions via `api_my_permissions`
- planning et classes
- votation et priorités
- storage institutions, avatars, documents étudiants

## Référence utile

Voir aussi:

- `data/migrations-catalog`
- `data/schema-supabase`
