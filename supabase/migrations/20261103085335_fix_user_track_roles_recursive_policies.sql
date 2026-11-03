-- Same access predicates as the four original policies, without querying the
-- protected table recursively from its own RLS expression. Already proven on TEST.
-- No user grants, role assignments or table privileges are introduced here.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_active_track_role(target_track_id text, accepted_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public'
AS $function$
  SELECT (SELECT auth.uid()) IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.user_track_roles utr
      WHERE utr.user_id = (SELECT auth.uid())
        AND (target_track_id IS NULL OR utr.track_id = target_track_id)
        AND utr.role::text = ANY(accepted_roles)
        AND utr.is_active = true
        AND (utr.expires_at IS NULL OR utr.expires_at > now())
    );
$function$;
REVOKE ALL ON FUNCTION private.has_active_track_role(text, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_active_track_role(text, text[]) TO authenticated, service_role;

ALTER POLICY "Admin can manage track roles" ON public.user_track_roles
TO authenticated
USING (role::text <> 'SUPER_ADMIN' AND private.has_active_track_role(track_id::text, ARRAY['ADMIN', 'SECRETARIAT']::text[]))
WITH CHECK (role::text <> 'SUPER_ADMIN' AND private.has_active_track_role(track_id::text, ARRAY['ADMIN', 'SECRETARIAT']::text[]));

ALTER POLICY "Admin can view track roles" ON public.user_track_roles
TO authenticated
USING (private.has_active_track_role(track_id::text, ARRAY['ADMIN', 'SECRETARIAT', 'RF']::text[]));

ALTER POLICY "SuperAdmin can manage all roles" ON public.user_track_roles
TO authenticated
USING (private.has_active_track_role(NULL::text, ARRAY['SUPER_ADMIN']::text[]))
WITH CHECK (private.has_active_track_role(NULL::text, ARRAY['SUPER_ADMIN']::text[]));

ALTER POLICY "SuperAdmin can view all roles" ON public.user_track_roles
TO authenticated
USING (private.has_active_track_role(NULL::text, ARRAY['SUPER_ADMIN']::text[]));
