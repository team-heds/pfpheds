-- ============================================
-- TABLE POUR LE PLANNING ACADÉMIQUE (MINIBRICK)
-- ============================================
-- Cette table stocke les cellules du planning académique (vue annuelle/semestrielle)
-- Chaque cellule représente un module assigné à un jour spécifique d'une semaine

CREATE TABLE IF NOT EXISTS planning_cells (
  id BIGSERIAL PRIMARY KEY,
  
  -- Identifiants
  class_code VARCHAR(20) NOT NULL,     -- "bac26", "bac25", "bac26-pt"...
  week_number INTEGER NOT NULL,        -- Numéro de semaine 1-52
  day VARCHAR(10) NOT NULL,            -- "lundi", "mardi", "mercredi", "jeudi", "vendredi"
  
  -- Contenu de la cellule
  module_code VARCHAR(50),             -- Code du module (référence modules.code)
  
  -- Métadonnées
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte d'unicité : une seule cellule par jour/semaine/classe
  UNIQUE(class_code, week_number, day)
);

-- ============================================
-- INDEX POUR PERFORMANCE
-- ============================================

-- Index sur class_code pour filtrer rapidement par classe
CREATE INDEX IF NOT EXISTS idx_planning_cells_class 
  ON planning_cells(class_code);

-- Index sur week_number pour filtrer par semaine
CREATE INDEX IF NOT EXISTS idx_planning_cells_week 
  ON planning_cells(week_number);

-- Index sur module_code pour retrouver où un module est utilisé
CREATE INDEX IF NOT EXISTS idx_planning_cells_module 
  ON planning_cells(module_code);

-- Index composite pour les requêtes de semestre
CREATE INDEX IF NOT EXISTS idx_planning_cells_class_week 
  ON planning_cells(class_code, week_number);

-- ============================================
-- TRIGGER POUR UPDATED_AT
-- ============================================

-- Fonction trigger (créer seulement si elle n'existe pas)
CREATE OR REPLACE FUNCTION update_planning_cells_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS trigger_planning_cells_updated_at ON planning_cells;

-- Créer le trigger
CREATE TRIGGER trigger_planning_cells_updated_at
  BEFORE UPDATE ON planning_cells
  FOR EACH ROW
  EXECUTE FUNCTION update_planning_cells_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE planning_cells ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Planning cells lisibles par tous" ON planning_cells;
DROP POLICY IF EXISTS "Planning cells modifiables par admins" ON planning_cells;

-- Policy pour lecture publique
CREATE POLICY "Planning cells lisibles par tous" 
  ON planning_cells FOR SELECT 
  TO authenticated
  USING (true);

-- Policy pour modification (admin/editor)
CREATE POLICY "Planning cells modifiables par admins" 
  ON planning_cells FOR ALL
  TO authenticated
  USING (true)  -- À adapter selon vos besoins de sécurité
  WITH CHECK (true);

-- ============================================
-- COMMENTAIRES
-- ============================================

COMMENT ON TABLE planning_cells IS 
  'Cellules du planning académique (vue minibrick). Une cellule = un module assigné à un jour/semaine spécifique.';

COMMENT ON COLUMN planning_cells.class_code IS 
  'Code de la classe (ex: bac26, bac25, bac26-pt)';

COMMENT ON COLUMN planning_cells.week_number IS 
  'Numéro de semaine ISO (1-52)';

COMMENT ON COLUMN planning_cells.day IS 
  'Jour de la semaine (lundi, mardi, mercredi, jeudi, vendredi)';

COMMENT ON COLUMN planning_cells.module_code IS 
  'Code du module assigné (référence vers modules.code)';
