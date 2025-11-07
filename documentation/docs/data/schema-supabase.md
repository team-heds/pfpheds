---
title: Schéma Supabase
---

Vue d’ensemble du schéma de données côté Supabase/Postgres.

## Tables principales

- `public.user_profiles`
  - `id UUID` (PK)
  - `user_id TEXT` (UID auth; unique)
  - `email TEXT`
  - `role TEXT` (enum logique: admin, user, teacher, ...)
  - `house TEXT` (harmonis|elaris|doloris|solencia)
  - `permissions TEXT[]` (ajoutée par `add_permissions_to_user_profiles.sql`)
  - Index: `idx_user_profiles_user_id`, `idx_user_profiles_email`, `idx_user_profiles_role`, `idx_user_profiles_house`, `idx_user_profiles_permissions (GIN)`

- `public.gamification_data`
  - `user_id TEXT` (unique), `points INT`, `level INT`, `badges JSONB`, ...
  - Index: `idx_gamification_user_id`, `idx_gamification_house`, `idx_gamification_points`

- `public.institutions`
  - `InstitutionId TEXT` (PK), `Name TEXT`, `Canton TEXT`, `Latitude NUMERIC`, `Longitude NUMERIC`, `ImageURL JSONB`, ...
  - Triggers: update auto `UpdatedAt`
  - RLS: activée, policies de lecture et service_role pour écritures (par défaut)

- `public.places`
  - `PlaceId TEXT` (PK), `InstitutionId TEXT`, `NomPlace TEXT`, `fileURL TEXT`
  - Spécialités (bool): `MSQ, SYSINT, AIGU, REHAB, AMBU, NEUROGER`
  - Langues (bool): `FR, DE, IT, ENG`
  - Capacités (JSONB): `PFP1A, PFP1B, PFP2, PFP3, PFP4`
  - `Remarques JSONB`, `praticiensFormateurs TEXT[]`
  - Index: par institution, nom, canton; GIN sur JSONB, composites sur spécialités/langues
  - RLS: activée; lecture authenticated/anon (exemples) et write `service_role`

## Relations

- `places.InstitutionId` → `institutions.InstitutionId` (FK conceptuelle; définir un FK explicite si requis)
- `gamification_data.user_id` ↔ `user_profiles.user_id`

## RLS (Row-Level Security)

- Activée sur `user_profiles`, `gamification_data`, `institutions`, `places`
- Policies d’exemple fournies dans les migrations; à adapter selon les besoins métiers

## Fonctions & vues utiles

- Triggers d’`updated_at`
- `handle_new_user()` (création profil/gamification à l’inscription)
- Vues: `user_profiles_complete`
- RPC permissions: `get_user_permissions(uid TEXT)` (cf. `add_permissions_to_user_profiles.sql`)

## Exemples de requêtes

```sql
-- Institutions avec coordonnées manquantes
select "InstitutionId", "Name" from public.institutions where "Latitude" is null or "Longitude" is null;

-- Places REHAB en FR ou DE
select "PlaceId", "NomPlace", "Canton"
from public.places
where "REHAB" is true and ("FR" is true or "DE" is true)
order by "NomPlace";

-- Permissions d’un utilisateur
select get_user_permissions('USER_UID');
```
