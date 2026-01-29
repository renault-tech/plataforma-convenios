-- 1. Enable Public Group Creation & Ownership
alter table public.access_groups 
add column if not exists owner_id uuid references public.profiles(id);

-- Update existing groups to have current user as owner (or system admin) if not set. 
-- For now, we rely on new inserts setting it.

-- Remove Admin-only restriction for group creation
drop policy if exists "Admins can manage access groups" on public.access_groups;

-- New Policies for Access Groups
create policy "Authenticated users can create groups" 
on public.access_groups for insert 
with check (auth.role() = 'authenticated');

create policy "Owners can update/delete their groups" 
on public.access_groups for all 
using (owner_id = auth.uid());

create policy "Members can view groups" 
on public.access_groups for select 
using (
    exists (
        select 1 from public.access_group_members 
        where group_id = public.access_groups.id 
        and user_id = auth.uid()
    )
    or owner_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true) -- Admins view all
);


-- 2. Add Member Status (Invite System)
alter table public.access_group_members 
add column if not exists status text default 'accepted' check (status in ('pending', 'accepted', 'rejected'));
-- Note: 'accepted' default maintains compatibility for existing members. 
-- Frontend will explicitly set 'pending' for new invites.

-- 3. RLS for Group Members
drop policy if exists "Admins can manage group members" on public.access_group_members;

create policy "Owners can manage members" 
on public.access_group_members for all 
using (
    exists (
        select 1 from public.access_groups 
        where id = group_id 
        and (owner_id = auth.uid() or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
    )
);

create policy "Users can update own membership status" 
on public.access_group_members for update 
using (user_id = auth.uid());

create policy "Users can view members of their groups" 
on public.access_group_members for select 
using (
    exists (
        select 1 from public.access_group_members as agm
        where agm.group_id = public.access_group_members.group_id 
        and agm.user_id = auth.uid()
    )
    or
    exists (
         select 1 from public.access_groups
         where id = public.access_group_members.group_id
         and owner_id = auth.uid()
    )
);

-- 4. Update Notifications for Invites
alter table public.notifications 
add column if not exists text_payload text; -- Generic payload for extra data if needed (e.g. group_id)
