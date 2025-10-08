-- Migration : Ajouter la colonne house à la table users_profiles
-- Date: 2025-10-08
-- Description: Ajouter la colonne pour stocker la maison d'appartenance de l'utilisateur

-- Ajouter la colonne house si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users_profiles' AND column_name = 'house'
  ) THEN
    ALTER TABLE users_profiles ADD COLUMN house TEXT CHECK (house IN ('harmonis', 'elaris', 'doloris', 'solencia'));
    RAISE NOTICE 'Colonne house ajoutée à la table users_profiles';
  ELSE
    RAISE NOTICE 'Colonne house existe déjà dans la table users_profiles';
  END IF;
END $$;

-- Ajouter un commentaire
COMMENT ON COLUMN users_profiles.house IS 'Maison d''appartenance de l''utilisateur (harmonis, elaris, doloris, solencia)';

-- Créer un index pour optimiser les requêtes par maison
CREATE INDEX IF NOT EXISTS idx_users_profiles_house ON users_profiles(house);

-- Fonction pour assigner aléatoirement une maison à un utilisateur
CREATE OR REPLACE FUNCTION assign_random_house(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  random_house TEXT;
  houses TEXT[] := ARRAY['harmonis', 'elaris', 'doloris', 'solencia'];
BEGIN
  -- Choisir une maison aléatoire
  random_house := houses[1 + floor(random() * 4)::int];
  
  -- Assigner la maison
  UPDATE users_profiles
  SET house = random_house
  WHERE id = user_id;
  
  RETURN random_house;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour répartir équitablement les utilisateurs sans maison
CREATE OR REPLACE FUNCTION distribute_users_to_houses()
RETURNS TABLE (
  house TEXT,
  users_assigned INTEGER
) AS $$
DECLARE
  users_without_house UUID[];
  current_house TEXT;
  house_index INTEGER := 0;
  houses TEXT[] := ARRAY['harmonis', 'elaris', 'doloris', 'solencia'];
BEGIN
  -- Récupérer tous les utilisateurs sans maison
  SELECT ARRAY_AGG(id) INTO users_without_house
  FROM users_profiles
  WHERE house IS NULL;
  
  -- Si aucun utilisateur sans maison, retourner
  IF users_without_house IS NULL THEN
    RAISE NOTICE 'Aucun utilisateur sans maison à répartir';
    RETURN;
  END IF;
  
  -- Répartir les utilisateurs équitablement
  FOR i IN 1..ARRAY_LENGTH(users_without_house, 1) LOOP
    current_house := houses[(house_index % 4) + 1];
    
    UPDATE users_profiles
    SET house = current_house
    WHERE id = users_without_house[i];
    
    house_index := house_index + 1;
  END LOOP;
  
  -- Retourner les statistiques
  RETURN QUERY
  SELECT 
    p.house,
    COUNT(*)::INTEGER as users_assigned
  FROM users_profiles p
  WHERE p.house IS NOT NULL
  GROUP BY p.house
  ORDER BY p.house;
  
  RAISE NOTICE '% utilisateurs répartis dans les maisons', ARRAY_LENGTH(users_without_house, 1);
END;
$$ LANGUAGE plpgsql;

-- Afficher un résumé
DO $$
DECLARE
  house_count INTEGER;
  users_without_house INTEGER;
BEGIN
  SELECT COUNT(*) INTO house_count
  FROM information_schema.columns
  WHERE table_name = 'users_profiles' AND column_name = 'house';
  
  SELECT COUNT(*) INTO users_without_house
  FROM users_profiles
  WHERE house IS NULL;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration de la colonne house terminée !';
  RAISE NOTICE 'Colonne house présente: %', house_count > 0;
  RAISE NOTICE 'Utilisateurs sans maison: %', users_without_house;
  RAISE NOTICE 'Fonctions utilitaires créées :';
  RAISE NOTICE '  - assign_random_house(user_id)';
  RAISE NOTICE '  - distribute_users_to_houses()';
  RAISE NOTICE '========================================';
  
  IF users_without_house > 0 THEN
    RAISE NOTICE 'Pour répartir les utilisateurs: SELECT * FROM distribute_users_to_houses();';
  END IF;
END $$;

-- Exemple d'utilisation (commenté - à décommenter pour l'utiliser) :
-- SELECT * FROM distribute_users_to_houses();
-- SELECT assign_random_house('user-uuid-here');
