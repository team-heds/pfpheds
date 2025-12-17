-- ============================================
-- Migration 003: Création table TRACKS (Filières)
-- Date: 2024-12-17
-- Description: Table de référence des filières SI/PHY
-- ⚠️ IDEMPOTENT: peut être exécuté plusieurs fois
-- ============================================

-- Table des filières
CREATE TABLE IF NOT EXISTS tracks (
  id TEXT PRIMARY KEY,                    -- 'SI' ou 'PHY'
  label TEXT NOT NULL,                    -- 'Soins Infirmiers' ou 'Physiothérapie'
  label_short TEXT NOT NULL,              -- 'SI' ou 'PHY'
  description TEXT,
  color TEXT DEFAULT '#3b82f6',           -- Couleur pour l'UI
  icon TEXT DEFAULT 'pi pi-briefcase',    -- Icône PrimeVue
  display_order INTEGER DEFAULT 0,        -- Ordre d'affichage
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_tracks_active ON tracks(is_active);

-- Insérer les filières (UPSERT pour idempotence)
INSERT INTO tracks (id, label, label_short, description, color, icon, display_order, is_active)
VALUES 
  ('SI', 'Soins Infirmiers', 'SI', 'Filière Bachelor en Soins Infirmiers', '#3b82f6', 'pi pi-heart', 1, true),
  ('PHY', 'Physiothérapie', 'PHY', 'Filière Bachelor en Physiothérapie', '#10b981', 'pi pi-user', 2, true)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  label_short = EXCLUDED.label_short,
  description = EXCLUDED.description,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_tracks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tracks_updated_at ON tracks;
CREATE TRIGGER tracks_updated_at
  BEFORE UPDATE ON tracks
  FOR EACH ROW
  EXECUTE FUNCTION update_tracks_updated_at();

-- RLS: Lecture publique (tout le monde peut voir les filières)
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tracks visible par tous" ON tracks;
CREATE POLICY "Tracks visible par tous" ON tracks
  FOR SELECT USING (true);

-- Vérification
SELECT '✅ Table tracks créée avec succès' AS status;
SELECT * FROM tracks;
