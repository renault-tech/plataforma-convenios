-- Enable Realtime for the new table so the client (ServiceContext) receives updates
-- when the server action (markServiceAsViewed) updates the timestamp.

ALTER PUBLICATION supabase_realtime ADD TABLE user_service_views;
