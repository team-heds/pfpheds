-- Migration: Création de la table places
-- Date: 2025-10-28
-- Description: Table pour les places de stage (PFP) avec fichiers PDF

-- Créer la table places
CREATE TABLE IF NOT EXISTS public.places (
  -- Clé primaire
  "PlaceId" TEXT PRIMARY KEY,
  
  -- Informations de base
  "NomPlace" TEXT,
  "InstitutionId" TEXT, -- FK vers institutions
  "fileURL" TEXT, -- URL du fichier PDF (Firebase Storage pour l'instant)
  
  -- Spécialités (domaines de formation)
  "MSQ" BOOLEAN DEFAULT FALSE,
  "SYSINT" BOOLEAN DEFAULT FALSE,
  "AIGU" BOOLEAN DEFAULT FALSE,
  "REHAB" BOOLEAN DEFAULT FALSE,
  "AMBU" BOOLEAN DEFAULT FALSE,
  "NEUROGER" BOOLEAN DEFAULT FALSE,
  
  -- Langues
  "FR" BOOLEAN DEFAULT FALSE,
  "DE" BOOLEAN DEFAULT FALSE,
  "IT" BOOLEAN DEFAULT FALSE,
  "ENG" BOOLEAN DEFAULT FALSE,
  
  -- PFP par année (format JSONB pour 2025/2026)
  "PFP1A" JSONB DEFAULT '{}'::jsonb,
  "PFP1B" JSONB DEFAULT '{}'::jsonb,
  "PFP2" JSONB DEFAULT '{}'::jsonb,
  "PFP3" JSONB DEFAULT '{}'::jsonb,
  "PFP4" JSONB DEFAULT '{}'::jsonb,
  
  -- Remarques par année (format JSONB)
  "Remarques" JSONB DEFAULT '{}'::jsonb,
  
  -- Praticiens formateurs (array d'IDs)
  "praticiensFormateurs" TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Champs dupliqués de l'institution (pour performance)
  "InstitutionName" TEXT,
  "AccordCadreDate" DATE,
  "Canton" TEXT,
  "Categorie" TEXT,
  "ConventionDate" DATE,
  "Lieu" TEXT,
  
  -- Métadonnées
  "CreatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "UpdatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_places_institution_id ON public.places("InstitutionId");
CREATE INDEX IF NOT EXISTS idx_places_nom ON public.places("NomPlace");
CREATE INDEX IF NOT EXISTS idx_places_canton ON public.places("Canton");

-- Index GIN pour les recherches dans JSONB
CREATE INDEX IF NOT EXISTS idx_places_pfp1a_gin ON public.places USING GIN ("PFP1A");
CREATE INDEX IF NOT EXISTS idx_places_pfp2_gin ON public.places USING GIN ("PFP2");

-- Index composites pour les filtres de spécialités
CREATE INDEX IF NOT EXISTS idx_places_specialites ON public.places("MSQ", "SYSINT", "AIGU", "REHAB", "AMBU", "NEUROGER");
CREATE INDEX IF NOT EXISTS idx_places_langues ON public.places("FR", "DE", "IT", "ENG");

-- Trigger pour UpdatedAt automatique
CREATE OR REPLACE FUNCTION update_places_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."UpdatedAt" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER places_updated_at
  BEFORE UPDATE ON public.places
  FOR EACH ROW
  EXECUTE FUNCTION update_places_updated_at();

-- Row Level Security (RLS)
ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

-- Politique: Lecture publique (tous les utilisateurs authentifiés)
CREATE POLICY "Places are viewable by authenticated users"
  ON public.places
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique: Lecture publique anonyme (optionnel, pour affichage public)
CREATE POLICY "Places are viewable by everyone"
  ON public.places
  FOR SELECT
  TO anon
  USING (true);

-- Politique: Insertion/Mise à jour/Suppression réservée aux admins
CREATE POLICY "Places are editable by service_role only"
  ON public.places
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Commentaires
COMMENT ON TABLE public.places IS 'Places de stage (PFP) pour les étudiants en physiothérapie';
COMMENT ON COLUMN public.places."PlaceId" IS 'Identifiant unique de la place (ex: -NzBxY...)';
COMMENT ON COLUMN public.places."NomPlace" IS 'Nom de la place ou du fichier PDF';
COMMENT ON COLUMN public.places."InstitutionId" IS 'ID de l''institution associée';
COMMENT ON COLUMN public.places."fileURL" IS 'URL du fichier PDF descriptif (Firebase Storage)';
COMMENT ON COLUMN public.places."PFP1A" IS 'Nombre de places PFP1A par année (JSONB: {"2025": "2", "2026": "3"})';
COMMENT ON COLUMN public.places."Remarques" IS 'Remarques par année (JSONB: {"2025": "...", "2026": "..."})';
COMMENT ON COLUMN public.places."praticiensFormateurs" IS 'IDs des praticiens formateurs (array)';

-- Afficher un message de succès
DO $$
BEGIN
  RAISE NOTICE 'Table places créée avec succès avec % colonnes', 
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'places');
END $$;
