-- Ajouter les colonnes pour stocker les fichiers uploadés dans la table places
-- Date: 2025-12-11

-- Ajouter la colonne fileURL pour stocker l'URL du fichier
ALTER TABLE places
ADD COLUMN IF NOT EXISTS fileURL text;

-- Ajouter la colonne fileName pour stocker le nom original du fichier
ALTER TABLE places
ADD COLUMN IF NOT EXISTS fileName text;

-- Ajouter un commentaire pour documenter les colonnes
COMMENT ON COLUMN places.fileURL IS 'URL du fichier PDF uploadé sur Firebase Storage';
COMMENT ON COLUMN places.fileName IS 'Nom original du fichier PDF uploadé';

-- Afficher les colonnes ajoutées
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'places'
AND column_name IN ('fileURL', 'fileName');
