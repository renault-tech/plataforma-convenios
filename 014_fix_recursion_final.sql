-- Fix Recursion using Security Definer Function

-- 1. Create a secure function to check ownership without triggering RLS on services table
-- This breaks the: service_permissions -> checks services -> checks service_permissions loop
CREATE OR REPLACE FUNCTION public.check_is_service_owner(check_service_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of creator (postgres/admin), bypassing RLS
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.services
    WHERE id = check_service_id
    AND owner_id = auth.uid()
  );
END;
$$;

-- 2. Update service_permissions policy to use the function
DROP POLICY IF EXISTS "Users can view permissions granted to them" ON public.service_permissions;

CREATE POLICY "Users can view permissions granted to them"
ON public.service_permissions
FOR SELECT
USING (
    (grantee_type = 'user' AND grantee_id = auth.uid())
    OR
    (grantee_type = 'group' AND EXISTS (
        SELECT 1 FROM public.access_group_members agm
        WHERE agm.group_id = service_permissions.grantee_id
        AND agm.user_id = auth.uid()
    ))
    OR
    -- Use function instead of direct table access to break recursion
    public.check_is_service_owner(service_id)
);
