-- Optimization for User Service Views
-- 1. Index for querying "My Last Viewed Services" quickly
CREATE INDEX IF NOT EXISTS idx_user_service_views_user_last_viewed 
ON public.user_service_views(user_id, last_viewed_at DESC);

-- 2. Index for querying "Who viewed this service recently" (if needed for analytics)
CREATE INDEX IF NOT EXISTS idx_user_service_views_service_last_viewed 
ON public.user_service_views(service_id, last_viewed_at DESC);

-- 3. Safety Index for Permissions Checks (critical for RLS performance)
CREATE INDEX IF NOT EXISTS idx_service_permissions_service_grantee
ON public.service_permissions(service_id, grantee_id);
