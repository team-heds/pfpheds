-- Grant requested access to specific profiles
-- Date: 2026-04-22
-- Scope: user_profiles permissions + track roles coherence

DO $$
DECLARE
  perms jsonb := '[
    "super.all",
    "admin",
    "AdminPhysio",
    "AdminSoins",
    "EnseignantSoins",
    "EnseignantPhysio",
    "EtudiantSoins",
    "EtudiantPhysio"
  ]'::jsonb;
BEGIN
  -- 1) Update global role/permissions for the requested users
  UPDATE user_profiles up
  SET
    role = 'admin',
    permissions = perms,
    is_active = true,
    updated_at = NOW()
  WHERE
    lower(coalesce(up.email, '')) IN (
      'sebastien.eyholzer@hevs.ch',
      'chris.schoepf@hevs.ch',
      'mathilde.dechastonay@hevs.ch'
    )
    OR coalesce(up.user_id::text, '') IN (
      'OfFj0feWEe',
      'oDhZlI5B5j',
      'v9goSA6DbV'
    );

  -- 2) Ensure track-level roles exist (SI + PHY)
  INSERT INTO user_track_roles (user_id, track_id, role, is_active)
  SELECT tu.user_id, tu.track_id, tu.role, true
  FROM (
    SELECT up.user_id, 'SI'::text AS track_id, 'SUPER_ADMIN'::text AS role
    FROM user_profiles up
    WHERE lower(coalesce(up.email, '')) IN (
      'sebastien.eyholzer@hevs.ch',
      'chris.schoepf@hevs.ch',
      'mathilde.dechastonay@hevs.ch'
    )

    UNION ALL
    SELECT up.user_id, 'PHY'::text AS track_id, 'SUPER_ADMIN'::text AS role
    FROM user_profiles up
    WHERE lower(coalesce(up.email, '')) IN (
      'sebastien.eyholzer@hevs.ch',
      'chris.schoepf@hevs.ch',
      'mathilde.dechastonay@hevs.ch'
    )
  ) tu
  WHERE NOT EXISTS (
    SELECT 1
    FROM user_track_roles utr
    WHERE utr.user_id = tu.user_id
      AND utr.track_id = tu.track_id
      AND utr.role = tu.role
  );
END $$;
