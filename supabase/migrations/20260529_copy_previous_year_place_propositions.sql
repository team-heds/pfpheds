-- Copy place propositions from previous votation year to target year (bulk RPC)

CREATE OR REPLACE FUNCTION public.copy_previous_year_place_propositions(
  p_target_year text,
  p_pfp_type text DEFAULT NULL
)
RETURNS TABLE(updated_places integer, updated_fields integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_is_admin boolean := false;
  v_previous_year text;
BEGIN
  IF p_target_year IS NULL OR p_target_year !~ '^\d{4}$' THEN
    RAISE EXCEPTION 'p_target_year must be a 4-digit year';
  END IF;

  IF p_pfp_type IS NOT NULL AND p_pfp_type NOT IN ('PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4') THEN
    RAISE EXCEPTION 'p_pfp_type must be NULL or one of PFP1A/PFP1B/PFP2/PFP3/PFP4';
  END IF;

  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.user_profiles up
    WHERE up.user_id = v_uid
      AND (
        up.role IN ('admin', 'super.all')
        OR (up.permissions IS NOT NULL AND up.permissions ? 'admin')
        OR (up.permissions IS NOT NULL AND up.permissions ? 'super.all')
      )
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;

  v_previous_year := (p_target_year::integer - 1)::text;

  RETURN QUERY
  WITH candidates AS (
    SELECT
      p."PlaceId",
      (
        (p_pfp_type IS NULL OR p_pfp_type = 'PFP1A')
        AND COALESCE(p.pfp1a_proposition, '{}'::jsonb) ? v_previous_year
        AND COALESCE(p.pfp1a_proposition ->> v_previous_year, '') IS DISTINCT FROM COALESCE(p.pfp1a_proposition ->> p_target_year, '')
      ) AS c_pfp1a,
      (
        (p_pfp_type IS NULL OR p_pfp_type = 'PFP1B')
        AND COALESCE(p.pfp1b_proposition, '{}'::jsonb) ? v_previous_year
        AND COALESCE(p.pfp1b_proposition ->> v_previous_year, '') IS DISTINCT FROM COALESCE(p.pfp1b_proposition ->> p_target_year, '')
      ) AS c_pfp1b,
      (
        (p_pfp_type IS NULL OR p_pfp_type = 'PFP2')
        AND COALESCE(p.pfp2_proposition, '{}'::jsonb) ? v_previous_year
        AND COALESCE(p.pfp2_proposition ->> v_previous_year, '') IS DISTINCT FROM COALESCE(p.pfp2_proposition ->> p_target_year, '')
      ) AS c_pfp2,
      (
        (p_pfp_type IS NULL OR p_pfp_type = 'PFP3')
        AND COALESCE(p.pfp3_proposition, '{}'::jsonb) ? v_previous_year
        AND COALESCE(p.pfp3_proposition ->> v_previous_year, '') IS DISTINCT FROM COALESCE(p.pfp3_proposition ->> p_target_year, '')
      ) AS c_pfp3,
      (
        (p_pfp_type IS NULL OR p_pfp_type = 'PFP4')
        AND COALESCE(p.pfp4_proposition, '{}'::jsonb) ? v_previous_year
        AND COALESCE(p.pfp4_proposition ->> v_previous_year, '') IS DISTINCT FROM COALESCE(p.pfp4_proposition ->> p_target_year, '')
      ) AS c_pfp4
    FROM public.places p
  ),
  to_update AS (
    SELECT *
    FROM candidates c
    WHERE c.c_pfp1a OR c.c_pfp1b OR c.c_pfp2 OR c.c_pfp3 OR c.c_pfp4
  ),
  updated AS (
    UPDATE public.places p
    SET
      pfp1a_proposition = CASE
        WHEN u.c_pfp1a THEN jsonb_set(COALESCE(p.pfp1a_proposition, '{}'::jsonb), ARRAY[p_target_year], COALESCE(p.pfp1a_proposition -> v_previous_year, 'null'::jsonb), true)
        ELSE p.pfp1a_proposition
      END,
      pfp1b_proposition = CASE
        WHEN u.c_pfp1b THEN jsonb_set(COALESCE(p.pfp1b_proposition, '{}'::jsonb), ARRAY[p_target_year], COALESCE(p.pfp1b_proposition -> v_previous_year, 'null'::jsonb), true)
        ELSE p.pfp1b_proposition
      END,
      pfp2_proposition = CASE
        WHEN u.c_pfp2 THEN jsonb_set(COALESCE(p.pfp2_proposition, '{}'::jsonb), ARRAY[p_target_year], COALESCE(p.pfp2_proposition -> v_previous_year, 'null'::jsonb), true)
        ELSE p.pfp2_proposition
      END,
      pfp3_proposition = CASE
        WHEN u.c_pfp3 THEN jsonb_set(COALESCE(p.pfp3_proposition, '{}'::jsonb), ARRAY[p_target_year], COALESCE(p.pfp3_proposition -> v_previous_year, 'null'::jsonb), true)
        ELSE p.pfp3_proposition
      END,
      pfp4_proposition = CASE
        WHEN u.c_pfp4 THEN jsonb_set(COALESCE(p.pfp4_proposition, '{}'::jsonb), ARRAY[p_target_year], COALESCE(p.pfp4_proposition -> v_previous_year, 'null'::jsonb), true)
        ELSE p.pfp4_proposition
      END
    FROM to_update u
    WHERE p."PlaceId" = u."PlaceId"
    RETURNING u.c_pfp1a, u.c_pfp1b, u.c_pfp2, u.c_pfp3, u.c_pfp4
  )
  SELECT
    COUNT(*)::integer AS updated_places,
    COALESCE(SUM((c_pfp1a::int + c_pfp1b::int + c_pfp2::int + c_pfp3::int + c_pfp4::int)), 0)::integer AS updated_fields
  FROM updated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.copy_previous_year_place_propositions(text, text) TO authenticated;

COMMENT ON FUNCTION public.copy_previous_year_place_propositions(text, text)
IS 'Bulk copy proposition values from target_year-1 to target_year for places, optionally filtered by PFP type.';
