-- Vérifier les colonnes de StudentsPhysio
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'StudentsPhysio'
ORDER BY ordinal_position;

-- Vérifier les colonnes de user_profiles
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;
