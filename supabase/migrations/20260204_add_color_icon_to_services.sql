-- Add color and icon columns to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS color text DEFAULT '#16a34a',
ADD COLUMN IF NOT EXISTS icon text DEFAULT 'FileSpreadsheet';
