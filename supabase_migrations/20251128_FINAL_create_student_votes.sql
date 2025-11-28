-- SCRIPT COMPLET POUR CRÉER LA TABLE student_votes
-- Exécutez ce script dans Supabase Dashboard > SQL Editor

-- 1. Supprimer la table si elle existe (pour repartir de zéro)
DROP TABLE IF EXISTS public.student_votes CASCADE;

-- 2. Créer la table
CREATE TABLE public.student_votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pfp_type text NOT NULL,
  year text NOT NULL,
  choices jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  CONSTRAINT student_votes_user_pfp_year_key UNIQUE (user_id, pfp_type, year)
);

-- 3. Activer RLS
ALTER TABLE public.student_votes ENABLE ROW LEVEL SECURITY;

-- 4. Créer les policies (permissives pour l'instant)
CREATE POLICY "Allow authenticated users to view their own votes"
  ON public.student_votes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert votes"
  ON public.student_votes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to update their own votes"
  ON public.student_votes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. Vérifier que la table est bien créée
SELECT 
  tablename, 
  schemaname
FROM pg_tables 
WHERE tablename = 'student_votes' AND schemaname = 'public';

-- 6. Vérifier que RLS est activé
SELECT 
  tablename, 
  rowsecurity
FROM pg_tables 
WHERE tablename = 'student_votes' AND schemaname = 'public';
