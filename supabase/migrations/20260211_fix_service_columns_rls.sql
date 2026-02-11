-- FIX SERVICE COLUMNS RLS
-- Currently only owners can insert/update service columns.
-- We need to allow users with 'active' permissions to also manage columns.

-- 1. DROP EXISTING POLICIES
drop policy if exists "Users can view columns for their services" on public.service_columns;
drop policy if exists "Service owners can insert columns" on public.service_columns;
drop policy if exists "Service owners can update columns" on public.service_columns;
drop policy if exists "Service owners can delete columns" on public.service_columns;

-- 2. RECREATE POLICIES ALLOWING PERMISSIONS

-- SELECT: Service Owner OR Shared User (Active)
create policy "Users can view service columns"
    on public.service_columns for select
    using (
        exists (
            select 1 from public.services s
            left join public.service_permissions sp on sp.service_id = s.id
            where s.id = service_columns.service_id
            and (
                s.owner_id = auth.uid()
                OR (sp.grantee_id = auth.uid() and sp.status = 'active')
            )
        )
    );

-- INSERT: Service Owner OR Shared User (Update/Edit/Manage Permissions?)
-- Assuming basic "active" permission implies write access for now, as nuanced roles aren't fully defined.
create policy "Users can insert service columns"
    on public.service_columns for insert
    with check (
        exists (
            select 1 from public.services s
            left join public.service_permissions sp on sp.service_id = s.id
            where s.id = service_columns.service_id
            and (
                s.owner_id = auth.uid()
                OR (sp.grantee_id = auth.uid() and sp.status = 'active')
            )
        )
    );

-- UPDATE: Service Owner OR Shared User
create policy "Users can update service columns"
    on public.service_columns for update
    using (
        exists (
            select 1 from public.services s
            left join public.service_permissions sp on sp.service_id = s.id
            where s.id = service_columns.service_id
            and (
                s.owner_id = auth.uid()
                OR (sp.grantee_id = auth.uid() and sp.status = 'active')
            )
        )
    );

-- DELETE: Service Owner OR Shared User
create policy "Users can delete service columns"
    on public.service_columns for delete
    using (
        exists (
            select 1 from public.services s
            left join public.service_permissions sp on sp.service_id = s.id
            where s.id = service_columns.service_id
            and (
                s.owner_id = auth.uid()
                OR (sp.grantee_id = auth.uid() and sp.status = 'active')
            )
        )
    );
