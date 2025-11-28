-- Migration: Création de la table student_votes pour la gestion des votes étudiants
-- Date: 2025-11-28
-- Description: Cette table stocke les votes des étudiants pour les places de formation pratique (PFP)

-- Supprimer la table si elle existe (pour faciliter les tests)
DROP TABLE IF EXISTS public.student_votes CASCADE;

-- Créer la table student_votes
CREATE TABLE public.student_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pfp_type text NOT NULL CHECK (pfp_type IN ('PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4')),
  year text NOT NULL CHECK (year ~ '^\d{4}$'), -- Format: '2026', '2027', etc.
  choices jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Contrainte: un étudiant ne peut voter qu'une seule fois par type PFP et par année
  CONSTRAINT student_votes_user_pfp_year_unique UNIQUE (user_id, pfp_type, year)
);

-- Créer un index pour améliorer les performances de recherche
CREATE INDEX idx_student_votes_user_id ON public.student_votes(user_id);
CREATE INDEX idx_student_votes_pfp_year ON public.student_votes(pfp_type, year);

-- Activer Row Level Security (RLS)
ALTER TABLE public.student_votes ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres votes
DROP POLICY IF EXISTS "student_votes_select_own" ON public.student_votes;
CREATE POLICY "student_votes_select_own"
  ON public.student_votes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent insérer leurs propres votes
DROP POLICY IF EXISTS "student_votes_insert_own" ON public.student_votes;
CREATE POLICY "student_votes_insert_own"
  ON public.student_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent mettre à jour leurs propres votes
DROP POLICY IF EXISTS "student_votes_update_own" ON public.student_votes;
CREATE POLICY "student_votes_update_own"
  ON public.student_votes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Les utilisateurs peuvent supprimer leurs propres votes
DROP POLICY IF EXISTS "student_votes_delete_own" ON public.student_votes;
CREATE POLICY "student_votes_delete_own"
  ON public.student_votes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fonction trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_student_votes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS set_student_votes_updated_at ON public.student_votes;
CREATE TRIGGER set_student_votes_updated_at
  BEFORE UPDATE ON public.student_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_student_votes_updated_at();

-- Commentaires pour la documentation
COMMENT ON TABLE public.student_votes IS 'Stocke les votes des étudiants pour les places de formation pratique';
COMMENT ON COLUMN public.student_votes.id IS 'Identifiant unique du vote';
COMMENT ON COLUMN public.student_votes.user_id IS 'Référence à l''utilisateur qui a voté';
COMMENT ON COLUMN public.student_votes.pfp_type IS 'Type de PFP (PFP1A, PFP1B, PFP2, PFP3, PFP4)';
COMMENT ON COLUMN public.student_votes.year IS 'Année du vote (format: 2026, 2027, etc.)';
COMMENT ON COLUMN public.student_votes.choices IS 'Array JSON des choix de places ordonnés par préférence';
COMMENT ON COLUMN public.student_votes.created_at IS 'Date de création du vote';
COMMENT ON COLUMN public.student_votes.updated_at IS 'Date de dernière modification du vote';

-- Vérification de la création
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'student_votes'
  ) THEN
    RAISE NOTICE '✅ Table student_votes créée avec succès';
  ELSE
    RAISE EXCEPTION '❌ Échec de la création de la table student_votes';
  END IF;
END $$;
