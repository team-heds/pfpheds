-- Migration: Convertir les colonnes PFP de boolean vers text dans StudentsPhysio
-- Problème: Les colonnes pfp1a, pfp1b, pfp2, pfp3, pfp4 (et retake) existaient en boolean
-- mais le code envoie des notes texte (A, B, C, D, E, F).
-- Erreur: "invalid input syntax for type boolean: 'A'"
-- Note: Gère automatiquement les vues dépendantes (drop + recréation)

DO $$
DECLARE
  _view_record RECORD;
  _views_to_recreate TEXT[] := '{}';
  _view_defs TEXT[] := '{}';
  _i INT;
BEGIN
  -- 1. Trouver et sauvegarder toutes les vues qui dépendent de StudentsPhysio
  FOR _view_record IN
    SELECT DISTINCT dependee.relname AS view_name,
           pg_get_viewdef(dependee.oid, true) AS view_def
    FROM pg_depend
    JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid
    JOIN pg_class AS dependee ON pg_rewrite.ev_class = dependee.oid
    JOIN pg_class AS dependent ON pg_depend.refobjid = dependent.oid
    JOIN pg_namespace ON dependee.relnamespace = pg_namespace.oid
    WHERE dependent.relname = 'StudentsPhysio'
      AND dependee.relname != 'StudentsPhysio'
      AND pg_namespace.nspname = 'public'
  LOOP
    RAISE NOTICE 'Vue dépendante trouvée: %', _view_record.view_name;
    _views_to_recreate := array_append(_views_to_recreate, _view_record.view_name);
    _view_defs := array_append(_view_defs, _view_record.view_def);
    EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', _view_record.view_name);
    RAISE NOTICE 'Vue % supprimée', _view_record.view_name;
  END LOOP;

  -- 2. Convertir les colonnes PFP de boolean/autre vers text
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StudentsPhysio'
      AND column_name = 'pfp1a' AND data_type != 'text'
  ) THEN
    ALTER TABLE public."StudentsPhysio" ALTER COLUMN pfp1a TYPE text USING pfp1a::text;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StudentsPhysio'
      AND column_name = 'pfp1b' AND data_type != 'text'
  ) THEN
    ALTER TABLE public."StudentsPhysio" ALTER COLUMN pfp1b TYPE text USING pfp1b::text;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StudentsPhysio'
      AND column_name = 'pfp2' AND data_type != 'text'
  ) THEN
    ALTER TABLE public."StudentsPhysio" ALTER COLUMN pfp2 TYPE text USING pfp2::text;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StudentsPhysio'
      AND column_name = 'pfp3' AND data_type != 'text'
  ) THEN
    ALTER TABLE public."StudentsPhysio" ALTER COLUMN pfp3 TYPE text USING pfp3::text;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StudentsPhysio'
      AND column_name = 'pfp4' AND data_type != 'text'
  ) THEN
    ALTER TABLE public."StudentsPhysio" ALTER COLUMN pfp4 TYPE text USING pfp4::text;
  END IF;

  -- Colonnes retake
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StudentsPhysio'
      AND column_name = 'pfp1a_retake' AND data_type != 'text'
  ) THEN
    ALTER TABLE public."StudentsPhysio" ALTER COLUMN pfp1a_retake TYPE text USING pfp1a_retake::text;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StudentsPhysio'
      AND column_name = 'pfp1b_retake' AND data_type != 'text'
  ) THEN
    ALTER TABLE public."StudentsPhysio" ALTER COLUMN pfp1b_retake TYPE text USING pfp1b_retake::text;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StudentsPhysio'
      AND column_name = 'pfp2_retake' AND data_type != 'text'
  ) THEN
    ALTER TABLE public."StudentsPhysio" ALTER COLUMN pfp2_retake TYPE text USING pfp2_retake::text;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StudentsPhysio'
      AND column_name = 'pfp3_retake' AND data_type != 'text'
  ) THEN
    ALTER TABLE public."StudentsPhysio" ALTER COLUMN pfp3_retake TYPE text USING pfp3_retake::text;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'StudentsPhysio'
      AND column_name = 'pfp4_retake' AND data_type != 'text'
  ) THEN
    ALTER TABLE public."StudentsPhysio" ALTER COLUMN pfp4_retake TYPE text USING pfp4_retake::text;
  END IF;

  RAISE NOTICE 'Colonnes converties en text';

  -- 3. Recréer les vues
  FOR _i IN 1..array_length(_views_to_recreate, 1) LOOP
    EXECUTE format('CREATE OR REPLACE VIEW public.%I AS %s', _views_to_recreate[_i], _view_defs[_i]);
    RAISE NOTICE 'Vue % recréée', _views_to_recreate[_i];
  END LOOP;
END $$;

-- S'assurer que les colonnes absences et remarques existent
ALTER TABLE public."StudentsPhysio"
  ADD COLUMN IF NOT EXISTS pfp1a_absences numeric(4,1),
  ADD COLUMN IF NOT EXISTS pfp1b_absences numeric(4,1),
  ADD COLUMN IF NOT EXISTS pfp2_absences numeric(4,1),
  ADD COLUMN IF NOT EXISTS pfp3_absences numeric(4,1),
  ADD COLUMN IF NOT EXISTS pfp4_absences numeric(4,1),
  ADD COLUMN IF NOT EXISTS pfp1a_remarques text,
  ADD COLUMN IF NOT EXISTS pfp1b_remarques text,
  ADD COLUMN IF NOT EXISTS pfp2_remarques text,
  ADD COLUMN IF NOT EXISTS pfp3_remarques text,
  ADD COLUMN IF NOT EXISTS pfp4_remarques text;

-- Nettoyer les anciennes valeurs boolean converties en texte
UPDATE public."StudentsPhysio"
SET
  pfp1a = CASE WHEN pfp1a IN ('true', 'false') THEN NULL ELSE pfp1a END,
  pfp1b = CASE WHEN pfp1b IN ('true', 'false') THEN NULL ELSE pfp1b END,
  pfp2  = CASE WHEN pfp2  IN ('true', 'false') THEN NULL ELSE pfp2  END,
  pfp3  = CASE WHEN pfp3  IN ('true', 'false') THEN NULL ELSE pfp3  END,
  pfp4  = CASE WHEN pfp4  IN ('true', 'false') THEN NULL ELSE pfp4  END,
  pfp1a_retake = CASE WHEN pfp1a_retake IN ('true', 'false') THEN NULL ELSE pfp1a_retake END,
  pfp1b_retake = CASE WHEN pfp1b_retake IN ('true', 'false') THEN NULL ELSE pfp1b_retake END,
  pfp2_retake  = CASE WHEN pfp2_retake  IN ('true', 'false') THEN NULL ELSE pfp2_retake  END,
  pfp3_retake  = CASE WHEN pfp3_retake  IN ('true', 'false') THEN NULL ELSE pfp3_retake  END,
  pfp4_retake  = CASE WHEN pfp4_retake  IN ('true', 'false') THEN NULL ELSE pfp4_retake  END;

-- S'assurer que l'index unique existe
CREATE UNIQUE INDEX IF NOT EXISTS studentsphysio_user_year_key
  ON public."StudentsPhysio" (user_id, year);
