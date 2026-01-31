-- Enable RLS
alter table if exists public.chat_conversations enable row level security;
alter table if exists public.chat_participants enable row level security;
alter table if exists public.chat_messages enable row level security;
alter table if exists public.chat_settings enable row level security;

-- RESET TABLES (To fix FKs during development)
drop table if exists public.chat_messages cascade;
drop table if exists public.chat_participants cascade;
drop table if exists public.chat_conversations cascade;
drop table if exists public.chat_settings cascade;

-- Ensure profiles has avatar_url (Fix for missing column error)
alter table public.profiles add column if not exists avatar_url text;

-- Enable RLS on profiles if not already
alter table public.profiles enable row level security;

-- Allow users to view profiles (needed for chat names/avatars)
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
    on public.profiles for select
    using ( true );

-- 1. Conversation Table
create table if not exists public.chat_conversations (
    id uuid default gen_random_uuid() primary key,
    type text not null check (type in ('global', 'service', 'group')),
    context_id uuid references public.services(id) on delete set null, -- Null for global, ServiceID for sheets
    name text, -- Optional, for named groups
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Participants Table
create table if not exists public.chat_participants (
    conversation_id uuid references public.chat_conversations(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
    last_read_at timestamp with time zone default timezone('utc'::text, now()),
    primary key (conversation_id, user_id)
);

-- 3. Messages Table
create table if not exists public.chat_messages (
    id uuid default gen_random_uuid() primary key,
    conversation_id uuid references public.chat_conversations(id) on delete cascade not null,
    sender_id uuid references public.profiles(id) on delete set null,
    content text not null,
    is_system_message boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Settings Table
create table if not exists public.chat_settings (
    user_id uuid references public.profiles(id) on delete cascade primary key,
    theme_color text default '#3b82f6',
    enter_to_send boolean default true,
    auto_open boolean default true,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- POLICIES

-- Conversations
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
        -- Logic for service channels: access if you have permission on context_id OR are the owner
        (type = 'service' and exists (
             select 1 from public.services s
             where s.id = context_id 
             and (s.owner_id = auth.uid() OR exists (
                 select 1 from public.service_permissions sp
                 where sp.service_id = s.id and sp.grantee_id = auth.uid()
             ))
        ))
    );

drop policy if exists "Users can create conversations" on public.chat_conversations;
create policy "Users can create conversations"
    on public.chat_conversations for insert
    with check (true);

-- Participants
drop policy if exists "View participants" on public.chat_participants;
create policy "View participants"
    on public.chat_participants for select
    using (
        exists (
            select 1 from public.chat_participants part
            where part.conversation_id = chat_participants.conversation_id
            and part.user_id = auth.uid()
        )
    );

drop policy if exists "Join conversation" on public.chat_participants;
create policy "Join conversation"
    on public.chat_participants for insert
    with check (user_id = auth.uid() OR exists ( -- Use trigger for invites later
        select 1 from public.chat_conversations c
        where c.id = conversation_id and c.type = 'global'
    ));

-- Messages
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
            join public.services s on s.id = c.context_id
            where c.id = chat_messages.conversation_id
            and c.type = 'service'
            and (
                s.owner_id = auth.uid()
                OR exists (
                    select 1 from public.service_permissions sp
                    where sp.service_id = s.id
                    and sp.grantee_id = auth.uid()
                )
            )
        )
    );

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
                join public.services s on s.id = c.context_id
                where c.id = chat_messages.conversation_id
                and c.type = 'service'
                and (
                    s.owner_id = auth.uid()
                    OR exists (
                        select 1 from public.service_permissions sp
                        where sp.service_id = s.id
                        and sp.grantee_id = auth.uid()
                    )
                )
            )
        )
    );

-- Settings
drop policy if exists "Manage own settings" on public.chat_settings;
create policy "Manage own settings"
    on public.chat_settings for all
    using (user_id = auth.uid());

-- Triggers for Updated At
create or replace function public.handle_updated_at()
returns trigger as $function$
begin
    new.updated_at = now();
    return new;
end;
$function$ language plpgsql;

drop trigger if exists set_timestamp_conversations on public.chat_conversations;
create trigger set_timestamp_conversations
    before update on public.chat_conversations
    for each row execute procedure public.handle_updated_at();
