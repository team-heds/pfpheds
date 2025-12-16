-- Script pour copier les données des Offres PFP vers les Propositions PFP
-- Ce script initialise les propositions avec les valeurs actuelles des offres

UPDATE public.places 
SET 
  pfp1a_proposition = COALESCE(NULLIF(pfp1a_proposition, '{}'::jsonb), "PFP1A"::jsonb, '{}'::jsonb),
  pfp1b_proposition = COALESCE(NULLIF(pfp1b_proposition, '{}'::jsonb), "PFP1B"::jsonb, '{}'::jsonb),
  pfp2_proposition = COALESCE(NULLIF(pfp2_proposition, '{}'::jsonb), "PFP2"::jsonb, '{}'::jsonb),
  pfp3_proposition = COALESCE(NULLIF(pfp3_proposition, '{}'::jsonb), "PFP3"::jsonb, '{}'::jsonb),
  pfp4_proposition = COALESCE(NULLIF(pfp4_proposition, '{}'::jsonb), "PFP4"::jsonb, '{}'::jsonb)
WHERE 
  pfp1a_proposition IS NULL OR pfp1a_proposition = '{}'::jsonb OR
  pfp1b_proposition IS NULL OR pfp1b_proposition = '{}'::jsonb OR
  pfp2_proposition IS NULL OR pfp2_proposition = '{}'::jsonb OR
  pfp3_proposition IS NULL OR pfp3_proposition = '{}'::jsonb OR
  pfp4_proposition IS NULL OR pfp4_proposition = '{}'::jsonb;

-- Afficher le nombre de lignes mises à jour pour vérification
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Nombre de places mises à jour: %', updated_count;
END $$;

-- Vérification rapide des données copiées (optionnel)
SELECT 
  "PlaceId",
  "NomPlace",
  jsonb_typeof(pfp1a_proposition) as pfp1a_prop_type,
  jsonb_typeof(pfp1b_proposition) as pfp1b_prop_type,
  jsonb_typeof(pfp2_proposition) as pfp2_prop_type,
  jsonb_typeof(pfp3_proposition) as pfp3_prop_type,
  jsonb_typeof(pfp4_proposition) as pfp4_prop_type
FROM public.places 
WHERE pfp1a_proposition IS NOT NULL
LIMIT 5;
