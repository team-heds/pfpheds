-- 🔐 CORRECTION PERMISSIONS RLS POUR GAMIFICATION_DATA
-- Exécute ce script dans Supabase SQL Editor pour corriger les erreurs 406

-- ============================================
-- 1. ACTIVER RLS SUR GAMIFICATION_DATA
-- ============================================

SELECT 'Activation RLS sur gamification_data...' as status;

-- S'assurer que RLS est activé
ALTER TABLE public.gamification_data ENABLE ROW LEVEL SECURITY;

SELECT 'RLS activé ✅' as status;

-- ============================================
-- 2. CRÉER POLITIQUES RLS PERMISSIVES
-- ============================================

SELECT 'Création des politiques RLS...' as status;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Users can view own gamification data" ON public.gamification_data;
DROP POLICY IF EXISTS "Users can insert own gamification data" ON public.gamification_data;
DROP POLICY IF EXISTS "Users can update own gamification data" ON public.gamification_data;

-- Politique de LECTURE : Utilisateurs peuvent lire leurs propres données
CREATE POLICY "Users can view own gamification data" ON public.gamification_data
    FOR SELECT USING (auth.uid() = user_id);

-- Politique d'INSERTION : Utilisateurs peuvent insérer leurs propres données
CREATE POLICY "Users can insert own gamification data" ON public.gamification_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique de MISE À JOUR : Utilisateurs peuvent modifier leurs propres données
CREATE POLICY "Users can update own gamification data" ON public.gamification_data
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

SELECT 'Politiques RLS créées ✅' as status;

-- ============================================
-- 3. VÉRIFIER LES POLITIQUES
-- ============================================

SELECT 'Vérification des politiques RLS...' as status;

-- Lister toutes les politiques sur gamification_data
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'gamification_data';

-- ============================================
-- 4. TEST DE LECTURE AVEC UTILISATEUR ACTUEL
-- ============================================

SELECT 'Test de lecture gamification_data...' as status;

-- Tenter de lire les données (devrait maintenant fonctionner)
SELECT 
    user_id,
    email,
    total_xp,
    current_level,
    house_id,
    house_points,
    created_at
FROM public.gamification_data 
WHERE user_id = '0a13b062-9189-4281-a9e5-5b438d62db3d';

-- ============================================
-- 5. MESSAGE FINAL
-- ============================================

SELECT '🎉 === PERMISSIONS RLS CORRIGÉES ! ===' as success;
SELECT '✅ Politiques RLS créées pour gamification_data' as info1;
SELECT '✅ Utilisateurs authentifiés peuvent lire/écrire leurs données' as info2;
SELECT '🧪 MAINTENANT: Teste le quiz - l''erreur 406 devrait disparaître !' as next_step;
SELECT '🏠 ENSUITE: Sélectionne ta maison et vérifie la sauvegarde !' as final_step;
