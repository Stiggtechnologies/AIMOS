/*
  # Clinical Intelligence & Innovation AI Agents

  Seeds the 4 R&D AI agents with optimized system prompts and risk configurations.

  1. Research Intelligence Agent - Paper ingestion and classification
  2. Evidence Synthesis Agent - Aggregate evidence and answer queries
  3. Practice Translation Agent - Convert research to practice changes
  4. Research Outcomes Agent - Measure adoption impact
*/

-- First, ensure we have a CII domain
INSERT INTO agent_domains (id, slug, name, description, executive_owner, risk_category, active)
VALUES (
  gen_random_uuid(),
  'cii',
  'Clinical Intelligence & Innovation',
  'Research-to-practice translation, evidence synthesis, and outcomes measurement',
  'Chief Clinical Officer',
  'medium',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  executive_owner = EXCLUDED.executive_owner;

-- Get the domain ID
DO $$
DECLARE
  v_domain_id uuid;
  v_agent_id uuid;
BEGIN
  SELECT id INTO v_domain_id FROM agent_domains WHERE slug = 'cii';

  -- ============================================================================
  -- AGENT 1: Research Intelligence Agent
  -- ============================================================================

  INSERT INTO ai_agents (
    id,
    domain_id,
    name,
    slug,
    description,
    system_prompt,
    capabilities,
    risk_level,
    requires_hitl,
    hitl_confidence_threshold,
    active
  ) VALUES (
    gen_random_uuid(),
    v_domain_id,
    'Research Intelligence Agent',
    'research-intelligence-agent',
    'Continuously ingests, classifies, and normalizes relevant clinical and operational research from approved sources',
    'You are the Research Intelligence AI Agent inside AIM OS Clinical Intelligence & Innovation module. Your mission is to continuously ingest and classify relevant clinical and operational research. Extract metadata, classify studies, and tag papers by condition, population, intervention. NEVER make clinical recommendations. Flag papers requiring review if source credibility < 70 or controversial findings detected.',
    jsonb_build_array('research_monitoring', 'metadata_extraction', 'study_classification', 'quality_assessment', 'relevance_scoring'),
    'low',
    false,
    85,
    true
  )
  ON CONFLICT (slug) DO UPDATE SET
    system_prompt = EXCLUDED.system_prompt,
    capabilities = EXCLUDED.capabilities,
    last_updated = now()
  RETURNING id INTO v_agent_id;

  -- Add risk threshold for Research Intelligence Agent
  INSERT INTO agent_risk_thresholds (agent_id, threshold_type, threshold_name, threshold_value, action_on_breach, description, active)
  VALUES (
    v_agent_id,
    'confidence',
    'Minimum Confidence Score',
    85,
    'escalate',
    'Low quality source or controversial findings',
    true
  )
  ON CONFLICT DO NOTHING;

  -- ============================================================================
  -- AGENT 2: Evidence Synthesis Agent
  -- ============================================================================

  INSERT INTO ai_agents (
    id,
    domain_id,
    name,
    slug,
    description,
    system_prompt,
    capabilities,
    risk_level,
    requires_hitl,
    hitl_confidence_threshold,
    active
  ) VALUES (
    gen_random_uuid(),
    v_domain_id,
    'Evidence Synthesis Agent',
    'evidence-synthesis-agent',
    'Aggregates research findings to answer real practitioner and executive questions with evidence-weighted responses',
    'You are the Evidence Synthesis AI Agent. Provide concise, evidence-weighted answers to clinical and operational questions by aggregating multiple research sources. Weight evidence quality (systematic reviews > RCTs > cohort studies). Declare confidence explicitly. Flag weak or conflicting evidence. NEVER issue clinical directives. Escalate if conflicting evidence, weak consensus, high-risk domain, or confidence < 85%.',
    jsonb_build_array('evidence_aggregation', 'quality_weighting', 'consensus_detection', 'query_answering', 'citation_management'),
    'medium',
    false,
    85,
    true
  )
  ON CONFLICT (slug) DO UPDATE SET
    system_prompt = EXCLUDED.system_prompt,
    capabilities = EXCLUDED.capabilities,
    last_updated = now()
  RETURNING id INTO v_agent_id;

  -- Add risk threshold
  INSERT INTO agent_risk_thresholds (agent_id, threshold_type, threshold_name, threshold_value, action_on_breach, description, active)
  VALUES (
    v_agent_id,
    'confidence',
    'Minimum Confidence Score',
    85,
    'escalate',
    'Conflicting or weak evidence',
    true
  )
  ON CONFLICT DO NOTHING;

  -- ============================================================================
  -- AGENT 3: Practice Translation Agent (MOST CRITICAL)
  -- ============================================================================

  INSERT INTO ai_agents (
    id,
    domain_id,
    name,
    slug,
    description,
    system_prompt,
    capabilities,
    risk_level,
    requires_hitl,
    hitl_confidence_threshold,
    active
  ) VALUES (
    gen_random_uuid(),
    v_domain_id,
    'Practice Translation Agent',
    'practice-translation-agent',
    'Converts validated research evidence into actionable operational and clinical practice changes',
    'You are the Practice Translation AI Agent. Translate validated research into proposed operational and clinical improvements. PROPOSE CHANGES ONLY - never deploy autonomously. Every proposal must specify: what changes, why (evidence), expected impact, implementation complexity, training requirements. Route all proposals for CCO approval. CRITICAL: ALL proposals require HITL approval (100% HITL). NEVER override clinical leadership.',
    jsonb_build_array('evidence_translation', 'sop_modification', 'pathway_design', 'documentation_improvement', 'impact_estimation'),
    'high',
    true,
    100,
    true
  )
  ON CONFLICT (slug) DO UPDATE SET
    system_prompt = EXCLUDED.system_prompt,
    capabilities = EXCLUDED.capabilities,
    requires_hitl = EXCLUDED.requires_hitl,
    last_updated = now()
  RETURNING id INTO v_agent_id;

  -- Add risk threshold
  INSERT INTO agent_risk_thresholds (agent_id, threshold_type, threshold_name, threshold_value, action_on_breach, description, active)
  VALUES (
    v_agent_id,
    'confidence',
    'Minimum Confidence Score',
    100,
    'escalate',
    'All practice changes require human approval',
    true
  )
  ON CONFLICT DO NOTHING;

  -- ============================================================================
  -- AGENT 4: Research Outcomes Agent
  -- ============================================================================

  INSERT INTO ai_agents (
    id,
    domain_id,
    name,
    slug,
    description,
    system_prompt,
    capabilities,
    risk_level,
    requires_hitl,
    hitl_confidence_threshold,
    active
  ) VALUES (
    gen_random_uuid(),
    v_domain_id,
    'Research Outcomes Agent',
    'research-outcomes-agent',
    'Measures real-world impact of research adoption by comparing pre/post implementation outcomes',
    'You are the Research Outcomes AI Agent. Measure whether research adoption actually improves results. Compare pre/post metrics: visits per case, days to RTW, claim acceptance rate. Require minimum 30 cases for assessment. Categorize impact: positive, neutral, negative, insufficient. Flag IMMEDIATELY if negative impact, unexpected variance >20%, or safety signals. Feed results back to Evidence Synthesis and Practice Translation agents.',
    jsonb_build_array('outcomes_measurement', 'statistical_analysis', 'impact_detection', 'variance_monitoring', 'feedback_loop_closure'),
    'medium',
    false,
    90,
    true
  )
  ON CONFLICT (slug) DO UPDATE SET
    system_prompt = EXCLUDED.system_prompt,
    capabilities = EXCLUDED.capabilities,
    last_updated = now()
  RETURNING id INTO v_agent_id;

  -- Add risk threshold
  INSERT INTO agent_risk_thresholds (agent_id, threshold_type, threshold_name, threshold_value, action_on_breach, description, active)
  VALUES (
    v_agent_id,
    'confidence',
    'Minimum Confidence Score',
    90,
    'escalate',
    'Negative or unexpected outcomes detected',
    true
  )
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================================================
-- SAMPLE DATA FOR TESTING
-- ============================================================================

-- Add sample research sources
INSERT INTO research_sources (name, source_type, url, credibility_score, approved, auto_ingest)
VALUES
  ('Journal of Occupational Rehabilitation', 'journal', 'https://link.springer.com/journal/10926', 95, true, true),
  ('Work', 'journal', 'https://www.iospress.nl/journal/work', 90, true, true),
  ('Cochrane Database', 'database', 'https://www.cochranelibrary.com', 98, true, true),
  ('ACOEM Practice Guidelines', 'guideline', 'https://acoem.org', 95, true, true),
  ('PubMed', 'database', 'https://pubmed.ncbi.nlm.nih.gov', 92, true, false)
ON CONFLICT DO NOTHING;

-- Initialize agent execution metrics for new agents
INSERT INTO agent_execution_metrics (agent_id, total_executions, successful_executions, failed_executions)
SELECT 
  aa.id,
  0,
  0,
  0
FROM ai_agents aa
WHERE aa.slug IN ('research-intelligence-agent', 'evidence-synthesis-agent', 'practice-translation-agent', 'research-outcomes-agent')
ON CONFLICT (agent_id) DO NOTHING;
