-- ================================================
-- SYNCHRONISER LES XP DES MAISONS DEPUIS LES UTILISATEURS
-- ================================================

-- 1. Voir l'état actuel des maisons
SELECT name, total_xp, member_count, level 
FROM houses 
ORDER BY name;

-- 2. Calculer les XP réels par maison depuis gamification_data
SELECT 
  LOWER(maison) as maison_name,
  COUNT(*) as nb_membres,
  SUM(total_xp) as total_xp_membres,
  AVG(total_xp)::INTEGER as xp_moyen,
  MAX(total_xp) as xp_max
FROM gamification_data
WHERE maison IS NOT NULL AND maison != ''
GROUP BY LOWER(maison)
ORDER BY maison_name;

-- 3. METTRE À JOUR les XP des maisons basé sur les XP des membres
UPDATE houses h
SET total_xp = COALESCE((
  SELECT SUM(total_xp)
  FROM gamification_data
  WHERE LOWER(maison) = h.name
), 0),
member_count = COALESCE((
  SELECT COUNT(*)
  FROM gamification_data
  WHERE LOWER(maison) = h.name
), 0);

-- 4. Calculer les niveaux des maisons
UPDATE houses
SET level = GREATEST(1, FLOOR(SQRT(total_xp / 10000.0)) + 1);

-- 5. Vérifier le résultat
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
  END as titre,
  (total_xp / NULLIF(member_count, 0))::INTEGER as xp_par_membre
FROM houses
ORDER BY total_xp DESC;

-- 6. Statistiques détaillées par maison
SELECT 
  h.name as maison,
  h.total_xp,
  h.level,
  h.member_count,
  COUNT(g.user_id) as membres_verifies,
  SUM(g.total_xp) as xp_calcule,
  AVG(g.total_xp)::INTEGER as xp_moyen_membre,
  MAX(g.total_xp) as xp_max_membre,
  MIN(g.total_xp) as xp_min_membre
FROM houses h
LEFT JOIN gamification_data g ON LOWER(g.maison) = h.name
GROUP BY h.name, h.total_xp, h.level, h.member_count
ORDER BY h.total_xp DESC;

SELECT '✅ Synchronisation des XP des maisons terminée !' as status;
