/*
  # New Clinic Launch Module (NCLM) - Core Schema

  1. New Tables
    - clinic_launches - Master launch records
    - launch_phases - 6 phases with gate validation
    - launch_workstreams - Parallel tracks
    - launch_tasks - Granular tasks with dependencies
    - launch_risks - Risk tracking
    - launch_documents - Document management
    - launch_milestones - Milestone tracking
    - launch_kpis - KPI metrics

  2. Security
    - RLS with proper role checks
*/

CREATE TYPE launch_status AS ENUM (
  'planning',
  'approved',
  'in_progress',
  'delayed',
  'at_risk',
  'completed',
  'cancelled'
);

CREATE TYPE launch_phase_name AS ENUM (
  'phase_0_deal_authorization',
  'phase_1_site_build_compliance',
  'phase_2_staffing_credentialing',
  'phase_3_systems_ops_readiness',
  'phase_4_go_live',
  'phase_5_stabilization'
);

CREATE TYPE phase_status AS ENUM (
  'not_started',
  'in_progress',
  'blocked',
  'completed',
  'skipped'
);

CREATE TYPE workstream_type AS ENUM (
  'real_estate_build',
  'compliance_licensing',
  'staffing_credentials',
  'systems_it',
  'clinical_ops',
  'marketing_outreach'
);

CREATE TYPE risk_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE risk_status AS ENUM ('identified', 'assessing', 'mitigating', 'monitoring', 'resolved', 'accepted');

CREATE TABLE IF NOT EXISTS clinic_launches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid REFERENCES clinics(id) ON DELETE CASCADE,
  launch_name text NOT NULL,
  launch_code text UNIQUE NOT NULL,
  launch_owner_id uuid REFERENCES auth.users(id),
  executive_sponsor_id uuid REFERENCES auth.users(id),
  target_open_date date NOT NULL,
  planned_start_date date NOT NULL,
  actual_start_date date,
  actual_open_date date,
  stabilization_target_date date,
  stabilization_actual_date date,
  current_phase launch_phase_name DEFAULT 'phase_0_deal_authorization',
  status launch_status DEFAULT 'planning',
  approved_budget numeric(12, 2),
  actual_cost numeric(12, 2) DEFAULT 0,
  overall_completion_pct numeric(5, 2) DEFAULT 0,
  days_to_open integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS launch_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_launch_id uuid NOT NULL REFERENCES clinic_launches(id) ON DELETE CASCADE,
  phase_name launch_phase_name NOT NULL,
  phase_order integer NOT NULL,
  status phase_status DEFAULT 'not_started',
  planned_start_date date,
  planned_end_date date,
  actual_start_date date,
  actual_end_date date,
  gate_passed boolean DEFAULT false,
  gate_passed_at timestamptz,
  gate_passed_by uuid REFERENCES auth.users(id),
  gate_notes text,
  completion_pct numeric(5, 2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(clinic_launch_id, phase_name)
);

CREATE TABLE IF NOT EXISTS launch_workstreams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_launch_id uuid NOT NULL REFERENCES clinic_launches(id) ON DELETE CASCADE,
  workstream_type workstream_type NOT NULL,
  workstream_name text NOT NULL,
  description text,
  owner_id uuid REFERENCES auth.users(id),
  owner_role text,
  status phase_status DEFAULT 'not_started',
  total_tasks integer DEFAULT 0,
  completed_tasks integer DEFAULT 0,
  completion_pct numeric(5, 2) DEFAULT 0,
  start_date date,
  target_end_date date,
  actual_end_date date,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(clinic_launch_id, workstream_type)
);

CREATE TABLE IF NOT EXISTS launch_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_launch_id uuid NOT NULL REFERENCES clinic_launches(id) ON DELETE CASCADE,
  workstream_id uuid REFERENCES launch_workstreams(id) ON DELETE CASCADE,
  phase_name launch_phase_name,
  task_name text NOT NULL,
  description text,
  is_required boolean DEFAULT false,
  is_gate_blocker boolean DEFAULT false,
  assigned_to uuid REFERENCES auth.users(id),
  assigned_role text,
  due_date date,
  start_date date,
  completed_date date,
  status phase_status DEFAULT 'not_started',
  completion_pct numeric(5, 2) DEFAULT 0,
  depends_on_task_ids uuid[] DEFAULT ARRAY[]::uuid[],
  blocks_task_ids uuid[] DEFAULT ARRAY[]::uuid[],
  estimated_hours numeric(6, 2),
  actual_hours numeric(6, 2),
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS launch_risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_launch_id uuid NOT NULL REFERENCES clinic_launches(id) ON DELETE CASCADE,
  phase_name launch_phase_name,
  workstream_id uuid REFERENCES launch_workstreams(id) ON DELETE SET NULL,
  risk_title text NOT NULL,
  risk_description text NOT NULL,
  severity risk_severity NOT NULL,
  probability text,
  impact_description text,
  status risk_status DEFAULT 'identified',
  identified_by uuid REFERENCES auth.users(id),
  owner_id uuid REFERENCES auth.users(id),
  mitigation_plan text,
  mitigation_actions jsonb DEFAULT '[]'::jsonb,
  identified_date date DEFAULT CURRENT_DATE,
  target_resolution_date date,
  resolved_date date,
  ai_detected boolean DEFAULT false,
  ai_confidence numeric(3, 2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS launch_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_launch_id uuid NOT NULL REFERENCES clinic_launches(id) ON DELETE CASCADE,
  phase_name launch_phase_name,
  workstream_id uuid REFERENCES launch_workstreams(id) ON DELETE SET NULL,
  task_id uuid REFERENCES launch_tasks(id) ON DELETE SET NULL,
  document_name text NOT NULL,
  document_type text,
  description text,
  file_path text,
  file_size_bytes bigint,
  mime_type text,
  version integer DEFAULT 1,
  is_current_version boolean DEFAULT true,
  requires_approval boolean DEFAULT false,
  approved boolean DEFAULT false,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  uploaded_by uuid REFERENCES auth.users(id),
  uploaded_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS launch_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_launch_id uuid NOT NULL REFERENCES clinic_launches(id) ON DELETE CASCADE,
  milestone_name text NOT NULL,
  milestone_description text,
  milestone_type text,
  planned_date date NOT NULL,
  actual_date date,
  is_critical boolean DEFAULT false,
  is_completed boolean DEFAULT false,
  completion_notes text,
  depends_on_phase launch_phase_name,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS launch_kpis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_launch_id uuid NOT NULL REFERENCES clinic_launches(id) ON DELETE CASCADE,
  metric_name text NOT NULL,
  metric_category text,
  metric_value numeric(12, 2),
  metric_unit text,
  measurement_date date DEFAULT CURRENT_DATE,
  phase_name launch_phase_name,
  target_value numeric(12, 2),
  is_on_target boolean,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  recorded_at timestamptz DEFAULT now(),
  recorded_by uuid REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_clinic_launches_clinic ON clinic_launches(clinic_id);
CREATE INDEX idx_clinic_launches_owner ON clinic_launches(launch_owner_id);
CREATE INDEX idx_clinic_launches_status ON clinic_launches(status);
CREATE INDEX idx_launch_phases_launch ON launch_phases(clinic_launch_id);
CREATE INDEX idx_launch_workstreams_launch ON launch_workstreams(clinic_launch_id);
CREATE INDEX idx_launch_tasks_launch ON launch_tasks(clinic_launch_id);
CREATE INDEX idx_launch_tasks_assigned ON launch_tasks(assigned_to);
CREATE INDEX idx_launch_risks_launch ON launch_risks(clinic_launch_id);
CREATE INDEX idx_launch_kpis_launch ON launch_kpis(clinic_launch_id);

-- RLS
ALTER TABLE clinic_launches ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_workstreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE launch_kpis ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Authorized users can view launches"
  ON clinic_launches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
    )
    OR launch_owner_id = auth.uid()
    OR executive_sponsor_id = auth.uid()
  );

CREATE POLICY "Launch owners can update launches"
  ON clinic_launches FOR UPDATE
  TO authenticated
  USING (launch_owner_id = auth.uid() OR executive_sponsor_id = auth.uid())
  WITH CHECK (launch_owner_id = auth.uid() OR executive_sponsor_id = auth.uid());

CREATE POLICY "Admins can create launches"
  ON clinic_launches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('executive', 'admin')
    )
  );

CREATE POLICY "Users can view accessible phases"
  ON launch_phases FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinic_launches
      WHERE clinic_launches.id = launch_phases.clinic_launch_id
      AND (
        clinic_launches.launch_owner_id = auth.uid()
        OR clinic_launches.executive_sponsor_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
        )
      )
    )
  );

CREATE POLICY "Launch team can manage phases"
  ON launch_phases FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinic_launches
      WHERE clinic_launches.id = launch_phases.clinic_launch_id
      AND (clinic_launches.launch_owner_id = auth.uid() OR clinic_launches.executive_sponsor_id = auth.uid())
    )
  );

CREATE POLICY "Users can view accessible workstreams"
  ON launch_workstreams FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM clinic_launches
      WHERE clinic_launches.id = launch_workstreams.clinic_launch_id
      AND (
        clinic_launches.launch_owner_id = auth.uid()
        OR clinic_launches.executive_sponsor_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
        )
      )
    )
  );

CREATE POLICY "Workstream owners can manage workstreams"
  ON launch_workstreams FOR ALL
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM clinic_launches
      WHERE clinic_launches.id = launch_workstreams.clinic_launch_id
      AND (clinic_launches.launch_owner_id = auth.uid() OR clinic_launches.executive_sponsor_id = auth.uid())
    )
  );

CREATE POLICY "Users can view accessible tasks"
  ON launch_tasks FOR SELECT
  TO authenticated
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM clinic_launches
      WHERE clinic_launches.id = launch_tasks.clinic_launch_id
      AND (
        clinic_launches.launch_owner_id = auth.uid()
        OR clinic_launches.executive_sponsor_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM user_profiles
          WHERE user_profiles.id = auth.uid()
          AND user_profiles.role IN ('executive', 'admin', 'clinic_manager')
        )
      )
    )
  );

CREATE POLICY "Task assignees can update tasks"
  ON launch_tasks FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Launch team can create tasks"
  ON launch_tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clinic_launches
      WHERE clinic_launches.id = launch_tasks.clinic_launch_id
      AND (clinic_launches.launch_owner_id = auth.uid() OR clinic_launches.executive_sponsor_id = auth.uid())
    )
  );

CREATE POLICY "Users can view accessible risks"
  ON launch_risks FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM clinic_launches WHERE clinic_launches.id = launch_risks.clinic_launch_id));

CREATE POLICY "Launch team can manage risks"
  ON launch_risks FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinic_launches
      WHERE clinic_launches.id = launch_risks.clinic_launch_id
      AND (clinic_launches.launch_owner_id = auth.uid() OR clinic_launches.executive_sponsor_id = auth.uid())
    )
  );

CREATE POLICY "Users can view accessible documents"
  ON launch_documents FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM clinic_launches WHERE clinic_launches.id = launch_documents.clinic_launch_id));

CREATE POLICY "Launch team can manage documents"
  ON launch_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinic_launches
      WHERE clinic_launches.id = launch_documents.clinic_launch_id
      AND (clinic_launches.launch_owner_id = auth.uid() OR clinic_launches.executive_sponsor_id = auth.uid())
    )
  );

CREATE POLICY "Users can view accessible milestones"
  ON launch_milestones FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM clinic_launches WHERE clinic_launches.id = launch_milestones.clinic_launch_id));

CREATE POLICY "Launch team can manage milestones"
  ON launch_milestones FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clinic_launches
      WHERE clinic_launches.id = launch_milestones.clinic_launch_id
      AND (clinic_launches.launch_owner_id = auth.uid() OR clinic_launches.executive_sponsor_id = auth.uid())
    )
  );

CREATE POLICY "Users can view accessible KPIs"
  ON launch_kpis FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM clinic_launches WHERE clinic_launches.id = launch_kpis.clinic_launch_id));

CREATE POLICY "Launch team can record KPIs"
  ON launch_kpis FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clinic_launches
      WHERE clinic_launches.id = launch_kpis.clinic_launch_id
    )
  );