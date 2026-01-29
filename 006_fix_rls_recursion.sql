-- Fix RLS Infinite Recursion by using Security Definer functions
-- These functions run with the privileges of the creator (postgres/admin), avoiding the RLS cycle.

-- 1. Helper Function: Is User Member of Group?
create or replace function public.is_group_member(check_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 
    from public.access_group_members 
    where group_id = check_group_id 
    and user_id = auth.uid()
  );
$$;

-- 2. Helper Function: Is User Owner of Group?
create or replace function public.is_group_owner(check_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 
    from public.access_groups 
    where id = check_group_id 
    and owner_id = auth.uid()
  );
$$;

-- 3. Update Policies on access_groups
drop policy if exists "Members can view groups" on public.access_groups;
create policy "Users can view groups" 
on public.access_groups for select 
using (
    is_group_member(id)
    or owner_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
);

-- 4. Update Policies on access_group_members
drop policy if exists "Users can view members of their groups" on public.access_group_members;

-- Use the functions to safely check permission without triggering recursion
create policy "Users can view group members" 
on public.access_group_members for select 
using (
    is_group_member(group_id)
    or 
    is_group_owner(group_id)
);

-- Also ensure owners can manage members (already defined but let's be safe)
drop policy if exists "Owners can manage members" on public.access_group_members;
create policy "Owners can manage members" 
on public.access_group_members for all 
using (
    is_group_owner(group_id)
);
