-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Allow generic access (since we are using client-side calls without strict auth for now)
-- In a production app with users, we would restrict this to authenticated users.

-- SERVICES Table Policies
CREATE POLICY "Enable all access for services" ON services
FOR ALL USING (true) WITH CHECK (true);

-- ITEMS Table Policies
CREATE POLICY "Enable all access for items" ON items
FOR ALL USING (true) WITH CHECK (true);

-- Note: If policies already exist, you might need to drop them first:
-- DROP POLICY IF EXISTS "Enable all access for services" ON services;
-- DROP POLICY IF EXISTS "Enable all access for items" ON items;
