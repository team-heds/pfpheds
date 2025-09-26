-- 🎓 AJOUTER COLONNE CLASSE À STUDENT_DATA
-- Exécute cette requête dans Supabase SQL Editor pour ajouter le champ classe

-- ============================================
-- AJOUTER LA COLONNE CLASSE
-- ============================================

SELECT 'Ajout de la colonne classe à student_data...' as status;

-- Ajouter la colonne classe si elle n'existe pas déjà
ALTER TABLE public.student_data 
ADD COLUMN IF NOT EXISTS classe VARCHAR(100);

-- Ajouter un commentaire pour documenter la colonne
COMMENT ON COLUMN public.student_data.classe IS 'Classe de l''étudiant (ex: "IG3-A", "SI2-B", "INFO-2024", etc.)';

SELECT 'Colonne classe ajoutée ✅' as status;

-- ============================================
-- CRÉER INDEX POUR LA COLONNE CLASSE
-- ============================================

SELECT 'Création d''un index pour la colonne classe...' as status;

-- Créer un index pour optimiser les recherches par classe
CREATE INDEX IF NOT EXISTS idx_student_data_classe ON public.student_data(classe);

SELECT 'Index classe créé ✅' as status;

-- ============================================
-- EXEMPLE DE MISE À JOUR AVEC UNE CLASSE
-- ============================================

SELECT 'Exemple de mise à jour avec une classe...' as status;

-- Mettre à jour tes données avec une classe d'exemple
UPDATE public.student_data 
SET classe = 'IG3-A'  -- Remplace par ta vraie classe
WHERE user_id = '0a13b062-9189-4281-a9e5-5b438d62db3d';

SELECT 'Données mises à jour avec classe ✅' as status;

-- ============================================
-- VÉRIFICATION
-- ============================================

SELECT 'Vérification de la colonne classe ajoutée:' as info;

-- Vérifier que la colonne existe
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'student_data' 
AND table_schema = 'public'
AND column_name = 'classe';

SELECT 'Vérification des données avec classe:' as info;

-- Vérifier tes données avec la nouvelle colonne
SELECT 
    user_id,
    student_number,
    program,
    classe,
    academic_year,
    academic_status
FROM public.student_data 
WHERE user_id = '0a13b062-9189-4281-a9e5-5b438d62db3d';

-- ============================================
-- MESSAGE FINAL
-- ============================================

SELECT '🎉 Colonne classe ajoutée avec succès à student_data !' as success;
SELECT '📝 Tu peux maintenant utiliser le champ classe dans tes requêtes' as info;
SELECT '🔧 N''oublie pas de mettre à jour ta vraie classe dans les données' as reminder;
