-- Add color column to access_groups
alter table public.access_groups 
add column if not exists color text default '#0f172a'; -- Default to slate-900 (black-ish)
