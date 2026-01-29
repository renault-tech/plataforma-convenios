-- 1. Add owner_id to services
alter table public.services 
add column if not exists owner_id uuid references public.profiles(id);

-- 2. Populate owner_id (Temporary fix: Assign null owners to the user running this, or Leave NULL if we can't determine)
-- We will policy-check nulls or let user manually fix.
-- For now, let's try to set it to an admin if exists, or auth user.
-- Since this is SQL passed to user, they run it as their user.
update public.services 
set owner_id = auth.uid() 
where owner_id is null;

-- 3. Enable RLS
alter table public.services enable row level security;

-- 4. Policies

-- Policy: Owner can do everything
create policy "Owners can manage services" 
on public.services 
for all 
using (owner_id = auth.uid());

-- Policy: Shared users can VIEW (if they have 'view' or 'edit' or 'admin' permission)
create policy "Shared users can view services" 
on public.services 
for select 
using (
    exists (
        select 1 from public.service_permissions sp
        where sp.service_id = id
        and (
            sp.grantee_id = auth.uid() -- Direct share
            or 
            -- Group share
            exists (
                select 1 from public.access_group_members agm 
                where agm.group_id = sp.grantee_id 
                and agm.user_id = auth.uid()
            )
        )
    )
);

-- Policy: Shared users can UPDATE (if they have 'edit' or 'admin')
-- Note: 'admin' might delete? usually 'admin' permission level implies permissions management, not table deletion.
-- Let's stick to update for now.
create policy "Shared users can edit services" 
on public.services 
for update
using (
    exists (
        select 1 from public.service_permissions sp
        where sp.service_id = id
        and sp.permission_level in ('edit', 'admin')
        and (
            sp.grantee_id = auth.uid()
            or 
            exists (
                select 1 from public.access_group_members agm 
                where agm.group_id = sp.grantee_id 
                and agm.user_id = auth.uid()
            )
        )
    )
);
