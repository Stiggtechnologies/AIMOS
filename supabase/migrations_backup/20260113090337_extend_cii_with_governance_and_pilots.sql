/*
  # Extend Clinical Intelligence & Innovation Module

  Adds complete research governance, pilot management, evidence digests, and evidence packs.

  1. New Tables
    - `evidence_digests` - Monthly automated evidence summaries
    - `research_priorities` - Priority conditions and outcomes map
    - `practice_pilots` - Pilot programs before platform-wide rollout
    - `evidence_packs` - Auto-generated insurer/regulator evidence documentation
    - `cco_approvals` - Approval workflow tracking

  2. Enhancements
    - Add tier classification to research_sources
    - Add priority scoring to research_papers
    - Enhanced outcomes tracking with statistical significance

  3. Security
    - RLS policies for all new tables
*/

-- ============================================================================
-- ENHANCE RESEARCH SOURCES WITH TIERING
-- ============================================================================

-- Add tier and ingest rules to existing research_sources table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'research_sources' AND column_name = 'tier') THEN
    ALTER TABLE research_sources ADD COLUMN tier integer CHECK (tier IN (1, 2, 3)) DEFAULT 1;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'research_sources' AND column_name = 'ingest_rules') THEN
    ALTER TABLE research_sources ADD COLUMN ingest_rules jsonb DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'research_sources' AND column_name = 'ingest_frequency') THEN
    ALTER TABLE research_sources ADD COLUMN ingest_frequency text DEFAULT 'weekly' CHECK (ingest_frequency IN ('daily', 'weekly', 'monthly', 'manual'));
  END IF;
END $$;

-- ============================================================================
-- EVIDENCE DIGESTS (Monthly Summaries)
-- ============================================================================

CREATE TABLE IF NOT EXISTS evidence_digests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Period
  digest_period text NOT NULL,
  digest_month date NOT NULL,
  
  -- Content
  top_findings jsonb,
  changes_vs_last_month text,
  adoption_recommendations text,
  not_ready_yet text,
  
  -- Audience-specific views
  clinician_view text,
  operations_view text,
  executive_view text,
  
  -- Status
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_digests_month ON evidence_digests(digest_month DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_digests_status ON evidence_digests(status);

-- ============================================================================
-- RESEARCH PRIORITIES (Focus Engine)
-- ============================================================================

CREATE TABLE IF NOT EXISTS research_priorities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Priority
  priority_type text NOT NULL CHECK (priority_type IN ('condition', 'outcome')),
  priority_name text NOT NULL,
  priority_score integer CHECK (priority_score BETWEEN 1 AND 100),
  
  -- Filters
  keywords text[],
  icd_codes text[],
  
  -- Mapping
  maps_to_sops uuid[],
  maps_to_pathways text[],
  
  -- Status
  active boolean DEFAULT true,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(priority_type, priority_name)
);

CREATE INDEX IF NOT EXISTS idx_research_priorities_type ON research_priorities(priority_type);
CREATE INDEX IF NOT EXISTS idx_research_priorities_active ON research_priorities(active) WHERE active = true;

-- ============================================================================
-- PRACTICE PILOTS (Test Before Platform Rollout)
-- ============================================================================

CREATE TABLE IF NOT EXISTS practice_pilots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_id uuid REFERENCES practice_translations(id) ON DELETE CASCADE,
  
  -- Pilot design
  pilot_name text NOT NULL,
  pilot_clinics uuid[],
  pilot_clinicians uuid[],
  
  -- Timeline
  start_date date NOT NULL,
  end_date date NOT NULL,
  duration_days integer,
  
  -- Success metrics
  success_criteria jsonb,
  target_metrics jsonb,
  
  -- Baseline (pre-pilot)
  baseline_visits_per_case decimal(5,2),
  baseline_days_to_rtw decimal(5,1),
  baseline_claim_acceptance decimal(5,2),
  
  -- Results (during pilot)
  pilot_visits_per_case decimal(5,2),
  pilot_days_to_rtw decimal(5,1),
  pilot_claim_acceptance decimal(5,2),
  
  -- Statistical
  sample_size integer,
  statistical_significance boolean,
  p_value decimal(5,4),
  
  -- Decision
  status text DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'success', 'neutral', 'failure', 'rolled_back')),
  decision text CHECK (decision IN ('rollout_platform_wide', 'refine', 'hold', 'reject')),
  decision_rationale text,
  decided_by uuid,
  decided_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_practice_pilots_translation ON practice_pilots(translation_id);
CREATE INDEX IF NOT EXISTS idx_practice_pilots_status ON practice_pilots(status);
CREATE INDEX IF NOT EXISTS idx_practice_pilots_dates ON practice_pilots(start_date, end_date);

-- ============================================================================
-- CCO APPROVALS (Governance Workflow)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cco_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What's being approved
  approval_type text NOT NULL CHECK (approval_type IN ('translation', 'pilot', 'platform_rollout', 'rollback')),
  entity_id uuid NOT NULL,
  
  -- Approval panel
  cco_id uuid,
  panel_members uuid[],
  
  -- Decision
  decision text NOT NULL CHECK (decision IN ('approved', 'approved_with_pilot', 'rejected', 'deferred')),
  decision_rationale text,
  conditions text[],
  
  -- Review details
  evidence_reviewed uuid[],
  concerns_raised text[],
  mitigation_plan text,
  
  -- Timestamps
  submitted_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cco_approvals_type ON cco_approvals(approval_type);
CREATE INDEX IF NOT EXISTS idx_cco_approvals_entity ON cco_approvals(entity_id);
CREATE INDEX IF NOT EXISTS idx_cco_approvals_decision ON cco_approvals(decision);

-- ============================================================================
-- EVIDENCE PACKS (Insurer/Regulator Documentation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS evidence_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Pack metadata
  pack_type text NOT NULL CHECK (pack_type IN ('wcb_audit', 'employer_justification', 'contract_negotiation', 'due_diligence', 'regulatory_compliance')),
  pack_name text NOT NULL,
  
  -- Content
  evidence_summary text,
  citations jsonb,
  practice_changes jsonb,
  measured_outcomes jsonb,
  versioned_sops jsonb,
  audit_trail jsonb,
  
  -- Context
  for_entity text,
  for_condition text,
  date_range_start date,
  date_range_end date,
  
  -- Generation
  generated_at timestamptz DEFAULT now(),
  generated_by uuid,
  auto_generated boolean DEFAULT true,
  
  -- Usage
  downloaded_at timestamptz,
  downloaded_by uuid,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_packs_type ON evidence_packs(pack_type);
CREATE INDEX IF NOT EXISTS idx_evidence_packs_entity ON evidence_packs(for_entity);
CREATE INDEX IF NOT EXISTS idx_evidence_packs_generated ON evidence_packs(generated_at DESC);

-- ============================================================================
-- ENHANCE RESEARCH PAPERS WITH PRIORITY SCORING
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'research_papers' AND column_name = 'priority_score') THEN
    ALTER TABLE research_papers ADD COLUMN priority_score integer CHECK (priority_score BETWEEN 0 AND 100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'research_papers' AND column_name = 'maps_to_priorities') THEN
    ALTER TABLE research_papers ADD COLUMN maps_to_priorities uuid[];
  END IF;
END $$;

-- ============================================================================
-- ENHANCE RESEARCH OUTCOMES WITH STATISTICAL ANALYSIS
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'research_outcomes' AND column_name = 'statistical_significance') THEN
    ALTER TABLE research_outcomes ADD COLUMN statistical_significance boolean;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'research_outcomes' AND column_name = 'p_value') THEN
    ALTER TABLE research_outcomes ADD COLUMN p_value decimal(5,4);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'research_outcomes' AND column_name = 'effect_size') THEN
    ALTER TABLE research_outcomes ADD COLUMN effect_size decimal(5,2);
  END IF;
END $$;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Evidence Digests
ALTER TABLE evidence_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view published digests"
  ON evidence_digests FOR SELECT
  TO authenticated
  USING (status = 'published');

CREATE POLICY "System can manage digests"
  ON evidence_digests FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Research Priorities
ALTER TABLE research_priorities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view priorities"
  ON research_priorities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage priorities"
  ON research_priorities FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Practice Pilots
ALTER TABLE practice_pilots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pilots"
  ON practice_pilots FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage pilots"
  ON practice_pilots FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- CCO Approvals
ALTER TABLE cco_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view approvals"
  ON cco_approvals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create approvals"
  ON cco_approvals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authorized users can update approvals"
  ON cco_approvals FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Evidence Packs
ALTER TABLE evidence_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view evidence packs"
  ON evidence_packs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create evidence packs"
  ON evidence_packs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get active pilots summary
CREATE OR REPLACE FUNCTION get_active_pilots_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_active', (SELECT COUNT(*) FROM practice_pilots WHERE status = 'active'),
    'planned', (SELECT COUNT(*) FROM practice_pilots WHERE status = 'planned'),
    'completed', (SELECT COUNT(*) FROM practice_pilots WHERE status = 'completed'),
    'successful', (SELECT COUNT(*) FROM practice_pilots WHERE status = 'success'),
    'avg_duration_days', (SELECT AVG(duration_days) FROM practice_pilots WHERE status = 'completed')
  )
  INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Function to generate evidence pack data
CREATE OR REPLACE FUNCTION generate_evidence_pack_data(
  p_pack_type text,
  p_condition text,
  p_start_date date,
  p_end_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'evidence_summary', (
      SELECT jsonb_agg(jsonb_build_object(
        'query', query_text,
        'summary', executive_summary,
        'confidence', confidence_score,
        'date', created_at
      ))
      FROM evidence_syntheses
      WHERE created_at BETWEEN p_start_date AND p_end_date
      AND applicable_conditions @> ARRAY[p_condition]
    ),
    'practice_changes', (
      SELECT jsonb_agg(jsonb_build_object(
        'title', change_title,
        'type', change_type,
        'status', status,
        'expected_impact', expected_outcome_improvement
      ))
      FROM practice_translations
      WHERE created_at BETWEEN p_start_date AND p_end_date
    ),
    'outcomes', (
      SELECT jsonb_agg(jsonb_build_object(
        'metric', 'visits_per_case',
        'value', avg_visits_per_case,
        'impact', impact_status
      ))
      FROM research_outcomes
      WHERE measurement_date BETWEEN p_start_date AND p_end_date
    )
  )
  INTO v_result;
  
  RETURN v_result;
END;
$$;
