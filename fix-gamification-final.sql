-- 🚀 SOLUTION FINALE - SCRIPT SIMPLE QUI FONCTIONNE
-- Exécute ce script dans Supabase SQL Editor pour tout régler d'un coup

-- ============================================
-- 1. CRÉER TABLE GAMIFICATION_DATA (SIMPLE)
-- ============================================

SELECT 'Création table gamification_data...' as status;

-- Supprimer si existe
DROP TABLE IF EXISTS public.gamification_data CASCADE;

-- Créer table gamification simple
CREATE TABLE public.gamification_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    email TEXT NOT NULL,
    
    -- Données gamification
    total_xp INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    house_id UUID,
    house_points INTEGER DEFAULT 0,
    
    -- Métadonnées
    gamification_metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT 'Table gamification_data créée ✅' as status;

-- ============================================
-- 2. CRÉER TABLE STUDENT_DATA (SIMPLE)
-- ============================================

SELECT 'Création table student_data...' as status;

-- Supprimer si existe
DROP TABLE IF EXISTS public.student_data CASCADE;

-- Créer table student simple
CREATE TABLE public.student_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    email TEXT NOT NULL,
    
    -- Données étudiant
    student_number TEXT,
    program TEXT,
    classe TEXT, -- ✅ Colonne classe incluse
    academic_year TEXT,
    academic_status TEXT DEFAULT 'active',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT 'Table student_data créée ✅' as status;

-- ============================================
-- 3. INSÉRER TES DONNÉES DIRECTEMENT
-- ============================================

SELECT 'Insertion de tes données...' as status;

-- Insérer tes données gamification avec Solencia
INSERT INTO public.gamification_data (
    user_id,
    email,
    total_xp,
    current_level,
    house_id,
    house_points,
    gamification_metadata
) VALUES (
    '0a13b062-9189-4281-a9e5-5b438d62db3d',
    'antoine.quarroz@hevs.ch',
    50,
    1,
    '550e8400-e29b-41d4-a716-446655440004', -- Solencia
    50,
    '{"quiz_completed": true, "house_assigned": "Solencia"}'::jsonb
);

-- Insérer tes données étudiant
INSERT INTO public.student_data (
    user_id,
    email,
    student_number,
    program,
    classe,
    academic_year,
    academic_status
) VALUES (
    '0a13b062-9189-4281-a9e5-5b438d62db3d',
    'antoine.quarroz@hevs.ch',
    'STU-AQ-2025',
    'Informatique de Gestion',
    'IG3-A', -- ✅ Classe ajoutée
    '2024-2025',
    'active'
);

SELECT 'Données insérées ✅' as status;

-- ============================================
-- 4. VÉRIFIER QUE TOUT FONCTIONNE
-- ============================================

SELECT 'Vérification gamification_data:' as info;
SELECT user_id, email, total_xp, house_id, gamification_metadata 
FROM public.gamification_data 
WHERE user_id = '0a13b062-9189-4281-a9e5-5b438d62db3d';

SELECT 'Vérification student_data:' as info;
SELECT user_id, email, student_number, program, classe, academic_year 
FROM public.student_data 
WHERE user_id = '0a13b062-9189-4281-a9e5-5b438d62db3d';

SELECT 'Vérification avec maison Solencia:' as info;
SELECT 
    gd.user_id,
    gd.email,
    gd.total_xp,
    h.name as house_name,
    h.color as house_color,
    sd.classe
FROM public.gamification_data gd
LEFT JOIN public.houses h ON gd.house_id = h.id
LEFT JOIN public.student_data sd ON gd.user_id = sd.user_id
WHERE gd.user_id = '0a13b062-9189-4281-a9e5-5b438d62db3d';

-- ============================================
-- 5. MESSAGE FINAL
-- ============================================

SELECT '🎉 === TOUT EST RÉGLÉ ! ===' as success;
SELECT '✅ gamification_data: Créée avec ta maison Solencia (50 XP)' as info1;
SELECT '✅ student_data: Créée avec colonne classe (IG3-A)' as info2;
SELECT '🧪 MAINTENANT: Teste le diagnostic - ça devrait marcher !' as next_step;
SELECT '🔧 ENSUITE: Désactive le mode MOCK et profite de Solencia !' as final_step;
