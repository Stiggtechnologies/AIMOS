/*
  # Create Email Queue and Enhanced Audit Support

  1. New Tables
    - `email_queue` - Stores queued emails for sending
    - Enhanced audit_events if not exists

  2. Security
    - Enable RLS on email_queue
    - Only authenticated users can manage their email queue items
*/

CREATE TABLE IF NOT EXISTS email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  to_name text,
  from_email text NOT NULL DEFAULT 'noreply@aimintegrative.com',
  from_name text NOT NULL DEFAULT 'AIM Integrative Medicine',
  subject text NOT NULL,
  html_body text NOT NULL,
  text_body text,
  template_id text,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'failed', 'bounced')),
  scheduled_for timestamptz,
  sent_at timestamptz,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON email_queue(scheduled_for) WHERE scheduled_for IS NOT NULL;

ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view email queue" ON email_queue;
CREATE POLICY "Staff can view email queue"
  ON email_queue
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

DROP POLICY IF EXISTS "Staff can insert email queue" ON email_queue;
CREATE POLICY "Staff can insert email queue"
  ON email_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager', 'clinician')
    )
  );

DROP POLICY IF EXISTS "Admin can update email queue" ON email_queue;
CREATE POLICY "Admin can update email queue"
  ON email_queue
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text,
  record_id text,
  old_data jsonb,
  new_data jsonb,
  changed_fields text[],
  metadata jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_user_id ON audit_events(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_action ON audit_events(action);
CREATE INDEX IF NOT EXISTS idx_audit_events_table_name ON audit_events(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit_events(created_at DESC);

ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view audit events" ON audit_events;
CREATE POLICY "Staff can view audit events"
  ON audit_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "System can insert audit events" ON audit_events;
CREATE POLICY "System can insert audit events"
  ON audit_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
