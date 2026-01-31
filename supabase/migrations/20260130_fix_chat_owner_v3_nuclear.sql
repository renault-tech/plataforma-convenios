-- NUCLEAR FIX V3: Reset & Rebuild Chat Permissions
-- Access: Owner of Service (via owner_id) OR Permission Grantee

-- 1. DROP EVERYTHING to ensure clean state
drop policy if exists "Users can view conversations they are part of" on public.chat_conversations;
drop policy if exists "View participants" on public.chat_participants;
drop policy if exists "Join conversation" on public.chat_participants;
drop policy if exists "View messages" on public.chat_messages;
drop policy if exists "Send messages" on public.chat_messages;
drop function if exists public.can_access_service_chat(_service_id uuid);

-- 2. RECREATE FUNCTION (Secure & Robust)
create or replace function public.can_access_service_chat(_service_id uuid)
returns boolean
language plpgsql
security definer -- Runs as admin to bypass Service RLS
set search_path = public, auth, extensions -- IMPORTANT: Access auth.uid()
as $$
declare
    _uid uuid;
begin
    _uid := auth.uid();
    
    -- If no user, deny
    if _uid is null then
        return false;
    end if;

    return exists (
        select 1 from public.services s
        where s.id = _service_id
        and (
            s.owner_id = _uid 
            OR exists (
                select 1 from public.service_permissions sp
                where sp.service_id = s.id 
                and sp.grantee_id = _uid
            )
        )
    );
end;
$$;

-- 3. RECREATE POLICIES

-- Conversations
create policy "Users can view conversations they are part of"
    on public.chat_conversations for select
    using (
        exists (
            select 1 from public.chat_participants
            where conversation_id = chat_conversations.id
            and user_id = auth.uid()
        )
        OR
        (type = 'service' and public.can_access_service_chat(context_id))
    );

-- Participants (View)
create policy "View participants"
    on public.chat_participants for select
    using (
        exists (
            select 1 from public.chat_participants part
            where part.conversation_id = chat_participants.conversation_id
            and part.user_id = auth.uid()
        )
        OR
        exists (
            select 1 from public.chat_conversations c
            where c.id = chat_participants.conversation_id
            and c.type = 'service'
            and public.can_access_service_chat(c.context_id)
        )
    );

-- Participants (Join/Insert)
create policy "Join conversation"
    on public.chat_participants for insert
    with check (
        user_id = auth.uid() 
        AND (
             exists (
                select 1 from public.chat_conversations c
                where c.id = conversation_id and c.type = 'global'
            )
            OR
            exists (
                select 1 from public.chat_conversations c
                where c.id = conversation_id and c.type = 'service'
                and public.can_access_service_chat(c.context_id)
            )
        )
    );

-- Messages (View)
create policy "View messages"
    on public.chat_messages for select
    using (
        exists (
            select 1 from public.chat_participants
            where conversation_id = chat_messages.conversation_id
            and user_id = auth.uid()
        )
        OR
        exists (
            select 1 from public.chat_conversations c
            where c.id = chat_messages.conversation_id
            and c.type = 'service'
            and public.can_access_service_chat(c.context_id)
        )
    );

-- Messages (Send)
create policy "Send messages"
    on public.chat_messages for insert
    with check (
        auth.uid() = sender_id 
        AND (
            exists (
                select 1 from public.chat_participants
                where conversation_id = chat_messages.conversation_id
                and user_id = auth.uid()
            )
            OR
            exists (
                select 1 from public.chat_conversations c
                where c.id = chat_messages.conversation_id
                and c.type = 'service'
                and public.can_access_service_chat(c.context_id)
            )
        )
    );
