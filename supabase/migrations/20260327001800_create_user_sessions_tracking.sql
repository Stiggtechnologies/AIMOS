-- User Session Tracking
-- Tracks IP address, login activity, and actions (downloads, copy) for demo accounts

CREATE TABLE IF NOT EXISTS user_sessions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email           text NOT NULL,
  ip_address      inet,
  user_agent      text,
  page_url        text,
  action_type     text, -- 'login', 'view', 'download', 'copy'
  created_at      timestamptz DEFAULT now()
);

-- Index for querying by user
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);

-- Index for querying by IP
CREATE INDEX idx_user_sessions_ip ON user_sessions(ip_address);

-- Index for querying by action
CREATE INDEX idx_user_sessions_action ON user_sessions(action_type);

-- Index for time-based queries
CREATE INDEX idx_user_sessions_created ON user_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Admin can read all sessions
CREATE POLICY "Admins can view all user sessions"
  ON user_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = auth.uid() AND user_profiles.role IN ('executive', 'clinic_manager'))
  );

-- Anyone can insert their own session (for auto-tracking)
CREATE POLICY "Users can insert own session data"
  ON user_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR auth.jwt()->>'email' = 'demo@aimos.app');

COMMENT ON TABLE user_sessions IS 'Tracks user logins, IP addresses, and actions (download, copy)';
COMMENT ON COLUMN user_sessions.action_type IS 'login, view, download, copy';