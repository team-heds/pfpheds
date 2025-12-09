-- =====================================================
-- FONCTION DE SUPPRESSION D'UTILISATEUR COMPLÈTE
-- =====================================================
-- Cette fonction permet de supprimer un utilisateur de auth.users
-- Elle doit être exécutée avec les privilèges service_role

-- Créer la fonction pour supprimer un utilisateur
CREATE OR REPLACE FUNCTION public.delete_user(user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER -- Exécute avec les privilèges du propriétaire (nécessaire pour auth.users)
SET search_path = public
AS $$
BEGIN
  -- Supprimer l'utilisateur de auth.users
  DELETE FROM auth.users WHERE id = user_id;
  
  -- Note: La suppression de user_profiles se fait automatiquement
  -- si vous avez une contrainte ON DELETE CASCADE
  -- Sinon, vous pouvez la faire manuellement ici :
  -- DELETE FROM public.user_profiles WHERE user_id = user_id::text;
END;
$$;

-- Donner les permissions d'exécution aux utilisateurs authentifiés
GRANT EXECUTE ON FUNCTION public.delete_user(UUID) TO authenticated;

-- Ajouter une politique RLS pour restreindre l'accès
-- Seulement les admins peuvent supprimer des utilisateurs
CREATE POLICY "Only admins can delete users"
ON auth.users
FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id::uuid 
    FROM public.user_profiles 
    WHERE role = 'admin'
  )
);

-- =====================================================
-- INSTRUCTIONS D'UTILISATION
-- =====================================================
-- 1. Exécutez ce script dans Supabase Dashboard > SQL Editor
-- 2. La fonction delete_user sera créée
-- 3. Le code Vue.js pourra l'appeler via supabase.rpc('delete_user', { user_id: '...' })
-- 4. Seuls les admins pourront supprimer des utilisateurs
