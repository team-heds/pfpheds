-- Diagnostic complet de la table praticiens_formateurs

-- 1. Structure de la table (colonnes et types)
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'praticiens_formateurs'
ORDER BY ordinal_position;

-- 2. Contraintes (clés primaires, uniques, etc.)
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'praticiens_formateurs';

-- 3. Séquences associées
SELECT 
    schemaname,
    sequencename,
    last_value
FROM pg_sequences
WHERE sequencename LIKE '%praticiens%';

-- 4. Policies RLS actives
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'praticiens_formateurs';

-- 5. Permissions sur la table
SELECT 
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'praticiens_formateurs';

-- 6. Compter les données existantes
SELECT COUNT(*) as total_praticiens FROM praticiens_formateurs;

-- 7. Afficher quelques exemples (si des données existent)
SELECT id, nom, prenom, mail, institution, localite, created_at
FROM praticiens_formateurs
LIMIT 5;
