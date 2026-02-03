-- Add size column to user_inbox_widgets
ALTER TABLE public.user_inbox_widgets 
ADD COLUMN IF NOT EXISTS size TEXT DEFAULT 'medium';

-- Add constraint to ensure valid sizes
ALTER TABLE public.user_inbox_widgets 
ADD CONSTRAINT size_check 
CHECK (size IN ('small', 'medium', 'large', 'wide'));

-- Update existing records to have default size
UPDATE public.user_inbox_widgets 
SET size = 'medium' 
WHERE size IS NULL;
