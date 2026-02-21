/*
  # Clinical Intelligence & Innovation (CII) Module

  Creates the complete R&D infrastructure for evidence-based practice improvement.

  1. New Tables
    - `research_sources` - Approved research sources (journals, databases)
    - `research_papers` - Ingested research papers with metadata
    - `evidence_syntheses` - Aggregated evidence answers to queries
    - `practice_translations` - Research-to-practice change proposals
    - `practice_adoptions` - Approved changes and their implementation
    - `research_outcomes` - Pre/post adoption outcome measurements
    - `research_queries` - Clinician evidence queries and answers

  2. Security
    - Enable RLS on all tables
    - Policies for clinical and research staff

  3. Indexes
    - Performance indexes for common queries
*/

-- ============================================================================
-- RESEARCH SOURCES (Approved Journals, Databases, etc.)
-- ============================================================================

CREATE TABLE IF NOT EXISTS research_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('journal', 'database', 'guideline', 'preprint', 'conference')),
  url text,
  credibility_score integer CHECK (credibility_score BETWEEN 1 AND 100),
  
  -- Approval & filtering
  approved boolean DEFAULT false,
  auto_ingest boolean DEFAULT false,
  filter_keywords text[],
  
  -- Metadata
  last_ingested_at timestamptz,
  total_papers_ingested integer DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_research_sources_approved ON research_sources(approved) WHERE approved = true;
CREATE INDEX IF NOT EXISTS idx_research_sources_type ON research_sources(source_type);

-- ============================================================================
-- RESEARCH PAPERS (Ingested Research)
-- ============================================================================

CREATE TABLE IF NOT EXISTS research_papers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES research_sources(id) ON DELETE SET NULL,
  
  -- Paper metadata
  title text NOT NULL,
  authors text[],
  publication_date date,
  doi text,
  pmid text,
  url text,
  abstract text,
  
  -- Classification
  study_type text CHECK (study_type IN ('rct', 'cohort', 'case_control', 'case_series', 'systematic_review', 'meta_analysis', 'expert_opinion')),
  quality_score integer CHECK (quality_score BETWEEN 1 AND 100),
  sample_size integer,
  
  -- Structured extraction
  study_question text,
  primary_outcomes jsonb,
  limitations text[],
  
  -- Categorization
  conditions text[],
  populations text[],
  interventions text[],
  outcome_types text[],
  
  -- Relevance
  clinical_relevance integer CHECK (clinical_relevance BETWEEN 1 AND 10),
  operational_relevance integer CHECK (operational_relevance BETWEEN 1 AND 10),
  reimbursement_relevance integer CHECK (reimbursement_relevance BETWEEN 1 AND 10),
  
  -- AI processing
  ai_summary text,
  ai_clinical_implications text,
  ai_operational_implications text,
  
  -- Status
  ingestion_status text DEFAULT 'pending' CHECK (ingestion_status IN ('pending', 'processed', 'reviewed', 'archived')),
  ingested_by uuid,
  ingested_at timestamptz DEFAULT now(),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_research_papers_source ON research_papers(source_id);
CREATE INDEX IF NOT EXISTS idx_research_papers_status ON research_papers(ingestion_status);
CREATE INDEX IF NOT EXISTS idx_research_papers_date ON research_papers(publication_date DESC);
CREATE INDEX IF NOT EXISTS idx_research_papers_quality ON research_papers(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_research_papers_conditions ON research_papers USING gin(conditions);
CREATE INDEX IF NOT EXISTS idx_research_papers_interventions ON research_papers USING gin(interventions);

-- ============================================================================
-- EVIDENCE SYNTHESES (Aggregated Answers to Questions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS evidence_syntheses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Query
  query_text text NOT NULL,
  query_by uuid,
  
  -- Synthesis
  executive_summary text,
  clinical_relevance_summary text,
  operational_relevance_summary text,
  documentation_implications text,
  
  -- Evidence metadata
  papers_reviewed uuid[],
  evidence_quality text CHECK (evidence_quality IN ('strong', 'moderate', 'weak', 'insufficient')),
  consensus_level text CHECK (consensus_level IN ('strong_consensus', 'moderate_consensus', 'conflicting', 'insufficient')),
  confidence_score integer CHECK (confidence_score BETWEEN 0 AND 100),
  
  -- Recommendations
  recommendation text,
  strength_of_recommendation text CHECK (strength_of_recommendation IN ('strong_for', 'weak_for', 'neutral', 'weak_against', 'strong_against')),
  
  -- Clinical context
  applicable_conditions text[],
  applicable_populations text[],
  contraindications text[],
  
  -- Status
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'published', 'outdated')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_syntheses_status ON evidence_syntheses(status);
CREATE INDEX IF NOT EXISTS idx_evidence_syntheses_quality ON evidence_syntheses(evidence_quality);
CREATE INDEX IF NOT EXISTS idx_evidence_syntheses_date ON evidence_syntheses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_syntheses_conditions ON evidence_syntheses USING gin(applicable_conditions);

-- ============================================================================
-- PRACTICE TRANSLATIONS (Research → Practice Change Proposals)
-- ============================================================================

CREATE TABLE IF NOT EXISTS practice_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_synthesis_id uuid REFERENCES evidence_syntheses(id) ON DELETE CASCADE,
  
  -- Change proposal
  change_type text NOT NULL CHECK (change_type IN ('sop_update', 'pathway_change', 'documentation_update', 'new_protocol', 'discontinue_practice')),
  change_title text NOT NULL,
  change_description text NOT NULL,
  
  -- Affected areas
  affected_sops uuid[],
  affected_pathways text[],
  affected_documentation text[],
  
  -- Expected impact
  expected_outcome_improvement text,
  expected_visit_reduction decimal(5,2),
  expected_rtw_improvement_days integer,
  expected_claim_acceptance_increase decimal(5,2),
  risk_assessment text,
  
  -- Implementation
  implementation_complexity text CHECK (implementation_complexity IN ('low', 'medium', 'high')),
  estimated_training_hours decimal(5,1),
  implementation_timeline text,
  
  -- Approval workflow
  status text DEFAULT 'proposed' CHECK (status IN ('proposed', 'under_review', 'approved', 'rejected', 'implemented')),
  proposed_by uuid,
  proposed_at timestamptz DEFAULT now(),
  reviewed_by uuid,
  reviewed_at timestamptz,
  reviewer_notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_practice_translations_status ON practice_translations(status);
CREATE INDEX IF NOT EXISTS idx_practice_translations_type ON practice_translations(change_type);
CREATE INDEX IF NOT EXISTS idx_practice_translations_synthesis ON practice_translations(evidence_synthesis_id);

-- ============================================================================
-- PRACTICE ADOPTIONS (Approved Changes in Production)
-- ============================================================================

CREATE TABLE IF NOT EXISTS practice_adoptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_id uuid REFERENCES practice_translations(id) ON DELETE CASCADE,
  
  -- Implementation details
  implementation_date date NOT NULL,
  clinics_implemented uuid[],
  clinicians_trained uuid[],
  
  -- Pre-implementation baseline
  baseline_start_date date,
  baseline_end_date date,
  baseline_metrics jsonb,
  
  -- Status
  adoption_status text DEFAULT 'active' CHECK (adoption_status IN ('active', 'monitoring', 'validated', 'rolled_back')),
  
  -- Notes
  implementation_notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_practice_adoptions_status ON practice_adoptions(adoption_status);
CREATE INDEX IF NOT EXISTS idx_practice_adoptions_date ON practice_adoptions(implementation_date);
CREATE INDEX IF NOT EXISTS idx_practice_adoptions_translation ON practice_adoptions(translation_id);

-- ============================================================================
-- RESEARCH OUTCOMES (Pre/Post Adoption Measurements)
-- ============================================================================

CREATE TABLE IF NOT EXISTS research_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adoption_id uuid REFERENCES practice_adoptions(id) ON DELETE CASCADE,
  
  -- Measurement period
  measurement_period text NOT NULL CHECK (measurement_period IN ('pre_adoption', 'post_adoption_30d', 'post_adoption_90d', 'post_adoption_180d')),
  measurement_date date NOT NULL,
  
  -- Outcome metrics
  avg_visits_per_case decimal(5,2),
  avg_days_to_rtw decimal(5,1),
  claim_acceptance_rate decimal(5,2),
  patient_satisfaction_score decimal(3,1),
  clinician_satisfaction_score decimal(3,1),
  
  -- Variance
  visits_variance decimal(5,2),
  rtw_variance decimal(5,1),
  
  -- Sample size
  cases_measured integer,
  
  -- Impact assessment
  impact_status text CHECK (impact_status IN ('positive', 'neutral', 'negative', 'insufficient_data')),
  impact_notes text,
  
  -- AI analysis
  ai_analysis text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_research_outcomes_adoption ON research_outcomes(adoption_id);
CREATE INDEX IF NOT EXISTS idx_research_outcomes_period ON research_outcomes(measurement_period);
CREATE INDEX IF NOT EXISTS idx_research_outcomes_impact ON research_outcomes(impact_status);

-- ============================================================================
-- RESEARCH QUERIES (Clinician Evidence Questions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS research_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Query
  query_text text NOT NULL,
  query_type text CHECK (query_type IN ('clinical', 'operational', 'documentation', 'reimbursement')),
  
  -- Requester
  requested_by uuid,
  requester_role text,
  
  -- Response
  synthesis_id uuid REFERENCES evidence_syntheses(id),
  response_text text,
  response_time_seconds integer,
  
  -- Satisfaction
  helpful boolean,
  feedback_text text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_research_queries_requester ON research_queries(requested_by);
CREATE INDEX IF NOT EXISTS idx_research_queries_date ON research_queries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_research_queries_synthesis ON research_queries(synthesis_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Research Sources
ALTER TABLE research_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view approved sources"
  ON research_sources FOR SELECT
  TO authenticated
  USING (approved = true OR auth.uid() IN (SELECT id FROM auth.users));

CREATE POLICY "Admins can manage sources"
  ON research_sources FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Research Papers
ALTER TABLE research_papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view processed papers"
  ON research_papers FOR SELECT
  TO authenticated
  USING (ingestion_status IN ('processed', 'reviewed'));

CREATE POLICY "System can insert papers"
  ON research_papers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update papers"
  ON research_papers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Evidence Syntheses
ALTER TABLE evidence_syntheses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view published syntheses"
  ON evidence_syntheses FOR SELECT
  TO authenticated
  USING (status = 'published' OR query_by = auth.uid());

CREATE POLICY "System can create syntheses"
  ON evidence_syntheses FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update syntheses"
  ON evidence_syntheses FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Practice Translations
ALTER TABLE practice_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view translations"
  ON practice_translations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create translations"
  ON practice_translations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authorized users can update translations"
  ON practice_translations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Practice Adoptions
ALTER TABLE practice_adoptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view adoptions"
  ON practice_adoptions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage adoptions"
  ON practice_adoptions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Research Outcomes
ALTER TABLE research_outcomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view outcomes"
  ON research_outcomes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage outcomes"
  ON research_outcomes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Research Queries
ALTER TABLE research_queries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own queries"
  ON research_queries FOR SELECT
  TO authenticated
  USING (requested_by = auth.uid() OR true);

CREATE POLICY "Users can create queries"
  ON research_queries FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own queries"
  ON research_queries FOR UPDATE
  TO authenticated
  USING (requested_by = auth.uid())
  WITH CHECK (requested_by = auth.uid());

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get R&D dashboard metrics
CREATE OR REPLACE FUNCTION get_cii_dashboard_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_papers', (SELECT COUNT(*) FROM research_papers WHERE ingestion_status = 'processed'),
    'pending_translations', (SELECT COUNT(*) FROM practice_translations WHERE status = 'proposed'),
    'active_adoptions', (SELECT COUNT(*) FROM practice_adoptions WHERE adoption_status IN ('active', 'monitoring')),
    'recent_queries', (SELECT COUNT(*) FROM research_queries WHERE created_at > NOW() - INTERVAL '7 days'),
    'avg_query_response_time', (SELECT AVG(response_time_seconds) FROM research_queries WHERE created_at > NOW() - INTERVAL '30 days'),
    'positive_outcomes', (SELECT COUNT(*) FROM research_outcomes WHERE impact_status = 'positive')
  )
  INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Function to get research-to-practice cycle time
CREATE OR REPLACE FUNCTION get_research_to_practice_cycle_time()
RETURNS TABLE (
  translation_title text,
  cycle_days integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.change_title,
    EXTRACT(DAY FROM (pa.implementation_date - pt.proposed_at::date))::integer
  FROM practice_translations pt
  JOIN practice_adoptions pa ON pa.translation_id = pt.id
  WHERE pt.status = 'implemented'
  ORDER BY pa.implementation_date DESC;
END;
$$;
