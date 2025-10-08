-- Migration : Générer automatiquement display_name depuis forname et family_name
-- Date: 2025-10-08
-- Description: Créer display_name au format "Prénom Nom" pour tous les utilisateurs

-- 1. Mettre à jour tous les display_name existants qui sont NULL ou vides
UPDATE user_profiles
SET display_name = CONCAT(
  COALESCE(INITCAP(forname), ''),
  CASE 
    WHEN forname IS NOT NULL AND family_name IS NOT NULL THEN ' '
    ELSE ''
  END,
  COALESCE(INITCAP(family_name), '')
)
WHERE display_name IS NULL 
   OR display_name = '' 
   OR display_name = 'Utilisateur';

-- 2. Créer une fonction pour générer le display_name
CREATE OR REPLACE FUNCTION generate_display_name(p_forname TEXT, p_family_name TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN TRIM(CONCAT(
    COALESCE(INITCAP(p_forname), ''),
    CASE 
      WHEN p_forname IS NOT NULL AND p_family_name IS NOT NULL THEN ' '
      ELSE ''
    END,
    COALESCE(INITCAP(p_family_name), '')
  ));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Créer un trigger pour générer automatiquement display_name
CREATE OR REPLACE FUNCTION auto_generate_display_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Si display_name est NULL ou vide, le générer automatiquement
  IF NEW.display_name IS NULL OR NEW.display_name = '' OR NEW.display_name = 'Utilisateur' THEN
    NEW.display_name := generate_display_name(NEW.forname, NEW.family_name);
  END IF;
  
  -- Si display_name est toujours vide, utiliser l'email
  IF NEW.display_name = '' AND NEW.email IS NOT NULL THEN
    NEW.display_name := split_part(NEW.email, '@', 1);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_auto_generate_display_name ON user_profiles;

-- Créer le trigger sur INSERT et UPDATE
CREATE TRIGGER trigger_auto_generate_display_name
  BEFORE INSERT OR UPDATE OF forname, family_name, display_name
  ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_display_name();

-- 4. Afficher les résultats
DO $$
DECLARE
  count_updated INTEGER;
  count_total INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_updated
  FROM user_profiles
  WHERE display_name IS NOT NULL AND display_name != '';
  
  SELECT COUNT(*) INTO count_total
  FROM user_profiles;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ % profils sur % ont maintenant un display_name', count_updated, count_total;
  RAISE NOTICE '✅ Trigger auto-génération display_name ajouté';
  RAISE NOTICE '========================================';
END $$;

-- 5. Afficher quelques exemples
SELECT 
  user_id,
  email,
  forname,
  family_name,
  display_name
FROM user_profiles
LIMIT 10;
