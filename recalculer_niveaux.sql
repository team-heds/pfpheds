-- ================================================
-- RECALCULER TOUS LES NIVEAUX BASÉS SUR L'XP
-- ================================================

-- Formule: niveau = FLOOR(SQRT(total_xp / 50)) + 1

-- 1. Voir les niveaux actuels vs calculés
SELECT 
  user_id,
  total_xp,
  current_level as niveau_actuel,
  FLOOR(SQRT(total_xp / 50.0)) + 1 as niveau_calcule,
  FLOOR(SQRT(total_xp / 50.0)) + 1 - current_level as difference
FROM gamification_data
ORDER BY total_xp DESC;

-- 2. METTRE À JOUR tous les niveaux automatiquement
UPDATE gamification_data
SET current_level = FLOOR(SQRT(total_xp / 50.0)) + 1
WHERE current_level != FLOOR(SQRT(total_xp / 50.0)) + 1;

-- 3. Vérifier que tout est bon
SELECT 
  user_id,
  total_xp,
  current_level,
  FLOOR(SQRT(total_xp / 50.0)) + 1 as niveau_attendu,
  CASE 
    WHEN current_level = FLOOR(SQRT(total_xp / 50.0)) + 1 THEN '✅ OK'
    ELSE '❌ Erreur'
  END as status
FROM gamification_data
ORDER BY total_xp DESC;

-- 4. Table de référence XP -> Niveau
SELECT 
  niveau,
  xp_minimum,
  xp_prochain_niveau,
  (xp_prochain_niveau - xp_minimum) as xp_requis
FROM (
  SELECT 
    level as niveau,
    POWER(level - 1, 2) * 50 as xp_minimum,
    POWER(level, 2) * 50 as xp_prochain_niveau
  FROM generate_series(1, 20) as level
) as niveaux
ORDER BY niveau;
