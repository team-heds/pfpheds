-- Fix simple : Ajouter l'auto-incrémentation à la colonne id existante
-- Les données actuelles (IDs 1-144) ne seront pas modifiées

-- 1. Créer la séquence
CREATE SEQUENCE IF NOT EXISTS praticiens_formateurs_id_seq;

-- 2. Définir la séquence à 145 (après le dernier ID)
SELECT setval('praticiens_formateurs_id_seq', 145, false);

-- 3. Attacher la séquence à la colonne id
ALTER TABLE praticiens_formateurs 
ALTER COLUMN id SET DEFAULT nextval('praticiens_formateurs_id_seq');

-- 4. Lier la séquence à la colonne (pour suppression automatique)
ALTER SEQUENCE praticiens_formateurs_id_seq OWNED BY praticiens_formateurs.id;

-- 5. Donner les permissions sur la séquence
GRANT USAGE, SELECT ON SEQUENCE praticiens_formateurs_id_seq TO authenticated;

-- 6. Vérification
SELECT column_name, column_default, data_type
FROM information_schema.columns
WHERE table_name = 'praticiens_formateurs' AND column_name = 'id';

-- 7. Test : voir la prochaine valeur
SELECT nextval('praticiens_formateurs_id_seq') as next_id;

-- RÉSULTAT ATTENDU :
-- ✅ La séquence commence à 145
-- ✅ La colonne id a un default avec nextval()
-- ✅ Les nouveaux inserts génèreront automatiquement 145, 146, 147...
