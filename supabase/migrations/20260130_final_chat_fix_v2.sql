-- Final Robust Fix for Chat Permissions V2 (Fixing search_path issue)

-- 1. Helper Function: Security Definer with INCLUSIVE search_path
-- We include 'auth' and 'extensions' to ensure auth.uid() and other helpers work correctly.
create or replace function public.can_access_service_chat(_service_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
begin
    return exists (
        select 1 from public.services s
        where s.id = _service_id
        and (
            s.owner_id = auth.uid() 
            OR exists (
                select 1 from public.service_permissions sp
                where sp.service_id = s.id 
                and sp.grantee_id = auth.uid()
            )
        )
    );
end;
$$;

-- 2. Conversations: Allow View if participant OR has service access (Owner/Perm)
drop policy if exists "Users can view conversations they are part of" on public.chat_conversations;
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

-- 3. Participants: Allow View if valid participant OR has access to join (Crucial for Owner caching)
drop policy if exists "View participants" on public.chat_participants;
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

-- 4. Participants: Allow Join (Insert) if Owner or Invited
drop policy if exists "Join conversation" on public.chat_participants;
create policy "Join conversation"
    on public.chat_participants for insert
    with check (
        user_id = auth.uid() 
        AND (
            -- Can join Global
             exists (
                select 1 from public.chat_conversations c
                where c.id = conversation_id and c.type = 'global'
            )
            OR
            -- Can join Service (if Owner or Permission)
            exists (
                select 1 from public.chat_conversations c
                where c.id = conversation_id and c.type = 'service'
                and public.can_access_service_chat(c.context_id)
            )
        )
    );

-- 5. Messages: Allow View
drop policy if exists "View messages" on public.chat_messages;
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

-- 6. Messages: Allow Send
drop policy if exists "Send messages" on public.chat_messages;
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
