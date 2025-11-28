-- =====================================================
-- FIX: Align user_profiles with production schema and enable signup
-- Date: 2025-11-05
-- =====================================================

-- 1) Ensure JSONB preferences column exists (some code paths expect it)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- 2) Recreate RLS policies using user_id (not id)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  EXECUTE 'DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_profiles';
  EXECUTE 'DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_profiles';
  EXECUTE 'DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles';
END $$;

CREATE POLICY "Enable read access for all users"
  ON public.user_profiles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for authenticated users only"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3) Trigger to auto-create minimal profile on new auth user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4) Grants (defensive)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO anon, authenticated;
