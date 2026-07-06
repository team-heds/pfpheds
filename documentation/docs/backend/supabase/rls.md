---
title: Supabase RLS et sécurité
---

## Rôle

RLS sert de dernier niveau d'enforcement côté base.

## Ce qu'il faut garder en tête

- un accès autorisé par le front peut rester refusé par la base
- un compte admin front ne doit pas faire oublier la sécurité base
- le backend peut parfois utiliser une service key et contourner RLS

## À vérifier pour chaque table sensible

- `select`
- `insert`
- `update`
- `delete`

## Zones critiques

- `user_profiles`
- tables PFP
- tables de votation
- tables de stockage et documents
