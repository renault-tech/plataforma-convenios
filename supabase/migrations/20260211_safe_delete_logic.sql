-- 1. Ensure Services DELETE policy is restricted to owners only
-- This overrides any potentially permissive policies.

DROP POLICY IF EXISTS "Owners and Admins can delete services" ON public.services;
CREATE POLICY "Owners and Admins can delete services"
    ON public.services FOR DELETE
    USING (
        owner_id = auth.uid() 
        OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- 2. Ensure Service Permissions DELETE policy allows users to leave (delete their own permission)
-- and owners to kick (delete permissions for their service)

DROP POLICY IF EXISTS "Users can leave or be kicked" ON public.service_permissions;
CREATE POLICY "Users can leave or be kicked"
    ON public.service_permissions FOR DELETE
    USING (
        -- User removing themselves (Leave)
        (grantee_type = 'user' AND grantee_id = auth.uid())
        OR 
        -- Owner removing a permission (Kick)
        EXISTS (
            SELECT 1 FROM public.services 
            WHERE id = service_permissions.service_id 
            AND owner_id = auth.uid()
        )
        OR
        -- Admin removing a permission
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- 3. Trigger Function: Notify Owner when a user leaves
CREATE OR REPLACE FUNCTION public.handle_service_permission_leaving()
RETURNS TRIGGER AS $$
DECLARE
    v_service_owner_id uuid;
    v_service_name text;
    v_user_name text;
    v_deleter_id uuid;
BEGIN
    -- Get current user ID (who performed the delete)
    v_deleter_id := auth.uid();
    
    -- If no user context (e.g. system), skip
    IF v_deleter_id IS NULL THEN
        RETURN OLD;
    END IF;

    -- Only proceed if it's a "Leave" action (User removing themselves)
    -- If Owner removed them, it's a Kick, so no need to notify Owner.
    IF OLD.grantee_type = 'user' AND OLD.grantee_id = v_deleter_id THEN
        
        -- Get Service Details
        SELECT owner_id, name INTO v_service_owner_id, v_service_name
        FROM public.services
        WHERE id = OLD.service_id;
        
        -- If service doesn't exist (e.g. cascading delete from service deletion), skip
        IF NOT FOUND THEN
            RETURN OLD;
        END IF;

        -- Don't notify if the owner is somehow deleting their own permission (shouldn't happen, but safe check)
        IF v_service_owner_id = v_deleter_id THEN
            RETURN OLD;
        END IF;

        -- Get User Name
        SELECT full_name INTO v_user_name
        FROM public.profiles
        WHERE id = v_deleter_id;
        
        -- Insert Notification
        INSERT INTO public.notifications (user_id, title, message, type, action_link)
        VALUES (
            v_service_owner_id,
            'Usuário saiu da planilha',
            COALESCE(v_user_name, 'Um usuário') || ' removeu o acesso à planilha "' || v_service_name || '".',
            'info',
            '/configuracoes?tab=' || OLD.service_id
        );
        
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create Trigger
DROP TRIGGER IF EXISTS on_service_permission_leave ON public.service_permissions;
CREATE TRIGGER on_service_permission_leave
    AFTER DELETE ON public.service_permissions
    FOR EACH ROW EXECUTE PROCEDURE public.handle_service_permission_leaving();
