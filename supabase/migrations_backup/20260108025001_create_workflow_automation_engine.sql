/*
  # Workflow Automation Engine

  ## Summary
  Comprehensive workflow automation system enabling scheduled tasks, triggered actions,
  and automated notifications across AIM OS modules.

  ## New Tables

  ### Workflow Definitions
    - `workflow_definitions` - Reusable workflow templates
    - `workflow_actions` - Individual actions within workflows
    - `workflow_executions` - Execution history and logging

  ### Notification System
    - `notification_templates` - Email/SMS templates with variables
    - `notification_queue` - Pending notifications to be sent
    - `notification_history` - Sent notification audit trail
    - `notification_preferences` - User notification settings

  ### Task Scheduling
    - `scheduled_tasks` - Cron-style scheduled job definitions
    - `task_execution_log` - Task execution history

  ## Security
    - RLS enabled on all tables
    - Managers can create workflows for their clinics
    - Executives can create system-wide workflows
    - Users can manage their own notification preferences
*/

-- =====================================================
-- ENUMS
-- =====================================================

DO $$ BEGIN
  CREATE TYPE workflow_trigger_type AS ENUM (
    'manual',
    'scheduled',
    'event_based',
    'condition_based'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE workflow_execution_status AS ENUM (
    'pending',
    'running',
    'completed',
    'failed',
    'cancelled',
    'timeout'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE workflow_action_type AS ENUM (
    'send_email',
    'send_sms',
    'create_notification',
    'update_record',
    'create_record',
    'call_webhook',
    'run_function',
    'wait'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM (
    'email',
    'sms',
    'in_app',
    'push'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_priority AS ENUM (
    'low',
    'normal',
    'high',
    'urgent'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_status AS ENUM (
    'pending',
    'sent',
    'failed',
    'bounced',
    'read'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- WORKFLOW DEFINITIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS workflow_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  trigger_type workflow_trigger_type NOT NULL DEFAULT 'manual',
  trigger_config jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  is_system boolean DEFAULT false,
  version integer DEFAULT 1,
  clinic_id uuid REFERENCES clinics(id),
  created_by uuid REFERENCES auth.users(id),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workflow_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflow_definitions(id) ON DELETE CASCADE,
  action_type workflow_action_type NOT NULL,
  action_order integer NOT NULL,
  action_config jsonb NOT NULL,
  retry_config jsonb DEFAULT '{"max_retries": 3, "retry_delay_seconds": 60}',
  is_critical boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflow_definitions(id),
  status workflow_execution_status DEFAULT 'pending',
  triggered_by text NOT NULL,
  trigger_data jsonb DEFAULT '{}',
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  execution_log jsonb DEFAULT '[]',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- NOTIFICATION SYSTEM
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  channel notification_channel NOT NULL,
  subject_template text,
  body_template text NOT NULL,
  variables jsonb DEFAULT '[]',
  default_priority notification_priority DEFAULT 'normal',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid REFERENCES auth.users(id),
  recipient_email text,
  recipient_phone text,
  channel notification_channel NOT NULL,
  priority notification_priority DEFAULT 'normal',
  subject text,
  body text NOT NULL,
  template_id uuid REFERENCES notification_templates(id),
  template_data jsonb DEFAULT '{}',
  scheduled_for timestamptz DEFAULT now(),
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  last_error text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id uuid REFERENCES notification_queue(id),
  recipient_id uuid REFERENCES auth.users(id),
  recipient_email text,
  recipient_phone text,
  channel notification_channel NOT NULL,
  priority notification_priority,
  subject text,
  body text NOT NULL,
  status notification_status NOT NULL,
  sent_at timestamptz,
  read_at timestamptz,
  error_message text,
  external_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) UNIQUE,
  email_enabled boolean DEFAULT true,
  sms_enabled boolean DEFAULT false,
  in_app_enabled boolean DEFAULT true,
  push_enabled boolean DEFAULT true,
  credential_alerts boolean DEFAULT true,
  staffing_alerts boolean DEFAULT true,
  system_announcements boolean DEFAULT true,
  weekly_digest boolean DEFAULT true,
  quiet_hours_start time,
  quiet_hours_end time,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================
-- TASK SCHEDULING
-- =====================================================

CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  schedule_cron text NOT NULL,
  function_name text NOT NULL,
  function_params jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  run_count integer DEFAULT 0,
  failure_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_execution_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES scheduled_tasks(id),
  status workflow_execution_status NOT NULL,
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  duration_ms integer,
  error_message text,
  execution_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_workflow_definitions_active ON workflow_definitions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_category ON workflow_definitions(category);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_clinic ON workflow_definitions(clinic_id);

CREATE INDEX IF NOT EXISTS idx_workflow_actions_workflow ON workflow_actions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_actions_order ON workflow_actions(workflow_id, action_order);

CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_created ON workflow_executions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON notification_queue(scheduled_for) WHERE attempts < max_attempts;
CREATE INDEX IF NOT EXISTS idx_notification_queue_channel ON notification_queue(channel);
CREATE INDEX IF NOT EXISTS idx_notification_queue_recipient ON notification_queue(recipient_id);

CREATE INDEX IF NOT EXISTS idx_notification_history_recipient ON notification_history(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_status ON notification_history(status);
CREATE INDEX IF NOT EXISTS idx_notification_history_created ON notification_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_active ON scheduled_tasks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_next_run ON scheduled_tasks(next_run_at) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_task_execution_log_task ON task_execution_log(task_id);
CREATE INDEX IF NOT EXISTS idx_task_execution_log_started ON task_execution_log(started_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_execution_log ENABLE ROW LEVEL SECURITY;

-- Workflow Definitions Policies
CREATE POLICY "Managers can view clinic workflows"
  ON workflow_definitions FOR SELECT
  TO authenticated
  USING (
    clinic_id IS NULL OR
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (user_profiles.role IN ('executive', 'admin') OR user_profiles.primary_clinic_id = workflow_definitions.clinic_id)
    )
  );

CREATE POLICY "Managers can create clinic workflows"
  ON workflow_definitions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

CREATE POLICY "Managers can update clinic workflows"
  ON workflow_definitions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (user_profiles.role IN ('executive', 'admin') OR
           (user_profiles.role = 'clinic_manager' AND user_profiles.primary_clinic_id = workflow_definitions.clinic_id))
    )
  );

-- Workflow Actions Policies
CREATE POLICY "Users can view workflow actions"
  ON workflow_actions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workflow_definitions
      WHERE workflow_definitions.id = workflow_actions.workflow_id
      AND (workflow_definitions.clinic_id IS NULL OR
           EXISTS (
             SELECT 1 FROM user_profiles
             WHERE user_profiles.id = auth.uid()
             AND (user_profiles.role IN ('executive', 'admin') OR user_profiles.primary_clinic_id = workflow_definitions.clinic_id)
           ))
    )
  );

CREATE POLICY "Managers can manage workflow actions"
  ON workflow_actions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- Workflow Executions Policies
CREATE POLICY "Users can view workflow executions"
  ON workflow_executions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

CREATE POLICY "System can manage workflow executions"
  ON workflow_executions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Notification Templates Policies
CREATE POLICY "Everyone can view active templates"
  ON notification_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage templates"
  ON notification_templates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- Notification Queue Policies
CREATE POLICY "Users can view their notifications"
  ON notification_queue FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "System can manage notification queue"
  ON notification_queue FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Notification History Policies
CREATE POLICY "Users can view their notification history"
  ON notification_history FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid());

CREATE POLICY "Managers can view all notification history"
  ON notification_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
  );

-- Notification Preferences Policies
CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Scheduled Tasks Policies
CREATE POLICY "Managers can view scheduled tasks"
  ON scheduled_tasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

CREATE POLICY "Admins can manage scheduled tasks"
  ON scheduled_tasks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

-- Task Execution Log Policies
CREATE POLICY "Managers can view task logs"
  ON task_execution_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

CREATE POLICY "System can create task logs"
  ON task_execution_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION update_workflow_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS update_workflow_definitions_updated_at ON workflow_definitions;
  CREATE TRIGGER update_workflow_definitions_updated_at
    BEFORE UPDATE ON workflow_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_updated_at();
END $$;

DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS update_notification_templates_updated_at ON notification_templates;
  CREATE TRIGGER update_notification_templates_updated_at
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_updated_at();
END $$;

DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
  CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_updated_at();
END $$;

DO $$ 
BEGIN
  DROP TRIGGER IF EXISTS update_scheduled_tasks_updated_at ON scheduled_tasks;
  CREATE TRIGGER update_scheduled_tasks_updated_at
    BEFORE UPDATE ON scheduled_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_workflow_updated_at();
END $$;
