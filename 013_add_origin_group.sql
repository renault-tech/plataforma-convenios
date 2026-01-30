-- Add origin_group_id to service_permissions to track if a permission came from a group share
ALTER TABLE public.service_permissions
ADD COLUMN IF NOT EXISTS origin_group_id uuid REFERENCES public.access_groups(id) ON DELETE SET NULL;
