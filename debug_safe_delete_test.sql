-- Test Script for Safe Delete Logic

DO $$
DECLARE
    v_owner_id uuid;
    v_guest_id uuid;
    v_service_id uuid;
    v_notification_count int;
BEGIN
    -- 1. Setup: Ensure we have 2 test users (using existing profiles if possible or mock)
    -- We'll try to use existing users from profiles to avoid FK issues with auth.users
    -- If not enough users, we can't fully test, but assuming dev env has users.
    
    SELECT id INTO v_owner_id FROM public.profiles ORDER BY created_at ASC LIMIT 1;
    SELECT id INTO v_guest_id FROM public.profiles WHERE id != v_owner_id ORDER BY created_at ASC LIMIT 1;
    
    IF v_owner_id IS NULL OR v_guest_id IS NULL THEN
        RAISE NOTICE 'Skipping test: Not enough users in profiles table.';
        RETURN;
    END IF;

    RAISE NOTICE 'Owner ID: %', v_owner_id;
    RAISE NOTICE 'Guest ID: %', v_guest_id;

    -- 2. Create a Test Service (Owner)
    INSERT INTO public.services (name, slug, owner_id)
    VALUES ('Service Test Deletion', 'service-test-del', v_owner_id)
    RETURNING id INTO v_service_id;
    
    RAISE NOTICE 'Created Service ID: %', v_service_id;

    -- 3. Add Guest Permission
    INSERT INTO public.service_permissions (service_id, grantee_type, grantee_id, permission_level)
    VALUES (v_service_id, 'user', v_guest_id, 'view');

    RAISE NOTICE 'Added Guest Permission';

    -- 4. Simulate Guest Leaving
    -- IMPORTANT: Triggers usually run as the user. In SQL script we are postgres/superuser.
    -- The trigger logic relies on `auth.uid()`.
    -- We can simulate this by briefly mocking auth.uid() function or just checking logic.
    -- Since we can't easily mock auth.uid() in a simple DO block without extensions,
    -- checks inside the trigger (v_deleter_id := auth.uid()) will return NULL or fail.
    
    -- MODIFYING STRATEGY: 
    -- We will temporarily trust the logic if we manually check it, 
    -- OR we can try to set local config if supabase supports it, e.g. set_config('request.jwt.claim.sub', ...).
    
    -- Attempting to mock auth.uid for the transaction
    PERFORM set_config('request.jwt.claim.sub', v_guest_id::text, true);
    
    DELETE FROM public.service_permissions
    WHERE service_id = v_service_id AND grantee_id = v_guest_id;
    
    RAISE NOTICE 'Guest Left (Simulated)';

    -- 5. Check Notification
    SELECT count(*) INTO v_notification_count
    FROM public.notifications
    WHERE user_id = v_owner_id 
    AND title = 'Usuário saiu da planilha'
    AND created_at > now() - interval '1 minute';
    
    IF v_notification_count > 0 THEN
        RAISE NOTICE 'SUCCESS: Notification found for Owner.';
    ELSE
        RAISE NOTICE 'FAILURE: No notification found for Owner.';
    END IF;

    -- 6. Clean up
    DELETE FROM public.services WHERE id = v_service_id;
    -- Notifications should cascade delete or remain? 
    -- Notifications reference profiles, not services directly in FK (only text link).
    -- Cleanup notifications created by test
    DELETE FROM public.notifications 
    WHERE user_id = v_owner_id AND title = 'Usuário saiu da planilha' 
    AND message LIKE '%Service Test Deletion%';

END $$;
