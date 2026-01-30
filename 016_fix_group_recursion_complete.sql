-- Fix ALL Group Recursion using Security Definer Functions

-- 1. Secure Function: Check Group Ownership
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

-- 2. Secure Function: Check Group Membership
CREATE OR REPLACE FUNCTION public.check_is_group_member(check_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.access_group_members
    WHERE group_id = check_group_id
    AND user_id = auth.uid()
  );
END;
$$;


-- 3. Update Policies on ACCESS_GROUPS (Break recursion looking up members)
DROP POLICY IF EXISTS "Members can view groups" ON public.access_groups;
DROP POLICY IF EXISTS "Owners can update/delete their groups" ON public.access_groups;

-- Admin/Owner Policy
CREATE POLICY "Admins and Owners can manage groups" 
ON public.access_groups FOR ALL 
USING (
    owner_id = auth.uid() 
    OR 
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Member View Policy (Uses Function)
CREATE POLICY "Members can view groups" 
ON public.access_groups FOR SELECT 
USING (
    public.check_is_group_member(id)
);


-- 4. Update Policies on ACCESS_GROUP_MEMBERS (Break recursion looking up groups)
DROP POLICY IF EXISTS "Owners can manage members" ON public.access_group_members;
DROP POLICY IF EXISTS "Users can view members of their groups" ON public.access_group_members;

-- Owner Manage Policy (Uses Function)
CREATE POLICY "Owners can manage members" 
ON public.access_group_members FOR ALL 
USING (
    public.check_is_group_owner(group_id)
    OR
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- Member View Policy (Uses Function)
CREATE POLICY "Users can view members of their groups" 
ON public.access_group_members FOR SELECT 
USING (
    -- You can see members if you are a member of that group
    public.check_is_group_member(group_id)
    OR
    -- Or if you are the owner (covered by function)
    public.check_is_group_owner(group_id)
);
