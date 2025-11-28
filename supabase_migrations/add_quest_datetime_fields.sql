-- Migration: Ajouter les champs de date/heure avec fuseau horaire pour les quêtes
-- Date: 2025-10-08
-- Description: Ajout des champs start_date et end_date avec timezone pour gérer les quêtes planifiées

-- Ajouter les colonnes de dates
ALTER TABLE quests 
ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ DEFAULT NULL;

-- Ajouter les colonnes supplémentaires pour les quêtes
ALTER TABLE quests 
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT '🗺️',
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurring_type TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS min_level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_level INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS target_houses TEXT[] DEFAULT NULL;

-- Ajouter les commentaires explicatifs
COMMENT ON COLUMN quests.start_date IS 'Date et heure de début de la quête (fuseau horaire Europe/Zurich)';
COMMENT ON COLUMN quests.end_date IS 'Date et heure de fin de la quête (fuseau horaire Europe/Zurich)';
COMMENT ON COLUMN quests.icon IS 'Emoji ou icône représentant la quête';
COMMENT ON COLUMN quests.duration IS 'Durée estimée en heures';
COMMENT ON COLUMN quests.is_recurring IS 'Indique si la quête est récurrente';
COMMENT ON COLUMN quests.recurring_type IS 'Type de récurrence (daily, weekly, monthly)';
COMMENT ON COLUMN quests.min_level IS 'Niveau minimum requis';
COMMENT ON COLUMN quests.max_level IS 'Niveau maximum autorisé';
COMMENT ON COLUMN quests.target_houses IS 'Maisons ciblées (null = toutes les maisons)';

-- Créer un index pour optimiser les requêtes par date
CREATE INDEX IF NOT EXISTS idx_quests_start_date ON quests(start_date) WHERE start_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quests_end_date ON quests(end_date) WHERE end_date IS NOT NULL;

-- Créer un index composé pour les requêtes de quêtes actives dans une période
CREATE INDEX IF NOT EXISTS idx_quests_active_period ON quests(start_date, end_date, status) 
WHERE status = 'active' AND start_date IS NOT NULL;

-- Vérification: Les quêtes avec end_date doivent avoir une end_date >= start_date
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_quest_dates'
  ) THEN
    ALTER TABLE quests ADD CONSTRAINT check_quest_dates 
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);
  END IF;
END $$;

-- Fonction pour vérifier automatiquement si une quête est expirée
CREATE OR REPLACE FUNCTION check_quest_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Si la quête a une date de fin et qu'elle est dépassée, marquer comme expired
  IF NEW.end_date IS NOT NULL AND NEW.end_date < NOW() AT TIME ZONE 'Europe/Zurich' THEN
    NEW.status = 'expired';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour vérifier l'expiration lors de l'update
DROP TRIGGER IF EXISTS trigger_check_quest_expiration ON quests;
CREATE TRIGGER trigger_check_quest_expiration
  BEFORE UPDATE ON quests
  FOR EACH ROW
  EXECUTE FUNCTION check_quest_expiration();

-- Afficher un résumé des changements
DO $$
BEGIN
  RAISE NOTICE 'Migration terminée avec succès !';
  RAISE NOTICE 'Colonnes ajoutées: start_date (TIMESTAMPTZ), end_date (TIMESTAMPTZ)';
  RAISE NOTICE 'Index créés pour optimiser les performances';
  RAISE NOTICE 'Contrainte de vérification des dates ajoutée';
  RAISE NOTICE 'Trigger d''expiration automatique créé';
  RAISE NOTICE 'Fuseau horaire configuré: Europe/Zurich (Berne)';
END $$;
