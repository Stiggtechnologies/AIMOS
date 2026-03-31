/*
  # Revenue Lab - Research & Experimentation System

  1. New Schema
    - `revenue_lab` - Isolated namespace for research operations

  2. New Tables
    - `research_programs`
      - `id` (uuid, primary key)
      - `name` (text) - Program name
      - `description` (text) - Program description
      - `program_type` (text) - Type: marketing/sales/research
      - `owner_id` (uuid) - Program owner
      - `is_active` (boolean) - Active flag
      - `created_at`, `updated_at`, `deleted_at` (timestamptz)

    - `research_artifacts`
      - `id` (uuid, primary key)
      - `program_id` (uuid) - Parent program
      - `artifact_type` (text) - Type of artifact
      - `name` (text) - Artifact name
      - `description` (text) - Artifact description
      - `current_version_id` (uuid) - Current version pointer
      - `baseline_version_id` (uuid) - Baseline version pointer
      - `production_version_id` (uuid) - Production version pointer
      - `owner_id` (uuid) - Artifact owner
      - `created_at`, `updated_at`, `deleted_at` (timestamptz)

    - `research_versions`
      - `id` (uuid, primary key)
      - `artifact_id` (uuid) - Parent artifact
      - `version_number` (integer) - Sequential version number
      - `content` (jsonb) - Version content
      - `version_type` (text) - Type: baseline/candidate/production/archived
      - `change_rationale` (text) - Why this version was created
      - `created_by` (uuid) - Creator
      - `created_at`, `deleted_at` (timestamptz)

    - `research_experiments`
      - `id` (uuid, primary key)
      - `artifact_id` (uuid) - Artifact being tested
      - `experiment_name` (text) - Experiment name
      - `charter` (text) - Experiment charter/hypothesis
      - `target_segment` (text) - Target audience segment
      - `owner_id` (uuid) - Experiment owner
      - `approval_owner_id` (uuid) - Approver
      - `status` (text) - Status: draft/active/paused/completed/cancelled
      - `rollout_scope` (jsonb) - Rollout configuration
      - `created_at`, `updated_at`, `deleted_at` (timestamptz)

    - `research_runs`
      - `id` (uuid, primary key)
      - `experiment_id` (uuid) - Parent experiment
      - `artifact_id` (uuid) - Artifact being tested
      - `baseline_version_id` (uuid) - Baseline version in test
      - `candidate_version_id` (uuid) - Candidate version in test
      - `run_status` (text) - Status: pending/running/completed/failed/timeout
      - `primary_kpi_name` (text) - Primary KPI being measured
      - `primary_kpi_baseline` (decimal) - Baseline KPI value
      - `primary_kpi_candidate` (decimal) - Candidate KPI value
      - `primary_kpi_delta` (decimal) - Delta between baseline and candidate
      - `primary_kpi_improvement_pct` (decimal) - Improvement percentage
      - `guardrail_results` (jsonb) - Guardrail metrics results
      - `run_result` (text) - Result: winner/loser/needs_review/invalid/timeout/crashed
      - `evaluation_notes` (text) - Evaluation notes
      - `run_started_at`, `run_completed_at` (timestamptz)
      - `created_by` (uuid) - Creator
      - `created_at`, `deleted_at` (timestamptz)

    - `research_promotions`
      - `id` (uuid, primary key)
      - `experiment_id` (uuid) - Source experiment
      - `artifact_id` (uuid) - Artifact being promoted
      - `from_version_id` (uuid) - Version being promoted from
      - `to_version_id` (uuid) - Version being promoted to
      - `promotion_type` (text) - Type: baseline_to_candidate/candidate_to_production/rollback/reject
      - `approved_by` (uuid) - Approver
      - `rollout_scope` (jsonb) - Rollout configuration
      - `rollout_percentage` (integer) - Rollout percentage (0-100)
      - `rollback_from_version_id` (uuid) - Version being rolled back from
      - `promotion_notes` (text) - Promotion notes
      - `promoted_at` (timestamptz) - Promotion timestamp

    - `research_audit_log`
      - `id` (uuid, primary key)
      - `experiment_id` (uuid) - Related experiment
      - `artifact_id` (uuid) - Related artifact
      - `version_id` (uuid) - Related version
      - `run_id` (uuid) - Related run
      - `promotion_id` (uuid) - Related promotion
      - `action_type` (text) - Type of action
      - `action_details` (jsonb) - Action details
      - `performed_by` (uuid) - User who performed action
      - `performed_at` (timestamptz) - Action timestamp

  3. Security
    - Enable RLS on all tables
    - Authenticated users can access all research data
    - Audit log is read-only + insert for authenticated users

  4. Seed Data
    - 3 research programs (Marketing, Sales, Research)
    - 6 research artifacts (landing pages, scripts, sequences)
    - Baseline versions for all artifacts
*/

CREATE SCHEMA IF NOT EXISTS revenue_lab;

CREATE TABLE IF NOT EXISTS revenue_lab.research_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  program_type TEXT NOT NULL CHECK (program_type IN ('marketing', 'sales', 'research')),
  owner_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS revenue_lab.research_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES revenue_lab.research_programs(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  current_version_id UUID,
  baseline_version_id UUID,
  production_version_id UUID,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS revenue_lab.research_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES revenue_lab.research_artifacts(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  version_type TEXT NOT NULL CHECK (version_type IN ('baseline', 'candidate', 'production', 'archived')),
  change_rationale TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS revenue_lab.research_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artifact_id UUID NOT NULL REFERENCES revenue_lab.research_artifacts(id) ON DELETE CASCADE,
  experiment_name TEXT NOT NULL,
  charter TEXT NOT NULL,
  target_segment TEXT,
  owner_id UUID REFERENCES auth.users(id),
  approval_owner_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')) DEFAULT 'draft',
  rollout_scope JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS revenue_lab.research_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES revenue_lab.research_experiments(id) ON DELETE SET NULL,
  artifact_id UUID NOT NULL REFERENCES revenue_lab.research_artifacts(id) ON DELETE CASCADE,
  baseline_version_id UUID NOT NULL REFERENCES revenue_lab.research_versions(id),
  candidate_version_id UUID NOT NULL REFERENCES revenue_lab.research_versions(id),
  run_status TEXT NOT NULL CHECK (run_status IN ('pending', 'running', 'completed', 'failed', 'timeout')) DEFAULT 'pending',
  primary_kpi_name TEXT NOT NULL,
  primary_kpi_baseline DECIMAL,
  primary_kpi_candidate DECIMAL,
  primary_kpi_delta DECIMAL,
  primary_kpi_improvement_pct DECIMAL,
  guardrail_results JSONB,
  run_result TEXT CHECK (run_result IN ('winner', 'loser', 'needs_review', 'invalid', 'timeout', 'crashed')),
  evaluation_notes TEXT,
  run_started_at TIMESTAMPTZ,
  run_completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS revenue_lab.research_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES revenue_lab.research_experiments(id) ON DELETE SET NULL,
  artifact_id UUID NOT NULL REFERENCES revenue_lab.research_artifacts(id) ON DELETE CASCADE,
  from_version_id UUID NOT NULL REFERENCES revenue_lab.research_versions(id),
  to_version_id UUID NOT NULL REFERENCES revenue_lab.research_versions(id),
  promotion_type TEXT NOT NULL CHECK (promotion_type IN ('baseline_to_candidate', 'candidate_to_production', 'rollback', 'reject')),
  approved_by UUID REFERENCES auth.users(id),
  rollout_scope JSONB,
  rollout_percentage INTEGER DEFAULT 100,
  rollback_from_version_id UUID REFERENCES revenue_lab.research_versions(id),
  promotion_notes TEXT,
  promoted_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS revenue_lab.research_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID REFERENCES revenue_lab.research_experiments(id) ON DELETE SET NULL,
  artifact_id UUID REFERENCES revenue_lab.research_artifacts(id) ON DELETE SET NULL,
  version_id UUID REFERENCES revenue_lab.research_versions(id) ON DELETE SET NULL,
  run_id UUID REFERENCES revenue_lab.research_runs(id) ON DELETE SET NULL,
  promotion_id UUID REFERENCES revenue_lab.research_promotions(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  action_details JSONB DEFAULT '{}',
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE revenue_lab.research_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_lab.research_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_lab.research_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_lab.research_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_lab.research_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_lab.research_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_lab.research_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rl_programs_all" ON revenue_lab.research_programs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rl_artifacts_all" ON revenue_lab.research_artifacts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rl_versions_all" ON revenue_lab.research_versions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rl_experiments_all" ON revenue_lab.research_experiments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rl_runs_all" ON revenue_lab.research_runs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rl_promotions_all" ON revenue_lab.research_promotions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rl_audit_read" ON revenue_lab.research_audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "rl_audit_insert" ON revenue_lab.research_audit_log FOR INSERT TO authenticated WITH CHECK (true);

-- Seed Data
INSERT INTO revenue_lab.research_programs (name, description, program_type) 
VALUES
  ('Marketing Optimization Program', 'Core marketing experimentation', 'marketing'),
  ('Sales Optimization Program', 'Core sales experimentation', 'sales'),
  ('Research Foundation', 'Base research infrastructure', 'research')
ON CONFLICT DO NOTHING;

INSERT INTO revenue_lab.research_artifacts (program_id, artifact_type, name, description) 
SELECT id, 'landing_page', 'Consultation Booking Funnel', 'Main consultation booking landing page'
FROM revenue_lab.research_programs WHERE program_type = 'marketing'
ON CONFLICT DO NOTHING;

INSERT INTO revenue_lab.research_artifacts (program_id, artifact_type, name, description)
SELECT id, 'outreach_script', 'Employer Outreach Script', 'Cold outreach for employer groups'
FROM revenue_lab.research_programs WHERE program_type = 'sales'
ON CONFLICT DO NOTHING;

INSERT INTO revenue_lab.research_artifacts (program_id, artifact_type, name, description)
SELECT id, 'proposal_copy', 'Proposal Optimizer', 'Proposal executive summary'
FROM revenue_lab.research_programs WHERE program_type = 'sales'
ON CONFLICT DO NOTHING;

INSERT INTO revenue_lab.research_artifacts (program_id, artifact_type, name, description)
SELECT id, 'email_sequence', 'Reactivation Nurture Sequence', 'Email for lapsed patients'
FROM revenue_lab.research_programs WHERE program_type = 'marketing'
ON CONFLICT DO NOTHING;

INSERT INTO revenue_lab.research_artifacts (program_id, artifact_type, name, description)
SELECT id, 'gbp_messaging', 'Local Growth GBP Messaging', 'Google Business Profile'
FROM revenue_lab.research_programs WHERE program_type = 'marketing'
ON CONFLICT DO NOTHING;

INSERT INTO revenue_lab.research_artifacts (program_id, artifact_type, name, description)
SELECT id, 'demo_sequence', 'Demo Flow Optimizer', 'Demo flow optimization'
FROM revenue_lab.research_programs WHERE program_type = 'sales'
ON CONFLICT DO NOTHING;

-- Create baseline versions
INSERT INTO revenue_lab.research_versions (artifact_id, version_number, content, version_type, change_rationale)
SELECT id, 1, '{"baseline": true}'::jsonb, 'baseline', 'Initial baseline version'
FROM revenue_lab.research_artifacts
WHERE NOT EXISTS (
  SELECT 1 FROM revenue_lab.research_versions 
  WHERE artifact_id = revenue_lab.research_artifacts.id
);

-- Update artifacts with baseline version references
UPDATE revenue_lab.research_artifacts ra
SET baseline_version_id = rv.id, current_version_id = rv.id
FROM revenue_lab.research_versions rv
WHERE rv.artifact_id = ra.id 
  AND rv.version_type = 'baseline' 
  AND ra.baseline_version_id IS NULL;