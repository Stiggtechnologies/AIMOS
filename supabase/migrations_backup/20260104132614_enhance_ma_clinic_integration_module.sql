/*
  # Enhance M&A / Clinic Integration Module

  ## Purpose
  Enhance existing integration infrastructure with PE-grade features:
  - Day 0/30/90 milestone checklists
  - SOP adoption tracking enhancement
  - Performance normalization metrics
  - Cultural alignment tasks
  - Integration team management
  - Enhanced project tracking

  ## New Tables
  - integration_checklists: Milestone-based checklists
  - integration_checklist_items: Individual checklist tasks
  - performance_normalization_metrics: Performance tracking
  - cultural_alignment_tasks: Cultural integration tasks
  - integration_team_members: Team roster and workload

  ## Enhancements
  - Enhanced clinic_integrations with financial and synergy targets
  - Enhanced integration_tasks with Day 0/30/90 categorization
  - Enhanced integration_milestones with gate requirements
  - Enhanced integration_sop_adoption with training metrics

  ## Security
  - RLS policies for team-based access
  - Project-level permissions
*/

-- Enhance clinic_integrations table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_integrations' AND column_name = 'deal_size_usd') THEN
    ALTER TABLE clinic_integrations ADD COLUMN deal_size_usd NUMERIC;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_integrations' AND column_name = 'target_annual_revenue') THEN
    ALTER TABLE clinic_integrations ADD COLUMN target_annual_revenue NUMERIC;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_integrations' AND column_name = 'target_patient_volume') THEN
    ALTER TABLE clinic_integrations ADD COLUMN target_patient_volume INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_integrations' AND column_name = 'target_staff_count') THEN
    ALTER TABLE clinic_integrations ADD COLUMN target_staff_count INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_integrations' AND column_name = 'synergy_targets') THEN
    ALTER TABLE clinic_integrations ADD COLUMN synergy_targets JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_integrations' AND column_name = 'integration_budget') THEN
    ALTER TABLE clinic_integrations ADD COLUMN integration_budget NUMERIC;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_integrations' AND column_name = 'actual_spend') THEN
    ALTER TABLE clinic_integrations ADD COLUMN actual_spend NUMERIC;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_integrations' AND column_name = 'day_0_completion_date') THEN
    ALTER TABLE clinic_integrations ADD COLUMN day_0_completion_date DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_integrations' AND column_name = 'day_30_completion_date') THEN
    ALTER TABLE clinic_integrations ADD COLUMN day_30_completion_date DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_integrations' AND column_name = 'day_90_completion_date') THEN
    ALTER TABLE clinic_integrations ADD COLUMN day_90_completion_date DATE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clinic_integrations' AND column_name = 'lessons_learned') THEN
    ALTER TABLE clinic_integrations ADD COLUMN lessons_learned TEXT;
  END IF;
END $$;

-- Enhance integration_sop_adoption table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integration_sop_adoption' AND column_name = 'sop_name') THEN
    ALTER TABLE integration_sop_adoption ADD COLUMN sop_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integration_sop_adoption' AND column_name = 'sop_category') THEN
    ALTER TABLE integration_sop_adoption ADD COLUMN sop_category TEXT CHECK (sop_category IN ('clinical', 'administrative', 'financial', 'hr', 'it', 'compliance', 'safety', 'quality'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integration_sop_adoption' AND column_name = 'target_staff_count') THEN
    ALTER TABLE integration_sop_adoption ADD COLUMN target_staff_count INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integration_sop_adoption' AND column_name = 'trained_staff_count') THEN
    ALTER TABLE integration_sop_adoption ADD COLUMN trained_staff_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integration_sop_adoption' AND column_name = 'certified_staff_count') THEN
    ALTER TABLE integration_sop_adoption ADD COLUMN certified_staff_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integration_sop_adoption' AND column_name = 'is_critical_sop') THEN
    ALTER TABLE integration_sop_adoption ADD COLUMN is_critical_sop BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integration_sop_adoption' AND column_name = 'owner_id') THEN
    ALTER TABLE integration_sop_adoption ADD COLUMN owner_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Enhance integration_milestones table  
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integration_milestones' AND column_name = 'phase') THEN
    ALTER TABLE integration_milestones ADD COLUMN phase TEXT CHECK (phase IN ('day_0', 'day_30', 'day_90', 'post_90'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integration_milestones' AND column_name = 'is_gate') THEN
    ALTER TABLE integration_milestones ADD COLUMN is_gate BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integration_milestones' AND column_name = 'gate_criteria') THEN
    ALTER TABLE integration_milestones ADD COLUMN gate_criteria JSONB;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integration_milestones' AND column_name = 'approval_status') THEN
    ALTER TABLE integration_milestones ADD COLUMN approval_status TEXT CHECK (approval_status IN ('pending', 'approved', 'rejected', 'not_required')) DEFAULT 'not_required';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integration_milestones' AND column_name = 'approver_id') THEN
    ALTER TABLE integration_milestones ADD COLUMN approver_id UUID REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'integration_milestones' AND column_name = 'evidence_documents') THEN
    ALTER TABLE integration_milestones ADD COLUMN evidence_documents JSONB;
  END IF;
END $$;

-- Create integration_checklists table
CREATE TABLE IF NOT EXISTS integration_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID REFERENCES clinic_integrations(id) ON DELETE CASCADE,
  checklist_code TEXT NOT NULL,
  checklist_name TEXT NOT NULL,
  milestone TEXT CHECK (milestone IN ('day_0', 'day_30', 'day_60', 'day_90', 'day_120', 'ongoing')) NOT NULL,
  category TEXT CHECK (category IN ('operations', 'finance', 'hr', 'it', 'legal', 'clinical', 'marketing', 'compliance', 'facilities', 'culture')) NOT NULL,
  description TEXT,
  target_completion_date DATE,
  actual_completion_date DATE,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'blocked', 'completed', 'skipped')) DEFAULT 'not_started',
  completion_percentage NUMERIC CHECK (completion_percentage BETWEEN 0 AND 100) DEFAULT 0,
  total_items INTEGER DEFAULT 0,
  completed_items INTEGER DEFAULT 0,
  blocked_items INTEGER DEFAULT 0,
  owner_id UUID REFERENCES auth.users(id),
  priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
  is_gate_requirement BOOLEAN DEFAULT false,
  gate_approval_status TEXT CHECK (gate_approval_status IN ('pending', 'approved', 'rejected', 'not_required')) DEFAULT 'not_required',
  approved_by UUID REFERENCES auth.users(id),
  approval_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create integration_checklist_items table
CREATE TABLE IF NOT EXISTS integration_checklist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  checklist_id UUID REFERENCES integration_checklists(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  assigned_to UUID REFERENCES auth.users(id),
  assigned_team TEXT,
  status TEXT CHECK (status IN ('not_started', 'in_progress', 'blocked', 'completed', 'skipped', 'not_applicable')) DEFAULT 'not_started',
  priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
  due_date DATE,
  completed_date DATE,
  estimated_hours NUMERIC,
  actual_hours NUMERIC,
  depends_on UUID REFERENCES integration_checklist_items(id),
  blocker_reason TEXT,
  blocker_owner UUID REFERENCES auth.users(id),
  evidence_required BOOLEAN DEFAULT false,
  evidence_url TEXT,
  evidence_notes TEXT,
  compliance_requirement BOOLEAN DEFAULT false,
  sop_reference TEXT,
  success_criteria TEXT,
  completion_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create performance_normalization_metrics table
CREATE TABLE IF NOT EXISTS performance_normalization_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID REFERENCES clinic_integrations(id) ON DELETE CASCADE,
  metric_code TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_category TEXT CHECK (metric_category IN ('financial', 'operational', 'clinical', 'patient_satisfaction', 'staff_productivity', 'quality')) NOT NULL,
  unit_of_measure TEXT,
  baseline_value NUMERIC,
  baseline_date DATE,
  target_value NUMERIC NOT NULL,
  target_date DATE,
  current_value NUMERIC,
  last_measured_date DATE,
  progress_percentage NUMERIC CHECK (progress_percentage BETWEEN 0 AND 100),
  variance_from_target NUMERIC,
  variance_percentage NUMERIC,
  trend TEXT CHECK (trend IN ('improving', 'stable', 'declining')),
  status TEXT CHECK (status IN ('on_track', 'at_risk', 'off_track', 'achieved')) DEFAULT 'on_track',
  benchmark_value NUMERIC,
  benchmark_source TEXT,
  measurement_frequency TEXT CHECK (measurement_frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
  next_measurement_date DATE,
  owner_id UUID REFERENCES auth.users(id),
  improvement_actions TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create cultural_alignment_tasks table
CREATE TABLE IF NOT EXISTS cultural_alignment_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID REFERENCES clinic_integrations(id) ON DELETE CASCADE,
  task_code TEXT NOT NULL,
  task_name TEXT NOT NULL,
  task_type TEXT CHECK (task_type IN ('assessment', 'communication', 'training', 'team_building', 'change_management', 'engagement', 'recognition', 'feedback')) NOT NULL,
  description TEXT,
  target_audience TEXT CHECK (target_audience IN ('all_staff', 'leadership', 'clinicians', 'administrative', 'front_desk', 'management', 'specific_group')),
  target_audience_details TEXT,
  participant_count INTEGER,
  completed_count INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('planned', 'scheduled', 'in_progress', 'completed', 'cancelled')) DEFAULT 'planned',
  scheduled_date DATE,
  completed_date DATE,
  facilitator_id UUID REFERENCES auth.users(id),
  location TEXT,
  delivery_method TEXT CHECK (delivery_method IN ('in_person', 'virtual', 'hybrid', 'self_paced', 'video')),
  engagement_score NUMERIC CHECK (engagement_score BETWEEN 0 AND 100),
  feedback_summary TEXT,
  success_metrics JSONB,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  budget_allocated NUMERIC,
  actual_cost NUMERIC,
  priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create integration_team_members table
CREATE TABLE IF NOT EXISTS integration_team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID REFERENCES clinic_integrations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  role TEXT CHECK (role IN ('executive_sponsor', 'integration_lead', 'project_manager', 'workstream_lead', 'team_member', 'sme', 'advisor', 'stakeholder')) NOT NULL,
  workstream TEXT CHECK (workstream IN ('operations', 'finance', 'hr', 'it', 'legal', 'clinical', 'marketing', 'compliance', 'facilities', 'culture', 'overall')),
  responsibilities TEXT,
  time_allocation_percentage NUMERIC CHECK (time_allocation_percentage BETWEEN 0 AND 100),
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  contact_email TEXT,
  contact_phone TEXT,
  location TEXT,
  reporting_to UUID REFERENCES integration_team_members(id),
  tasks_assigned INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  performance_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_integration_checklists_integration ON integration_checklists(integration_id, milestone);
CREATE INDEX IF NOT EXISTS idx_integration_checklists_status ON integration_checklists(status, milestone);
CREATE INDEX IF NOT EXISTS idx_integration_checklists_owner ON integration_checklists(owner_id);

CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist ON integration_checklist_items(checklist_id, status);
CREATE INDEX IF NOT EXISTS idx_checklist_items_assigned ON integration_checklist_items(assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_checklist_items_due ON integration_checklist_items(due_date) WHERE status != 'completed';

CREATE INDEX IF NOT EXISTS idx_performance_metrics_integration ON performance_normalization_metrics(integration_id, metric_category);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_status ON performance_normalization_metrics(status);

CREATE INDEX IF NOT EXISTS idx_cultural_tasks_integration ON cultural_alignment_tasks(integration_id, status);
CREATE INDEX IF NOT EXISTS idx_cultural_tasks_type ON cultural_alignment_tasks(task_type, status);
CREATE INDEX IF NOT EXISTS idx_cultural_tasks_scheduled ON cultural_alignment_tasks(scheduled_date) WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_team_members_integration ON integration_team_members(integration_id, is_active);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON integration_team_members(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON integration_team_members(role, workstream);

-- Add updated_at triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'integration_checklists_updated_at') THEN
    CREATE TRIGGER integration_checklists_updated_at 
      BEFORE UPDATE ON integration_checklists 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'integration_checklist_items_updated_at') THEN
    CREATE TRIGGER integration_checklist_items_updated_at 
      BEFORE UPDATE ON integration_checklist_items 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'performance_normalization_metrics_updated_at') THEN
    CREATE TRIGGER performance_normalization_metrics_updated_at 
      BEFORE UPDATE ON performance_normalization_metrics 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'cultural_alignment_tasks_updated_at') THEN
    CREATE TRIGGER cultural_alignment_tasks_updated_at 
      BEFORE UPDATE ON cultural_alignment_tasks 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'integration_team_members_updated_at') THEN
    CREATE TRIGGER integration_team_members_updated_at 
      BEFORE UPDATE ON integration_team_members 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;

-- Enable RLS
ALTER TABLE integration_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_normalization_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultural_alignment_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Team members can view checklists" 
  ON integration_checklists FOR SELECT
  TO authenticated
  USING (
    integration_id IN (
      SELECT itm.integration_id 
      FROM integration_team_members itm
      WHERE itm.user_id = auth.uid() 
      AND itm.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Checklist owners can update" 
  ON integration_checklists FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Team members can view items" 
  ON integration_checklist_items FOR SELECT
  TO authenticated
  USING (
    checklist_id IN (
      SELECT ic.id 
      FROM integration_checklists ic
      JOIN integration_team_members itm ON itm.integration_id = ic.integration_id
      WHERE itm.user_id = auth.uid()
      AND itm.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Assigned users can update items" 
  ON integration_checklist_items FOR UPDATE
  TO authenticated
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Team members can view metrics" 
  ON performance_normalization_metrics FOR SELECT
  TO authenticated
  USING (
    integration_id IN (
      SELECT itm.integration_id 
      FROM integration_team_members itm
      WHERE itm.user_id = auth.uid() 
      AND itm.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Team members can view cultural tasks" 
  ON cultural_alignment_tasks FOR SELECT
  TO authenticated
  USING (
    integration_id IN (
      SELECT itm.integration_id 
      FROM integration_team_members itm
      WHERE itm.user_id = auth.uid() 
      AND itm.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'executive')
    )
  );

CREATE POLICY "Authenticated can view team members" 
  ON integration_team_members FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR integration_id IN (
      SELECT itm2.integration_id 
      FROM integration_team_members itm2
      WHERE itm2.user_id = auth.uid() 
      AND itm2.is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'executive')
    )
  );
