-- Replace email-based frontend exceptions with explicit profile permissions.
-- Existing permissions are preserved and the migration is idempotent.

DO $$
DECLARE
  restricted_emails text[] := ARRAY[
    'lucienne.darbellay-fumeaux@hevs.ch',
    'filipa.pereira@hevs.ch',
    'aline.chappuis@hevs.ch',
    'maude.epiney-perruchoud@hevs.ch',
    'isabelle.salamin-plaschy@hevs.ch',
    'rafael.weissbrodt@hevs.ch',
    'valerie.caloz-albrecht@hevs.ch',
    'tiffany.rapillard@hevs.ch',
    'omar.porteladossantos@hevs.ch',
    'jesse.curchod@hevs.ch',
    'line.martin@hevs.ch',
    'isabelle.rey@hevs.ch',
    'carla.gomesdarocha@hevs.ch',
    'elodie.perruchoud@hevs.ch'
  ];
BEGIN
  UPDATE public.user_profiles AS profile
  SET permissions = (
    SELECT jsonb_agg(permission ORDER BY permission)
    FROM (
      SELECT DISTINCT permission
      FROM jsonb_array_elements_text(
        CASE
          WHEN jsonb_typeof(profile.permissions) = 'array' THEN profile.permissions
          ELSE '[]'::jsonb
        END
        || '["academic_restricted", "academic.restricted", "auth.redirect.dashboard_rm", "planning.weekly.view"]'::jsonb
      ) AS permission
    ) AS permissions_to_keep
  )
  WHERE lower(profile.email) = ANY (restricted_emails);
END
$$;
