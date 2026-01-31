-- Fix for Chat Access for Service Owners

-- Helper function to check service access (Bypasses RLS on services table)
create or replace function public.can_access_service_chat(_service_id uuid)
returns boolean
language plpgsql
security definer -- Runs with privileges of creator (postgres), bypassing RLS
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

-- Update Policies to use the secure function

-- 1. Conversation Visibility
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

-- 2. Message Visibility
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

-- 3. Message Sending
drop policy if exists "Send messages" on public.chat_messages;
create policy "Send messages"
    on public.chat_messages for insert
    with check (
        auth.uid() = sender_id AND
        (
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
