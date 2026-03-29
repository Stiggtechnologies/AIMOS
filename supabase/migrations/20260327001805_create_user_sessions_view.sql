-- View for Admin Dashboard: User Session Summary
-- Shows all logins, downloads, copies with IP addresses

CREATE OR REPLACE VIEW user_sessions_summary AS
SELECT 
  us.id,
  us.email,
  us.ip_address,
  us.user_agent,
  us.page_url,
  us.action_type,
  us.created_at,
  up.full_name,
  up.role
FROM user_sessions us
LEFT JOIN user_profiles up ON us.user_id = up.user_id
ORDER BY us.created_at DESC;

-- Query to see demo account activity
-- Run in Supabase SQL Editor:
-- SELECT * FROM user_sessions_summary WHERE email LIKE '%demo%';

-- Query to see all activity
-- SELECT * FROM user_sessions_summary ORDER BY created_at DESC LIMIT 100;

-- Query to see downloads only
-- SELECT * FROM user_sessions_summary WHERE action_type = 'download';

-- Query to see copy events
-- SELECT * FROM user_sessions_summary WHERE action_type = 'copy';