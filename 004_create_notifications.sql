-- Create notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text default 'info', -- 'group_add', 'alert', 'info'
  read_at timestamp with time zone,
  action_link text,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policies
create policy "Users can view their own notifications" on public.notifications
  for select using (auth.uid() = user_id);

create policy "Users can update their own notifications" on public.notifications
  for update using (auth.uid() = user_id);

-- Allow anyone (e.g. admins or system triggers) to create notifications for others
-- In a stricter system, you might limit this, but for now allow authenticated users to notify others (e.g. adding to group)
create policy "Users can insert notifications" on public.notifications
  for insert with check (auth.role() = 'authenticated');
