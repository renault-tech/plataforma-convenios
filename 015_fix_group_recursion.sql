-- Fix Group Recursion using Security Definer Function

-- 1. Create a secure function to check group ownership without triggering RLS on access_groups table
CREATE OR REPLACE FUNCTION public.check_is_group_owner(check_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.access_groups
    WHERE id = check_group_id
    AND owner_id = auth.uid()
  );
END;
$$;

-- 2. Update access_group_members policy to use the function for OWNERS
-- This replaces the direct join which causes recursion
DROP POLICY IF EXISTS "Owners can manage members" ON public.access_group_members;

CREATE POLICY "Owners can manage members" 
ON public.access_group_members 
FOR ALL 
USING (
    -- Use function to check ownership securely
    public.check_is_group_owner(group_id)
    OR
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);
