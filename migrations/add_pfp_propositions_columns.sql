-- Ajouter les colonnes de propositions PFP à la table places
-- Ces colonnes permettront de stocker les propositions séparément des offres

ALTER TABLE public.places 
ADD COLUMN IF NOT EXISTS pfp1a_proposition JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS pfp1b_proposition JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS pfp2_proposition JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS pfp3_proposition JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS pfp4_proposition JSONB DEFAULT '{}';

-- Ajouter des commentaires pour documenter les colonnes
COMMENT ON COLUMN public.places.pfp1a_proposition IS 'Propositions PFP1A par année (JSONB avec année comme clé)';
COMMENT ON COLUMN public.places.pfp1b_proposition IS 'Propositions PFP1B par année (JSONB avec année comme clé)';
COMMENT ON COLUMN public.places.pfp2_proposition IS 'Propositions PFP2 par année (JSONB avec année comme clé)';
COMMENT ON COLUMN public.places.pfp3_proposition IS 'Propositions PFP3 par année (JSONB avec année comme clé)';
COMMENT ON COLUMN public.places.pfp4_proposition IS 'Propositions PFP4 par année (JSONB avec année comme clé)';
