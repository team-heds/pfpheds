-- Migration : Créer les profils user_profiles manquants depuis gamification_data
-- Date: 2025-10-08
-- Description: Créer automatiquement les profils user_profiles à partir des données gamification_data

-- Fonction pour extraire le prénom depuis un email (prenom.nom@domain.com → Prenom)
CREATE OR REPLACE FUNCTION extract_forname_from_email(email TEXT)
RETURNS TEXT AS $$
DECLARE
  username TEXT;
  parts TEXT[];
BEGIN
  -- Extraire la partie avant @
  username := split_part(email, '@', 1);
  
  -- Séparer par point
  parts := string_to_array(username, '.');
  
  -- Si on a au moins 2 parties, prendre la première et capitaliser
  IF array_length(parts, 1) >= 2 THEN
    RETURN initcap(parts[1]);
  ELSE
    -- Sinon retourner le username capitalisé
    RETURN initcap(username);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour extraire le nom depuis un email (prenom.nom@domain.com → Nom)
CREATE OR REPLACE FUNCTION extract_family_name_from_email(email TEXT)
RETURNS TEXT AS $$
DECLARE
  username TEXT;
  parts TEXT[];
BEGIN
  -- Extraire la partie avant @
  username := split_part(email, '@', 1);
  
  -- Séparer par point
  parts := string_to_array(username, '.');
  
  -- Si on a au moins 2 parties, prendre la deuxième et capitaliser
  IF array_length(parts, 1) >= 2 THEN
    RETURN initcap(parts[2]);
  ELSE
    -- Sinon retourner vide
    RETURN '';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Créer les profils manquants
INSERT INTO user_profiles (
  user_id,
  email,
  forname,
  family_name,
  display_name,
  is_active,
  created_at,
  updated_at
)
SELECT 
  gd.user_id,
  gd.email,
  extract_forname_from_email(gd.email) as forname,
  extract_family_name_from_email(gd.email) as family_name,
  NULL as display_name, -- Sera généré par le computed column si configuré
  true as is_active,
  NOW() as created_at,
  NOW() as updated_at
FROM gamification_data gd
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up
  WHERE up.user_id = gd.user_id
)
AND gd.email IS NOT NULL;

-- Afficher le résultat
DO $$
DECLARE
  count_created INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_created
  FROM user_profiles up
  INNER JOIN gamification_data gd ON up.user_id = gd.user_id
  WHERE up.created_at >= NOW() - INTERVAL '1 minute';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ % profils user_profiles créés depuis gamification_data', count_created;
  RAISE NOTICE '========================================';
END $$;

-- Ajouter une politique RLS pour la lecture publique si elle n'existe pas
DO $$
BEGIN
  -- Activer RLS si pas déjà fait
  ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
  
  -- Supprimer l'ancienne politique si elle existe
  DROP POLICY IF EXISTS "Public read access" ON user_profiles;
  
  -- Créer la nouvelle politique de lecture
  CREATE POLICY "Public read access"
    ON user_profiles
    FOR SELECT
    TO authenticated
    USING (true);
  
  RAISE NOTICE '✅ Politique RLS de lecture publique ajoutée à user_profiles';
END $$;

-- Créer un trigger pour créer automatiquement le profil lors de l'insertion dans gamification_data
CREATE OR REPLACE FUNCTION auto_create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si le profil existe déjà
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_id = NEW.user_id) THEN
    -- Créer le profil automatiquement
    INSERT INTO user_profiles (
      user_id,
      email,
      forname,
      family_name,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      NEW.user_id,
      NEW.email,
      extract_forname_from_email(NEW.email),
      extract_family_name_from_email(NEW.email),
      true,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Profil user_profiles créé automatiquement pour %', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS trigger_auto_create_user_profile ON gamification_data;

-- Créer le trigger
CREATE TRIGGER trigger_auto_create_user_profile
  AFTER INSERT ON gamification_data
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_user_profile();

-- Afficher le résumé final
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger de création automatique de profil ajouté';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RÉSUMÉ:';
END $$;

-- Afficher les statistiques
SELECT 
  'user_profiles' as table_name,
  COUNT(*) as total_profiles
FROM user_profiles
UNION ALL
SELECT 
  'gamification_data' as table_name,
  COUNT(*) as total_users
FROM gamification_data;
