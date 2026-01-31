/*
  # Enhance Clinical Intelligence Implementation (CII) Automation System

  This migration adds missing tables and functions for the complete self-driving CII system:
  
  1. Research Ingestion - Automated research pulls from approved sources
  2. Evidence Synthesis - Monthly digests with confidence-weighted summaries
  3. Translation Trigger - Auto-generate change proposals from actionable evidence
  4. Pilot Management - Enhanced pilot definitions with locked metrics
  5. Outcome Attribution - Track outcomes to SOP version and evidence ID
  6. Decision Enforcement - Rollout or rollback based on pilot results

  ## New Tables:

  - `ingestion_jobs` - Track scheduled research ingestion jobs
  - `evidence_flags` - Flag actionable evidence (confidence >= 80%)
  - `clinic_pilot_assignments` - Clinic-to-pilot assignments
  - `pilot_observations` - Weekly/daily observations during pilots
  - `pilot_checkpoints` - Scheduled pilot evaluation checkpoints
  - `outcome_attributions` - Pre/post metrics and attribution tracking
  - `rollout_decisions` - Record of rollout/rollback decisions
  - `clinic_rollout_plans` - Phased rollout scheduling per clinic
  - `clinic_rollout_status` - Rollout execution tracking
  - `clinic_rollback_plans` - Rollback scheduling
  - `cii_learning_repository` - Permanent storage of learnings and insights
*/

-- ============================================================================
-- INGESTION JOBS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ingestion_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES research_sources(id) ON DELETE CASCADE,
  source_name text NOT NULL,
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  papers_found integer DEFAULT 0,
  papers_ingested integer DEFAULT 0,
  papers_rejected integer DEFAULT 0,
  status text DEFAULT 'pending',
  error_message text,
  metadata_quality_score numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ingestion_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view ingestion jobs"
  ON ingestion_jobs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage ingestion jobs"
  ON ingestion_jobs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX idx_ingestion_jobs_source_id ON ingestion_jobs(source_id);
CREATE INDEX idx_ingestion_jobs_status ON ingestion_jobs(status);
CREATE INDEX idx_ingestion_jobs_scheduled_for ON ingestion_jobs(scheduled_for);

-- ============================================================================
-- EVIDENCE FLAGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS evidence_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_id uuid REFERENCES evidence_digests(id) ON DELETE CASCADE,
  evidence_theme text NOT NULL,
  confidence_score numeric NOT NULL,
  actionability_flag text DEFAULT 'actionable',
  processed_at timestamptz,
  flagged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE evidence_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view evidence flags"
  ON evidence_flags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage evidence flags"
  ON evidence_flags FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update evidence flags"
  ON evidence_flags FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_evidence_flags_actionability ON evidence_flags(actionability_flag);
CREATE INDEX idx_evidence_flags_confidence ON evidence_flags(confidence_score);

-- ============================================================================
-- EVIDENCE DIGESTS ENHANCEMENT
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evidence_digests' AND column_name = 'confidence_weighted_summaries'
  ) THEN
    ALTER TABLE evidence_digests ADD COLUMN confidence_weighted_summaries jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- ============================================================================
-- PRACTICE PILOTS ENHANCEMENT
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'practice_pilots' AND column_name = 'locked_metrics'
  ) THEN
    ALTER TABLE practice_pilots ADD COLUMN locked_metrics jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'practice_pilots' AND column_name = 'metrics_locked_at'
  ) THEN
    ALTER TABLE practice_pilots ADD COLUMN metrics_locked_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'practice_pilots' AND column_name = 'baseline_metrics'
  ) THEN
    ALTER TABLE practice_pilots ADD COLUMN baseline_metrics jsonb DEFAULT '{}';
  END IF;
END $$;

-- ============================================================================
-- CLINIC PILOT ASSIGNMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinic_pilot_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  pilot_id uuid NOT NULL REFERENCES practice_pilots(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  status text DEFAULT 'active',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clinic_pilot_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view assignments"
  ON clinic_pilot_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage assignments"
  ON clinic_pilot_assignments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_clinic_pilot_assignments_clinic_id ON clinic_pilot_assignments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_pilot_assignments_pilot_id ON clinic_pilot_assignments(pilot_id);

-- ============================================================================
-- PILOT OBSERVATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS pilot_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id uuid NOT NULL REFERENCES practice_pilots(id) ON DELETE CASCADE,
  clinic_id uuid REFERENCES clinics(id) ON DELETE SET NULL,
  observation_date timestamptz NOT NULL DEFAULT now(),
  observation_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pilot_observations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view observations"
  ON pilot_observations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can record observations"
  ON pilot_observations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_pilot_observations_pilot_id ON pilot_observations(pilot_id);
CREATE INDEX IF NOT EXISTS idx_pilot_observations_clinic_id ON pilot_observations(clinic_id);
CREATE INDEX IF NOT EXISTS idx_pilot_observations_date ON pilot_observations(observation_date);

-- ============================================================================
-- PILOT CHECKPOINTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS pilot_checkpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id uuid NOT NULL REFERENCES practice_pilots(id) ON DELETE CASCADE,
  checkpoint_date timestamptz NOT NULL,
  checkpoint_type text NOT NULL,
  completed_at timestamptz,
  scheduled_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pilot_checkpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view checkpoints"
  ON pilot_checkpoints FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage checkpoints"
  ON pilot_checkpoints FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_pilot_checkpoints_pilot_id ON pilot_checkpoints(pilot_id);
CREATE INDEX IF NOT EXISTS idx_pilot_checkpoints_date ON pilot_checkpoints(checkpoint_date);

-- ============================================================================
-- OUTCOME ATTRIBUTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS outcome_attributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id uuid NOT NULL REFERENCES practice_pilots(id) ON DELETE CASCADE,
  evidence_id uuid,
  sop_version text NOT NULL,
  measurement_period text NOT NULL,
  pre_metrics jsonb NOT NULL DEFAULT '{}',
  post_metrics jsonb NOT NULL DEFAULT '{}',
  outcome_metrics jsonb NOT NULL DEFAULT '{}',
  improvement_percentage numeric DEFAULT 0,
  statistically_significant boolean DEFAULT false,
  confidence_interval text,
  attribution_status text DEFAULT 'preliminary',
  finalized_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE outcome_attributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view attributions"
  ON outcome_attributions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage attributions"
  ON outcome_attributions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_outcome_attributions_pilot_id ON outcome_attributions(pilot_id);
CREATE INDEX IF NOT EXISTS idx_outcome_attributions_status ON outcome_attributions(attribution_status);

-- ============================================================================
-- ROLLOUT DECISIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS rollout_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pilot_id uuid NOT NULL REFERENCES practice_pilots(id) ON DELETE CASCADE,
  attribution_id uuid REFERENCES outcome_attributions(id) ON DELETE SET NULL,
  decision text NOT NULL,
  decided_by uuid NOT NULL REFERENCES auth.users(id),
  decided_at timestamptz DEFAULT now(),
  decision_rationale text NOT NULL,
  rollout_phase text DEFAULT 'phase_1',
  rollout_timeline jsonb DEFAULT '{}',
  learning_stored boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rollout_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view decisions"
  ON rollout_decisions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage decisions"
  ON rollout_decisions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_rollout_decisions_pilot_id ON rollout_decisions(pilot_id);
CREATE INDEX IF NOT EXISTS idx_rollout_decisions_decision ON rollout_decisions(decision);
CREATE INDEX IF NOT EXISTS idx_rollout_decisions_learning_stored ON rollout_decisions(learning_stored);

-- ============================================================================
-- CLINIC ROLLOUT PLANS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinic_rollout_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  decision_id uuid NOT NULL REFERENCES rollout_decisions(id) ON DELETE CASCADE,
  phase text NOT NULL,
  scheduled_start timestamptz NOT NULL,
  status text DEFAULT 'scheduled',
  started_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clinic_rollout_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view rollout plans"
  ON clinic_rollout_plans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage rollout plans"
  ON clinic_rollout_plans FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_clinic_rollout_plans_clinic_id ON clinic_rollout_plans(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_rollout_plans_decision_id ON clinic_rollout_plans(decision_id);
CREATE INDEX IF NOT EXISTS idx_clinic_rollout_plans_phase ON clinic_rollout_plans(phase);

-- ============================================================================
-- CLINIC ROLLOUT STATUS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinic_rollout_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  decision_id uuid NOT NULL REFERENCES rollout_decisions(id) ON DELETE CASCADE,
  phase text NOT NULL,
  status text NOT NULL,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clinic_rollout_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view rollout status"
  ON clinic_rollout_status FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can record rollout status"
  ON clinic_rollout_status FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_clinic_rollout_status_clinic_id ON clinic_rollout_status(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_rollout_status_decision_id ON clinic_rollout_status(decision_id);

-- ============================================================================
-- CLINIC ROLLBACK PLANS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinic_rollback_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  decision_id uuid NOT NULL REFERENCES rollout_decisions(id) ON DELETE CASCADE,
  scheduled_start timestamptz NOT NULL,
  status text DEFAULT 'scheduled',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clinic_rollback_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view rollback plans"
  ON clinic_rollback_plans FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage rollback plans"
  ON clinic_rollback_plans FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_clinic_rollback_plans_clinic_id ON clinic_rollback_plans(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_rollback_plans_decision_id ON clinic_rollback_plans(decision_id);

-- ============================================================================
-- CII LEARNING REPOSITORY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS cii_learning_repository (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id uuid NOT NULL REFERENCES rollout_decisions(id) ON DELETE CASCADE,
  pilot_id uuid NOT NULL REFERENCES practice_pilots(id) ON DELETE CASCADE,
  decision text NOT NULL,
  outcome_findings jsonb NOT NULL DEFAULT '{}',
  lessons_learned text[] DEFAULT '{}',
  applicable_contexts text[] DEFAULT '{}',
  stored_at timestamptz DEFAULT now(),
  searchable boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cii_learning_repository ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view learning"
  ON cii_learning_repository FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can store learning"
  ON cii_learning_repository FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_cii_learning_decision ON cii_learning_repository(decision);
CREATE INDEX IF NOT EXISTS idx_cii_learning_searchable ON cii_learning_repository(searchable);

-- ============================================================================
-- HELPER FUNCTION: Get Clinic Baseline Metrics
-- ============================================================================

CREATE OR REPLACE FUNCTION get_clinic_baseline_metrics(p_clinic_id uuid)
RETURNS TABLE (
  avg_days_to_rtw numeric,
  claim_acceptance_rate numeric,
  avg_visits_per_case numeric,
  avg_patient_satisfaction numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(AVG(CAST(kpi_value AS numeric)), 0) AS avg_days_to_rtw,
    COALESCE(MAX(CAST(kpi_value AS numeric)), 0) AS claim_acceptance_rate,
    COALESCE(AVG(CAST(kpi_value AS numeric)), 0) AS avg_visits_per_case,
    COALESCE(AVG(CAST(kpi_value AS numeric)), 0) AS avg_patient_satisfaction
  FROM clinic_kpis
  WHERE clinic_id = p_clinic_id
    AND kpi_period >= NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTION: Get Clinic Outcome Metrics
-- ============================================================================

CREATE OR REPLACE FUNCTION get_clinic_outcome_metrics(p_clinic_id uuid, p_timeframe_days integer)
RETURNS TABLE (
  avg_days_to_rtw numeric,
  claim_acceptance_rate numeric,
  avg_visits_per_case numeric,
  avg_patient_satisfaction numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(AVG(CAST(kpi_value AS numeric)), 0) AS avg_days_to_rtw,
    COALESCE(MAX(CAST(kpi_value AS numeric)), 0) AS claim_acceptance_rate,
    COALESCE(AVG(CAST(kpi_value AS numeric)), 0) AS avg_visits_per_case,
    COALESCE(AVG(CAST(kpi_value AS numeric)), 0) AS avg_patient_satisfaction
  FROM clinic_kpis
  WHERE clinic_id = p_clinic_id
    AND kpi_period >= NOW() - (p_timeframe_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- HELPER FUNCTION: Get Translation Proposal Stats
-- ============================================================================

CREATE OR REPLACE FUNCTION get_translation_proposal_stats()
RETURNS TABLE (
  total_generated integer,
  pending_review integer,
  approved_count integer,
  rejected_count integer,
  avg_time_to_approval numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::integer AS total_generated,
    COUNT(*) FILTER (WHERE status IN ('generated', 'awaiting_cco_review'))::integer AS pending_review,
    COUNT(*) FILTER (WHERE status = 'approved')::integer AS approved_count,
    COUNT(*) FILTER (WHERE status = 'rejected')::integer AS rejected_count,
    COALESCE(
      AVG(EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 86400),
      0
    )::numeric AS avg_time_to_approval
  FROM practice_translations
  WHERE evidence_flag_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;
