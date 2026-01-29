-- Add status column to service_permissions
ALTER TABLE public.service_permissions
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected'));

-- Add status column to access_group_members
ALTER TABLE public.access_group_members
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected'));

-- Update RLS for services to only show ACTIVE permissions (or owner)
-- Existing policy: "Users can view services they own or have permission to"
DROP POLICY IF EXISTS "Users can view services they own or have permission to" ON public.services;

CREATE POLICY "Users can view services they own or have permission to"
ON public.services
FOR SELECT
USING (
    owner_id = auth.uid()
    OR
    EXISTS (
        SELECT 1 FROM public.service_permissions sp
        WHERE sp.service_id = public.services.id
        AND sp.status = 'active' -- ONLY ACTIVE
        AND (
            (sp.grantee_type = 'user' AND sp.grantee_id = auth.uid())
            OR
            (sp.grantee_type = 'group' AND EXISTS (
                SELECT 1 FROM public.access_group_members agm
                WHERE agm.group_id = sp.grantee_id
                AND agm.user_id = auth.uid()
                AND agm.status = 'active' -- ONLY ACTIVE GROUP MEMBERS
            ))
        )
    )
    OR
    EXISTS (
        SELECT 1 FROM public.access_groups ag
        WHERE ag.owner_id = auth.uid()
        AND EXISTS (
             SELECT 1 FROM public.service_permissions sp
             WHERE sp.service_id = public.services.id
             AND sp.grantee_type = 'group'
             AND sp.grantee_id = ag.id
             And sp.status = 'active'
        )
    )
);

-- Update service_permissions RLS so users can see their PENDING invites (to accept them)
-- But they shouldn't see the SERVICE content yet (handled above).
-- They need to see the permission record itself.
DROP POLICY IF EXISTS "Users can view permissions granted to them" ON public.service_permissions;

CREATE POLICY "Users can view permissions granted to them"
ON public.service_permissions
FOR SELECT
USING (
    (grantee_type = 'user' AND grantee_id = auth.uid()) -- Can see pending too
    OR
    (grantee_type = 'group' AND EXISTS (
        SELECT 1 FROM public.access_group_members agm
        WHERE agm.group_id = service_permissions.grantee_id
        AND agm.user_id = auth.uid()
    ))
    OR
    EXISTS (
        SELECT 1 FROM public.services s
        WHERE s.id = service_permissions.service_id
        AND s.owner_id = auth.uid()
    )
);

-- Explicitly allow users to UPDATE their own permission status (Accept/Reject)
CREATE POLICY "Users can update their own permissions (Accept/Reject)"
ON public.service_permissions
FOR UPDATE
USING (
    grantee_type = 'user' AND grantee_id = auth.uid()
)
WITH CHECK (
    grantee_type = 'user' AND grantee_id = auth.uid()
    -- Maybe constrain status changes? trusting app logic for now
);
