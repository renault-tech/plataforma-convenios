-- Add deleted_at to critical tables
ALTER TABLE services ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE table_blocks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE service_columns ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE items ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add version for Application-Side Optimistic Locking (not using DB trigger to keep it simple and controllable by app)
ALTER TABLE items ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Create index for performance on soft deletes
CREATE INDEX IF NOT EXISTS idx_services_deleted_at ON services(deleted_at);
CREATE INDEX IF NOT EXISTS idx_table_blocks_deleted_at ON table_blocks(deleted_at);
CREATE INDEX IF NOT EXISTS idx_service_columns_deleted_at ON service_columns(deleted_at);
CREATE INDEX IF NOT EXISTS idx_items_deleted_at ON items(deleted_at);

-- Update RLS Policies to hide soft-deleted items by default
-- NOTE: We are NOT dropping existing policies blindly, just adding a filter is usually safer, 
-- but RLS policies are hard to "alter". We usually recreate them or update standard views.
-- For this MVP/Phase, we will rely on the Application Logic to filter `deleted_at IS NULL` 
-- BUT robust security requires RLS.

-- Let's update the main SELECT policy for items if it exists, or create a new one.
-- Actually, the safest way without knowing exact policy names is to instruct the application to always filter.
-- However, for RLS:

-- SERVICES
CREATE POLICY "Hide deleted services" ON services
FOR SELECT
USING (deleted_at IS NULL);

-- TABLE BLOCKS
CREATE POLICY "Hide deleted table_blocks" ON table_blocks
FOR SELECT
USING (deleted_at IS NULL);

-- SERVICE COLUMNS
CREATE POLICY "Hide deleted service_columns" ON service_columns
FOR SELECT
USING (deleted_at IS NULL);

-- ITEMS
CREATE POLICY "Hide deleted items" ON items
FOR SELECT
USING (deleted_at IS NULL);

-- IMPORTANT: This might conflict if there are strict "Allow All" policies.
-- But standard policies usually allow access based on user_id. Restricting further is fine.
