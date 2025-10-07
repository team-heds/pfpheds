-- ================================================
-- MIGRATION VERS SYSTÈME 20 NIVEAUX
-- ================================================

-- Nouvelle formule: niveau = FLOOR(SQRT(total_xp / 100))
-- Plafond au niveau 20

-- 1. Voir l'impact de la migration
SELECT 
  user_id,
  total_xp,
  current_level as niveau_actuel,
  LEAST(FLOOR(SQRT(total_xp / 100.0)), 20) as nouveau_niveau,
  LEAST(FLOOR(SQRT(total_xp / 100.0)), 20) - current_level as difference
FROM gamification_data
ORDER BY total_xp DESC;

-- 2. APPLIQUER LA MIGRATION
UPDATE gamification_data
SET current_level = LEAST(FLOOR(SQRT(total_xp / 100.0)), 20)
WHERE current_level != LEAST(FLOOR(SQRT(total_xp / 100.0)), 20);

-- 3. Vérifier que tout est bon
SELECT 
  user_id,
  total_xp,
  current_level,
  CASE
    WHEN current_level BETWEEN 1 AND 20 THEN '✅ OK'
    ELSE '❌ Hors limites'
  END as status
FROM gamification_data
ORDER BY total_xp DESC;

-- 4. Table de référence des 20 niveaux
WITH niveau_config AS (
  SELECT 
    level as niveau,
    POWER(level, 2) * 100 as xp_minimum,
    POWER(level + 1, 2) * 100 as xp_prochain_niveau,
    POWER(level + 1, 2) * 100 - POWER(level, 2) * 100 as xp_requis,
    CASE
      WHEN level BETWEEN 1 AND 5 THEN 'Novice'
      WHEN level BETWEEN 6 AND 10 THEN 'Intermédiaire'
      WHEN level BETWEEN 11 AND 15 THEN 'Avancé'
      WHEN level BETWEEN 16 AND 20 THEN 'Maître'
    END as phase,
    CASE level
      WHEN 1 THEN 'Étudiant·e Physio'
      WHEN 2 THEN 'Observateur·rice'
      WHEN 3 THEN 'Apprenti·e Thérapeute'
      WHEN 4 THEN 'Stagiaire Physio'
      WHEN 5 THEN 'Assistant·e Physio'
      WHEN 6 THEN 'Physiothérapeute Junior'
      WHEN 7 THEN 'Thérapeute Confirmé·e'
      WHEN 8 THEN 'Physiothérapeute Diplômé·e'
      WHEN 9 THEN 'Clinicien·ne Physio'
      WHEN 10 THEN 'Spécialiste'
      WHEN 11 THEN 'Expert·e Thérapie Manuelle'
      WHEN 12 THEN 'Physiothérapeute Référent·e'
      WHEN 13 THEN 'Formateur·rice Clinique'
      WHEN 14 THEN 'Responsable Rééducation'
      WHEN 15 THEN 'Cadre de Santé Physio'
      WHEN 16 THEN 'Maître Physiothérapeute'
      WHEN 17 THEN 'Consultant·e Expert·e'
      WHEN 18 THEN 'Chercheur·se en Physiothérapie'
      WHEN 19 THEN 'Professeur·e HES Physio'
      WHEN 20 THEN 'Légende Physiothérapie HES'
    END as titre,
    level IN (5, 10, 15, 20) as est_palier,
    CASE 
      WHEN level = 5 THEN 500
      WHEN level = 10 THEN 1000
      WHEN level = 15 THEN 1500
      WHEN level = 20 THEN 3000
      ELSE 0
    END as bonus_palier
  FROM generate_series(1, 20) as level
)
SELECT * FROM niveau_config ORDER BY niveau;

-- 5. Statistiques par phase
SELECT 
  CASE
    WHEN current_level BETWEEN 1 AND 5 THEN 'Novice'
    WHEN current_level BETWEEN 6 AND 10 THEN 'Intermédiaire'
    WHEN current_level BETWEEN 11 AND 15 THEN 'Avancé'
    WHEN current_level BETWEEN 16 AND 20 THEN 'Maître'
  END as phase,
  COUNT(*) as nombre_utilisateurs,
  AVG(total_xp)::INTEGER as xp_moyen,
  MAX(total_xp) as xp_max
FROM gamification_data
GROUP BY 
  CASE
    WHEN current_level BETWEEN 1 AND 5 THEN 'Novice'
    WHEN current_level BETWEEN 6 AND 10 THEN 'Intermédiaire'
    WHEN current_level BETWEEN 11 AND 15 THEN 'Avancé'
    WHEN current_level BETWEEN 16 AND 20 THEN 'Maître'
  END
ORDER BY 
  MIN(current_level);

-- 6. Utilisateurs aux paliers
SELECT 
  user_id,
  total_xp,
  current_level,
  CASE current_level
    WHEN 5 THEN 'Assistant·e'
    WHEN 10 THEN 'Spécialiste'
    WHEN 15 THEN 'Manager'
    WHEN 20 THEN 'Légende HES'
  END as titre_palier
FROM gamification_data
WHERE current_level IN (5, 10, 15, 20)
ORDER BY current_level DESC, total_xp DESC;

-- 7. Progression vers paliers suivants
SELECT 
  user_id,
  current_level,
  total_xp,
  CASE
    WHEN current_level < 5 THEN 5
    WHEN current_level < 10 THEN 10
    WHEN current_level < 15 THEN 15
    WHEN current_level < 20 THEN 20
    ELSE 20
  END as prochain_palier,
  CASE
    WHEN current_level < 5 THEN (5 * 5 * 100) - total_xp
    WHEN current_level < 10 THEN (10 * 10 * 100) - total_xp
    WHEN current_level < 15 THEN (15 * 15 * 100) - total_xp
    WHEN current_level < 20 THEN (20 * 20 * 100) - total_xp
    ELSE 0
  END as xp_restant_palier
FROM gamification_data
WHERE current_level < 20
ORDER BY current_level DESC, xp_restant_palier ASC
LIMIT 10;

SELECT '✅ Migration vers système 20 niveaux terminée !' as status;
