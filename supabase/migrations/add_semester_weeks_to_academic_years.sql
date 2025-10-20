-- Ajouter les colonnes pour les semaines de semestres
ALTER TABLE academic_years
ADD COLUMN IF NOT EXISTS autumn_start_week INTEGER DEFAULT 38,
ADD COLUMN IF NOT EXISTS autumn_end_week INTEGER DEFAULT 7,
ADD COLUMN IF NOT EXISTS spring_start_week INTEGER DEFAULT 8,
ADD COLUMN IF NOT EXISTS spring_end_week INTEGER DEFAULT 37;

-- Ajouter des commentaires pour documenter
COMMENT ON COLUMN academic_years.autumn_start_week IS 'Semaine de début du semestre d''automne (défaut: 38)';
COMMENT ON COLUMN academic_years.autumn_end_week IS 'Semaine de fin du semestre d''automne (défaut: 7, année suivante)';
COMMENT ON COLUMN academic_years.spring_start_week IS 'Semaine de début du semestre de printemps (défaut: 8)';
COMMENT ON COLUMN academic_years.spring_end_week IS 'Semaine de fin du semestre de printemps (défaut: 37)';

-- Mettre à jour les données existantes si nécessaire
UPDATE academic_years
SET 
  autumn_start_week = 38,
  autumn_end_week = 7,
  spring_start_week = 8,
  spring_end_week = 37
WHERE autumn_start_week IS NULL;
