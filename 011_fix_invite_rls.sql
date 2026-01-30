-- 1. DROP old restrictive policies on service_permissions
DROP POLICY IF EXISTS "Admins can manage service permissions" ON public.service_permissions;
DROP POLICY IF EXISTS "Users can view permissions granted to them" ON public.service_permissions;
DROP POLICY IF EXISTS "Users can update their own permissions (Accept/Reject)" ON public.service_permissions;

-- 2. New Policy: OWNERS can manage ALL permissions for their services (Insert/Update/Delete)
CREATE POLICY "Service Owners can manage permissions"
ON public.service_permissions
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.services s
        WHERE s.id = service_permissions.service_id
        AND s.owner_id = auth.uid()
    )
);

-- 3. New Policy: GRANTEES can VIEW their own permissions (to see pending invites)
CREATE POLICY "Grantees can view their own permissions"
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
);

-- 4. New Policy: GRANTEES can UPDATE status (Accept/Reject)
-- Strictly check that they are modifying their own record
CREATE POLICY "Grantees can update status"
ON public.service_permissions
FOR UPDATE
USING (
    grantee_type = 'user' AND grantee_id = auth.uid()
)
WITH CHECK (
    grantee_type = 'user' AND grantee_id = auth.uid()
);

-- Note: We do NOT allow grantees to DELETE. They can set status to 'rejected' or the owner can delete.
-- Or we could allow delete if we want "Leave" functionality. Let's stick to status update for now.

-- 5. Data Integrity: Prevent duplicates
-- We need to ensure one permission per service/grantee pair.
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_permissions_unique 
ON public.service_permissions(service_id, grantee_type, grantee_id);
