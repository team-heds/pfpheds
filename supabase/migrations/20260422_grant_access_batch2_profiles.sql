-- Grant requested access (batch 2)
-- Date: 2026-04-22
-- Same permissions as previous batch: super.all, admin, AdminPhysio, AdminSoins,
-- EnseignantSoins, EnseignantPhysio, EtudiantSoins, EtudiantPhysio

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
  -- 1) Update global role/permissions
  UPDATE user_profiles up
  SET
    role = 'admin',
    permissions = perms,
    is_active = true,
    updated_at = NOW()
  WHERE lower(coalesce(up.email, '')) IN (
    'aurelien.chion@hevs.ch',
    'christine.maschio@hevs.ch',
    'calexandre.fournier@hevs.ch',
    'sebastien.putallaz@hevs.ch',
    'christine.seppey@hevs.ch',
    'emmanuelle.kerwien-jacquier@hevs.ch',
    'christa.furrer@hevs.ch',
    'anita.heggli@hevs.ch',
    'brigitte.lehmann@hevs.ch',
    'doris.bittel-passeraub@hevs.ch',
    'stephan.dorschner@hevs.ch',
    'fernando.carlen@hevs.ch',
    'regula.treyer@hevs.ch',
    'kira.fux@hevs.ch',
    'rebecca.schafers@hevs.ch',
    'melanie.kistler-fischbacher@hevs.ch',
    'pascale.tanner@hevs.ch',
    'mnicole.barmaz@hevs.ch',
    'michela.bassolino@hevs.ch',
    'alainmiguel.berard@hevs.ch',
    'sofia.fernandes@hevs.ch'
  );

  -- 2) Ensure track-level roles exist (SI + PHY) as SUPER_ADMIN
  INSERT INTO user_track_roles (user_id, track_id, role, is_active)
  SELECT tu.user_id, tu.track_id, tu.role, true
  FROM (
    SELECT up.user_id, 'SI'::text AS track_id, 'SUPER_ADMIN'::text AS role
    FROM user_profiles up
    WHERE lower(coalesce(up.email, '')) IN (
      'aurelien.chion@hevs.ch',
      'christine.maschio@hevs.ch',
      'calexandre.fournier@hevs.ch',
      'sebastien.putallaz@hevs.ch',
      'christine.seppey@hevs.ch',
      'emmanuelle.kerwien-jacquier@hevs.ch',
      'christa.furrer@hevs.ch',
      'anita.heggli@hevs.ch',
      'brigitte.lehmann@hevs.ch',
      'doris.bittel-passeraub@hevs.ch',
      'stephan.dorschner@hevs.ch',
      'fernando.carlen@hevs.ch',
      'regula.treyer@hevs.ch',
      'kira.fux@hevs.ch',
      'rebecca.schafers@hevs.ch',
      'melanie.kistler-fischbacher@hevs.ch',
      'pascale.tanner@hevs.ch',
      'mnicole.barmaz@hevs.ch',
      'michela.bassolino@hevs.ch',
      'alainmiguel.berard@hevs.ch',
      'sofia.fernandes@hevs.ch'
    )

    UNION ALL

    SELECT up.user_id, 'PHY'::text AS track_id, 'SUPER_ADMIN'::text AS role
    FROM user_profiles up
    WHERE lower(coalesce(up.email, '')) IN (
      'aurelien.chion@hevs.ch',
      'christine.maschio@hevs.ch',
      'calexandre.fournier@hevs.ch',
      'sebastien.putallaz@hevs.ch',
      'christine.seppey@hevs.ch',
      'emmanuelle.kerwien-jacquier@hevs.ch',
      'christa.furrer@hevs.ch',
      'anita.heggli@hevs.ch',
      'brigitte.lehmann@hevs.ch',
      'doris.bittel-passeraub@hevs.ch',
      'stephan.dorschner@hevs.ch',
      'fernando.carlen@hevs.ch',
      'regula.treyer@hevs.ch',
      'kira.fux@hevs.ch',
      'rebecca.schafers@hevs.ch',
      'melanie.kistler-fischbacher@hevs.ch',
      'pascale.tanner@hevs.ch',
      'mnicole.barmaz@hevs.ch',
      'michela.bassolino@hevs.ch',
      'alainmiguel.berard@hevs.ch',
      'sofia.fernandes@hevs.ch'
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
