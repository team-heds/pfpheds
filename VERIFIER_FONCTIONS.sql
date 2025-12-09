-- =====================================================
-- VÉRIFIER LES FONCTIONS SUPABASE
-- =====================================================

-- 1. Vérifier si les fonctions existent
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN ('admin_create_user', 'delete_user');

-- 2. Vérifier les détails de admin_create_user
SELECT 
    p.proname AS function_name,
    pg_get_function_arguments(p.oid) AS arguments,
    pg_get_function_result(p.oid) AS return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'admin_create_user';

-- 3. Si aucune fonction n'apparaît, exécute les scripts SQL :
-- - supabase/migrations/admin_create_user_function.sql
-- - supabase/migrations/delete_user_function.sql

-- 4. Vérifier les permissions
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.routine_privileges 
WHERE routine_name = 'admin_create_user';
