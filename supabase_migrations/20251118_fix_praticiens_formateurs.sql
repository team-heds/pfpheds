-- Migration: Configuration de la table praticiens_formateurs existante
-- Date: 2025-11-18
-- Description: Ajout des fonctions manquantes et politiques RLS

-- 1. Créer la fonction pour le trigger set_timestamp si elle n'existe pas
CREATE OR REPLACE FUNCTION set_timestamp_praticiens_formateurs()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Vérifier que le trigger existe, sinon le créer
DROP TRIGGER IF EXISTS set_timestamp_praticiens_formateurs ON public.praticiens_formateurs;

CREATE TRIGGER set_timestamp_praticiens_formateurs 
  BEFORE UPDATE ON public.praticiens_formateurs 
  FOR EACH ROW
  EXECUTE FUNCTION set_timestamp_praticiens_formateurs();

-- 3. Activer Row Level Security si pas déjà fait
ALTER TABLE public.praticiens_formateurs ENABLE ROW LEVEL SECURITY;

-- 4. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Praticiens formateurs are viewable by everyone" ON public.praticiens_formateurs;
DROP POLICY IF EXISTS "Praticiens formateurs are viewable by authenticated users" ON public.praticiens_formateurs;
DROP POLICY IF EXISTS "Praticiens formateurs are editable by authenticated users" ON public.praticiens_formateurs;

-- 5. Créer les politiques RLS
-- Lecture publique (pour tous)
CREATE POLICY "Praticiens formateurs are viewable by everyone"
  ON public.praticiens_formateurs
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Édition réservée aux utilisateurs authentifiés
CREATE POLICY "Praticiens formateurs are editable by authenticated users"
  ON public.praticiens_formateurs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Ajouter des commentaires pour la documentation
COMMENT ON TABLE public.praticiens_formateurs IS 'Praticiens formateurs pour les places de formation pratique';
COMMENT ON COLUMN public.praticiens_formateurs.id IS 'Identifiant unique du praticien formateur (UUID ou TEXT)';
COMMENT ON COLUMN public.praticiens_formateurs.prenom IS 'Prénom du praticien';
COMMENT ON COLUMN public.praticiens_formateurs.nom IS 'Nom de famille du praticien';
COMMENT ON COLUMN public.praticiens_formateurs.mail IS 'Email de contact du praticien';
COMMENT ON COLUMN public.praticiens_formateurs.institution_id IS 'UUID de l''institution associée (FK vers institutions)';
COMMENT ON COLUMN public.praticiens_formateurs.institution IS 'Nom de l''institution (dupliqué pour performance)';
COMMENT ON COLUMN public.praticiens_formateurs.localite IS 'Localité de l''institution';

-- 7. Vérifier et afficher les informations
DO $$
DECLARE
  row_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Compter les lignes
  SELECT COUNT(*) INTO row_count FROM public.praticiens_formateurs;
  
  -- Compter les politiques
  SELECT COUNT(*) INTO policy_count 
  FROM pg_policies 
  WHERE tablename = 'praticiens_formateurs';
  
  RAISE NOTICE '✅ Configuration terminée:';
  RAISE NOTICE '   - Table praticiens_formateurs: OK';
  RAISE NOTICE '   - Trigger set_timestamp: OK';
  RAISE NOTICE '   - Politiques RLS: % actives', policy_count;
  RAISE NOTICE '   - Praticiens existants: %', row_count;
END $$;
