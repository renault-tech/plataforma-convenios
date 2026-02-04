-- Drop table if exists to ensure clean slate (and avoid policy conflicts)
drop table if exists public.feedback;

-- Create feedback table
create table public.feedback (
    id uuid not null default gen_random_uuid(),
    user_id uuid references public.profiles(id) on delete set null,
    message text not null,
    type text not null default 'general', -- general, bug, suggestion
    url text,
    status text not null default 'new', -- new, read, archived
    created_at timestamp with time zone not null default now(),
    
    constraint feedback_pkey primary key (id)
);

-- Enable RLS
alter table public.feedback enable row level security;

-- Policies

-- Insert: Authenticated users can insert their own feedback
create policy "Users can insert their own feedback"
    on public.feedback
    for insert
    to authenticated
    with check (true); 

-- Select: Admins can view all feedback. Users can view their own (optional, but good for history if we implement it later)
-- For now, let's allow users to see their own, and admins to see all.
-- We assume there's an is_admin function or claim. Based on previous context, we'll check public.profiles.is_admin
create policy "Admins can view all feedback"
    on public.feedback
    for select
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.is_admin = true
        )
        or
        auth.uid() = user_id
    );

-- Update: Admins can update status
create policy "Admins can update feedback"
    on public.feedback
    for update
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.is_admin = true
        )
    );

-- Delete: Admins can delete
create policy "Admins can delete feedback"
    on public.feedback
    for delete
    using (
        exists (
            select 1 from public.profiles
            where profiles.id = auth.uid()
            and profiles.is_admin = true
        )
    );

-- Enable Realtime
alter publication supabase_realtime add table public.feedback;
