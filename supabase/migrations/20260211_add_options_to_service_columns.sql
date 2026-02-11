-- Add options column to service_columns to support Status/Select types
alter table public.service_columns
add column if not exists options jsonb default '[]'::jsonb;
