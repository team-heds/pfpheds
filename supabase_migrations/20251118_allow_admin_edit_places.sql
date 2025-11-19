-- Migration: Permettre aux admins de modifier les places
-- Date: 2025-11-18
-- Description: Ajoute une policy RLS pour que les utilisateurs authentifiés puissent modifier les places

-- Supprimer l'ancienne policy restrictive si elle existe
DROP POLICY IF EXISTS "Places are editable by service_role only" ON public.places;

-- Politique: Les utilisateurs authentifiés peuvent modifier les places
-- Note: Dans un environnement de production, vous devriez vérifier le rôle admin
CREATE POLICY "Places are editable by authenticated users"
  ON public.places
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Alternative: Si vous avez une table user_profiles avec un champ role
-- Décommentez ceci pour une sécurité renforcée:
/*
CREATE POLICY "Places are editable by admins only"
  ON public.places
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );
*/

-- Commentaire
COMMENT ON POLICY "Places are editable by authenticated users" ON public.places 
IS 'Permet aux utilisateurs authentifiés de modifier les places';
