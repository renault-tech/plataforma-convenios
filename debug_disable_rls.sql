-- DIAGNOSTIC: SUSPEND RLS ON ITEMS
-- This checks if the issue is strictly permissions-related.

ALTER TABLE items DISABLE ROW LEVEL SECURITY;

-- After running this, check the Dashboard.
-- If items appear, we know the policies were wrong.
-- If items DO NOT appear, then the Service ID is wrong or there are no items.

-- TO RE-ENABLE (Run this after checking):
-- ALTER TABLE items ENABLE ROW LEVEL SECURITY;
