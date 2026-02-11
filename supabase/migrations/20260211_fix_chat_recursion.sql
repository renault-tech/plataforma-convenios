-- FIX RECURSION V2: Use Security Definer functions for ALL membership checks
-- This prevents RLS policies from triggering themselves recursively.

-- 1. Helper: Check if auth user is a participant (Bypasses RLS)
create or replace function public.is_chat_member(_conversation_id uuid)
returns boolean
language plpgsql
security definer -- Runs as admin to bypass RLS
set search_path = public, auth
as $$
begin
    return exists (
        select 1 from public.chat_participants
        where conversation_id = _conversation_id
        and user_id = auth.uid()
    );
end;
$$;

-- 2. Helper: Check if auth user has service access (Bypasses RLS)
create or replace function public.can_access_service_chat_v2(_service_id uuid)
returns boolean
language plpgsql
security definer -- Runs as admin to bypass RLS
set search_path = public, auth
as $$
declare
    _uid uuid;
begin
    _uid := auth.uid();
    if _uid is null then return false; end if;

    return exists (
        select 1 
        from public.services s
        left join public.service_permissions sp on sp.service_id = s.id
        where s.id = _service_id
        and (
            s.owner_id = _uid 
            OR (sp.grantee_id = _uid and sp.status = 'active')
        )
    );
end;
$$;

-- 3. DROP OLD POLICIES
drop policy if exists "Users can view conversations they are part of" on public.chat_conversations;
drop policy if exists "View participants" on public.chat_participants;
drop policy if exists "Join conversation" on public.chat_participants;
drop policy if exists "View messages" on public.chat_messages;
drop policy if exists "Send messages" on public.chat_messages;

-- 4. RECREATE POLICIES USING FUNCTIONS

-- Conversations
create policy "Users can view conversations they are part of"
    on public.chat_conversations for select
    using (
        public.is_chat_member(id) -- Uses function (No Recursion)
        OR
        (type = 'service' and public.can_access_service_chat_v2(context_id))
    );

-- Participants (View)
create policy "View participants"
    on public.chat_participants for select
    using (
        public.is_chat_member(conversation_id) -- Uses function (No Recursion)
        OR
        exists (
            select 1 from public.chat_conversations c
            where c.id = chat_participants.conversation_id
            and c.type = 'service'
            and public.can_access_service_chat_v2(c.context_id)
        )
    );

-- Participants (Insert/Join)
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
                and public.can_access_service_chat_v2(c.context_id)
            )
        )
    );

-- Messages (View)
create policy "View messages"
    on public.chat_messages for select
    using (
        public.is_chat_member(conversation_id) -- Uses function (No Recursion)
        OR
        exists (
            select 1 from public.chat_conversations c
            where c.id = chat_messages.conversation_id
            and c.type = 'service'
            and public.can_access_service_chat_v2(c.context_id)
        )
    );

-- Messages (Send)
create policy "Send messages"
    on public.chat_messages for insert
    with check (
        auth.uid() = sender_id 
        AND (
            public.is_chat_member(conversation_id) -- Uses function (No Recursion)
            OR
            exists (
                select 1 from public.chat_conversations c
                where c.id = chat_messages.conversation_id
                and c.type = 'service'
                and public.can_access_service_chat_v2(c.context_id)
            )
        )
    );
