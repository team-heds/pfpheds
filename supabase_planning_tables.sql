-- ========================================
-- TABLE PLANNING UNIFIÉ - SUPABASE
-- ========================================
-- À exécuter dans l'éditeur SQL de Supabase
-- 
-- NOTE: La table 'modules' existe déjà dans votre base
-- On crée uniquement la table des créneaux horaires

-- Table des créneaux horaires du planning
CREATE TABLE IF NOT EXISTS planning_time_slots (
  id BIGSERIAL PRIMARY KEY,
  class_code VARCHAR(20) NOT NULL, -- Ex: "bac26", "bac26-pt", "bac26-ee"
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 52),
  day VARCHAR(10) NOT NULL, -- "lundi", "mardi", "mercredi", "jeudi", "vendredi"
  day_index INTEGER NOT NULL CHECK (day_index >= 0 AND day_index <= 4), -- 0=lundi, 4=vendredi
  date VARCHAR(10), -- Format DD.MM.YYYY
  start_time VARCHAR(5) NOT NULL, -- Format HH:MM
  end_time VARCHAR(5) NOT NULL, -- Format HH:MM
  module_code VARCHAR(50), -- Référence à course_modules.code
  course_title TEXT, -- Titre spécifique du cours
  activity TEXT, -- Détails de l'activité
  teachers TEXT[] DEFAULT ARRAY[]::TEXT[], -- Liste des enseignants
  room VARCHAR(50), -- Salle
  notes TEXT, -- Notes diverses
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte unique: une seule entrée par classe/semaine/jour/heure
  UNIQUE(class_code, week_number, day, start_time),
  
  -- Clé étrangère vers la table modules existante (optionnel)
  FOREIGN KEY (module_code) REFERENCES modules(code) ON DELETE SET NULL
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_planning_slots_class_week 
  ON planning_time_slots(class_code, week_number);

CREATE INDEX IF NOT EXISTS idx_planning_slots_module 
  ON planning_time_slots(module_code);

CREATE INDEX IF NOT EXISTS idx_planning_slots_day 
  ON planning_time_slots(day_index);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour planning_time_slots
DROP TRIGGER IF EXISTS update_planning_slots_updated_at ON planning_time_slots;
CREATE TRIGGER update_planning_slots_updated_at
  BEFORE UPDATE ON planning_time_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE planning_time_slots ENABLE ROW LEVEL SECURITY;

-- Politiques RLS : tout le monde peut lire, seuls les admins peuvent modifier
-- (À adapter selon vos besoins d'authentification)

-- Supprimer les policies existantes si elles existent
DROP POLICY IF EXISTS "Créneaux lisibles par tous" ON planning_time_slots;
DROP POLICY IF EXISTS "Créneaux modifiables par admins" ON planning_time_slots;

-- Policy pour lecture publique des créneaux
CREATE POLICY "Créneaux lisibles par tous" 
  ON planning_time_slots FOR SELECT 
  TO authenticated
  USING (true);

-- Policy pour écriture admin des créneaux
CREATE POLICY "Créneaux modifiables par admins" 
  ON planning_time_slots FOR ALL
  TO authenticated
  USING (true) -- À remplacer par une vérification du rôle admin
  WITH CHECK (true);

-- ========================================
-- COMMENTAIRES
-- ========================================

COMMENT ON TABLE planning_time_slots IS 'Créneaux horaires détaillés du planning hebdomadaire pour chaque classe';
COMMENT ON TABLE modules IS 'Table existante - Modules de cours/formations avec leurs codes, numéros et couleurs';

COMMENT ON COLUMN planning_time_slots.class_code IS 'Code de la classe (ex: bac26 = Bachelor 2026 temps plein, bac26-pt = temps partiel, bac26-ee = en emploi)';
COMMENT ON COLUMN planning_time_slots.week_number IS 'Numéro de semaine ISO (1-52). Semestre printemps: S8-S37, Automne: S38-S52 puis S1-S7';
COMMENT ON COLUMN planning_time_slots.day_index IS 'Index du jour pour tri: 0=lundi, 1=mardi, 2=mercredi, 3=jeudi, 4=vendredi';
COMMENT ON COLUMN planning_time_slots.teachers IS 'Tableau des noms d''enseignants assignés au créneau';
