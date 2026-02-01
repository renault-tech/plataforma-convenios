-- Create a function to check if an item satisfies a policy
create or replace function public.satisfies_policy_logic(
    item_data jsonb,
    logic jsonb,
    user_name text
) returns boolean as $$
declare
    col_name text;
    op text;
    val text;
    item_val text;
    safe_val text;
begin
    col_name := logic->>'column';
    op := logic->>'operator';
    val := logic->>'value';

    -- Dynamic replacement of {{user_name}}
    if val = '{{user_name}}' then
        safe_val := user_name;
    else
        safe_val := val;
    end if;

    -- Get value from item data (as text)
    item_val := item_data->>col_name;

    if item_val is null then
        return false;
    end if;

    if op = 'eq' then
        return item_val = safe_val;
    elsif op = 'neq' then
        return item_val <> safe_val;
    elsif op = 'ilike' then
        return item_val ilike '%' || safe_val || '%';
    elsif op = 'gt' then
        return item_val > safe_val;
    elsif op = 'lt' then
        return item_val < safe_val;
    else
        return false;
    end if;
end;
$$ language plpgsql stable;

-- Create a robust check_permission function that handles both users and groups
create or replace function public.check_item_access(
    _service_id uuid,
    _item_data jsonb
) returns boolean as $$
declare
    _user_id uuid := auth.uid();
    _is_admin boolean;
    _user_name text;
begin
    -- 1. Admin bypass
    select is_admin into _is_admin from public.profiles where id = _user_id;
    if _is_admin then
        return true;
    end if;

    -- Get user name early if needed for policy substitution
    -- We get it from jwt metadata for performance or profiles table
    -- Using profiles table to match exactly what is shown in UI
    select full_name into _user_name from public.profiles where id = _user_id;

    -- 2. Check Permissions (Direct User OR via Groups)
    return exists (
        select 1 
        from public.service_permissions sp
        left join public.access_policies ap on sp.policy_id = ap.id
        where sp.service_id = _service_id
        and (
            -- Direct User Permission
            (sp.grantee_type = 'user' and sp.grantee_id = _user_id)
            OR
            -- Group Permission (User is member of group)
            (sp.grantee_type = 'group' and exists (
                select 1 from public.access_group_members agm
                where agm.group_id = sp.grantee_id
                and agm.user_id = _user_id
            ))
        )
        and (
            -- Case A: No Policy (Full Access)
            sp.policy_id is null
            OR
            -- Case B: Policy Logic Satisfied
            public.satisfies_policy_logic(_item_data, ap.filter_logic, _user_name)
        )
    );
end;
$$ language plpgsql security definer;

-- Drop existing permissive policy
drop policy if exists "Enable all access for items" on public.items;

-- Create new restrictive policy
create policy "Enforce Item Permissions" on public.items
    for select
    using (
        public.check_item_access(service_id, data)
    );

create policy "Enforce Item Insert" on public.items
    for insert
    with check (
        -- For insert, checking 'data' against policies is tricky if data isn't complete yet.
        -- Usually we check if user has 'edit' or 'admin' permission on the service.
        -- Usage of policies on INSERT is advanced. For now, let's allow if user has EDIT permissions on service, ignoring specific row policy for INSERT.
        -- Or we can enforce that they can only insert what matches their policy?
        -- Let's stick to: "Can insert if has edit access to service".
        exists (
            select 1 
            from public.service_permissions sp
            where sp.service_id = service_id
            and (
                (sp.grantee_type = 'user' and sp.grantee_id = auth.uid())
                OR
                (sp.grantee_type = 'group' and exists (
                    select 1 from public.access_group_members agm
                    where agm.group_id = sp.grantee_id
                    and agm.user_id = auth.uid()
                ))
            )
            and sp.permission_level in ('edit', 'admin')
        )
        OR
        (select is_admin from public.profiles where id = auth.uid())
    );

create policy "Enforce Item Update" on public.items
    for update
    using (
        -- Can see the item
        public.check_item_access(service_id, data)
        AND
        -- AND has edit/admin permission
        (
             exists (
                select 1 
                from public.service_permissions sp
                where sp.service_id = service_id
                and (
                    (sp.grantee_type = 'user' and sp.grantee_id = auth.uid())
                    OR
                    (sp.grantee_type = 'group' and exists (
                        select 1 from public.access_group_members agm
                        where agm.group_id = sp.grantee_id
                        and agm.user_id = auth.uid()
                    ))
                )
                and sp.permission_level in ('edit', 'admin')
            )
            OR
            (select is_admin from public.profiles where id = auth.uid())
        )
    );

create policy "Enforce Item Delete" on public.items
    for delete
    using (
        -- Must have admin permission on service (or global admin)
        (
             exists (
                select 1 
                from public.service_permissions sp
                where sp.service_id = service_id
                and (
                    (sp.grantee_type = 'user' and sp.grantee_id = auth.uid())
                    OR
                    (sp.grantee_type = 'group' and exists (
                        select 1 from public.access_group_members agm
                        where agm.group_id = sp.grantee_id
                        and agm.user_id = auth.uid()
                    ))
                )
                and sp.permission_level = 'admin'
            )
            OR
            (select is_admin from public.profiles where id = auth.uid())
        )
    );
