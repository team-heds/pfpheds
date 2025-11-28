---
title: Migration Firebase → Supabase
---

Guide pour migrer certaines données de Firebase RTDB vers Supabase Postgres.

## Principe

- Exporter les données RTDB (JSON) pour une ressource (ex: `Places`)
- Utiliser un script SQL d’import qui lit un blob JSON et insère dans les tables cibles
- Normaliser types/valeurs (booleans, nombres, dates)

## Import des places (existant)

Fichier: `supabase_migrations/20251106_import_places_from_json.sql`

Étapes:
1. Ouvrir le fichier et coller l’export JSON RTDB entre le bloc `$$ ... $$` (section `WITH src AS (...)`)
2. Exécuter avec `psql` sur la base Supabase

```bash
psql "$DATABASE_URL" -f supabase_migrations/20251106_import_places_from_json.sql
```

Le script:
- Parse le JSON source
- Mappe les champs connus (spécialités, langues, PFPx, fileURL, etc.)
- Insère dans `public.places` (schéma défini par `20251028_create_places.sql`)

## Mappage courant (exemple)

- RTDB `IDPlace` → `PlaceId`
- RTDB `NomPlace` → `NomPlace`
- RTDB `fileURL` → `fileURL`
- RTDB `PFP1A`, `PFP2`, ... → colonnes JSONB `PFP1A`, `PFP2`, ...
- RTDB `MSQ`, `REHAB`, `AMBU`, `NEUROGER`, `SYSINT` → booleans de même nom
- RTDB `FR`, `DE`, `IT`, `ENG` → booleans langues
- `praticiensFormateurs` → `praticiensFormateurs` (TEXT[])

## Conseils

- Sauvegarder la base avant tout import (dump)
- Itérer par petits lots, valider puis élargir
- Uniformiser les booléens (`"true"` → `true`), nombres (`'1'` → `1`)
- Garder une trace des correspondances de champs dans ce fichier
- Ajouter des index après import si des colonnes deviennent critiques
## Vérifications

```sql
-- Total lignes importées
select count(*) from public.places;

-- Exemples de contrôles
select PlaceId, NomPlace from public.places where fileURL is null;
select * from public.places where "PFP1A"::text = '{}'::text;
