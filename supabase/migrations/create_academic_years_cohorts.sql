-- Table pour les années académiques
CREATE TABLE IF NOT EXISTS academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE, -- ex: "2025-2026"
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les classes
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) NOT NULL UNIQUE, -- ex: "B25", "B26"
  name VARCHAR(100), -- ex: "Bachelor 2025"
  year_level INTEGER NOT NULL, -- 1, 2 ou 3 (année d'étude)
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_academic_years_active ON academic_years(is_active);
CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(code);
CREATE INDEX IF NOT EXISTS idx_classes_academic_year ON classes(academic_year_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
DROP TRIGGER IF EXISTS update_academic_years_updated_at ON academic_years;
CREATE TRIGGER update_academic_years_updated_at
  BEFORE UPDATE ON academic_years
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insérer les données initiales pour 2025-2026
INSERT INTO academic_years (name, start_date, end_date, is_active)
VALUES 
  ('2025-2026', '2025-09-01', '2026-08-31', true),
  ('2026-2027', '2026-09-01', '2027-08-31', false),
  ('2027-2028', '2027-09-01', '2028-08-31', false)
ON CONFLICT (name) DO NOTHING;

-- Récupérer l'ID de l'année active pour les classes
DO $$
DECLARE
  active_year_id UUID;
BEGIN
  SELECT id INTO active_year_id FROM academic_years WHERE name = '2025-2026';
  
  -- Insérer les classes pour 2025-2026
  INSERT INTO classes (code, name, year_level, academic_year_id)
  VALUES 
    ('B25', 'Bachelor 2025 - 1ère année', 1, active_year_id),
    ('B24', 'Bachelor 2024 - 2ème année', 2, active_year_id),
    ('B23', 'Bachelor 2023 - 3ème année', 3, active_year_id)
  ON CONFLICT (code) DO NOTHING;
END $$;

-- RLS (Row Level Security) - À adapter selon vos besoins
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture publique
DROP POLICY IF EXISTS "Allow public read access on academic_years" ON academic_years;
CREATE POLICY "Allow public read access on academic_years"
  ON academic_years FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow public read access on classes" ON classes;
CREATE POLICY "Allow public read access on classes"
  ON classes FOR SELECT
  USING (true);

-- Politique pour les admins (à adapter avec votre système d'authentification)
-- CREATE POLICY "Allow admin full access on academic_years"
--   ON academic_years
--   USING (auth.jwt() ->> 'role' = 'admin');

COMMENT ON TABLE academic_years IS 'Années académiques (ex: 2025-2026)';
COMMENT ON TABLE classes IS 'Classes (ex: B25, B24, B23) avec leur niveau d''étude pour une année donnée';
