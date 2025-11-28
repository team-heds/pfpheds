-- Migration sécurisée : Ajouter les colonnes une par une avec vérification
-- Date: 2025-10-08
-- Description: Version sécurisée qui vérifie chaque colonne avant de l'ajouter

-- Fonction helper pour ajouter une colonne si elle n'existe pas
CREATE OR REPLACE FUNCTION add_column_if_not_exists(
  p_table text,
  p_column text,
  p_type text,
  p_default text DEFAULT NULL
) RETURNS void AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = p_table AND column_name = p_column
  ) THEN
    IF p_default IS NOT NULL THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s DEFAULT %s', p_table, p_column, p_type, p_default);
    ELSE
      EXECUTE format('ALTER TABLE %I ADD COLUMN %I %s', p_table, p_column, p_type);
    END IF;
    RAISE NOTICE 'Colonne % ajoutée à la table %', p_column, p_table;
  ELSE
    RAISE NOTICE 'Colonne % existe déjà dans la table %', p_column, p_table;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Ajouter les colonnes de dates
SELECT add_column_if_not_exists('quests', 'start_date', 'TIMESTAMPTZ', 'NULL');
SELECT add_column_if_not_exists('quests', 'end_date', 'TIMESTAMPTZ', 'NULL');

-- Ajouter les colonnes supplémentaires
SELECT add_column_if_not_exists('quests', 'icon', 'TEXT', '''🗺️''');
SELECT add_column_if_not_exists('quests', 'duration', 'INTEGER', 'NULL');
SELECT add_column_if_not_exists('quests', 'is_recurring', 'BOOLEAN', 'FALSE');
SELECT add_column_if_not_exists('quests', 'recurring_type', 'TEXT', 'NULL');
SELECT add_column_if_not_exists('quests', 'min_level', 'INTEGER', '1');
SELECT add_column_if_not_exists('quests', 'max_level', 'INTEGER', 'NULL');

-- Pour les arrays, syntaxe différente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'quests' AND column_name = 'target_houses'
  ) THEN
    ALTER TABLE quests ADD COLUMN target_houses TEXT[];
    RAISE NOTICE 'Colonne target_houses ajoutée';
  ELSE
    RAISE NOTICE 'Colonne target_houses existe déjà';
  END IF;
END $$;

-- Ajouter les commentaires
COMMENT ON COLUMN quests.start_date IS 'Date et heure de début de la quête (Europe/Zurich)';
COMMENT ON COLUMN quests.end_date IS 'Date et heure de fin de la quête (Europe/Zurich)';
COMMENT ON COLUMN quests.icon IS 'Emoji ou icône de la quête';
COMMENT ON COLUMN quests.duration IS 'Durée estimée en heures';
COMMENT ON COLUMN quests.is_recurring IS 'Quête récurrente';
COMMENT ON COLUMN quests.recurring_type IS 'Type: daily, weekly, monthly';
COMMENT ON COLUMN quests.min_level IS 'Niveau minimum requis';
COMMENT ON COLUMN quests.max_level IS 'Niveau maximum autorisé';
COMMENT ON COLUMN quests.target_houses IS 'Maisons ciblées (null = toutes)';

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_quests_start_date ON quests(start_date) WHERE start_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quests_end_date ON quests(end_date) WHERE end_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quests_active_period ON quests(start_date, end_date, status) 
WHERE status = 'active' AND start_date IS NOT NULL;

-- Créer la contrainte de validation des dates
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_quest_dates'
  ) THEN
    ALTER TABLE quests ADD CONSTRAINT check_quest_dates 
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date);
    RAISE NOTICE 'Contrainte check_quest_dates ajoutée';
  ELSE
    RAISE NOTICE 'Contrainte check_quest_dates existe déjà';
  END IF;
END $$;

-- Fonction trigger pour l'expiration automatique
CREATE OR REPLACE FUNCTION check_quest_expiration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date IS NOT NULL AND NEW.end_date < NOW() AT TIME ZONE 'Europe/Zurich' THEN
    NEW.status = 'expired';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger
DROP TRIGGER IF EXISTS trigger_check_quest_expiration ON quests;
CREATE TRIGGER trigger_check_quest_expiration
  BEFORE UPDATE ON quests
  FOR EACH ROW
  EXECUTE FUNCTION check_quest_expiration();

-- Nettoyer la fonction helper
DROP FUNCTION add_column_if_not_exists(text, text, text, text);

-- Afficher un résumé
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_name = 'quests' 
  AND column_name IN (
    'start_date', 'end_date', 'icon', 'duration', 
    'is_recurring', 'recurring_type', 'min_level', 
    'max_level', 'target_houses'
  );
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration terminée avec succès !';
  RAISE NOTICE '%/9 colonnes nouvelles présentes', col_count;
  RAISE NOTICE '========================================';
END $$;

-- Afficher la structure finale
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'quests'
AND column_name IN (
  'start_date', 'end_date', 'icon', 'duration', 
  'is_recurring', 'recurring_type', 'min_level', 
  'max_level', 'target_houses'
)
ORDER BY column_name;
