-- Fix Notification RLS Policies
-- Issue: Notifications reappear because DELETE policy was missing, and UPDATE might behavior might be inconsistent.

-- 1. Add DELETE policy (Missing)
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- 2. Verify/Recreate UPDATE policy (Ensure it works)
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
-- Added WITH CHECK for explicit enforcement, though logic remains same.
