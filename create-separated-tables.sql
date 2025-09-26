-- 🏗️ ARCHITECTURE MODULAIRE - TABLES SÉPARÉES
-- Script pour créer user_profiles, gamification_data, student_data séparément
-- Exécute ce script dans Supabase SQL Editor

-- ============================================
-- 1. NETTOYAGE DES TABLES EXISTANTES
-- ============================================

SELECT '🧹 Nettoyage des tables existantes...' as status;

-- Supprimer les tables dans l'ordre des dépendances
DROP TABLE IF EXISTS public.gamification_data CASCADE;
DROP TABLE IF EXISTS public.student_data CASCADE;
-- Ne pas supprimer user_profiles si elle contient des données importantes

SELECT 'Nettoyage terminé ✅' as status;

-- ============================================
-- 2. CRÉER/AMÉLIORER TABLE USER_PROFILES
-- ============================================

SELECT '👤 Création/amélioration table user_profiles...' as status;

-- Créer la table user_profiles si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    forname VARCHAR(100),
    family_name VARCHAR(100),
    display_name VARCHAR(200),
    
    -- Informations personnelles
    birth_date DATE,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Switzerland',
    
    -- Métadonnées profil
    profile_picture_url TEXT,
    bio TEXT,
    preferences JSONB DEFAULT '{}'::jsonb,
    
    -- Statut
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    role VARCHAR(50) DEFAULT 'user',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ajouter les colonnes manquantes si elles n'existent pas
DO $$ 
BEGIN
    -- Ajouter display_name si manquant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='display_name' AND table_schema='public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN display_name VARCHAR(200);
    END IF;
    
    -- Ajouter bio si manquant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='bio' AND table_schema='public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN bio TEXT;
    END IF;
    
    -- Ajouter preferences si manquant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='preferences' AND table_schema='public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN preferences JSONB DEFAULT '{}'::jsonb;
    END IF;
    
    -- Ajouter is_active si manquant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='is_active' AND table_schema='public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Ajouter is_verified si manquant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='is_verified' AND table_schema='public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;
    END IF;
    
    -- Ajouter role si manquant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='role' AND table_schema='public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN role VARCHAR(50) DEFAULT 'user';
    END IF;
    
    -- Ajouter profile_picture_url si manquant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='profile_picture_url' AND table_schema='public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN profile_picture_url TEXT;
    END IF;
    
    -- Ajouter birth_date si manquant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='birth_date' AND table_schema='public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN birth_date DATE;
    END IF;
    
    -- Ajouter phone si manquant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='phone' AND table_schema='public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN phone VARCHAR(20);
    END IF;
    
    -- Ajouter address si manquant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='address' AND table_schema='public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN address TEXT;
    END IF;
    
    -- Ajouter city si manquant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='city' AND table_schema='public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN city VARCHAR(100);
    END IF;
    
    -- Ajouter postal_code si manquant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='postal_code' AND table_schema='public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN postal_code VARCHAR(20);
    END IF;
    
    -- Ajouter country si manquant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='country' AND table_schema='public') THEN
        ALTER TABLE public.user_profiles ADD COLUMN country VARCHAR(100) DEFAULT 'Switzerland';
    END IF;
END $$;

SELECT 'Table user_profiles créée/améliorée ✅' as status;

-- ============================================
-- 3. CRÉER TABLE GAMIFICATION_DATA
-- ============================================

SELECT '🎮 Création table gamification_data...' as status;

CREATE TABLE public.gamification_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    
    -- XP et niveaux
    total_xp INTEGER DEFAULT 0 NOT NULL,
    current_level INTEGER DEFAULT 1 NOT NULL,
    
    -- Maison assignée
    house_id UUID REFERENCES public.houses(id),
    house_points INTEGER DEFAULT 0 NOT NULL,
    
    -- Streaks et connexions
    login_streak INTEGER DEFAULT 0 NOT NULL,
    last_login TIMESTAMPTZ,
    
    -- Données JSON pour flexibilité
    achievements JSONB DEFAULT '[]'::jsonb NOT NULL,
    badges JSONB DEFAULT '[]'::jsonb NOT NULL,
    streaks JSONB DEFAULT '{}'::jsonb NOT NULL,
    xp_sources JSONB DEFAULT '{}'::jsonb NOT NULL,
    level_history JSONB DEFAULT '[]'::jsonb NOT NULL,
    
    -- Préférences gamification
    notifications_enabled BOOLEAN DEFAULT true NOT NULL,
    public_profile BOOLEAN DEFAULT true NOT NULL,
    gamification_metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

SELECT 'Table gamification_data créée ✅' as status;

-- ============================================
-- 4. CRÉER TABLE STUDENT_DATA
-- ============================================

SELECT '🎓 Création table student_data...' as status;

CREATE TABLE public.student_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES public.user_profiles(user_id) ON DELETE CASCADE,
    
    -- Informations académiques
    student_number VARCHAR(50) UNIQUE,
    institution_id UUID,
    program VARCHAR(200),
    classe VARCHAR(100), -- Classe de l'étudiant (ex: "IG3-A", "SI2-B", etc.)
    academic_year VARCHAR(20),
    semester INTEGER,
    enrollment_date DATE,
    graduation_date DATE,
    
    -- Statut académique
    academic_status VARCHAR(50) DEFAULT 'active', -- active, suspended, graduated, dropped
    gpa DECIMAL(3,2),
    credits_earned INTEGER DEFAULT 0,
    credits_required INTEGER,
    
    -- Informations supplémentaires
    advisor_id UUID,
    emergency_contact JSONB DEFAULT '{}'::jsonb,
    academic_metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

SELECT 'Table student_data créée ✅' as status;

-- ============================================
-- 5. CRÉER LES INDEX POUR PERFORMANCE
-- ============================================

SELECT '⚡ Création des index...' as status;

-- Index user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active);

-- Index gamification_data
CREATE INDEX IF NOT EXISTS idx_gamification_data_user_id ON public.gamification_data(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_data_house_id ON public.gamification_data(house_id);
CREATE INDEX IF NOT EXISTS idx_gamification_data_total_xp ON public.gamification_data(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_gamification_data_level ON public.gamification_data(current_level);

-- Index student_data
CREATE INDEX IF NOT EXISTS idx_student_data_user_id ON public.student_data(user_id);
CREATE INDEX IF NOT EXISTS idx_student_data_student_number ON public.student_data(student_number);
CREATE INDEX IF NOT EXISTS idx_student_data_institution ON public.student_data(institution_id);
CREATE INDEX IF NOT EXISTS idx_student_data_status ON public.student_data(academic_status);

SELECT 'Index créés ✅' as status;

-- ============================================
-- 6. CONFIGURER RLS (ROW LEVEL SECURITY)
-- ============================================

SELECT '🔒 Configuration RLS...' as status;

-- RLS pour user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
CREATE POLICY "Users can read own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- RLS pour gamification_data
ALTER TABLE public.gamification_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own gamification data" ON public.gamification_data;
CREATE POLICY "Users can read own gamification data" ON public.gamification_data
    FOR SELECT USING (
        auth.uid()::text = user_id::text 
        OR public_profile = true
    );

DROP POLICY IF EXISTS "Users can insert own gamification data" ON public.gamification_data;
CREATE POLICY "Users can insert own gamification data" ON public.gamification_data
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update own gamification data" ON public.gamification_data;
CREATE POLICY "Users can update own gamification data" ON public.gamification_data
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- RLS pour student_data
ALTER TABLE public.student_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own student data" ON public.student_data;
CREATE POLICY "Users can read own student data" ON public.student_data
    FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert own student data" ON public.student_data;
CREATE POLICY "Users can insert own student data" ON public.student_data
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update own student data" ON public.student_data;
CREATE POLICY "Users can update own student data" ON public.student_data
    FOR UPDATE USING (auth.uid()::text = user_id::text);

SELECT 'RLS configuré ✅' as status;

-- ============================================
-- 7. CRÉER FONCTIONS DE MISE À JOUR AUTOMATIQUE
-- ============================================

SELECT '🔄 Création des fonctions automatiques...' as status;

-- Fonction générique pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour chaque table
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gamification_data_updated_at ON public.gamification_data;
CREATE TRIGGER update_gamification_data_updated_at 
    BEFORE UPDATE ON public.gamification_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_data_updated_at ON public.student_data;
CREATE TRIGGER update_student_data_updated_at 
    BEFORE UPDATE ON public.student_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

SELECT 'Fonctions et triggers créés ✅' as status;

-- ============================================
-- 8. INSÉRER TES DONNÉES DE BASE
-- ============================================

SELECT '💾 Insertion de tes données de base...' as status;

-- Insérer/mettre à jour ton profil utilisateur
INSERT INTO public.user_profiles (
    user_id,
    email,
    forname,
    family_name,
    display_name,
    role,
    is_active,
    is_verified
) VALUES (
    '0a13b062-9189-4281-a9e5-5b438d62db3d',
    'antoine.quarroz@hevs.ch',
    'Antoine',
    'Quarroz',
    'Antoine Quarroz',
    'student',
    true,
    true
)
ON CONFLICT (user_id) 
DO UPDATE SET 
    forname = EXCLUDED.forname,
    family_name = EXCLUDED.family_name,
    display_name = EXCLUDED.display_name,
    updated_at = NOW();

-- Insérer tes données gamification avec Solencia
INSERT INTO public.gamification_data (
    user_id,
    total_xp,
    current_level,
    house_id,
    house_points,
    login_streak,
    achievements,
    badges,
    streaks,
    xp_sources,
    level_history,
    notifications_enabled,
    public_profile,
    gamification_metadata,
    last_login
) VALUES (
    '0a13b062-9189-4281-a9e5-5b438d62db3d',
    50,
    1,
    '550e8400-e29b-41d4-a716-446655440004',  -- Solencia
    50,
    1,
    '[]'::jsonb,
    '[]'::jsonb,
    '{}'::jsonb,
    '{"quiz_complete": 50}'::jsonb,
    '[{"level": 1, "date": "2025-09-26T12:57:00Z"}]'::jsonb,
    true,
    true,
    '{"quiz_completed": true, "house_assigned": "Solencia"}'::jsonb,
    NOW()
)
ON CONFLICT (user_id) 
DO UPDATE SET 
    total_xp = EXCLUDED.total_xp,
    house_id = EXCLUDED.house_id,
    house_points = EXCLUDED.house_points,
    gamification_metadata = EXCLUDED.gamification_metadata,
    updated_at = NOW();

-- Insérer tes données étudiant
INSERT INTO public.student_data (
    user_id,
    student_number,
    program,
    academic_year,
    semester,
    academic_status,
    enrollment_date
) VALUES (
    '0a13b062-9189-4281-a9e5-5b438d62db3d',
    'STU-AQ-2025',
    'Informatique de Gestion',
    '2024-2025',
    1,
    'active',
    '2024-09-01'
)
ON CONFLICT (user_id) 
DO UPDATE SET 
    program = EXCLUDED.program,
    academic_year = EXCLUDED.academic_year,
    updated_at = NOW();

SELECT 'Données de base insérées ✅' as status;

-- ============================================
-- 9. VÉRIFICATIONS ET TESTS
-- ============================================

SELECT '🔍 Vérifications des tables créées:' as info;

-- Vérifier les tables
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
FROM information_schema.tables t
WHERE t.table_schema = 'public' 
AND t.table_name IN ('user_profiles', 'gamification_data', 'student_data')
ORDER BY t.table_name;

SELECT 'Vérification de tes données:' as info;

-- Vérifier tes données avec jointures
SELECT 
    up.user_id,
    up.email,
    up.forname,
    up.family_name,
    gd.total_xp,
    gd.current_level,
    h.name as house_name,
    h.color as house_color,
    sd.student_number,
    sd.program,
    sd.academic_status
FROM public.user_profiles up
LEFT JOIN public.gamification_data gd ON up.user_id = gd.user_id
LEFT JOIN public.houses h ON gd.house_id = h.id
LEFT JOIN public.student_data sd ON up.user_id = sd.user_id
WHERE up.user_id = '0a13b062-9189-4281-a9e5-5b438d62db3d';

-- ============================================
-- 10. MESSAGES FINAUX
-- ============================================

SELECT '🎉 === ARCHITECTURE MODULAIRE CRÉÉE ! ===' as success;
SELECT '✅ user_profiles: Profils utilisateurs avec informations de base' as info1;
SELECT '✅ gamification_data: Données gamification (XP, maisons, achievements)' as info2;
SELECT '✅ student_data: Données académiques (programmes, statuts)' as info3;
SELECT '✅ Relations: Foreign keys configurées entre les tables' as info4;
SELECT '✅ Sécurité: RLS activé sur toutes les tables' as info5;
SELECT '✅ Performance: Index créés pour optimiser les requêtes' as info6;
SELECT '✅ Données: Ton profil avec maison Solencia sauvegardé' as info7;
SELECT '🔧 PROCHAINE ÉTAPE: Adapter gamificationDataService pour utiliser cette architecture' as next_step;
