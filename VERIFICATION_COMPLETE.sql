-- ================================================
-- VÉRIFICATION COMPLÈTE DU SYSTÈME
-- ================================================
-- Exécute ce script APRÈS avoir fait les 4 scripts
-- Pour vérifier que tout fonctionne correctement
-- ================================================

-- ========================================
-- CHECK 1 : NIVEAUX INDIVIDUELS
-- ========================================

SELECT '=== CHECK 1 : NIVEAUX INDIVIDUELS ===' as test;

-- Tous les niveaux doivent être entre 1 et 20
SELECT 
  COUNT(*) as total_users,
  MIN(current_level) as niveau_min,
  MAX(current_level) as niveau_max,
  AVG(current_level)::NUMERIC(10,2) as niveau_moyen,
  CASE
    WHEN MIN(current_level) >= 1 AND MAX(current_level) <= 20 THEN '✅ OK'
    ELSE '❌ PROBLÈME'
  END as status
FROM gamification_data;

-- Répartition par niveau
SELECT 
  current_level,
  COUNT(*) as nombre_users,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as pourcentage
FROM gamification_data
GROUP BY current_level
ORDER BY current_level;


-- ========================================
-- CHECK 2 : LIAISON GAMIFICATION <-> HOUSES
-- ========================================

SELECT '=== CHECK 2 : LIAISON GAMIFICATION <-> HOUSES ===' as test;

-- Vérifier que tous les users ont une maison valide
SELECT 
  COUNT(CASE WHEN house_id IS NOT NULL THEN 1 END) as users_avec_maison,
  COUNT(CASE WHEN house_id IS NULL THEN 1 END) as users_sans_maison,
  COUNT(*) as total_users,
  CASE
    WHEN COUNT(CASE WHEN house_id IS NULL THEN 1 END) = 0 THEN '✅ OK - Tous ont une maison'
    ELSE '⚠️ ' || COUNT(CASE WHEN house_id IS NULL THEN 1 END) || ' users sans maison'
  END as status
FROM gamification_data;

-- Statistiques par maison
SELECT 
  h.name as maison,
  h.id as house_id,
  COUNT(g.user_id) as nb_membres_comptés,
  h.member_count as nb_membres_stocké,
  SUM(g.total_xp) as xp_calculé,
  h.total_xp as xp_stocké,
  h.level as niveau_maison,
  CASE
    WHEN COUNT(g.user_id) = h.member_count AND SUM(g.total_xp) = h.total_xp THEN '✅ OK'
    ELSE '⚠️ Désynchronisé'
  END as status
FROM houses h
LEFT JOIN gamification_data g ON g.house_id = h.id
GROUP BY h.id, h.name, h.member_count, h.total_xp, h.level
ORDER BY h.name;


-- ========================================
-- CHECK 3 : NIVEAUX MAISONS
-- ========================================

SELECT '=== CHECK 3 : NIVEAUX MAISONS ===' as test;

-- Vérifier que la colonne level existe et est correcte
SELECT 
  name as maison,
  total_xp,
  level as niveau_actuel,
  GREATEST(1, FLOOR(SQRT(total_xp / 10000.0)) + 1) as niveau_calculé,
  CASE
    WHEN level = GREATEST(1, FLOOR(SQRT(total_xp / 10000.0)) + 1) THEN '✅ OK'
    ELSE '⚠️ Recalculer'
  END as status,
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
-- CHECK 4 : TRIGGER AUTOMATIQUE
-- ========================================

SELECT '=== CHECK 4 : TRIGGER MAISONS ===' as test;

-- Vérifier que le trigger existe
SELECT 
  tgname as nom_trigger,
  tgtype as type,
  tgenabled as actif,
  CASE
    WHEN tgenabled = 'O' THEN '✅ Trigger actif'
    ELSE '❌ Trigger désactivé'
  END as status
FROM pg_trigger 
WHERE tgname = 'trigger_update_house_level';

-- Vérifier que la fonction existe
SELECT 
  proname as nom_fonction,
  prolang::regproc as langage,
  CASE
    WHEN proname = 'update_house_level' THEN '✅ Fonction existe'
    ELSE '❌ Fonction manquante'
  END as status
FROM pg_proc 
WHERE proname = 'update_house_level';


-- ========================================
-- CHECK 5 : FORMULES DE CALCUL
-- ========================================

SELECT '=== CHECK 5 : FORMULES DE CALCUL ===' as test;

-- Exemples de niveaux individuels
WITH level_examples AS (
  SELECT 
    niveau,
    niveau * niveau * 100 as xp_minimum,
    (niveau + 1) * (niveau + 1) * 100 - 1 as xp_maximum,
    CASE niveau
      WHEN 1 THEN 'Étudiant·e Physio'
      WHEN 5 THEN 'Assistant·e Physio (PALIER)'
      WHEN 10 THEN 'Spécialiste (PALIER)'
      WHEN 15 THEN 'Cadre de Santé Physio (PALIER)'
      WHEN 20 THEN 'Légende Physiothérapie HES (PALIER)'
      ELSE 'Niveau ' || niveau
    END as titre
  FROM generate_series(1, 20) as niveau
  WHERE niveau IN (1, 2, 5, 8, 10, 15, 20)
)
SELECT * FROM level_examples;

-- Exemples de niveaux maisons
WITH house_level_examples AS (
  SELECT 
    niveau,
    (niveau - 1) * (niveau - 1) * 10000 as xp_minimum,
    niveau * niveau * 10000 - 1 as xp_maximum,
    CASE niveau
      WHEN 1 THEN 'Maison Naissante'
      WHEN 2 THEN 'Maison Active'
      WHEN 3 THEN 'Maison Dynamique'
      WHEN 4 THEN 'Maison Brillante'
      WHEN 5 THEN 'Maison d''Excellence'
      ELSE 'Niveau ' || niveau
    END as titre
  FROM generate_series(1, 8) as niveau
)
SELECT * FROM house_level_examples;


-- ========================================
-- CHECK 6 : TOP ÉTUDIANTS
-- ========================================

SELECT '=== CHECK 6 : TOP 10 ÉTUDIANTS ===' as test;

-- Top 10 tous niveaux confondus
SELECT 
  g.email,
  h.name as maison,
  g.total_xp,
  g.current_level,
  CASE
    WHEN g.current_level BETWEEN 1 AND 5 THEN 'Novice'
    WHEN g.current_level BETWEEN 6 AND 10 THEN 'Intermédiaire'
    WHEN g.current_level BETWEEN 11 AND 15 THEN 'Avancé'
    WHEN g.current_level BETWEEN 16 AND 20 THEN 'Maître'
  END as phase
FROM gamification_data g
LEFT JOIN houses h ON g.house_id = h.id
ORDER BY g.total_xp DESC
LIMIT 10;


-- ========================================
-- CHECK 7 : STATISTIQUES GLOBALES
-- ========================================

SELECT '=== CHECK 7 : STATISTIQUES GLOBALES ===' as test;

-- Vue d'ensemble du système
SELECT 
  'Total Utilisateurs' as statistique,
  COUNT(*)::TEXT as valeur
FROM gamification_data

UNION ALL

SELECT 
  'XP Total Système',
  SUM(total_xp)::TEXT
FROM gamification_data

UNION ALL

SELECT 
  'XP Moyen par User',
  AVG(total_xp)::INTEGER::TEXT
FROM gamification_data

UNION ALL

SELECT 
  'Niveau Moyen',
  AVG(current_level)::NUMERIC(10,1)::TEXT
FROM gamification_data

UNION ALL

SELECT 
  'Nombre de Maisons',
  COUNT(*)::TEXT
FROM houses

UNION ALL

SELECT 
  'XP Total Maisons',
  SUM(total_xp)::TEXT
FROM houses

UNION ALL

SELECT 
  'Niveau Moyen Maisons',
  AVG(level)::NUMERIC(10,1)::TEXT
FROM houses;


-- ========================================
-- CHECK 8 : USERS PAR PALIER
-- ========================================

SELECT '=== CHECK 8 : USERS PAR PALIER ===' as test;

-- Combien d'users ont atteint chaque palier
SELECT 
  'Palier 5 (Assistant·e Physio)' as palier,
  COUNT(*) as nombre_users
FROM gamification_data
WHERE current_level >= 5

UNION ALL

SELECT 
  'Palier 10 (Spécialiste)',
  COUNT(*)
FROM gamification_data
WHERE current_level >= 10

UNION ALL

SELECT 
  'Palier 15 (Cadre de Santé)',
  COUNT(*)
FROM gamification_data
WHERE current_level >= 15

UNION ALL

SELECT 
  'Palier 20 (Légende)',
  COUNT(*)
FROM gamification_data
WHERE current_level >= 20;


-- ========================================
-- RÉSUMÉ FINAL
-- ========================================

SELECT '=== RÉSUMÉ FINAL ===' as test;

WITH checks AS (
  SELECT 
    COUNT(*) as check_total,
    SUM(CASE WHEN current_level >= 1 AND current_level <= 20 THEN 1 ELSE 0 END) as check_niveaux,
    SUM(CASE WHEN house_id IS NOT NULL THEN 1 ELSE 0 END) as check_maisons,
    COUNT(*) as total_users
  FROM gamification_data
)
SELECT 
  CASE
    WHEN check_niveaux = total_users THEN '✅ Tous les niveaux OK (1-20)'
    ELSE '❌ Problème niveaux'
  END as check_1_niveaux,
  CASE
    WHEN check_maisons = total_users THEN '✅ Tous ont une maison'
    ELSE '⚠️ Certains sans maison'
  END as check_2_maisons,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_house_level') THEN '✅ Trigger actif'
    ELSE '❌ Trigger manquant'
  END as check_3_trigger,
  CASE
    WHEN (SELECT COUNT(*) FROM houses WHERE level IS NOT NULL) = (SELECT COUNT(*) FROM houses) THEN '✅ Toutes les maisons ont un niveau'
    ELSE '❌ Maisons sans niveau'
  END as check_4_houses_level
FROM checks;

SELECT '✅ VÉRIFICATION TERMINÉE !' as resultat;
