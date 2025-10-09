-- =====================================================
-- SCHÉMA DE BASE SUPABASE - PLATEFORME PFPHEDS
-- =====================================================
-- Description: Création des tables essentielles pour l'authentification et les profils utilisateurs
-- Version: 1.0
-- Date: 2025-10-09

-- =====================================================
-- 1. TABLE USER_PROFILES (Profils utilisateurs)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE, -- UID de l'utilisateur (Firebase legacy ou Supabase)
  email TEXT NOT NULL,
  forname TEXT, -- Prénom
  family_name TEXT, -- Nom de famille
  display_name TEXT, -- Nom d'affichage généré
  avatar_url TEXT, -- URL de l'avatar
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'moderator', 'student', 'teacher', 'practitioner')),
  house TEXT CHECK (house IN ('harmonis', 'elaris', 'doloris', 'solencia')), -- Maison HES
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_house ON public.user_profiles(house);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_profiles_updated_at ON public.user_profiles;

CREATE TRIGGER trigger_update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. TABLE GAMIFICATION_DATA (Données de gamification)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.gamification_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  house TEXT CHECK (house IN ('harmonis', 'elaris', 'doloris', 'solencia')),
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  badges JSONB DEFAULT '[]'::jsonb,
  achievements JSONB DEFAULT '[]'::jsonb,
  completed_quests JSONB DEFAULT '[]'::jsonb,
  active_quests JSONB DEFAULT '[]'::jsonb,
  statistics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_gamification_user_id ON public.gamification_data(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_house ON public.gamification_data(house);
CREATE INDEX IF NOT EXISTS idx_gamification_points ON public.gamification_data(points DESC);

DROP TRIGGER IF EXISTS trigger_update_gamification_updated_at ON public.gamification_data;

CREATE TRIGGER trigger_update_gamification_updated_at
  BEFORE UPDATE ON public.gamification_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. POLITIQUES RLS (Row Level Security)
-- =====================================================

-- Activer RLS sur user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Politique : Tous les utilisateurs authentifiés peuvent lire les profils
DROP POLICY IF EXISTS "Public read access" ON public.user_profiles;
CREATE POLICY "Public read access"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique : Les utilisateurs peuvent modifier leur propre profil
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Politique : Les utilisateurs peuvent insérer leur propre profil
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

-- Activer RLS sur gamification_data
ALTER TABLE public.gamification_data ENABLE ROW LEVEL SECURITY;

-- Politique : Tous les utilisateurs authentifiés peuvent lire les données de gamification
DROP POLICY IF EXISTS "Public read access" ON public.gamification_data;
CREATE POLICY "Public read access"
  ON public.gamification_data
  FOR SELECT
  TO authenticated
  USING (true);

-- Politique : Les utilisateurs peuvent modifier leurs propres données
DROP POLICY IF EXISTS "Users can update own data" ON public.gamification_data;
CREATE POLICY "Users can update own data"
  ON public.gamification_data
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

-- Politique : Les utilisateurs peuvent insérer leurs propres données
DROP POLICY IF EXISTS "Users can insert own data" ON public.gamification_data;
CREATE POLICY "Users can insert own data"
  ON public.gamification_data
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

-- =====================================================
-- 4. FONCTION : Créer automatiquement le profil utilisateur
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, forname, family_name, created_at, updated_at)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'forname', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'family_name', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  -- Créer également les données de gamification
  INSERT INTO public.gamification_data (user_id, email, created_at, updated_at)
  VALUES (
    NEW.id::text,
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer le trigger sur auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 5. VUES UTILES
-- =====================================================

-- Vue: Profils complets avec données de gamification
CREATE OR REPLACE VIEW public.user_profiles_complete AS
SELECT 
  up.*,
  gd.house as gamification_house,
  gd.points,
  gd.level,
  gd.xp,
  gd.badges,
  gd.achievements
FROM public.user_profiles up
LEFT JOIN public.gamification_data gd ON up.user_id = gd.user_id;

-- =====================================================
-- 6. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction: Vérifier si un utilisateur a un rôle spécifique
CREATE OR REPLACE FUNCTION public.has_role(user_uid TEXT, required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_id = user_uid AND role = required_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction: Obtenir la maison d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_house(user_uid TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT house FROM public.user_profiles
    WHERE user_id = user_uid
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. RÉSUMÉ
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Schéma de base Supabase créé avec succès';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Tables créées:';
  RAISE NOTICE '  - user_profiles (profils utilisateurs)';
  RAISE NOTICE '  - gamification_data (données de gamification)';
  RAISE NOTICE '';
  RAISE NOTICE 'Politiques RLS activées:';
  RAISE NOTICE '  - Lecture publique pour utilisateurs authentifiés';
  RAISE NOTICE '  - Modification uniquement de son propre profil';
  RAISE NOTICE '';
  RAISE NOTICE 'Triggers créés:';
  RAISE NOTICE '  - Création automatique de profil lors de l inscription';
  RAISE NOTICE '  - Mise à jour automatique de updated_at';
  RAISE NOTICE '========================================';
END $$;

-- Afficher les statistiques
SELECT 
  'user_profiles' as table_name,
  COUNT(*) as total_rows
FROM public.user_profiles
UNION ALL
SELECT 
  'gamification_data' as table_name,
  COUNT(*) as total_rows
FROM public.gamification_data;
