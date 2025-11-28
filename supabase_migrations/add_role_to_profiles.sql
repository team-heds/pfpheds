-- Migration : Ajouter la colonne role à la table users_profiles
-- Date: 2025-10-08
-- Description: Ajouter un système de rôles pour la gestion des maisons et de la gamification

-- Créer un type ENUM pour les rôles si il n'existe pas
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'student',        -- Étudiant standard
    'house_coach',    -- Coach de maison
    'game_master',    -- Maître du jeu
    'teacher',        -- Enseignant
    'admin'           -- Administrateur
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Ajouter la colonne role si elle n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users_profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE users_profiles ADD COLUMN role user_role DEFAULT 'student';
    RAISE NOTICE 'Colonne role ajoutée à la table users_profiles';
  ELSE
    RAISE NOTICE 'Colonne role existe déjà dans la table users_profiles';
  END IF;
END $$;

-- Ajouter un commentaire
COMMENT ON COLUMN users_profiles.role IS 'Rôle de l''utilisateur dans le système de gamification';

-- Créer un index pour optimiser les requêtes par rôle
CREATE INDEX IF NOT EXISTS idx_users_profiles_role ON users_profiles(role);

-- Fonction pour promouvoir un utilisateur au rôle admin
CREATE OR REPLACE FUNCTION promote_user_to_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE users_profiles
  SET role = 'admin'
  WHERE email = user_email;
  
  RAISE NOTICE 'Utilisateur % promu au rôle admin', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour attribuer le rôle house_coach
CREATE OR REPLACE FUNCTION assign_house_coach(user_email TEXT, house_name TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE users_profiles
  SET role = 'house_coach',
      house = house_name
  WHERE email = user_email;
  
  RAISE NOTICE 'Utilisateur % assigné comme coach de %', user_email, house_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour attribuer le rôle game_master
CREATE OR REPLACE FUNCTION assign_game_master(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE users_profiles
  SET role = 'game_master'
  WHERE email = user_email;
  
  RAISE NOTICE 'Utilisateur % assigné comme Maître du Jeu', user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Afficher un résumé
DO $$
DECLARE
  role_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO role_count
  FROM information_schema.columns
  WHERE table_name = 'users_profiles' AND column_name = 'role';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration des rôles terminée !';
  RAISE NOTICE 'Colonne role présente: %', role_count > 0;
  RAISE NOTICE 'Fonctions utilitaires créées :';
  RAISE NOTICE '  - promote_user_to_admin(email)';
  RAISE NOTICE '  - assign_house_coach(email, house)';
  RAISE NOTICE '  - assign_game_master(email)';
  RAISE NOTICE '========================================';
END $$;

-- Exemple d'utilisation (commenté - à décommenter pour l'utiliser) :
-- SELECT promote_user_to_admin('votre.email@example.com');
-- SELECT assign_house_coach('coach.email@example.com', 'harmonis');
-- SELECT assign_game_master('master.email@example.com');
