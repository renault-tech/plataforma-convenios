-- Create a table for public profiles (synced with auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  is_admin boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Trigger to create a profile entry when a new user signs up via Supabase Auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to avoid conflicts
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Now create the Permission System Tables

-- Create access_groups table
create table if not exists public.access_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create access_group_members table
create table if not exists public.access_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.access_groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(group_id, user_id)
);

-- Create access_policies table (Criteria/Rules)
create table if not exists public.access_policies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  filter_logic jsonb not null, 
  service_id uuid references public.services(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- Create service_permissions table
create table if not exists public.service_permissions (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services(id) on delete cascade not null,
  grantee_type text not null check (grantee_type in ('user', 'group')),
  grantee_id uuid not null,
  policy_id uuid references public.access_policies(id) on delete set null,
  permission_level text not null check (permission_level in ('view', 'edit', 'admin')),
  created_at timestamp with time zone default now()
);

-- Indexes
create index if not exists idx_access_group_members_user on public.access_group_members(user_id);
create index if not exists idx_service_permissions_service_grantee on public.service_permissions(service_id, grantee_id);

-- Enable RLS
alter table public.access_groups enable row level security;
alter table public.access_group_members enable row level security;
alter table public.access_policies enable row level security;
alter table public.service_permissions enable row level security;

-- Admin policies
create policy "Admins can manage access groups" on public.access_groups
  for all using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins can manage group members" on public.access_group_members
  for all using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins can manage policies" on public.access_policies
  for all using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins can manage service permissions" on public.service_permissions
  for all using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

-- User policies
create policy "Users can view groups they are in" on public.access_groups
  for select using (
    exists (
      select 1 from public.access_group_members
      where group_id = public.access_groups.id
      and user_id = auth.uid()
    )
  );
