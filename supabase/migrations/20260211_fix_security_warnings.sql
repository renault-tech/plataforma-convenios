-- Fix Function Search Path Mutable Warnings
-- We explicitly set search_path to 'public' to prevent search path hijacking.

ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
ALTER FUNCTION public.handle_updated_at() SET search_path = 'public';
ALTER FUNCTION public.satisfies_policy_logic(jsonb, jsonb, text) SET search_path = 'public';
ALTER FUNCTION public.check_item_access(uuid, jsonb) SET search_path = 'public';
ALTER FUNCTION public.handle_status_change_notification() SET search_path = 'public';

-- These functions might be defined with different argument names in different migrations, 
-- but types should be consistent.
ALTER FUNCTION public.check_is_service_owner(uuid) SET search_path = 'public';
ALTER FUNCTION public.check_is_group_owner(uuid) SET search_path = 'public';

-- is_service_owner might be from an older migration or an alias. 
-- Attempting to secure it if it exists with standard UUID signature.
-- If this fails, it might be because the signature is different or it doesn't exist.
-- We wrap in a DO block to avoid breaking the migration if it's missing or different,
-- but since we can't easily do partial failures in SQL script without procedural code:
-- We will assume it takes a UUID based on the naming convention.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_service_owner') THEN
        ALTER FUNCTION public.is_service_owner(uuid) SET search_path = 'public';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not set search_path for is_service_owner: %', SQLERRM;
END $$;


-- Fix RLS Policy Always True Warnings

-- 1. Chat Conversations - Restrict INSERT to authenticated users
DROP POLICY IF EXISTS "Users can create conversations" ON public.chat_conversations;
CREATE POLICY "Users can create conversations"
    ON public.chat_conversations
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- 2. Feedback - Restrict INSERT to owner (user_id must match auth.uid)
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.feedback;
CREATE POLICY "Users can insert their own feedback"
    ON public.feedback
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 3. Services - Restrict modifications, allow public read (if that was the intent of "Enable all")
-- Previous: FOR ALL USING (true) WITH CHECK (true)
DROP POLICY IF EXISTS "Enable all access for services" ON public.services;

-- Split into granular policies for better security

-- Public Read (keep widely accessible as per previous "Enable all")
CREATE POLICY "Public read access for services"
    ON public.services FOR SELECT
    USING (true);

-- Authenticated Create
CREATE POLICY "Authenticated users can create services"
    ON public.services FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Owners/Admins Update
CREATE POLICY "Owners and Admins can update services"
    ON public.services FOR UPDATE
    USING (
        owner_id = auth.uid() 
        OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- Owners/Admins Delete
CREATE POLICY "Owners and Admins can delete services"
    ON public.services FOR DELETE
    USING (
        owner_id = auth.uid() 
        OR 
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );


-- 4. System Logs - Restrict INSERT to authenticated users (or service role)
DROP POLICY IF EXISTS "System can insert logs" ON public.system_logs;
CREATE POLICY "Authenticated users can insert logs"
    ON public.system_logs
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- (Optional) If strictly backend only, we could require service_role, but 'authenticated' is a safe step up from 'anon'.
