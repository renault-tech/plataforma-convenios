-- Fix Group Member Status Constraint
-- Issue: Table allows 'accepted', but Logic/RLS expects 'active'.

-- 1. Drop existing check constraint that enforces ('pending', 'accepted', 'rejected')
ALTER TABLE public.access_group_members
DROP CONSTRAINT IF EXISTS access_group_members_status_check;

-- 2. Migrate existing data: Rename 'accepted' to 'active'
UPDATE public.access_group_members
SET status = 'active'
WHERE status = 'accepted';

-- 3. Add new, correct constraint ('pending', 'active', 'rejected')
ALTER TABLE public.access_group_members
ADD CONSTRAINT access_group_members_status_check
CHECK (status IN ('pending', 'active', 'rejected'));
