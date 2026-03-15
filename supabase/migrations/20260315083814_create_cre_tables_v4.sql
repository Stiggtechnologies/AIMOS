/*
  # AIM OS Clinic Replication Engine (CRE) Tables
  
  Creates 7 new tables for the CRE module. Uses prefixed names (cre_) to avoid
  conflicts with existing launch_tasks and integration_tasks tables.

  New Tables:
  - clinic_expansion_pipeline: 7-stage site tracking
  - cre_launch_templates: Reusable playbook templates
  - cre_launch_projects: Active launch projects per clinic
  - cre_launch_tasks: Domain-specific tasks within a project
  - cre_readiness_scores: Per-category readiness (85% threshold)
  - cre_launch_metrics: Post-launch 90-day KPI tracking
  - cre_integration_tasks: Acquisition Day 1/30/90 milestones
*/

CREATE TABLE IF NOT EXISTS clinic_expansion_pipeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  province text NOT NULL DEFAULT 'AB',
  address text,
  stage text NOT NULL DEFAULT 'target_identified',
  launch_type text NOT NULL DEFAULT 'new_clinic',
  target_open_date date,
  actual_open_date date,
  capex_budget numeric(12,2) DEFAULT 0,
  capex_actual numeric(12,2) DEFAULT 0,
  projected_annual_revenue numeric(12,2) DEFAULT 0,
  catchment_population integer,
  competition_level text DEFAULT 'medium',
  market_score numeric(4,1),
  notes text,
  owner_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clinic_expansion_pipeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cep_select" ON clinic_expansion_pipeline FOR SELECT TO authenticated USING (true);
CREATE POLICY "cep_insert" ON clinic_expansion_pipeline FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "cep_update" ON clinic_expansion_pipeline FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS cre_launch_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  launch_type text NOT NULL DEFAULT 'new_clinic',
  description text,
  estimated_days integer DEFAULT 45,
  task_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cre_launch_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clt_select" ON cre_launch_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "clt_insert" ON cre_launch_templates FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "clt_update" ON cre_launch_templates FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS cre_launch_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid REFERENCES clinic_expansion_pipeline(id),
  template_id uuid REFERENCES cre_launch_templates(id),
  clinic_name text NOT NULL,
  launch_type text NOT NULL DEFAULT 'new_clinic',
  status text NOT NULL DEFAULT 'planning',
  readiness_score numeric(4,1) DEFAULT 0,
  go_live_date date,
  kickoff_date date,
  total_budget numeric(12,2) DEFAULT 0,
  budget_spent numeric(12,2) DEFAULT 0,
  staffing_filled integer DEFAULT 0,
  staffing_target integer DEFAULT 0,
  project_manager_id uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cre_launch_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clp_select" ON cre_launch_projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "clp_insert" ON cre_launch_projects FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "clp_update" ON cre_launch_projects FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS cre_launch_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES cre_launch_projects(id) ON DELETE CASCADE,
  template_id uuid REFERENCES cre_launch_templates(id),
  domain text NOT NULL DEFAULT 'General',
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'not_started',
  priority text NOT NULL DEFAULT 'medium',
  assigned_to uuid REFERENCES auth.users(id),
  due_date date,
  completed_at timestamptz,
  day_target integer,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cre_launch_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cltask_select" ON cre_launch_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "cltask_insert" ON cre_launch_tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "cltask_update" ON cre_launch_tasks FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS cre_readiness_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES cre_launch_projects(id) ON DELETE CASCADE,
  category text NOT NULL,
  score numeric(4,1) NOT NULL DEFAULT 0,
  max_score numeric(4,1) NOT NULL DEFAULT 100,
  items_complete integer DEFAULT 0,
  items_total integer DEFAULT 0,
  threshold numeric(4,1) DEFAULT 85,
  last_updated timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_cre_rs_project_cat ON cre_readiness_scores(project_id, category);

ALTER TABLE cre_readiness_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crs_select" ON cre_readiness_scores FOR SELECT TO authenticated USING (true);
CREATE POLICY "crs_insert" ON cre_readiness_scores FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "crs_update" ON cre_readiness_scores FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS cre_launch_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES cre_launch_projects(id) ON DELETE CASCADE,
  metric_date date NOT NULL,
  day_number integer,
  new_patients integer DEFAULT 0,
  total_visits integer DEFAULT 0,
  revenue numeric(10,2) DEFAULT 0,
  utilization_pct numeric(4,1) DEFAULT 0,
  satisfaction_score numeric(3,1),
  staff_count integer DEFAULT 0,
  no_shows integer DEFAULT 0,
  cancellations integer DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cre_launch_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clm_select" ON cre_launch_metrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "clm_insert" ON cre_launch_metrics FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "clm_update" ON cre_launch_metrics FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS cre_integration_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES cre_launch_projects(id) ON DELETE CASCADE,
  phase text NOT NULL DEFAULT 'day1',
  domain text NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'not_started',
  assigned_to uuid REFERENCES auth.users(id),
  due_date date,
  completed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cre_integration_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cit_select" ON cre_integration_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "cit_insert" ON cre_integration_tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "cit_update" ON cre_integration_tasks FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_cep_stage ON clinic_expansion_pipeline(stage);
CREATE INDEX IF NOT EXISTS idx_clp_status ON cre_launch_projects(status);
CREATE INDEX IF NOT EXISTS idx_clp_pipeline ON cre_launch_projects(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_cltask_project ON cre_launch_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_cltask_domain ON cre_launch_tasks(domain);
CREATE INDEX IF NOT EXISTS idx_crs_project ON cre_readiness_scores(project_id);
CREATE INDEX IF NOT EXISTS idx_clm_project ON cre_launch_metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_cit_project ON cre_integration_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_cit_phase ON cre_integration_tasks(phase);

INSERT INTO cre_launch_templates (name, launch_type, description, estimated_days, task_count) VALUES
  ('New Clinic Standard Launch', 'new_clinic', 'Full 45-day launch playbook for a new AIM clinic from lease to open', 45, 52),
  ('Acquired Clinic Integration', 'acquisition', '90-day integration plan for acquiring and rebranding an existing clinic', 90, 68),
  ('Partner Clinic Onboarding', 'partner', '30-day onboarding for partner/affiliate clinics joining the AIM network', 30, 34),
  ('Satellite Clinic Setup', 'satellite', '21-day rapid setup for satellite/mobile clinic locations', 21, 22);

INSERT INTO clinic_expansion_pipeline (name, city, province, address, stage, launch_type, target_open_date, capex_budget, projected_annual_revenue, catchment_population, competition_level, market_score) VALUES
  ('AIM South Commons', 'Calgary', 'AB', '4500 South Trail Blvd SE', 'open', 'new_clinic', '2026-04-15', 580000, 1200000, 85000, 'low', 8.9),
  ('AIM Crowfoot', 'Calgary', 'AB', 'Crowfoot Village Market NW', 'under_construction', 'new_clinic', '2026-07-01', 520000, 980000, 72000, 'medium', 8.2),
  ('AIM Bridlewood', 'Calgary', 'AB', 'Bridlewood Town Centre SW', 'launch_planning', 'new_clinic', '2026-10-01', 495000, 920000, 68000, 'low', 8.5),
  ('AIM Airdrie', 'Airdrie', 'AB', 'Kingsview Market', 'due_diligence', 'new_clinic', '2027-01-01', 460000, 850000, 78000, 'low', 8.0),
  ('AIM Okotoks', 'Okotoks', 'AB', 'TBD', 'target_identified', 'new_clinic', '2027-04-01', 440000, 780000, 35000, 'low', 7.6);
