-- Add last_changelog_viewed column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_changelog_viewed TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) - INTERVAL '1 day';

-- Comment check logic:
-- When user logs in, we compare profiles.last_changelog_viewed < (SELECT MAX(created_at) FROM changelog)
-- If true, show dialog, then update last_changelog_viewed = now()
