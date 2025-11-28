-- Migration : S'assurer que avatar_url peut stocker de grandes chaînes base64
-- Date: 2025-10-08
-- Description: Modifier la colonne avatar_url pour accepter du TEXT (illimité)

-- Vérifier le type actuel de la colonne
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'user_profiles' 
AND column_name = 'avatar_url';

-- Modifier le type de colonne en TEXT si nécessaire
ALTER TABLE user_profiles 
ALTER COLUMN avatar_url TYPE TEXT;

-- Vérifier après modification
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'user_profiles' 
AND column_name = 'avatar_url';

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE '✅ Colonne avatar_url configurée en TEXT (peut stocker des images base64 de toute taille)';
END $$;
