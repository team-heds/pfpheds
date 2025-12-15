CREATE OR REPLACE FUNCTION public.api_my_permissions()
RETURNS TABLE(perm text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT unnest(public.get_user_permissions(auth.uid()::text)) AS perm;
$$;

GRANT EXECUTE ON FUNCTION public.api_my_permissions() TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
