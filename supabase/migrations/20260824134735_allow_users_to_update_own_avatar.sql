-- HEDS25-576: authenticated users may persist changes to their own profile,
-- while privileged staff retain the profile-management access used by admin UI.
-- Legacy UPDATE policies are replaced because user_profiles_admin_update calls
-- the obsolete is_admin() implementation based on user_roles.role_id.

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "update_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_update" ON public.user_profiles;
DROP POLICY IF EXISTS "p0_user_profiles_update_own" ON public.user_profiles;
DROP POLICY IF EXISTS "p0_user_profiles_update_own_or_privileged" ON public.user_profiles;

CREATE POLICY "p0_user_profiles_update_own_or_privileged"
ON public.user_profiles
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.uid()) = user_id
  OR (SELECT public.app_is_privileged())
)
WITH CHECK (
  (SELECT auth.uid()) = user_id
  OR (SELECT public.app_is_privileged())
);

COMMENT ON POLICY "p0_user_profiles_update_own_or_privileged" ON public.user_profiles IS
  'Allows profile owners and privileged staff to update user profile rows.';
