-- Make 'title' column optional if it exists (legacy support)
-- We use DO block to avoid errors if column doesn't exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'items' AND column_name = 'title') THEN
        ALTER TABLE items ALTER COLUMN title DROP NOT NULL;
    END IF;
END $$;

-- If table was missing or malformed, ensure basic structure supports JSONB
CREATE TABLE IF NOT EXISTS items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Re-apply RLS just in case
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for items" ON items;
CREATE POLICY "Enable all access for items" ON items
FOR ALL USING (true) WITH CHECK (true);
