-- Migration : Créer une vue pour les statistiques des maisons
-- Date: 2025-10-08
-- Description: Vue matérialisée pour calculer efficacement les statistiques des maisons

-- Créer une vue pour les totaux de points par maison
-- Note: Cette vue nécessite que la colonne 'house' existe dans la table users_profiles
CREATE OR REPLACE VIEW house_points_totals AS
SELECT 
  h.name,
  h.color,
  h.description,
  COALESCE(SUM(hph.points), 0) as total_points,
  (
    SELECT COUNT(DISTINCT p.id)
    FROM users_profiles p
    WHERE p.house = h.name
  ) as member_count,
  (
    SELECT COUNT(DISTINCT ucp.id) 
    FROM user_challenge_progress ucp
    INNER JOIN users_profiles p2 ON ucp.user_id = p2.id
    WHERE p2.house = h.name AND ucp.completed = true
  ) as completed_challenges,
  (
    SELECT COUNT(DISTINCT uqp.id)
    FROM user_quest_progress uqp
    INNER JOIN users_profiles p3 ON uqp.user_id = p3.id
    WHERE p3.house = h.name AND uqp.status = 'completed'
  ) as completed_quests
FROM houses h
LEFT JOIN house_points_history hph ON hph.house = h.name
GROUP BY h.name, h.color, h.description
ORDER BY total_points DESC;

-- Ajouter un commentaire
COMMENT ON VIEW house_points_totals IS 'Vue des statistiques agrégées par maison (points, membres, défis, quêtes)';

-- Créer une fonction pour obtenir le classement des maisons
CREATE OR REPLACE FUNCTION get_house_rankings()
RETURNS TABLE (
  rank INTEGER,
  name TEXT,
  color TEXT,
  description TEXT,
  total_points BIGINT,
  member_count BIGINT,
  completed_challenges BIGINT,
  completed_quests BIGINT,
  percentage_of_leader NUMERIC
) AS $$
DECLARE
  leader_points BIGINT;
BEGIN
  -- Obtenir les points du leader
  SELECT COALESCE(MAX(hpt.total_points), 1) INTO leader_points
  FROM house_points_totals hpt;
  
  -- Retourner le classement
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY hpt.total_points DESC)::INTEGER as rank,
    hpt.name,
    hpt.color,
    hpt.description,
    hpt.total_points,
    hpt.member_count,
    hpt.completed_challenges,
    hpt.completed_quests,
    ROUND((hpt.total_points::NUMERIC / leader_points::NUMERIC) * 100, 2) as percentage_of_leader
  FROM house_points_totals hpt
  ORDER BY hpt.total_points DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- Ajouter un commentaire
COMMENT ON FUNCTION get_house_rankings() IS 'Fonction pour obtenir le classement complet des maisons avec statistiques';

-- Créer une fonction pour obtenir l'historique récent d'une maison
CREATE OR REPLACE FUNCTION get_house_recent_history(house_name TEXT, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  house TEXT,
  points INTEGER,
  reason TEXT,
  created_at TIMESTAMPTZ,
  author_name TEXT,
  author_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hph.id,
    hph.house,
    hph.points,
    hph.reason,
    hph.created_at,
    COALESCE(p.first_name || ' ' || p.last_name, p.email) as author_name,
    p.email as author_email
  FROM house_points_history hph
  LEFT JOIN users_profiles p ON hph.created_by = p.id
  WHERE hph.house = house_name
  ORDER BY hph.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- Ajouter un commentaire
COMMENT ON FUNCTION get_house_recent_history(TEXT, INTEGER) IS 'Fonction pour obtenir l''historique récent des points d''une maison';

-- Afficher un résumé
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Vue et fonctions de statistiques créées !';
  RAISE NOTICE 'Vue : house_points_totals';
  RAISE NOTICE 'Fonction : get_house_rankings()';
  RAISE NOTICE 'Fonction : get_house_recent_history(house_name, limit)';
  RAISE NOTICE '========================================';
END $$;

-- Tester la vue
SELECT * FROM house_points_totals;

-- Tester la fonction de classement
SELECT * FROM get_house_rankings();
