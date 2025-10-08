-- Migration: Ajouter la colonne is_active à la table challenges si elle n'existe pas
-- Date: 2025-10-08

-- Vérifier et ajouter la colonne is_active
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'challenges' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE challenges ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    RAISE NOTICE 'Colonne is_active ajoutée à la table challenges';
  ELSE
    RAISE NOTICE 'Colonne is_active existe déjà dans la table challenges';
  END IF;
END $$;

-- Si une ancienne colonne 'active' existe, copier ses valeurs vers 'is_active' puis la supprimer
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'challenges' AND column_name = 'active'
  ) THEN
    -- Copier les valeurs
    UPDATE challenges SET is_active = active WHERE is_active IS NULL;
    
    -- Supprimer l'ancienne colonne
    ALTER TABLE challenges DROP COLUMN active;
    
    RAISE NOTICE 'Colonne active migrée vers is_active et supprimée';
  END IF;
END $$;

-- Ajouter un commentaire
COMMENT ON COLUMN challenges.is_active IS 'Indique si le défi est actif et visible pour les utilisateurs';

-- Créer un index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_challenges_is_active ON challenges(is_active) WHERE is_active = TRUE;

-- Afficher le résultat
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'challenges' AND column_name = 'is_active';
