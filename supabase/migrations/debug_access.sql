-- DEBUG SCRIPT V2: Auto-test Access
-- Run this in the SQL Editor of Supabase.

do $$
declare
    _service_id uuid;
    _has_access boolean;
begin
    -- 1. Automatically pick the first service found
    select id into _service_id from public.services limit 1;
    
    if _service_id is null then
        raise notice 'No services found to test.';
        return;
    end if;

    raise notice 'Testing with Service ID: %', _service_id;

    -- 2. Test the function (checking for crashes)
    begin
        select public.can_access_service_chat(_service_id) into _has_access;
        raise notice 'Function execution: SUCCESS. Access Result: %', _has_access;
    exception when others then
        raise notice 'Function execution: FAILED. Error: %', SQLERRM;
    end;
    
    -- 3. Check policies existence
    if exists (select 1 from pg_policies where policyname = 'View participants' and tablename = 'chat_participants') then
        raise notice 'Policy "View participants" exists.';
    else
        raise notice 'WARNING: Policy "View participants" NOT found.';
    end if;

end $$;
