/*
  # Enhance Emergency & Business Continuity Module (Fixed)

  ## Purpose
  Enhance existing emergency infrastructure with crisis playbooks, task management, and event logging.

  ## New Tables
  - emergency_playbooks: Crisis response plans
  - emergency_playbook_steps: Individual playbook steps
  - emergency_tasks: Live task assignment during emergencies
  - emergency_event_logs: Audit trail and timeline

  ## Enhancements
  - Enhanced emergency_events with playbook support
  - Enhanced emergency_broadcasts with tracking
  - Enhanced emergency_contacts with escalation

  ## Security
  - RLS policies for emergency personnel
*/

-- Enhance emergency_events table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_events' AND column_name = 'is_emergency_mode_active') THEN
    ALTER TABLE emergency_events ADD COLUMN is_emergency_mode_active BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_events' AND column_name = 'playbook_id') THEN
    ALTER TABLE emergency_events ADD COLUMN playbook_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_events' AND column_name = 'affected_staff_count') THEN
    ALTER TABLE emergency_events ADD COLUMN affected_staff_count INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_events' AND column_name = 'affected_patient_count') THEN
    ALTER TABLE emergency_events ADD COLUMN affected_patient_count INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_events' AND column_name = 'response_team') THEN
    ALTER TABLE emergency_events ADD COLUMN response_team JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_events' AND column_name = 'lessons_learned') THEN
    ALTER TABLE emergency_events ADD COLUMN lessons_learned TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_events' AND column_name = 'cost_estimate') THEN
    ALTER TABLE emergency_events ADD COLUMN cost_estimate NUMERIC;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_events' AND column_name = 'actual_cost') THEN
    ALTER TABLE emergency_events ADD COLUMN actual_cost NUMERIC;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_events' AND column_name = 'media_involvement') THEN
    ALTER TABLE emergency_events ADD COLUMN media_involvement BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_events' AND column_name = 'regulatory_reporting_required') THEN
    ALTER TABLE emergency_events ADD COLUMN regulatory_reporting_required BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_events' AND column_name = 'priority') THEN
    ALTER TABLE emergency_events ADD COLUMN priority INTEGER CHECK (priority BETWEEN 1 AND 5) DEFAULT 1;
  END IF;
END $$;

-- Enhance emergency_broadcasts table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_broadcasts' AND column_name = 'event_id') THEN
    ALTER TABLE emergency_broadcasts ADD COLUMN event_id UUID REFERENCES emergency_events(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_broadcasts' AND column_name = 'broadcast_code') THEN
    ALTER TABLE emergency_broadcasts ADD COLUMN broadcast_code TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_broadcasts' AND column_name = 'broadcast_title') THEN
    ALTER TABLE emergency_broadcasts ADD COLUMN broadcast_title TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_broadcasts' AND column_name = 'target_audience_details') THEN
    ALTER TABLE emergency_broadcasts ADD COLUMN target_audience_details JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_broadcasts' AND column_name = 'total_recipients') THEN
    ALTER TABLE emergency_broadcasts ADD COLUMN total_recipients INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_broadcasts' AND column_name = 'delivered_count') THEN
    ALTER TABLE emergency_broadcasts ADD COLUMN delivered_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_broadcasts' AND column_name = 'acknowledged_count') THEN
    ALTER TABLE emergency_broadcasts ADD COLUMN acknowledged_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_broadcasts' AND column_name = 'failed_count') THEN
    ALTER TABLE emergency_broadcasts ADD COLUMN failed_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_broadcasts' AND column_name = 'broadcast_status') THEN
    ALTER TABLE emergency_broadcasts ADD COLUMN broadcast_status TEXT CHECK (broadcast_status IN ('draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled')) DEFAULT 'draft';
  END IF;
END $$;

-- Enhance emergency_contacts table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_contacts' AND column_name = 'contact_role') THEN
    ALTER TABLE emergency_contacts ADD COLUMN contact_role TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_contacts' AND column_name = 'is_24_7_available') THEN
    ALTER TABLE emergency_contacts ADD COLUMN is_24_7_available BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_contacts' AND column_name = 'availability_hours') THEN
    ALTER TABLE emergency_contacts ADD COLUMN availability_hours TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_contacts' AND column_name = 'escalation_level') THEN
    ALTER TABLE emergency_contacts ADD COLUMN escalation_level INTEGER CHECK (escalation_level BETWEEN 1 AND 5) DEFAULT 1;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_contacts' AND column_name = 'escalation_order') THEN
    ALTER TABLE emergency_contacts ADD COLUMN escalation_order INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_contacts' AND column_name = 'reports_to') THEN
    ALTER TABLE emergency_contacts ADD COLUMN reports_to UUID REFERENCES emergency_contacts(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_contacts' AND column_name = 'specialty_areas') THEN
    ALTER TABLE emergency_contacts ADD COLUMN specialty_areas TEXT[];
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_contacts' AND column_name = 'response_time_minutes') THEN
    ALTER TABLE emergency_contacts ADD COLUMN response_time_minutes INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_contacts' AND column_name = 'last_contacted_date') THEN
    ALTER TABLE emergency_contacts ADD COLUMN last_contacted_date TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_contacts' AND column_name = 'verification_date') THEN
    ALTER TABLE emergency_contacts ADD COLUMN verification_date DATE;
  END IF;
END $$;

-- Create emergency_playbooks table
CREATE TABLE IF NOT EXISTS emergency_playbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playbook_code TEXT UNIQUE NOT NULL,
  playbook_name TEXT NOT NULL,
  playbook_category TEXT CHECK (playbook_category IN ('natural_disaster', 'cyberattack', 'data_breach', 'system_outage', 'medical_emergency', 'safety_incident', 'pandemic', 'financial_crisis', 'regulatory', 'operational', 'communication', 'evacuation', 'other')) NOT NULL,
  description TEXT,
  severity_applicable TEXT[] CHECK (severity_applicable <@ ARRAY['critical', 'high', 'medium', 'low']),
  version TEXT DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  last_reviewed_date DATE,
  next_review_date DATE,
  owner_id UUID REFERENCES auth.users(id),
  approval_status TEXT CHECK (approval_status IN ('draft', 'under_review', 'approved', 'archived')) DEFAULT 'draft',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  total_steps INTEGER DEFAULT 0,
  estimated_duration_minutes INTEGER,
  prerequisites TEXT,
  success_criteria TEXT,
  escalation_criteria TEXT,
  communication_plan TEXT,
  resource_requirements JSONB,
  training_required BOOLEAN DEFAULT false,
  last_used_date TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  effectiveness_rating NUMERIC CHECK (effectiveness_rating BETWEEN 0 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create emergency_playbook_steps table
CREATE TABLE IF NOT EXISTS emergency_playbook_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playbook_id UUID REFERENCES emergency_playbooks(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  step_description TEXT,
  step_category TEXT CHECK (step_category IN ('assess', 'notify', 'activate', 'contain', 'respond', 'communicate', 'document', 'recover', 'review')) NOT NULL,
  responsible_role TEXT,
  estimated_duration_minutes INTEGER,
  is_critical BOOLEAN DEFAULT false,
  dependencies JSONB,
  required_resources JSONB,
  checklist_items JSONB,
  decision_points TEXT,
  communication_requirements TEXT,
  documentation_requirements TEXT,
  success_criteria TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(playbook_id, step_number)
);

-- Create emergency_tasks table
CREATE TABLE IF NOT EXISTS emergency_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES emergency_events(id) ON DELETE CASCADE,
  playbook_step_id UUID REFERENCES emergency_playbook_steps(id),
  task_code TEXT NOT NULL,
  task_title TEXT NOT NULL,
  task_description TEXT,
  task_category TEXT CHECK (task_category IN ('assess', 'notify', 'activate', 'contain', 'respond', 'communicate', 'document', 'recover', 'review', 'support')) NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  assigned_team TEXT,
  assigned_role TEXT,
  priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')) DEFAULT 'high',
  urgency TEXT CHECK (urgency IN ('immediate', 'urgent', 'normal', 'low')) DEFAULT 'urgent',
  task_status TEXT CHECK (task_status IN ('pending', 'in_progress', 'blocked', 'completed', 'cancelled', 'deferred')) DEFAULT 'pending',
  due_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  dependencies JSONB,
  required_resources JSONB,
  blockers TEXT,
  progress_notes TEXT,
  completion_notes TEXT,
  verification_required BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  location TEXT,
  contact_info TEXT,
  attachments JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create emergency_event_logs table
CREATE TABLE IF NOT EXISTS emergency_event_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES emergency_events(id) ON DELETE CASCADE,
  log_timestamp TIMESTAMPTZ DEFAULT now(),
  log_type TEXT CHECK (log_type IN ('status_change', 'action_taken', 'decision', 'communication', 'task_update', 'broadcast', 'escalation', 'resource_allocation', 'contact', 'note', 'system')) NOT NULL,
  log_category TEXT,
  log_title TEXT NOT NULL,
  log_description TEXT,
  performed_by UUID REFERENCES auth.users(id),
  affected_entities JSONB,
  previous_state JSONB,
  new_state JSONB,
  related_task_id UUID REFERENCES emergency_tasks(id),
  related_broadcast_id UUID REFERENCES emergency_broadcasts(id),
  related_contact_id UUID REFERENCES emergency_contacts(id),
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  attachments JSONB,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key constraint for playbook_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'emergency_events_playbook_id_fkey'
  ) THEN
    ALTER TABLE emergency_events 
      ADD CONSTRAINT emergency_events_playbook_id_fkey 
      FOREIGN KEY (playbook_id) REFERENCES emergency_playbooks(id);
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_emergency_events_mode ON emergency_events(is_emergency_mode_active) WHERE is_emergency_mode_active = true;
CREATE INDEX IF NOT EXISTS idx_emergency_events_playbook ON emergency_events(playbook_id);

CREATE INDEX IF NOT EXISTS idx_emergency_playbooks_category ON emergency_playbooks(playbook_category, is_active);
CREATE INDEX IF NOT EXISTS idx_emergency_playbooks_status ON emergency_playbooks(approval_status);

CREATE INDEX IF NOT EXISTS idx_playbook_steps_playbook ON emergency_playbook_steps(playbook_id, step_number);

CREATE INDEX IF NOT EXISTS idx_emergency_tasks_event ON emergency_tasks(event_id, task_status);
CREATE INDEX IF NOT EXISTS idx_emergency_tasks_assigned ON emergency_tasks(assigned_to, task_status);
CREATE INDEX IF NOT EXISTS idx_emergency_tasks_priority ON emergency_tasks(priority, urgency);
CREATE INDEX IF NOT EXISTS idx_emergency_tasks_due ON emergency_tasks(due_at) WHERE task_status NOT IN ('completed', 'cancelled');

CREATE INDEX IF NOT EXISTS idx_emergency_event_logs_event ON emergency_event_logs(event_id, log_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_event_logs_type ON emergency_event_logs(log_type, log_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_event_logs_performer ON emergency_event_logs(performed_by);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_escalation ON emergency_contacts(escalation_level, escalation_order);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_24_7 ON emergency_contacts(is_24_7_available) WHERE is_24_7_available = true;

CREATE INDEX IF NOT EXISTS idx_emergency_broadcasts_event ON emergency_broadcasts(event_id, broadcast_status);

-- Add updated_at triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'emergency_playbooks_updated_at') THEN
    CREATE TRIGGER emergency_playbooks_updated_at 
      BEFORE UPDATE ON emergency_playbooks 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'emergency_playbook_steps_updated_at') THEN
    CREATE TRIGGER emergency_playbook_steps_updated_at 
      BEFORE UPDATE ON emergency_playbook_steps 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'emergency_tasks_updated_at') THEN
    CREATE TRIGGER emergency_tasks_updated_at 
      BEFORE UPDATE ON emergency_tasks 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE emergency_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_playbook_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_event_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for emergency_playbooks
CREATE POLICY "All authenticated users can view approved playbooks" 
  ON emergency_playbooks FOR SELECT
  TO authenticated
  USING (
    approval_status = 'approved' AND is_active = true
  );

CREATE POLICY "Admins can manage playbooks" 
  ON emergency_playbooks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for emergency_playbook_steps
CREATE POLICY "All authenticated users can view playbook steps" 
  ON emergency_playbook_steps FOR SELECT
  TO authenticated
  USING (
    playbook_id IN (
      SELECT id FROM emergency_playbooks 
      WHERE approval_status = 'approved' AND is_active = true
    )
  );

CREATE POLICY "Admins can manage playbook steps" 
  ON emergency_playbook_steps FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for emergency_tasks
CREATE POLICY "Users can view tasks assigned to them or leadership can view all" 
  ON emergency_tasks FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'executive', 'clinic_manager')
    )
  );

CREATE POLICY "Assigned users can update their tasks" 
  ON emergency_tasks FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Admins can manage emergency tasks" 
  ON emergency_tasks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

-- RLS Policies for emergency_event_logs
CREATE POLICY "Users can view logs for active emergencies or leadership can view all" 
  ON emergency_event_logs FOR SELECT
  TO authenticated
  USING (
    event_id IN (
      SELECT id FROM emergency_events 
      WHERE is_emergency_mode_active = true
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Authenticated users can insert logs" 
  ON emergency_event_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage event logs" 
  ON emergency_event_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );
