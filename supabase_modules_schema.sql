-- =====================================================
-- SCRIPT COMPLÉMENTAIRE POUR TABLE MODULES EXISTANTE
-- Description: Ajoute les éléments manquants pour la bibliothèque vidéo
-- =====================================================

-- Note : La table modules existe déjà, ce script ajoute seulement
-- les index et fonctions nécessaires pour la bibliothèque vidéo

-- =====================================================
-- INDEX pour performances
-- =====================================================

-- Index sur titre pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_modules_title ON modules(title);

-- Les autres index dépendent des colonnes existantes dans votre table modules
-- Décommentez si ces colonnes existent :
-- CREATE INDEX IF NOT EXISTS idx_modules_year_id ON modules(year_id);
-- CREATE INDEX IF NOT EXISTS idx_modules_order ON modules(order_index);

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour obtenir le nombre de vidéos par module
-- Adapté pour module_id en INTEGER ou UUID selon votre table
CREATE OR REPLACE FUNCTION get_module_video_count(p_module_id INTEGER)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM video_library
  WHERE module_id::TEXT = p_module_id::TEXT;
$$ LANGUAGE SQL STABLE;

-- Fonction pour obtenir tous les modules avec leur nombre de vidéos
-- Adapté à la structure existante de la table modules
-- Utilise une conversion de type pour gérer UUID et INTEGER
CREATE OR REPLACE FUNCTION get_modules_with_video_count()
RETURNS TABLE (
  id INTEGER,
  title TEXT,
  description TEXT,
  video_count BIGINT
) AS $$
  SELECT 
    m.id,
    m.title,
    m.description,
    COUNT(v.id) as video_count
  FROM modules m
  LEFT JOIN video_library v ON v.module_id::TEXT = m.id::TEXT
  GROUP BY m.id, m.title, m.description
  ORDER BY m.title;
$$ LANGUAGE SQL STABLE;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

-- Pour exécuter ce script dans Supabase:
-- 1. Aller dans SQL Editor
-- 2. Copier-coller ce script
-- 3. Exécuter
-- 4. Vérifier que les tables et policies sont créées
