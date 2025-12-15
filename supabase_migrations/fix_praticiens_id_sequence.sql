-- Fix complet pour la colonne id et la séquence de praticiens_formateurs
-- Exécuter dans Supabase SQL Editor

-- 1. Créer la séquence s'il n'existe pas déjà
CREATE SEQUENCE IF NOT EXISTS praticiens_formateurs_id_seq;

-- 2. Définir la valeur actuelle de la séquence au maximum existant + 1
-- (Important : la table contient déjà 144 praticiens avec des IDs 1-144)
SELECT setval('praticiens_formateurs_id_seq', (SELECT COALESCE(MAX(id::bigint), 0) + 1 FROM praticiens_formateurs), false);

-- 3. Attacher la séquence à la colonne id
ALTER TABLE praticiens_formateurs ALTER COLUMN id SET DEFAULT nextval('praticiens_formateurs_id_seq');

-- 4. Définir la séquence comme "owned" par la colonne (pour suppression en cascade)
ALTER SEQUENCE praticiens_formateurs_id_seq OWNED BY praticiens_formateurs.id;

-- 5. Vérifier la configuration
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_name = 'praticiens_formateurs' AND column_name = 'id';

-- 6. Test de la séquence
SELECT nextval('praticiens_formateurs_id_seq') as next_id;
SELECT currval('praticiens_formateurs_id_seq') as current_id;

-- RÉSULTAT ATTENDU :
-- ✅ La séquence existe et démarre à 145 (après les 144 existants)
-- ✅ La colonne id a maintenant un default: nextval('praticiens_formateurs_id_seq')
-- ✅ Les nouveaux inserts génèreront automatiquement un ID
