-- ================================================
-- SCRIPTS CORRECTS POUR TA STRUCTURE
-- ================================================

-- ========================================
-- SCRIPT 1 : CORRIGER LES NIVEAUX (0 → 1+)
-- ========================================

-- Voir les niveaux actuels
SELECT 
  user_id,
  email,
  total_xp,
  current_level,
  GREATEST(1, FLOOR(SQRT(total_xp / 100.0))) as nouveau_niveau
FROM gamification_data
ORDER BY total_xp DESC
LIMIT 10;

-- APPLIQUER LA CORRECTION
UPDATE gamification_data
SET current_level = GREATEST(1, FLOOR(SQRT(total_xp / 100.0)));

-- Vérifier
SELECT 
  current_level,
  COUNT(*) as nombre_users
FROM gamification_data
GROUP BY current_level
ORDER BY current_level;


-- ========================================
-- SCRIPT 2 : SYNCHRONISER XP MAISONS
-- ========================================

-- 1. Voir état AVANT
SELECT 
  id,
  name,
  total_xp,
  member_count
FROM houses
ORDER BY name;

-- 2. METTRE À JOUR les XP des maisons depuis gamification_data
UPDATE houses h
SET 
  total_xp = COALESCE((
    SELECT SUM(total_xp)
    FROM gamification_data g
    WHERE g.house_id = h.id
  ), 0),
  member_count = COALESCE((
    SELECT COUNT(*)
    FROM gamification_data g
    WHERE g.house_id = h.id
  ), 0);

-- 3. Voir état APRÈS
SELECT 
  name,
  total_xp,
  member_count,
  (total_xp / NULLIF(member_count, 0))::INTEGER as xp_moyen_membre
FROM houses
ORDER BY total_xp DESC;


-- ========================================
-- SCRIPT 3 : AJOUTER NIVEAUX MAISONS
-- ========================================

-- 1. Ajouter colonne level si elle n'existe pas
ALTER TABLE houses 
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- 2. Calculer niveaux initiaux
UPDATE houses
SET level = GREATEST(1, FLOOR(SQRT(total_xp / 10000.0)) + 1);

-- 3. Créer fonction de calcul automatique
CREATE OR REPLACE FUNCTION update_house_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level = GREATEST(1, FLOOR(SQRT(NEW.total_xp / 10000.0)) + 1);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Créer trigger
DROP TRIGGER IF EXISTS trigger_update_house_level ON houses;
CREATE TRIGGER trigger_update_house_level
  BEFORE UPDATE OF total_xp ON houses
  FOR EACH ROW
  EXECUTE FUNCTION update_house_level();

-- 5. Vérifier
SELECT 
  name,
  total_xp,
  level,
  member_count,
  CASE
    WHEN level = 1 THEN 'Maison Naissante'
    WHEN level = 2 THEN 'Maison Active'
    WHEN level = 3 THEN 'Maison Dynamique'
    WHEN level = 4 THEN 'Maison Brillante'
    WHEN level >= 5 THEN 'Maison d''Excellence'
  END as titre
FROM houses
ORDER BY total_xp DESC;


-- ========================================
-- SCRIPT 4 : TESTS FINAUX
-- ========================================

-- Test 1: Vérifier liaison gamification_data <-> houses
SELECT 
  h.name as maison,
  COUNT(g.user_id) as nb_membres,
  SUM(g.total_xp) as total_xp_membres,
  h.total_xp as total_xp_maison,
  h.level as niveau_maison
FROM houses h
LEFT JOIN gamification_data g ON g.house_id = h.id
GROUP BY h.name, h.total_xp, h.level
ORDER BY h.total_xp DESC;

-- Test 2: Top 3 étudiants par maison
SELECT 
  h.name as maison,
  g.email,
  g.total_xp,
  g.current_level,
  ROW_NUMBER() OVER (PARTITION BY h.name ORDER BY g.total_xp DESC) as rang
FROM gamification_data g
JOIN houses h ON g.house_id = h.id
ORDER BY h.name, g.total_xp DESC;

-- Test 3: Statistiques globales
SELECT 
  'Total Utilisateurs' as stat,
  COUNT(*)::TEXT as valeur
FROM gamification_data

UNION ALL

SELECT 
  'XP Total Système' as stat,
  SUM(total_xp)::TEXT as valeur
FROM gamification_data

UNION ALL

SELECT 
  'XP Moyen par User' as stat,
  AVG(total_xp)::INTEGER::TEXT as valeur
FROM gamification_data

UNION ALL

SELECT 
  'Niveau Moyen' as stat,
  AVG(current_level)::NUMERIC(10,1)::TEXT as valeur
FROM gamification_data;

-- Test 4: Tester le trigger maison
-- Sauvegarder état actuel
SELECT name, total_xp, level FROM houses WHERE name = 'harmonis';

-- Ajouter 1000 XP
UPDATE houses SET total_xp = total_xp + 1000 WHERE name = 'harmonis';

-- Le level doit avoir changé
SELECT name, total_xp, level FROM houses WHERE name = 'harmonis';

-- Remettre l'XP comme avant (optionnel)
UPDATE houses SET total_xp = total_xp - 1000 WHERE name = 'harmonis';

SELECT '✅ TOUS LES SCRIPTS TERMINÉS !' as status;
