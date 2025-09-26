-- 🏗️ CRÉATION TABLE STUDENT_DATA UNIFIÉE
-- Table combinant user_profiles + gamification_data pour une solution complète
-- Exécute ce script dans Supabase SQL Editor

-- ============================================
-- 1. SUPPRIMER LA TABLE SI ELLE EXISTE (NETTOYAGE)
-- ============================================

SELECT 'Nettoyage: suppression de la table student_data si elle existe...' as status;

DROP TABLE IF EXISTS public.student_data CASCADE;

SELECT 'Table supprimée (si elle existait) ✅' as status;

-- ============================================
-- 2. CRÉER LA TABLE STUDENT_DATA UNIFIÉE
-- ============================================

SELECT 'Création de la table student_data unifiée...' as status;

CREATE TABLE public.student_data (
    -- Clé primaire
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- === DONNÉES USER_PROFILES ===
    user_id UUID NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
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
    
    -- Informations académiques
    student_number VARCHAR(50),
    institution_id UUID,
    program VARCHAR(200),
    academic_year VARCHAR(20),
    semester INTEGER,
    
    -- Statut et permissions
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    role VARCHAR(50) DEFAULT 'student',
    
    -- === DONNÉES GAMIFICATION ===
    -- XP et niveaux
    total_xp INTEGER DEFAULT 0 NOT NULL,
    current_level INTEGER DEFAULT 1 NOT NULL,
    
    -- Maison assignée
    house_id UUID REFERENCES public.houses(id),
    house_points INTEGER DEFAULT 0 NOT NULL,
    
    -- Streaks et connexions
    login_streak INTEGER DEFAULT 0 NOT NULL,
    last_login TIMESTAMPTZ,
    
    -- Données JSON pour flexibilité gamification
    achievements JSONB DEFAULT '[]'::jsonb NOT NULL,
    badges JSONB DEFAULT '[]'::jsonb NOT NULL,
    streaks JSONB DEFAULT '{}'::jsonb NOT NULL,
    xp_sources JSONB DEFAULT '{}'::jsonb NOT NULL,
    level_history JSONB DEFAULT '[]'::jsonb NOT NULL,
    
    -- Préférences gamification
    notifications_enabled BOOLEAN DEFAULT true NOT NULL,
    public_profile BOOLEAN DEFAULT true NOT NULL,
    gamification_metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
    
    -- === DONNÉES SUPPLÉMENTAIRES ===
    -- Préférences utilisateur
    preferences JSONB DEFAULT '{}'::jsonb,
    settings JSONB DEFAULT '{}'::jsonb,
    
    -- Métadonnées
    profile_picture_url TEXT,
    bio TEXT,
    social_links JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    last_activity TIMESTAMPTZ DEFAULT NOW()
);

SELECT 'Table student_data créée ✅' as status;

-- ============================================
-- 3. CRÉER LES INDEX POUR PERFORMANCE
-- ============================================

SELECT 'Création des index...' as status;

-- Index principaux
CREATE UNIQUE INDEX idx_student_data_user_id ON public.student_data(user_id);
CREATE UNIQUE INDEX idx_student_data_email ON public.student_data(email);
CREATE INDEX idx_student_data_student_number ON public.student_data(student_number);

-- Index gamification
CREATE INDEX idx_student_data_house_id ON public.student_data(house_id);
CREATE INDEX idx_student_data_total_xp ON public.student_data(total_xp DESC);
CREATE INDEX idx_student_data_current_level ON public.student_data(current_level);

-- Index pour recherches
CREATE INDEX idx_student_data_forname ON public.student_data(forname);
CREATE INDEX idx_student_data_family_name ON public.student_data(family_name);
CREATE INDEX idx_student_data_institution ON public.student_data(institution_id);

-- Index pour statut
CREATE INDEX idx_student_data_active ON public.student_data(is_active);
CREATE INDEX idx_student_data_role ON public.student_data(role);

SELECT 'Index créés ✅' as status;

-- ============================================
-- 4. CONFIGURER RLS (ROW LEVEL SECURITY)
-- ============================================

SELECT 'Configuration RLS...' as status;

-- Activer RLS sur la table
ALTER TABLE public.student_data ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : utilisateurs authentifiés peuvent lire leurs données + profils publics
CREATE POLICY "Users can read own student data" ON public.student_data
    FOR SELECT USING (
        auth.uid()::text = user_id::text 
        OR public_profile = true
    );

-- Politique d'insertion : utilisateurs authentifiés peuvent créer leurs données
CREATE POLICY "Users can insert own student data" ON public.student_data
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Politique de mise à jour : utilisateurs authentifiés peuvent modifier leurs données
CREATE POLICY "Users can update own student data" ON public.student_data
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Politique de suppression : utilisateurs authentifiés peuvent supprimer leurs données
CREATE POLICY "Users can delete own student data" ON public.student_data
    FOR DELETE USING (auth.uid()::text = user_id::text);

SELECT 'RLS configuré ✅' as status;

-- ============================================
-- 5. CRÉER FONCTIONS DE MISE À JOUR AUTOMATIQUE
-- ============================================

SELECT 'Création des fonctions automatiques...' as status;

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_student_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_activity = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour appeler la fonction automatiquement
CREATE TRIGGER update_student_data_updated_at_trigger 
    BEFORE UPDATE ON public.student_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_student_data_updated_at();

SELECT 'Fonctions et triggers créés ✅' as status;

-- ============================================
-- 6. MIGRER LES DONNÉES USER_PROFILES EXISTANTES
-- ============================================

SELECT 'Migration des données user_profiles existantes...' as status;

-- Insérer toutes les données user_profiles dans student_data
INSERT INTO public.student_data (
    user_id,
    email,
    forname,
    family_name,
    display_name,
    birth_date,
    phone,
    student_number,
    institution_id,
    is_active,
    role,
    created_at,
    updated_at
)
SELECT 
    user_id,
    email,
    forname,
    family_name,
    COALESCE(forname || ' ' || family_name, email) as display_name,
    birth_date,
    phone,
    student_number,
    institution_id,
    COALESCE(is_active, true) as is_active,
    COALESCE(role, 'student') as role,
    COALESCE(created_at, NOW()) as created_at,
    COALESCE(updated_at, NOW()) as updated_at
FROM public.user_profiles
ON CONFLICT (user_id) DO NOTHING;

SELECT 'Migration user_profiles terminée ✅' as status;

-- ============================================
-- 7. INSÉRER/METTRE À JOUR TES DONNÉES SOLENCIA
-- ============================================

SELECT 'Insertion/mise à jour de tes données Solencia...' as status;

-- Insérer ou mettre à jour tes données avec Solencia
INSERT INTO public.student_data (
    user_id,
    email,
    forname,
    family_name,
    display_name,
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
    '0a13b062-9189-4281-a9e5-5b438d62db3d',  -- Ton user_id
    'antoine.quarroz@hevs.ch',                -- Ton email
    'Antoine',                                 -- Prénom
    'Quarroz',                                -- Nom
    'Antoine Quarroz',                        -- Nom d'affichage
    50,                                        -- XP initial
    1,                                         -- Niveau 1
    '550e8400-e29b-41d4-a716-446655440004',  -- Solencia ID
    50,                                        -- Points maison
    1,                                         -- Streak de connexion
    '[]'::jsonb,                              -- Achievements vides
    '[]'::jsonb,                              -- Badges vides
    '{}'::jsonb,                              -- Streaks vides
    '{"quiz_complete": 50}'::jsonb,           -- Source XP
    '[{"level": 1, "date": "2025-09-26T12:03:00Z"}]'::jsonb,  -- Historique
    true,                                      -- Notifications ON
    true,                                      -- Profil public
    '{"quiz_completed": true, "house_assigned": "Solencia"}'::jsonb,  -- Métadonnées
    NOW()                                      -- Dernière connexion
)
ON CONFLICT (user_id) 
DO UPDATE SET 
    total_xp = EXCLUDED.total_xp,
    current_level = EXCLUDED.current_level,
    house_id = EXCLUDED.house_id,
    house_points = EXCLUDED.house_points,
    login_streak = EXCLUDED.login_streak,
    xp_sources = EXCLUDED.xp_sources,
    level_history = EXCLUDED.level_history,
    gamification_metadata = EXCLUDED.gamification_metadata,
    last_login = EXCLUDED.last_login,
    updated_at = NOW();

SELECT 'Données Solencia insérées/mises à jour ✅' as status;

-- ============================================
-- 8. VÉRIFICATIONS ET TESTS
-- ============================================

SELECT 'Vérification de la structure de la table:' as info;

-- Vérifier la structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'student_data' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Vérification du nombre d''enregistrements:' as info;

-- Compter les enregistrements
SELECT COUNT(*) as total_students FROM public.student_data;

SELECT 'Vérification de tes données:' as info;

-- Vérifier tes données spécifiques
SELECT 
    user_id,
    email,
    forname,
    family_name,
    total_xp,
    current_level,
    house_id,
    house_points,
    gamification_metadata,
    created_at,
    updated_at
FROM public.student_data 
WHERE user_id = '0a13b062-9189-4281-a9e5-5b438d62db3d';

SELECT 'Vérification avec jointure maison:' as info;

-- Vérifier avec la maison Solencia
SELECT 
    sd.user_id,
    sd.email,
    sd.forname,
    sd.family_name,
    sd.total_xp,
    sd.current_level,
    h.name as house_name,
    h.motto as house_motto,
    h.color as house_color,
    sd.house_points,
    sd.gamification_metadata
FROM public.student_data sd
LEFT JOIN public.houses h ON sd.house_id = h.id
WHERE sd.user_id = '0a13b062-9189-4281-a9e5-5b438d62db3d';

-- ============================================
-- 9. MESSAGES FINAUX
-- ============================================

SELECT '🎉 === TABLE STUDENT_DATA CRÉÉE ET CONFIGURÉE ! ===' as success;
SELECT '✅ Structure: Table unifiée avec user_profiles + gamification_data' as info1;
SELECT '✅ Migration: Données user_profiles existantes migrées' as info2;
SELECT '✅ Sécurité: RLS configuré avec politiques appropriées' as info3;
SELECT '✅ Performance: Index créés pour optimiser les requêtes' as info4;
SELECT '✅ Gamification: Ta maison Solencia sauvegardée avec 50 XP' as info5;
SELECT '🔧 PROCHAINE ÉTAPE: Adapter gamificationDataService pour utiliser student_data' as next_step;
SELECT '🧪 ENSUITE: Tester le quiz et vérifier que tout fonctionne !' as final_step;
