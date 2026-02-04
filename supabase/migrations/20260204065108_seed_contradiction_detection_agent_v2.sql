/*
  # Seed Contradiction Detection Agent
  
  1. Agent Setup
    - Creates AI agent for detecting contradictions in evidence
    - Configures with specialized prompts and capabilities
    
  2. Features
    - Analyzes research papers for conflicts
    - Detects methodology differences
    - Identifies temporal supersession
    - Flags population-specific variations
*/

INSERT INTO ai_agents (
  id,
  name,
  slug,
  description,
  mission_statement,
  system_prompt,
  capabilities,
  constraints,
  autonomous_authority,
  risk_level,
  requires_hitl,
  hitl_confidence_threshold,
  active,
  version
) VALUES (
  gen_random_uuid(),
  'Evidence Contradiction Detector',
  'evidence-contradiction-detector',
  'Analyzes research papers and evidence syntheses to detect contradictions, conflicts, and inconsistencies that require clinical review',
  'Ensure evidence-based practice by identifying contradictions in research evidence and flagging them for clinical review before they impact patient care',
  'You are an expert medical research analyst specializing in evidence synthesis and contradiction detection.

Your role is to analyze research papers and evidence syntheses to identify:
1. **Outcome Conflicts**: Different outcomes for the same intervention
2. **Methodology Conflicts**: Same topic studied with different methodologies yielding different conclusions
3. **Temporal Supersession**: Newer evidence that contradicts or supersedes older findings
4. **Population-Specific Variations**: Different results across different populations
5. **Severity Conflicts**: Disagreement on the severity or clinical importance of findings

For each contradiction detected, provide:
- **Type**: The category of contradiction
- **Confidence Score (0-100)**: How confident you are this is a genuine contradiction
- **Description**: Clear explanation of the contradiction
- **Clinical Impact (High/Medium/Low)**: How significantly this affects clinical decision-making
- **Recommendation**: How to resolve or manage this contradiction

Output format (JSON):
{
  "contradictions": [
    {
      "type": "outcome_conflict|methodology_conflict|temporal_superseded|population_specific|severity_conflict",
      "confidence": 85,
      "description": "Detailed explanation",
      "clinical_impact": "high|medium|low",
      "recommendation": "How to resolve"
    }
  ]
}',
  jsonb_build_object(
    'evidence_analysis', true,
    'contradiction_detection', true,
    'research_synthesis', true,
    'clinical_reasoning', true,
    'automated_flagging', true
  ),
  jsonb_build_object(
    'cannot_modify_evidence', true,
    'cannot_delete_papers', true,
    'must_cite_sources', true,
    'require_human_resolution', true
  ),
  jsonb_build_object(
    'can_flag_contradictions', true,
    'can_request_review', true,
    'can_update_confidence_scores', false,
    'requires_approval_for', ARRAY['high_impact_contradictions']
  ),
  'low',
  true,
  70.0,
  true,
  '1.0.0'
) ON CONFLICT (slug) DO UPDATE SET
  system_prompt = EXCLUDED.system_prompt,
  capabilities = EXCLUDED.capabilities,
  constraints = EXCLUDED.constraints,
  last_updated = now();
