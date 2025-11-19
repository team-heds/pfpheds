-- Migration: Création de la table praticiens_formateurs
-- Date: 2025-11-18
-- Description: Table pour les praticiens formateurs avec lien vers les institutions

-- Créer la table praticiens_formateurs
CREATE TABLE IF NOT EXISTS public.praticiens_formateurs (
  -- Clé primaire
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- Informations personnelles
  "prenom" TEXT,
  "nom" TEXT,
  "mail" TEXT,
  
  -- Lien vers l'institution
  "institution_id" TEXT, -- FK vers institutions.InstitutionId
  "institution" TEXT, -- Nom de l'institution (dupliqué pour performance)
  "localite" TEXT, -- Localité de l'institution
  
  -- Métadonnées
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les recherches
CREATE INDEX IF NOT EXISTS idx_praticiens_formateurs_nom ON public.praticiens_formateurs("nom");
CREATE INDEX IF NOT EXISTS idx_praticiens_formateurs_prenom ON public.praticiens_formateurs("prenom");
CREATE INDEX IF NOT EXISTS idx_praticiens_formateurs_mail ON public.praticiens_formateurs("mail");
CREATE INDEX IF NOT EXISTS idx_praticiens_formateurs_institution_id ON public.praticiens_formateurs("institution_id");
CREATE INDEX IF NOT EXISTS idx_praticiens_formateurs_institution ON public.praticiens_formateurs("institution");

-- Trigger pour UpdatedAt automatique
CREATE OR REPLACE FUNCTION update_praticiens_formateurs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updated_at" = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER praticiens_formateurs_updated_at
  BEFORE UPDATE ON public.praticiens_formateurs
  FOR EACH ROW
  EXECUTE FUNCTION update_praticiens_formateurs_updated_at();

-- Row Level Security (RLS)
ALTER TABLE public.praticiens_formateurs ENABLE ROW LEVEL SECURITY;

-- Politique: Lecture publique (tous les utilisateurs authentifiés)
CREATE POLICY "Praticiens formateurs are viewable by authenticated users"
  ON public.praticiens_formateurs
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique: Lecture publique anonyme (optionnel, pour affichage public)
CREATE POLICY "Praticiens formateurs are viewable by everyone"
  ON public.praticiens_formateurs
  FOR SELECT
  TO anon
  USING (true);

-- Politique: Insertion/Mise à jour/Suppression réservée aux utilisateurs authentifiés
CREATE POLICY "Praticiens formateurs are editable by authenticated users"
  ON public.praticiens_formateurs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Commentaires
COMMENT ON TABLE public.praticiens_formateurs IS 'Praticiens formateurs pour les places de formation pratique';
COMMENT ON COLUMN public.praticiens_formateurs."id" IS 'Identifiant unique du praticien formateur';
COMMENT ON COLUMN public.praticiens_formateurs."prenom" IS 'Prénom du praticien';
COMMENT ON COLUMN public.praticiens_formateurs."nom" IS 'Nom de famille du praticien';
COMMENT ON COLUMN public.praticiens_formateurs."mail" IS 'Email de contact du praticien';
COMMENT ON COLUMN public.praticiens_formateurs."institution_id" IS 'ID de l''institution associée (FK vers institutions)';
COMMENT ON COLUMN public.praticiens_formateurs."institution" IS 'Nom de l''institution (dupliqué pour performance)';
COMMENT ON COLUMN public.praticiens_formateurs."localite" IS 'Localité de l''institution';

-- Afficher un message de succès
DO $$
BEGIN
  RAISE NOTICE 'Table praticiens_formateurs créée avec succès avec % colonnes', 
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'praticiens_formateurs');
END $$;
