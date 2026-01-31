-- CLEANUP SCRIPT: Remove Duplicate Service Conversations
-- Keeps ONLY the oldest conversation for each service, deletes all others.
-- Safely cleans up messages and participants first.
-- Usage: Run in Supabase SQL Editor.

do $$
declare
    _ids uuid[];
begin
    -- 1. Identify IDs of duplicate conversations (all except the oldest one per service)
    select array_agg(id) into _ids
    from (
        select id,
               row_number() over (partition by context_id, type order by created_at asc) as rn
        from public.chat_conversations
        where type = 'service'
    ) t
    where rn > 1;

    if _ids is not null then
        raise notice 'Found % duplicate conversations to delete.', array_length(_ids, 1);
        
        -- 2. Delete dependent data manually (safer than relying on cascade if not configured)
        delete from public.chat_messages where conversation_id = any(_ids);
        delete from public.chat_participants where conversation_id = any(_ids);
        
        -- 3. Delete the conversations
        delete from public.chat_conversations where id = any(_ids);
        
        raise notice 'Cleanup complete. Deleted % conversations.', array_length(_ids, 1);
    else
        raise notice 'No duplicates found. Database is clean.';
    end if;
end $$ LANGUAGE plpgsql;
