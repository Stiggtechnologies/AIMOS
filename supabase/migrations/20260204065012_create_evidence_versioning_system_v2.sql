/*
  # Create Evidence Versioning System
  
  1. New Tables
    - evidence_synthesis_versions: Complete version history for evidence syntheses
    - practice_translation_versions: Version history for practice translations
    - evidence_contradiction_log: Tracks detected contradictions between evidence pieces
    
  2. Features
    - Automatic version creation on every update
    - Diff tracking between versions
    - Rollback capability
    - Contradiction detection and logging
    - Change attribution (who changed what when)
    
  3. Security
    - RLS policies for version access
    - Audit trail integration
*/

-- Evidence Synthesis Versions Table
CREATE TABLE IF NOT EXISTS evidence_synthesis_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  synthesis_id uuid NOT NULL REFERENCES evidence_syntheses(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  
  -- Snapshot of synthesis at this version
  query_text text NOT NULL,
  synthesis_text text NOT NULL,
  clinical_implications text,
  operational_implications text,
  recommendations jsonb DEFAULT '[]'::jsonb,
  confidence_score integer,
  evidence_quality text,
  consensus_level text,
  
  -- Version metadata
  changed_by uuid REFERENCES user_profiles(id),
  change_reason text,
  change_summary text,
  diff_from_previous jsonb, -- JSON representation of what changed
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(synthesis_id, version_number)
);

-- Practice Translation Versions Table
CREATE TABLE IF NOT EXISTS practice_translation_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  translation_id uuid NOT NULL REFERENCES practice_translations(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  
  -- Snapshot of translation at this version
  change_title text NOT NULL,
  change_description text NOT NULL,
  expected_outcome_improvement text,
  implementation_complexity text,
  estimated_training_hours numeric,
  status text NOT NULL,
  
  -- Version metadata
  changed_by uuid REFERENCES user_profiles(id),
  change_reason text,
  change_summary text,
  diff_from_previous jsonb,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(translation_id, version_number)
);

-- Evidence Contradiction Log
CREATE TABLE IF NOT EXISTS evidence_contradiction_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contradicting evidence pieces
  synthesis_a_id uuid REFERENCES evidence_syntheses(id),
  synthesis_b_id uuid REFERENCES evidence_syntheses(id),
  paper_a_id uuid REFERENCES research_papers(id),
  paper_b_id uuid REFERENCES research_papers(id),
  
  -- Contradiction details
  contradiction_type text NOT NULL CHECK (contradiction_type IN (
    'outcome_conflict',      -- Different outcomes for same intervention
    'methodology_conflict',  -- Same topic, different methodologies
    'temporal_superseded',   -- Newer evidence contradicts older
    'population_specific',   -- Different populations, different results
    'severity_conflict'      -- Disagreement on severity/importance
  )),
  
  confidence_score integer CHECK (confidence_score >= 0 AND confidence_score <= 100),
  description text NOT NULL,
  clinical_impact text CHECK (clinical_impact IN ('high', 'medium', 'low')),
  
  -- Resolution tracking
  resolution_status text DEFAULT 'unresolved' CHECK (resolution_status IN (
    'unresolved',
    'investigating',
    'resolved_favor_a',
    'resolved_favor_b',
    'resolved_both_valid',
    'resolved_both_invalid'
  )),
  
  resolution_notes text,
  resolved_by uuid REFERENCES user_profiles(id),
  resolved_at timestamptz,
  
  -- Detection metadata
  detected_by_agent_id uuid REFERENCES ai_agents(id),
  detected_at timestamptz DEFAULT now(),
  reviewed_by uuid REFERENCES user_profiles(id),
  reviewed_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Function to automatically create evidence synthesis version on update
CREATE OR REPLACE FUNCTION create_evidence_synthesis_version()
RETURNS TRIGGER AS $$
DECLARE
  v_version_number integer;
  v_diff jsonb;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO v_version_number
  FROM evidence_synthesis_versions
  WHERE synthesis_id = NEW.id;
  
  -- Calculate diff (simplified - tracks which fields changed)
  v_diff := jsonb_build_object(
    'query_text_changed', (OLD.query_text IS DISTINCT FROM NEW.query_text),
    'synthesis_text_changed', (OLD.synthesis_text IS DISTINCT FROM NEW.synthesis_text),
    'confidence_score_changed', (OLD.confidence_score IS DISTINCT FROM NEW.confidence_score),
    'evidence_quality_changed', (OLD.evidence_quality IS DISTINCT FROM NEW.evidence_quality),
    'recommendations_changed', (OLD.recommendations IS DISTINCT FROM NEW.recommendations)
  );
  
  -- Create version snapshot
  INSERT INTO evidence_synthesis_versions (
    synthesis_id,
    version_number,
    query_text,
    synthesis_text,
    clinical_implications,
    operational_implications,
    recommendations,
    confidence_score,
    evidence_quality,
    consensus_level,
    changed_by,
    change_summary,
    diff_from_previous
  ) VALUES (
    NEW.id,
    v_version_number,
    NEW.query_text,
    NEW.synthesis_text,
    NEW.clinical_implications,
    NEW.operational_implications,
    NEW.recommendations,
    NEW.confidence_score,
    NEW.evidence_quality,
    NEW.consensus_level,
    auth.uid(),
    'Auto-versioned on update',
    v_diff
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically create practice translation version on update
CREATE OR REPLACE FUNCTION create_practice_translation_version()
RETURNS TRIGGER AS $$
DECLARE
  v_version_number integer;
  v_diff jsonb;
BEGIN
  -- Get next version number
  SELECT COALESCE(MAX(version_number), 0) + 1 
  INTO v_version_number
  FROM practice_translation_versions
  WHERE translation_id = NEW.id;
  
  -- Calculate diff
  v_diff := jsonb_build_object(
    'change_title_changed', (OLD.change_title IS DISTINCT FROM NEW.change_title),
    'change_description_changed', (OLD.change_description IS DISTINCT FROM NEW.change_description),
    'expected_outcome_changed', (OLD.expected_outcome_improvement IS DISTINCT FROM NEW.expected_outcome_improvement),
    'status_changed', (OLD.status IS DISTINCT FROM NEW.status)
  );
  
  -- Create version snapshot
  INSERT INTO practice_translation_versions (
    translation_id,
    version_number,
    change_title,
    change_description,
    expected_outcome_improvement,
    implementation_complexity,
    estimated_training_hours,
    status,
    changed_by,
    change_summary,
    diff_from_previous
  ) VALUES (
    NEW.id,
    v_version_number,
    NEW.change_title,
    NEW.change_description,
    NEW.expected_outcome_improvement,
    NEW.implementation_complexity,
    NEW.estimated_training_hours,
    NEW.status,
    auth.uid(),
    CASE 
      WHEN OLD.status != NEW.status 
      THEN 'Status changed from ' || OLD.status || ' to ' || NEW.status
      ELSE 'Auto-versioned on update'
    END,
    v_diff
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS evidence_synthesis_version_trigger ON evidence_syntheses;
CREATE TRIGGER evidence_synthesis_version_trigger
  AFTER UPDATE ON evidence_syntheses
  FOR EACH ROW
  EXECUTE FUNCTION create_evidence_synthesis_version();

DROP TRIGGER IF EXISTS practice_translation_version_trigger ON practice_translations;
CREATE TRIGGER practice_translation_version_trigger
  AFTER UPDATE ON practice_translations
  FOR EACH ROW
  EXECUTE FUNCTION create_practice_translation_version();

-- RLS Policies
ALTER TABLE evidence_synthesis_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_translation_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_contradiction_log ENABLE ROW LEVEL SECURITY;

-- Evidence synthesis versions: Authenticated users can read
CREATE POLICY "Authenticated users can read synthesis versions"
  ON evidence_synthesis_versions FOR SELECT
  TO authenticated
  USING (true);

-- Practice translation versions: Authenticated users can read
CREATE POLICY "Authenticated users can read translation versions"
  ON practice_translation_versions FOR SELECT
  TO authenticated
  USING (true);

-- Contradiction log: Authenticated users can read
CREATE POLICY "Authenticated users can read contradiction log"
  ON evidence_contradiction_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authorized users can manage contradictions"
  ON evidence_contradiction_log FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role::text IN ('admin', 'operations_manager', 'clinician')
    )
  );

-- Indexes for performance
CREATE INDEX idx_evidence_synthesis_versions_synthesis_id 
  ON evidence_synthesis_versions(synthesis_id, version_number DESC);

CREATE INDEX idx_practice_translation_versions_translation_id 
  ON practice_translation_versions(translation_id, version_number DESC);

CREATE INDEX idx_contradiction_log_unresolved 
  ON evidence_contradiction_log(resolution_status, detected_at DESC) 
  WHERE resolution_status = 'unresolved';

CREATE INDEX idx_contradiction_log_synthesis_ids 
  ON evidence_contradiction_log(synthesis_a_id, synthesis_b_id);

CREATE INDEX idx_contradiction_log_paper_ids 
  ON evidence_contradiction_log(paper_a_id, paper_b_id);

-- Helper function to get latest version
CREATE OR REPLACE FUNCTION get_evidence_synthesis_latest_version(p_synthesis_id uuid)
RETURNS TABLE (
  version_number integer,
  synthesis_text text,
  confidence_score integer,
  changed_by uuid,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    esv.version_number,
    esv.synthesis_text,
    esv.confidence_score,
    esv.changed_by,
    esv.created_at
  FROM evidence_synthesis_versions esv
  WHERE esv.synthesis_id = p_synthesis_id
  ORDER BY esv.version_number DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to compare versions
CREATE OR REPLACE FUNCTION compare_synthesis_versions(
  p_synthesis_id uuid,
  p_version_a integer,
  p_version_b integer
)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'version_a', jsonb_build_object(
      'version_number', a.version_number,
      'synthesis_text', a.synthesis_text,
      'confidence_score', a.confidence_score,
      'created_at', a.created_at
    ),
    'version_b', jsonb_build_object(
      'version_number', b.version_number,
      'synthesis_text', b.synthesis_text,
      'confidence_score', b.confidence_score,
      'created_at', b.created_at
    ),
    'differences', jsonb_build_object(
      'synthesis_text_changed', (a.synthesis_text != b.synthesis_text),
      'confidence_changed', (a.confidence_score != b.confidence_score),
      'recommendations_changed', (a.recommendations != b.recommendations)
    )
  ) INTO v_result
  FROM evidence_synthesis_versions a
  CROSS JOIN evidence_synthesis_versions b
  WHERE a.synthesis_id = p_synthesis_id
  AND b.synthesis_id = p_synthesis_id
  AND a.version_number = p_version_a
  AND b.version_number = p_version_b;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
