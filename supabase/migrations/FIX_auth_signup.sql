-- =====================================================
-- FIX: Autoriser les inscriptions utilisateurs
-- Date: 2025-01-30
-- Problème: "Failed to create user: API error happened"
-- =====================================================

-- =====================================================
-- 1. TABLE USER_PROFILES
-- =====================================================

-- Créer la table user_profiles si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'student',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. POLITIQUES RLS POUR USER_PROFILES
-- =====================================================

-- Supprimer anciennes policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_profiles;

-- Policy: Tout le monde peut lire les profils (pour affichage public)
CREATE POLICY "Enable read access for all users"
  ON public.user_profiles
  FOR SELECT
  TO public
  USING (true);

-- Policy: Les utilisateurs authentifiés peuvent créer leur propre profil
CREATE POLICY "Enable insert for authenticated users only"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy: Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- =====================================================
-- 3. FONCTION TRIGGER POUR CRÉATION AUTO PROFIL
-- =====================================================

-- Supprimer ancienne fonction si existe
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Créer fonction pour créer automatiquement un profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Nouvel utilisateur'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer ancien trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Créer trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 4. PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO anon, authenticated;

-- =====================================================
-- 5. INDEX POUR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_at ON public.user_profiles(created_at);

-- =====================================================
-- 6. FONCTION POUR METTRE À JOUR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_updated_at ON public.user_profiles;

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 7. VÉRIFICATION
-- =====================================================

-- Afficher les policies créées
-- SELECT * FROM pg_policies WHERE tablename = 'user_profiles';

-- Afficher les triggers
-- SELECT * FROM pg_trigger WHERE tgname LIKE '%user%';

-- Tester l'insertion (remplacer les UUIDs par des valeurs réelles)
-- INSERT INTO public.user_profiles (id, email, full_name)
-- VALUES (gen_random_uuid(), 'test@example.com', 'Test User');
