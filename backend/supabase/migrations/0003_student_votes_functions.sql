-- Migration: Fonctions backend pour la gestion des votes étudiants
-- Date: 2025-11-28
-- Description: Fonctions PostgreSQL pour la logique métier des votes

-- ============================================================================
-- FONCTION: Obtenir le vote d'un étudiant pour un PFP et une année
-- ============================================================================
CREATE OR REPLACE FUNCTION get_student_vote(
  p_user_id uuid,
  p_pfp_type text,
  p_year text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_vote jsonb;
BEGIN
  SELECT to_jsonb(sv.*)
  INTO v_vote
  FROM public.student_votes sv
  WHERE sv.user_id = p_user_id
    AND sv.pfp_type = p_pfp_type
    AND sv.year = p_year;
    
  RETURN v_vote;
END;
$$;

COMMENT ON FUNCTION get_student_vote IS 'Récupère le vote d''un étudiant pour un PFP et une année donnés';

-- ============================================================================
-- FONCTION: Enregistrer ou mettre à jour un vote
-- ============================================================================
CREATE OR REPLACE FUNCTION upsert_student_vote(
  p_user_id uuid,
  p_pfp_type text,
  p_year text,
  p_choices jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Vérifier que l'utilisateur est authentifié et correspond à p_user_id
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Non autorisé: vous devez être authentifié et voter pour vous-même';
  END IF;

  -- Vérifier que choices est un array
  IF jsonb_typeof(p_choices) != 'array' THEN
    RAISE EXCEPTION 'Le paramètre choices doit être un array JSON';
  END IF;

  -- Upsert le vote
  INSERT INTO public.student_votes (user_id, pfp_type, year, choices)
  VALUES (p_user_id, p_pfp_type, p_year, p_choices)
  ON CONFLICT (user_id, pfp_type, year)
  DO UPDATE SET
    choices = p_choices,
    updated_at = timezone('utc'::text, now())
  RETURNING to_jsonb(student_votes.*) INTO v_result;

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION upsert_student_vote IS 'Enregistre ou met à jour le vote d''un étudiant (avec vérification de sécurité)';

-- ============================================================================
-- FONCTION: Supprimer le vote d'un étudiant
-- ============================================================================
CREATE OR REPLACE FUNCTION delete_student_vote(
  p_user_id uuid,
  p_pfp_type text,
  p_year text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que l'utilisateur est authentifié et correspond à p_user_id
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Non autorisé: vous devez être authentifié et supprimer votre propre vote';
  END IF;

  DELETE FROM public.student_votes
  WHERE user_id = p_user_id
    AND pfp_type = p_pfp_type
    AND year = p_year;
    
  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION delete_student_vote IS 'Supprime le vote d''un étudiant (avec vérification de sécurité)';

-- ============================================================================
-- VUE: Statistiques des votes par PFP et année
-- ============================================================================
CREATE OR REPLACE VIEW vote_statistics AS
SELECT 
  pfp_type,
  year,
  COUNT(DISTINCT user_id) as total_voters,
  COUNT(*) as total_votes,
  MIN(created_at) as first_vote_date,
  MAX(updated_at) as last_vote_date
FROM public.student_votes
GROUP BY pfp_type, year
ORDER BY year DESC, pfp_type;

COMMENT ON VIEW vote_statistics IS 'Statistiques générales des votes par type PFP et année';

-- ============================================================================
-- VUE: Agrégation des choix de places (pour les résultats de votation)
-- ============================================================================
CREATE OR REPLACE VIEW vote_place_aggregation AS
SELECT 
  sv.pfp_type,
  sv.year,
  choice->>'placeId' as place_id,
  choice->>'placeName' as place_name,
  choice->>'InstitutionName' as institution_name,
  (choice->>'rank')::int as rank,
  COUNT(*) as vote_count
FROM public.student_votes sv,
  jsonb_array_elements(sv.choices) as choice
WHERE choice->>'placeId' IS NOT NULL
GROUP BY 
  sv.pfp_type,
  sv.year,
  choice->>'placeId',
  choice->>'placeName',
  choice->>'InstitutionName',
  (choice->>'rank')::int
ORDER BY sv.year DESC, sv.pfp_type, (choice->>'rank')::int, COUNT(*) DESC;

COMMENT ON VIEW vote_place_aggregation IS 'Agrégation des votes par place, utile pour afficher les résultats';

-- ============================================================================
-- FONCTION: Récupérer le top N des places les plus votées
-- ============================================================================
CREATE OR REPLACE FUNCTION get_top_voted_places(
  p_pfp_type text,
  p_year text,
  p_rank int DEFAULT 1,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  place_id text,
  place_name text,
  institution_name text,
  vote_count bigint,
  rank int
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    vpa.place_id,
    vpa.place_name,
    vpa.institution_name,
    vpa.vote_count,
    vpa.rank
  FROM vote_place_aggregation vpa
  WHERE vpa.pfp_type = p_pfp_type
    AND vpa.year = p_year
    AND vpa.rank = p_rank
  ORDER BY vpa.vote_count DESC
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION get_top_voted_places IS 'Récupère les places les plus votées pour un rang donné (ex: top 10 des choix #1)';

-- ============================================================================
-- FONCTION: Vérifier si un étudiant a déjà voté
-- ============================================================================
CREATE OR REPLACE FUNCTION has_student_voted(
  p_user_id uuid,
  p_pfp_type text,
  p_year text
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.student_votes
    WHERE user_id = p_user_id
      AND pfp_type = p_pfp_type
      AND year = p_year
  );
$$;

COMMENT ON FUNCTION has_student_voted IS 'Vérifie si un étudiant a déjà voté pour un PFP et une année donnés';

-- ============================================================================
-- FONCTION: Obtenir tous les votes d'un étudiant
-- ============================================================================
CREATE OR REPLACE FUNCTION get_all_student_votes(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_agg(to_jsonb(sv.*) ORDER BY sv.updated_at DESC)
  FROM public.student_votes sv
  WHERE sv.user_id = p_user_id;
$$;

COMMENT ON FUNCTION get_all_student_votes IS 'Récupère tous les votes d''un étudiant';

-- ============================================================================
-- FONCTION: Obtenir le nombre total de votes pour un PFP/année
-- ============================================================================
CREATE OR REPLACE FUNCTION count_votes(
  p_pfp_type text,
  p_year text
)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)::integer
  FROM public.student_votes
  WHERE pfp_type = p_pfp_type
    AND year = p_year;
$$;

COMMENT ON FUNCTION count_votes IS 'Compte le nombre total de votes pour un type PFP et une année';

-- ============================================================================
-- GRANTS: Donner les permissions nécessaires
-- ============================================================================

-- Permettre aux utilisateurs authentifiés d'utiliser les fonctions
GRANT EXECUTE ON FUNCTION get_student_vote TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_student_vote TO authenticated;
GRANT EXECUTE ON FUNCTION delete_student_vote TO authenticated;
GRANT EXECUTE ON FUNCTION has_student_voted TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_student_votes TO authenticated;
GRANT EXECUTE ON FUNCTION count_votes TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_voted_places TO authenticated;

-- Permettre aux utilisateurs authentifiés de voir les vues (lecture seule)
GRANT SELECT ON vote_statistics TO authenticated;
GRANT SELECT ON vote_place_aggregation TO authenticated;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Fonctions backend pour student_votes créées avec succès';
  RAISE NOTICE '   - get_student_vote()';
  RAISE NOTICE '   - upsert_student_vote()';
  RAISE NOTICE '   - delete_student_vote()';
  RAISE NOTICE '   - has_student_voted()';
  RAISE NOTICE '   - get_all_student_votes()';
  RAISE NOTICE '   - count_votes()';
  RAISE NOTICE '   - get_top_voted_places()';
  RAISE NOTICE '   - Vues: vote_statistics, vote_place_aggregation';
END $$;
