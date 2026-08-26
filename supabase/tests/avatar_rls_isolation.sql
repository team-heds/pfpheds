\set ON_ERROR_STOP on

BEGIN;

SELECT set_config(
  'request.jwt.claim.sub',
  (
    SELECT au.id::text
    FROM auth.users au
    JOIN public.user_profiles up ON up.user_id = au.id
    WHERE lower(coalesce(up.role, '')) NOT IN ('admin', 'super.all', 'adminphysio', 'adminsoins')
      AND NOT (coalesce(up.permissions, '{}'::jsonb) ?| array['admin', 'super.all', 'editor'])
      AND NOT EXISTS (
        SELECT 1
        FROM public.user_track_roles utr
        WHERE utr.user_id = au.id
          AND utr.is_active = true
          AND utr.role::text IN ('SUPER_ADMIN', 'ADMIN', 'SECRETARIAT', 'RF', 'RM')
          AND (utr.expires_at IS NULL OR utr.expires_at > now())
      )
    ORDER BY au.created_at
    LIMIT 1
  ),
  true
);

SELECT set_config(
  'heds_test.other_uid',
  (
    SELECT au.id::text
    FROM auth.users au
    JOIN public.user_profiles up ON up.user_id = au.id
    WHERE au.id <> current_setting('request.jwt.claim.sub')::uuid
    ORDER BY au.created_at
    LIMIT 1
  ),
  true
);

SET LOCAL ROLE authenticated;

DO $test$
DECLARE
  own_updates integer;
  other_updates integer;
BEGIN
  IF nullif(current_setting('request.jwt.claim.sub', true), '') IS NULL
     OR nullif(current_setting('heds_test.other_uid', true), '') IS NULL THEN
    RAISE EXCEPTION 'Avatar RLS isolation test requires two auth users';
  END IF;

  WITH changed AS (
    UPDATE public.user_profiles
    SET updated_at = updated_at
    WHERE user_id = auth.uid()
    RETURNING 1
  )
  SELECT count(*) INTO own_updates FROM changed;

  WITH changed AS (
    UPDATE public.user_profiles
    SET updated_at = updated_at
    WHERE user_id = current_setting('heds_test.other_uid')::uuid
    RETURNING 1
  )
  SELECT count(*) INTO other_updates FROM changed;

  IF own_updates <> 1 THEN
    RAISE EXCEPTION 'Owner update expected 1 row, got %', own_updates;
  END IF;

  IF other_updates <> 0 THEN
    RAISE EXCEPTION 'Cross-user update expected 0 rows, got %', other_updates;
  END IF;
END
$test$;

RESET ROLE;
ROLLBACK;

SELECT 'avatar_rls_isolation_ok' AS result;
