/*
  # Add Translation Rejection Workflow and Feedback Loop
  
  1. New Features
    - Translation rejection with reasons
    - Automatic feedback loop from outcomes to research priorities
    - Research gap scoring function
    - Priority auto-adjustment based on outcomes
    
  2. Functions
    - reject_practice_translation: Rejects a translation with reason
    - auto_adjust_research_priorities: Adjusts priorities based on outcomes
    - calculate_research_gap_score: Calculates urgency of research gaps
    
  3. Triggers
    - Auto-trigger priority adjustment when outcomes are recorded
*/

-- Function to reject practice translation
CREATE OR REPLACE FUNCTION reject_practice_translation(
  p_translation_id uuid,
  p_rejection_reason text,
  p_reviewer_notes text DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
  UPDATE practice_translations
  SET 
    status = 'rejected',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    reviewer_notes = COALESCE(p_reviewer_notes, 'Rejected: ' || p_rejection_reason)
  WHERE id = p_translation_id;
  
  IF FOUND THEN
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate research gap score
CREATE OR REPLACE FUNCTION calculate_research_gap_score(
  p_condition_name text,
  p_outcome_type text
)
RETURNS integer AS $$
DECLARE
  v_priority_score integer := 0;
  v_paper_count integer := 0;
  v_recent_paper_count integer := 0;
  v_synthesis_count integer := 0;
  v_translation_success_rate numeric := 0;
  v_gap_score integer;
BEGIN
  SELECT priority_score 
  INTO v_priority_score
  FROM research_priorities
  WHERE condition_name = p_condition_name
  AND outcome_type = p_outcome_type
  AND is_active = true
  LIMIT 1;
  
  v_priority_score := COALESCE(v_priority_score, 50);
  
  SELECT COUNT(*)
  INTO v_paper_count
  FROM research_papers
  WHERE p_condition_name = ANY(conditions);
  
  SELECT COUNT(*)
  INTO v_recent_paper_count
  FROM research_papers
  WHERE p_condition_name = ANY(conditions)
  AND ingested_at >= now() - interval '2 years';
  
  SELECT COUNT(*)
  INTO v_synthesis_count
  FROM evidence_syntheses
  WHERE query_text ILIKE '%' || p_condition_name || '%'
  AND evidence_quality IN ('strong', 'moderate');
  
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 THEN
        COUNT(*) FILTER (WHERE status = 'implemented')::numeric / COUNT(*)::numeric
      ELSE 0
    END
  INTO v_translation_success_rate
  FROM practice_translations pt
  JOIN evidence_syntheses es ON es.id = pt.evidence_synthesis_id
  WHERE es.query_text ILIKE '%' || p_condition_name || '%';
  
  v_gap_score := v_priority_score;
  v_gap_score := v_gap_score - (v_paper_count * 2);
  v_gap_score := v_gap_score - (v_recent_paper_count * 3);
  v_gap_score := v_gap_score - (v_synthesis_count * 5);
  v_gap_score := v_gap_score + ((1 - v_translation_success_rate) * 20)::integer;
  v_gap_score := GREATEST(0, LEAST(100, v_gap_score));
  
  RETURN v_gap_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-adjust research priorities based on outcomes
CREATE OR REPLACE FUNCTION auto_adjust_research_priorities()
RETURNS void AS $$
DECLARE
  v_condition record;
  v_gap_score integer;
BEGIN
  FOR v_condition IN 
    SELECT DISTINCT 
      condition_name,
      outcome_type
    FROM research_priorities
    WHERE is_active = true
  LOOP
    v_gap_score := calculate_research_gap_score(
      v_condition.condition_name,
      v_condition.outcome_type
    );
    
    UPDATE research_priorities
    SET 
      priority_score = v_gap_score,
      last_updated = now()
    WHERE condition_name = v_condition.condition_name
    AND outcome_type = v_condition.outcome_type
    AND is_active = true;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-adjust priorities when new outcomes are recorded
CREATE OR REPLACE FUNCTION trigger_priority_adjustment()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM auto_adjust_research_priorities();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS research_outcome_priority_adjustment ON research_outcomes;
CREATE TRIGGER research_outcome_priority_adjustment
  AFTER INSERT OR UPDATE ON research_outcomes
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_priority_adjustment();

-- Function to get high-priority research gaps
CREATE OR REPLACE FUNCTION get_high_priority_research_gaps(p_limit integer DEFAULT 10)
RETURNS TABLE (
  condition_name text,
  outcome_type text,
  gap_score integer,
  paper_count bigint,
  recent_synthesis_count bigint,
  recommendation text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rp.condition_name,
    rp.outcome_type,
    calculate_research_gap_score(rp.condition_name, rp.outcome_type) as gap_score,
    COUNT(DISTINCT rpp.id) FILTER (WHERE rp.condition_name = ANY(rpp.conditions)) as paper_count,
    COUNT(DISTINCT es.id) FILTER (
      WHERE es.created_at >= now() - interval '1 year'
    ) as recent_synthesis_count,
    CASE 
      WHEN calculate_research_gap_score(rp.condition_name, rp.outcome_type) > 80 
        THEN 'Critical: Immediate research needed'
      WHEN calculate_research_gap_score(rp.condition_name, rp.outcome_type) > 60 
        THEN 'High: Prioritize for next research cycle'
      WHEN calculate_research_gap_score(rp.condition_name, rp.outcome_type) > 40 
        THEN 'Medium: Monitor and consider for research'
      ELSE 'Low: Adequate evidence available'
    END as recommendation
  FROM research_priorities rp
  LEFT JOIN research_papers rpp ON rp.condition_name = ANY(rpp.conditions)
  LEFT JOIN evidence_syntheses es ON es.query_text ILIKE '%' || rp.condition_name || '%'
  WHERE rp.is_active = true
  GROUP BY rp.condition_name, rp.outcome_type, rp.priority_score
  ORDER BY calculate_research_gap_score(rp.condition_name, rp.outcome_type) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_research_papers_conditions 
  ON research_papers USING GIN(conditions);

CREATE INDEX IF NOT EXISTS idx_research_papers_ingested_at 
  ON research_papers(ingested_at DESC);

CREATE INDEX IF NOT EXISTS idx_evidence_syntheses_quality 
  ON evidence_syntheses(evidence_quality) 
  WHERE evidence_quality IN ('strong', 'moderate');

CREATE INDEX IF NOT EXISTS idx_practice_translations_status_v2 
  ON practice_translations(status);
