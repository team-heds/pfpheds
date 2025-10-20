-- =====================================================
-- TABLE: video_library
-- Description: Bibliothèque de toutes les vidéos Vimeo archivées depuis les tickets terminés
-- =====================================================

CREATE TABLE IF NOT EXISTS video_library (
  -- Identifiants
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES academic_tickets(id) ON DELETE SET NULL,
  
  -- Informations Vimeo
  vimeo_url TEXT NOT NULL,
  vimeo_id VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  
  -- Métadonnées vidéo
  duration INTEGER, -- Durée en minutes
  
  -- Organisation
  module_id UUID, -- Référence au module (peut être null)
  year_id UUID, -- Année académique (peut être null)
  type VARCHAR(50) DEFAULT 'cours', -- Type: cours, tp, demo, simulation, autre
  
  -- Métadonnées additionnelles
  person_filmed VARCHAR(255), -- Personne filmée
  filming_date DATE, -- Date du tournage
  published_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Date d'ajout à la bibliothèque
  
  -- Tags et catégorisation
  tags TEXT[], -- Array de tags
  
  -- Timestamps et audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Contraintes
  CONSTRAINT unique_vimeo_url UNIQUE(vimeo_url)
);

-- =====================================================
-- INDEX pour performances
-- =====================================================

-- Index sur vimeo_id pour recherches rapides
CREATE INDEX IF NOT EXISTS idx_video_library_vimeo_id ON video_library(vimeo_id);

-- Index sur module_id pour filtrage par module
CREATE INDEX IF NOT EXISTS idx_video_library_module_id ON video_library(module_id);

-- Index sur year_id pour filtrage par année
CREATE INDEX IF NOT EXISTS idx_video_library_year_id ON video_library(year_id);

-- Index sur type pour filtrage par type
CREATE INDEX IF NOT EXISTS idx_video_library_type ON video_library(type);

-- Index sur published_date pour tri chronologique
CREATE INDEX IF NOT EXISTS idx_video_library_published_date ON video_library(published_date DESC);

-- Index sur ticket_id pour liaison avec tickets
CREATE INDEX IF NOT EXISTS idx_video_library_ticket_id ON video_library(ticket_id);

-- Index GIN sur tags pour recherche dans les tags
CREATE INDEX IF NOT EXISTS idx_video_library_tags ON video_library USING GIN(tags);

-- =====================================================
-- RLS (Row Level Security) Policies
-- =====================================================

-- Activer RLS
ALTER TABLE video_library ENABLE ROW LEVEL SECURITY;

-- Politique : Tous les utilisateurs authentifiés peuvent lire
CREATE POLICY "Anyone authenticated can view videos"
  ON video_library
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique : Seuls admin et editor peuvent insérer
CREATE POLICY "Only admin and editor can insert videos"
  ON video_library
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Politique : Seuls admin et editor peuvent mettre à jour
CREATE POLICY "Only admin and editor can update videos"
  ON video_library
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'editor')
    )
  );

-- Politique : Seuls admin peuvent supprimer
CREATE POLICY "Only admin can delete videos"
  ON video_library
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour obtenir le nombre de vidéos par module
CREATE OR REPLACE FUNCTION get_module_video_count(p_module_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM video_library
  WHERE module_id = p_module_id;
$$ LANGUAGE SQL STABLE;

-- Fonction pour obtenir le nombre total de vidéos par année
CREATE OR REPLACE FUNCTION get_year_video_count(p_year_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM video_library
  WHERE year_id = p_year_id;
$$ LANGUAGE SQL STABLE;

-- Fonction pour obtenir les statistiques globales
CREATE OR REPLACE FUNCTION get_video_library_stats()
RETURNS JSON AS $$
  SELECT json_build_object(
    'total_videos', COUNT(*),
    'total_duration_minutes', COALESCE(SUM(duration), 0),
    'videos_by_type', (
      SELECT json_object_agg(type, count)
      FROM (
        SELECT type, COUNT(*) as count
        FROM video_library
        GROUP BY type
      ) type_counts
    ),
    'unique_modules', COUNT(DISTINCT module_id),
    'unique_years', COUNT(DISTINCT year_id)
  )
  FROM video_library;
$$ LANGUAGE SQL STABLE;

-- =====================================================
-- TRIGGER pour mise à jour automatique de updated_at (si nécessaire)
-- =====================================================

-- Note: Si vous ajoutez une colonne updated_at plus tard
-- CREATE OR REPLACE FUNCTION update_video_library_updated_at()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = NOW();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER video_library_updated_at
--   BEFORE UPDATE ON video_library
--   FOR EACH ROW
--   EXECUTE FUNCTION update_video_library_updated_at();

-- =====================================================
-- COMMENTAIRES POUR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE video_library IS 'Bibliothèque centralisée de toutes les vidéos Vimeo issues des tickets terminés';
COMMENT ON COLUMN video_library.id IS 'Identifiant unique de la vidéo dans la bibliothèque';
COMMENT ON COLUMN video_library.ticket_id IS 'Référence au ticket source (nullable si ticket supprimé)';
COMMENT ON COLUMN video_library.vimeo_url IS 'URL complète de la vidéo sur Vimeo';
COMMENT ON COLUMN video_library.vimeo_id IS 'ID unique Vimeo pour intégration player';
COMMENT ON COLUMN video_library.module_id IS 'Module académique associé';
COMMENT ON COLUMN video_library.year_id IS 'Année académique associée';
COMMENT ON COLUMN video_library.type IS 'Type de contenu: cours, tp, demo, simulation, autre';
COMMENT ON COLUMN video_library.tags IS 'Tags pour catégorisation et recherche';

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

-- Pour exécuter ce script dans Supabase:
-- 1. Aller dans SQL Editor
-- 2. Copier-coller ce script
-- 3. Exécuter
-- 4. Vérifier que la table et les policies sont créées
