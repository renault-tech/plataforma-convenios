-- FIX RLS ON ITEMS TABLE (v2 - Comprehensive)
-- This script ensures users can view items for services they own, share, OR if they are admins.

-- 1. Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view items of their services" ON items;
DROP POLICY IF EXISTS "Users can insert items to their services" ON items;
DROP POLICY IF EXISTS "Users can update items of their services" ON items;
DROP POLICY IF EXISTS "Users can delete items of their services" ON items;
DROP POLICY IF EXISTS "Admins can view all items" ON items;
DROP POLICY IF EXISTS "Admins can manage all items" ON items;

-- 2. Grant Access to Admins (Fail-safe)
-- Requires the is_admin() function to exist (created in fix_recursion.sql)
CREATE POLICY "Admins can manage all items" ON items
TO authenticated
USING ( 
  (SELECT public.is_admin()) 
)
WITH CHECK (
  (SELECT public.is_admin())
);

-- 3. Create optimized Policy for SELECT (Owners + Shared)
CREATE POLICY "Users can view items of their services" ON items
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM services
    WHERE services.id = items.service_id
    AND (
      services.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM service_permissions
        WHERE service_id = services.id
        AND status = 'active'
        AND (
            (grantee_type = 'user' AND grantee_id = auth.uid())
            OR
            (grantee_type = 'group' AND origin_group_id IN (
                SELECT group_id FROM access_group_members WHERE user_id = auth.uid() AND status = 'active'
            ))
        )
      )
    )
  )
);

-- 4. Create optimized Policy for INSERT
CREATE POLICY "Users can insert items to their services" ON items
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM services
    WHERE services.id = items.service_id
    AND (
      services.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM service_permissions
        WHERE service_id = services.id
        AND status = 'active'
        AND (
            (grantee_type = 'user' AND grantee_id = auth.uid())
            OR
            (grantee_type = 'group' AND origin_group_id IN (
                SELECT group_id FROM access_group_members WHERE user_id = auth.uid() AND status = 'active'
            ))
        )
      )
    )
  )
);

-- 5. Create optimized Policy for UPDATE
CREATE POLICY "Users can update items of their services" ON items
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM services
    WHERE services.id = items.service_id
    AND (
      services.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM service_permissions
        WHERE service_id = services.id
        AND status = 'active'
        AND (
            (grantee_type = 'user' AND grantee_id = auth.uid())
            OR
            (grantee_type = 'group' AND origin_group_id IN (
                SELECT group_id FROM access_group_members WHERE user_id = auth.uid() AND status = 'active'
            ))
        )
      )
    )
  )
);

-- 6. Create optimized Policy for DELETE
CREATE POLICY "Users can delete items of their services" ON items
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM services
    WHERE services.id = items.service_id
    AND (
      services.owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM service_permissions
        WHERE service_id = services.id
        AND status = 'active'
        AND (
            (grantee_type = 'user' AND grantee_id = auth.uid())
            OR
            (grantee_type = 'group' AND origin_group_id IN (
                SELECT group_id FROM access_group_members WHERE user_id = auth.uid() AND status = 'active'
            ))
        )
      )
    )
  )
);
