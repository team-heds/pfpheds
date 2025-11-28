---
title: Supabase - Vue d'ensemble
---

Vue d’ensemble de l’intégration Supabase (Postgres + Auth + Storage) dans la plateforme.

## Client Supabase

Fichier: `src/supabase.js`

- Lit `VITE_SUPABASE_URL` et `VITE_SUPABASE_KEY`
- Normalise l’URL si elle contient `/rest/v1`
- Crée le client via `createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })`

## Données principales

- Institutions & Places: tables gérées via migrations (voir `supabase_migrations/`)
- Gamification: profils, maisons, points (migrations dédiées)

## Sécurité

- RLS activée sur les tables sensibles (voir `backend/supabase/rls` et `security/supabase-rls`)
- Les policies sont définies dans les fichiers SQL des migrations

## Migration des données

- Le répertoire `supabase_migrations/` contient les scripts (schema, import, policies)
- Voir `backend/supabase/migrations` pour la procédure d’application

## Services & Stores

- Les Stores (Pinia) encapsulent les requêtes Supabase pour l’UI
- Voir `backend/supabase/services` pour l’organisation par domaines
