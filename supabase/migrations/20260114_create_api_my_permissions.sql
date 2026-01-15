-- Create RPC function to get current user's permissions
-- This function returns all permissions associated with the authenticated user

CREATE OR REPLACE FUNCTION api_my_permissions()
RETURNS TABLE (perm text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  user_role text;
  user_permissions jsonb;
BEGIN
  -- Get current authenticated user ID
  current_user_id := auth.uid();
  
  -- Return empty if no user is authenticated
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Get user role and permissions from user_profiles table
  SELECT 
    up.role,
    up.permissions
  INTO 
    user_role,
    user_permissions
  FROM user_profiles up
  WHERE up.user_id = current_user_id;

  -- Return role as a permission if it exists
  IF user_role IS NOT NULL THEN
    RETURN QUERY SELECT user_role::text;
  END IF;

  -- Return permissions from permissions column (if it's a jsonb array)
  IF user_permissions IS NOT NULL THEN
    IF jsonb_typeof(user_permissions) = 'array' THEN
      RETURN QUERY 
        SELECT jsonb_array_elements_text(user_permissions)::text;
    END IF;
  END IF;

  RETURN;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION api_my_permissions() TO authenticated;

-- Add comment
COMMENT ON FUNCTION api_my_permissions() IS 'Returns all permissions for the currently authenticated user from user_profiles table';
