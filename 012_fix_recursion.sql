-- Fix Infinite Recursion in RLS

-- 1. Create a secure function to check ownership without triggering RLS recursively
-- SECURITY DEFINER means it runs with the privileges of the creator (postgres/admin), bypassing RLS on 'services'.
CREATE OR REPLACE FUNCTION public.is_service_owner(service_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.services 
    WHERE id = service_id 
    AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update the Policy on service_permissions to use this function
DROP POLICY IF EXISTS "Service Owners can manage permissions" ON public.service_permissions;

CREATE POLICY "Service Owners can manage permissions"
ON public.service_permissions
FOR ALL
USING (
    public.is_service_owner(service_id)
);

-- Note: The other policies (Grantees view/update) do not query 'services', so they are safe.
